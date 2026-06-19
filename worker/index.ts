/** converTeXcel production Worker. */

const TEXLIVE_CGI = "https://texlive.net/cgi-bin/latexcgi"
const TEXLIVE_ORIGIN = "https://texlive.net"

const MAX_REQUEST_BYTES = 256 * 1024
const MAX_TEX_CHARS = 120_000
const MAX_FILES = 4
const MAX_FILE_CHARS = 64_000
const MAX_TOTAL_FILE_CHARS = 128_000
const MAX_LOG_BYTES = 128 * 1024
const MAX_PDF_BYTES = 12 * 1024 * 1024
const MAX_DOCS_CONTENT_CHARS = 180_000
const GITHUB_API_VERSION = "2022-11-28"
const DOCS_SITE_URL = "https://docs.convertexcel.net/docs"

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
}

const GUIDE_SLUGS = new Set([
  "excel-to-latex-table",
  "siunitx-numbers-units",
  "graphs-from-data",
  "pgfplots-basics",
  "pgfplots-error-bars",
  "pgfplots-from-csv",
])
const LOCALIZED_PATHS = new Set([
  "",
  "/convert",
  "/privacy",
  "/excel-addin",
  "/about",
  "/contact",
  "/updates",
])
const JA_ONLY_PATHS = new Set(["/guide", "/faq", "/terms", "/admin/docs"])
const LANGUAGE_PREFIXES = new Set(["en", "zh", "zh-hant", "es", "de"])

type TexFile = { name: string; contents: string }
type TexPreviewBody = { tex?: unknown; files?: unknown }
type DocsPublishBody = { slug?: unknown; title?: unknown; content?: unknown }

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  const headers = new Headers(extraHeaders)
  headers.set("Content-Type", "application/json; charset=utf-8")
  headers.set("Cache-Control", "no-store")
  return withSecurityHeaders(new Response(JSON.stringify(data), { status, headers }))
}

function withSecurityHeaders(response: Response, pathname = ""): Response {
  const secured = new Response(response.body, response)
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value)

  if (!secured.headers.has("Cache-Control")) {
    const hashedAsset = /\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(pathname)
    if (hashedAsset) {
      secured.headers.set("Cache-Control", "public, max-age=31536000, immutable")
    } else if (/\.[A-Za-z0-9]+$/.test(pathname)) {
      secured.headers.set("Cache-Control", "public, max-age=86400")
    } else {
      secured.headers.set("Cache-Control", "public, must-revalidate, max-age=0")
    }
  }
  return secured
}

function isPublicPage(pathname: string): boolean {
  const normalized = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  if (normalized === "/" || LOCALIZED_PATHS.has(normalized) || JA_ONLY_PATHS.has(normalized)) return true
  if (normalized.startsWith("/guides/")) return GUIDE_SLUGS.has(normalized.slice("/guides/".length))

  const [, prefix = "", ...rest] = normalized.split("/")
  if (!LANGUAGE_PREFIXES.has(prefix)) return false
  const localizedPath = `/${rest.join("/")}`.replace(/\/$/, "")
  if (LOCALIZED_PATHS.has(localizedPath)) return true
  return localizedPath.startsWith("/guides/") && GUIDE_SLUGS.has(localizedPath.slice("/guides/".length))
}

async function readBoundedBytes(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<Uint8Array> {
  if (!stream) return new Uint8Array()
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) throw new RangeError("payload too large")
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

async function readJson(request: Request): Promise<TexPreviewBody> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0")
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new RangeError("payload too large")
  }
  const bytes = await readBoundedBytes(request.body, MAX_REQUEST_BYTES)
  return JSON.parse(new TextDecoder().decode(bytes)) as TexPreviewBody
}

async function readBoundedText(response: Response): Promise<string> {
  const bytes = await readBoundedBytes(response.body, MAX_LOG_BYTES)
  return new TextDecoder().decode(bytes)
}

function validateFiles(value: unknown): TexFile[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > MAX_FILES) return null

  let totalChars = 0
  const files: TexFile[] = []
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") return null
    const { name, contents } = candidate as { name?: unknown; contents?: unknown }
    if (typeof name !== "string" || typeof contents !== "string") return null
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(name) || name === "document.tex") return null
    if (contents.length > MAX_FILE_CHARS) return null
    totalChars += contents.length
    if (totalChars > MAX_TOTAL_FILE_CHARS) return null
    files.push({ name, contents })
  }
  return files
}

function texliveResultUrl(location: string): URL | null {
  let result: URL
  try {
    result = new URL(location, TEXLIVE_ORIGIN)
  } catch {
    return null
  }
  if (result.origin !== TEXLIVE_ORIGIN) return null
  if (!/^\/latexcgi\/[A-Za-z0-9_-]+\.(pdf|log)$/.test(result.pathname)) return null
  return result
}

async function texPreview(request: Request, env: Env): Promise<Response> {
  const clientKey = request.headers.get("CF-Connecting-IP") ?? "local"
  const rateLimit = await env.PDF_PREVIEW_RATE_LIMIT.limit({ key: clientKey })
  if (!rateLimit.success) {
    return json({ ok: false, reason: "network", log: "送信回数が多すぎます。しばらく待ってから再試行してください。" }, 429, {
      "Retry-After": "60",
    })
  }

  let body: TexPreviewBody
  try {
    body = await readJson(request)
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 422
    return json({ ok: false, reason: "compile", log: status === 413 ? "リクエストが大きすぎます" : "リクエストボディが不正です" }, status)
  }

  const tex = typeof body.tex === "string" ? body.tex : ""
  if (tex.trim() === "") return json({ ok: false, reason: "compile", log: "tex は必須です" }, 422)
  if (tex.length > MAX_TEX_CHARS) return json({ ok: false, reason: "compile", log: "TeX コードが大きすぎます" }, 413)

  const files = validateFiles(body.files)
  if (!files) return json({ ok: false, reason: "compile", log: "追加ファイルが不正または大きすぎます" }, 422)

  const form = new FormData()
  form.append("filecontents[]", tex)
  form.append("filename[]", "document.tex")
  for (const file of files) {
    form.append("filecontents[]", file.contents)
    form.append("filename[]", file.name)
  }
  form.append("engine", "lualatex")
  form.append("return", "pdf")

  let response: Response
  try {
    response = await fetch(TEXLIVE_CGI, { method: "POST", body: form, redirect: "manual" })
  } catch {
    return json({ ok: false, reason: "network", log: "texlive.net への接続に失敗しました" }, 502)
  }

  const resultUrl = texliveResultUrl(response.headers.get("location") ?? "")
  if (resultUrl?.pathname.endsWith(".pdf")) {
    try {
      const pdfResponse = await fetch(resultUrl.toString())
      if (!pdfResponse.ok) throw new Error(`HTTP ${pdfResponse.status}`)
      const contentType = pdfResponse.headers.get("Content-Type") ?? ""
      if (!contentType.toLowerCase().includes("application/pdf")) {
        return json({ ok: false, reason: "network", log: "PDFではない応答を受信しました" }, 502)
      }
      const pdf = await readBoundedBytes(pdfResponse.body, MAX_PDF_BYTES)
      if (pdf.byteLength === 0) return json({ ok: false, reason: "network", log: "空のPDFを受信しました" }, 502)
      return withSecurityHeaders(new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline; filename=preview.pdf",
          "Cache-Control": "no-store",
        },
      }))
    } catch (error) {
      const message = error instanceof RangeError ? "生成されたPDFが大きすぎます" : "生成されたPDFを取得できませんでした"
      return json({ ok: false, reason: "network", log: message }, error instanceof RangeError ? 413 : 502)
    }
  }
  if (resultUrl?.pathname.endsWith(".log")) {
    try {
      const logResponse = await fetch(resultUrl.toString())
      return json({ ok: false, reason: "compile", log: await readBoundedText(logResponse) })
    } catch {
      return json({ ok: false, reason: "network", log: "コンパイルログを取得できませんでした" }, 502)
    }
  }

  return json({ ok: false, reason: "compile", log: `想定外の応答 (HTTP ${response.status})` }, 502)
}

// ── /api/explain-error: Workers AI で TeX コンパイルエラーを自然言語解説 ──────
// フロントの parseTexLog が作る構造化エラーを受け取り、LLM に「何が原因で、
// どう直すか」を説明させる。プロンプトが短く失敗時しか呼ばれないため、
// Workers AI の無料枠（10,000 Neurons/日）でも十分に収まる。

// 日本語品質を優先したモデル。8B fast 版は日本語で繰り返しに陥り品質が低かったため 70B fp8 fast を採用。
// もっと無料枠を節約したい場合は @cf/qwen/qwen3-30b-a3b-fp8 などに差し替え可（出力単価が安い）。
// 注意: 無印の llama-3.1-8b-instruct は 2026-05-30 で deprecated。
const EXPLAIN_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
const EXPLAIN_MAX_ERRORS = 6
const EXPLAIN_MAX_FIELD_CHARS = 600
const EXPLAIN_MAX_LOG_CHARS = 6000
// プロンプトに載せるログはここまで圧縮する（コスト削減）。生ログ全体は載せない。
const EXPLAIN_CONDENSED_LOG_CHARS = 1500

type ExplainError = {
  kind?: unknown
  message?: unknown
  symbol?: unknown
  sourceLine?: unknown
  line?: unknown
  context?: unknown
}
type ExplainBody = { errors?: unknown; lang?: unknown; log?: unknown }

// UI 言語に合わせて回答言語を固定する（i18n の Language と対応）。
const EXPLAIN_LANGUAGES: Record<string, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  "zh-Hant": "繁體中文",
  es: "Español",
  de: "Deutsch",
}

// Few-shot 例。出力フォーマット（1行目 FIXABLE: yes/no）、可否判定の基準、
// 解説の粒度・文体をモデルに示す。解説は主対象である日本語で書くが、これは形式の見本であり、
// 実際の応答は system の指示どおり要求言語で書かせる。
const FEW_SHOT_MESSAGES: { role: "user" | "assistant"; content: string }[] = [
  {
    role: "user",
    content:
      "Compile failure details:\n\nRaw compile log:\n! Misplaced alignment tab character &.\nl.14 価格は 100 & 200 円",
  },
  {
    role: "assistant",
    content:
      "FIXABLE: yes\n「&」は表の列区切り専用の記号です。文字として使うにはエスケープします。\n\n```latex\n100 \\& 200 円\n```",
  },
  {
    role: "user",
    content:
      "Compile failure details:\n\nRaw compile log:\n! Package pgfplots Error: Sorry, the requested feature is not available in this build.",
  },
  {
    role: "assistant",
    content:
      "FIXABLE: no\nツールが生成した pgfplots コードがコンパイル環境の制約に当たっています。入力の修正では直らないため、ログを添えて報告してください。",
  },
]

function clampField(value: unknown): string {
  return typeof value === "string" ? value.slice(0, EXPLAIN_MAX_FIELD_CHARS) : ""
}

// 生ログ全体ではなく、エラーに関係する行だけを抜き出してプロンプトを軽くする。
// TeX ログはプリアンブルやパッケージ読み込みのノイズが大半なので、エラー/警告らしい行と
// 末尾（致命的エラーが出る場所）に絞る。コスト削減と精度の両取り。
function condenseLog(raw: string): string {
  const lines = raw.split(/\r?\n/)
  const relevant = /^(!|l\.\d|Runaway|Overfull|Underfull)|error|warning|fatal|undefined|not found/i
  const picked: string[] = []
  for (const line of lines) {
    if (relevant.test(line) && line.trim()) picked.push(line.trim())
  }
  // 関連行が拾えなければ末尾だけ（多くの致命的エラーは末尾に出る）。
  const tail = lines.slice(-25).map((l) => l.trim()).filter(Boolean)
  const merged = (picked.length > 0 ? picked : tail).join("\n")
  return merged.slice(0, EXPLAIN_CONDENSED_LOG_CHARS)
}

// 集計用のエラー署名。数値・引用符・パスなどユーザー固有値を伏せて正規化する
// （生データを溜め込まないプライバシー配慮も兼ねる）。
function normalizeSignature(message: string): string {
  return message
    .replace(/\d+/g, "#")
    .replace(/`[^`]*`/g, "`…`")
    .replace(/'[^']*'/g, "'…'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160)
}

function buildErrorDigest(errors: ExplainError[]): string {
  return errors
    .slice(0, EXPLAIN_MAX_ERRORS)
    .map((e, i) => {
      const kind = clampField(e.kind) || "generic"
      const message = clampField(e.message)
      const symbol = clampField(e.symbol)
      const context = clampField(e.context)
      const lineValue = typeof e.sourceLine === "number" ? e.sourceLine : typeof e.line === "number" ? e.line : null
      const parts = [`#${i + 1} [${kind}] ${message}`]
      if (symbol) parts.push(`  symbol: ${symbol}`)
      if (lineValue != null) parts.push(`  line: ${lineValue}`)
      if (context) parts.push(`  code: ${context}`)
      return parts.join("\n")
    })
    .join("\n\n")
}

async function explainError(request: Request, env: Env): Promise<Response> {
  const clientKey = request.headers.get("CF-Connecting-IP") ?? "local"
  const rateLimit = await env.EXPLAIN_RATE_LIMIT.limit({ key: clientKey })
  if (!rateLimit.success) {
    return json({ ok: false, reason: "rate", error: "リクエストが多すぎます。しばらく待ってから再試行してください。" }, 429, {
      "Retry-After": "60",
    })
  }

  let body: ExplainBody
  try {
    body = await readJson(request) as ExplainBody
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 422
    return json({ ok: false, reason: "input", error: "リクエストが不正です" }, status)
  }

  const errors = Array.isArray(body.errors) ? (body.errors as ExplainError[]) : []
  // 構造化エラーが無い（parseTexLog が分類できなかった）場合は生ログで補う。
  const rawLog = typeof body.log === "string" ? body.log.slice(0, EXPLAIN_MAX_LOG_CHARS) : ""
  if (errors.length === 0 && rawLog.trim() === "") {
    return json({ ok: false, reason: "input", error: "errors か log のどちらかが必要です" }, 422)
  }

  const lang = typeof body.lang === "string" && body.lang in EXPLAIN_LANGUAGES ? body.lang : "ja"
  const language = EXPLAIN_LANGUAGES[lang]
  const context = errors.length > 0 ? buildErrorDigest(errors) : `Relevant compile log lines:\n${condenseLog(rawLog)}`

  // この経路は「機械的な分類に失敗した」エラーのみが来る。AI には解説に加えて
  // 「ユーザーが自分で直せるか」も判定させ、issues 誘導の出し分けに使う。
  // 出力は JSON ではなく行プレフィックス方式にする（コードブロックや改行・途中切れに強い）。
  const system =
    `You are a friendly LaTeX assistant for a tool that converts spreadsheets into LaTeX tables and pgfplots graphs. ` +
    `The document is compiled with LuaLaTeX (ltjsarticle, Japanese). ` +
    `A heuristic parser already FAILED to classify the following compile failure, so think carefully. ` +
    `Respond in this exact format:\n` +
    `- The FIRST line must be exactly "FIXABLE: yes" if the user can fix it by editing their own input/LaTeX, ` +
    `or "FIXABLE: no" if it looks like a bug in the conversion tool or environment.\n` +
    `- From the SECOND line onward, write the explanation in plain ${language}. ` +
    `Be very concise: at most 2-3 short sentences. State the cause and the fix directly. ` +
    `If a fix needs code, show it in a short fenced code block instead of describing it in prose.\n` +
    `Do NOT restate the error, do NOT repeat yourself, and do NOT add filler or generic closing advice ` +
    `(e.g. "check your code", "please review and fix"). Do not invent errors that are not present. ` +
    `Do NOT mention specific line numbers; the tool already shows the exact location separately. ` +
    `The example exchanges below show the expected brevity and format; ` +
    `always write your actual explanation in ${language}.`
  const user = `Compile failure details:\n\n${context}`

  let aiResult: { response?: string }
  try {
    aiResult = await env.AI.run(EXPLAIN_MODEL, {
      messages: [
        { role: "system", content: system },
        ...FEW_SHOT_MESSAGES,
        { role: "user", content: user },
      ],
      max_tokens: 350,
      temperature: 0.2,
    }) as { response?: string }
  } catch (error) {
    console.error(JSON.stringify({
      message: "workers ai explain failed",
      error: error instanceof Error ? error.message : "unknown error",
    }))
    return json({ ok: false, reason: "ai", error: "解説の生成に失敗しました" }, 502)
  }

  const raw = typeof aiResult.response === "string" ? aiResult.response.trim() : ""
  const parsed = parseExplainResponse(raw)
  if (!parsed.explanation) return json({ ok: false, reason: "ai", error: "解説の生成に失敗しました" }, 502)

  // 集計用に「どんなエラーを AI に回したか」を記録する（本文は保存せず署名のみ）。
  // 頻出する署名を後で分析し、parseTexLog のルールへ昇格させる。書き込み失敗は握りつぶす。
  try {
    const firstMessage =
      errors.length > 0 ? clampField(errors[0]?.message) : (condenseLog(rawLog).split("\n")[0] ?? "")
    const signature = normalizeSignature(firstMessage)
    if (signature) {
      env.EXPLAIN_ANALYTICS?.writeDataPoint({
        blobs: [clampField(errors[0]?.kind) || "none", signature, lang, parsed.userFixable ? "fixable" : "unfixable", EXPLAIN_MODEL],
        indexes: [signature.slice(0, 96)],
      })
    }
  } catch {
    // 分析ログは best-effort。
  }

  return json({ ok: true, explanation: parsed.explanation, userFixable: parsed.userFixable })
}

// モデルの応答から { userFixable, explanation } を取り出す。
// 先頭行の "FIXABLE: yes/no" で可否を判定し、残りを解説とする。行プレフィックス方式は
// JSON と違いコードブロックや改行・途中切れに強い。マーカーが見つからない場合は
// 「ツール側の問題かもしれない」前提で userFixable=false にし、全文を解説として扱う（安全側）。
function parseExplainResponse(raw: string): { userFixable: boolean; explanation: string } {
  const text = raw.trim()
  const match = text.match(/^\s*FIXABLE:\s*(yes|no)\b[ \t]*\r?\n?/i)
  if (match) {
    const userFixable = match[1].toLowerCase() === "yes"
    const explanation = text.slice(match[0].length).trim()
    if (explanation) return { userFixable, explanation }
  }
  return { userFixable: false, explanation: text }
}

async function constantTimeEquals(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ])
  const left = new Uint8Array(providedHash)
  const right = new Uint8Array(expectedHash)
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  const chunks: string[] = []
  const chunkSize = 8192
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)))
  }
  return btoa(chunks.join(""))
}

function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ""))
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function githubHeaders(env: Env): Headers {
  return new Headers({
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_DOCS_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "convertexcel-docs-publisher",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  })
}

async function githubFileSha(apiUrl: string, env: Env): Promise<string | undefined> {
  const response = await fetch(`${apiUrl}?ref=${encodeURIComponent(env.GITHUB_DOCS_BRANCH)}`, {
    headers: githubHeaders(env),
  })
  if (response.status === 404) return undefined
  if (!response.ok) throw new Error(`GitHub read failed (${response.status})`)
  const data = await response.json<{ sha?: unknown }>()
  return typeof data.sha === "string" ? data.sha : undefined
}

async function authorizeDocsAdmin(request: Request, env: Env): Promise<Response | null> {
  const clientKey = request.headers.get("CF-Connecting-IP") ?? "local"
  const rateLimit = await env.DOCS_PUBLISH_RATE_LIMIT.limit({ key: clientKey })
  if (!rateLimit.success) return json({ ok: false, error: "試行回数が多すぎます。しばらく待ってください。" }, 429)
  if (!env.DOCS_ADMIN_TOKEN || !env.GITHUB_DOCS_TOKEN) {
    return json({ ok: false, error: "Docs管理用Secretが設定されていません。" }, 503)
  }
  const authorization = request.headers.get("Authorization") ?? ""
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : ""
  if (!token || !(await constantTimeEquals(token, env.DOCS_ADMIN_TOKEN))) {
    return json({ ok: false, error: "公開用トークンが正しくありません。" }, 401, { "WWW-Authenticate": "Bearer" })
  }
  return null
}

function docsGithubUrl(env: Env, slug?: string): string {
  const repository = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_DOCS_OWNER)}/${encodeURIComponent(env.GITHUB_DOCS_REPO)}/contents/docs/content/docs`
  return slug ? `${repository}/${encodeURIComponent(slug)}.mdx` : repository
}

async function listDocsArticles(request: Request, env: Env): Promise<Response> {
  const denied = await authorizeDocsAdmin(request, env)
  if (denied) return denied
  try {
    const response = await fetch(`${docsGithubUrl(env)}?ref=${encodeURIComponent(env.GITHUB_DOCS_BRANCH)}`, { headers: githubHeaders(env) })
    if (!response.ok) return json({ ok: false, error: `記事一覧の取得に失敗しました (${response.status})。` }, 502)
    const data = await response.json<unknown>()
    if (!Array.isArray(data)) return json({ ok: false, error: "記事一覧の形式が不正です。" }, 502)
    const articles = data.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const entry = item as Record<string, unknown>
      if (entry.type !== "file" || typeof entry.name !== "string" || !entry.name.endsWith(".mdx")) return []
      const slug = entry.name.slice(0, -4)
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return []
      return [{
        slug,
        sha: typeof entry.sha === "string" ? entry.sha : undefined,
        url: typeof entry.html_url === "string" ? entry.html_url : undefined,
      }]
    }).sort((left, right) => left.slug.localeCompare(right.slug))
    return json({ ok: true, articles })
  } catch (error) {
    console.error(JSON.stringify({ message: "github docs list error", error: error instanceof Error ? error.message : "unknown error" }))
    return json({ ok: false, error: "GitHubへの接続に失敗しました。" }, 502)
  }
}

async function getDocsArticle(request: Request, env: Env, slug: string): Promise<Response> {
  const denied = await authorizeDocsAdmin(request, env)
  if (denied) return denied
  try {
    const response = await fetch(`${docsGithubUrl(env, slug)}?ref=${encodeURIComponent(env.GITHUB_DOCS_BRANCH)}`, { headers: githubHeaders(env) })
    if (response.status === 404) return json({ ok: false, error: "記事が見つかりません。" }, 404)
    if (!response.ok) return json({ ok: false, error: `記事の取得に失敗しました (${response.status})。` }, 502)
    const data = await response.json<{ content?: unknown; sha?: unknown; html_url?: unknown }>()
    if (typeof data.content !== "string") return json({ ok: false, error: "記事本文を読み取れませんでした。" }, 502)
    return json({
      ok: true,
      article: {
        slug,
        content: decodeBase64(data.content),
        sha: typeof data.sha === "string" ? data.sha : undefined,
        url: typeof data.html_url === "string" ? data.html_url : undefined,
      },
    })
  } catch (error) {
    console.error(JSON.stringify({ message: "github docs read error", slug, error: error instanceof Error ? error.message : "unknown error" }))
    return json({ ok: false, error: "GitHubへの接続に失敗しました。" }, 502)
  }
}

async function deleteDocsArticle(request: Request, env: Env, slug: string): Promise<Response> {
  const denied = await authorizeDocsAdmin(request, env)
  if (denied) return denied
  const apiUrl = docsGithubUrl(env, slug)
  try {
    const sha = await githubFileSha(apiUrl, env)
    if (!sha) return json({ ok: false, error: "記事が見つかりません。" }, 404)
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: githubHeaders(env),
      body: JSON.stringify({ message: `Delete docs: ${slug}`, sha, branch: env.GITHUB_DOCS_BRANCH }),
    })
    if (!response.ok) {
      console.error(JSON.stringify({ message: "github docs delete failed", status: response.status, slug }))
      return json({ ok: false, error: `記事の削除に失敗しました (${response.status})。` }, 502)
    }
    console.log(JSON.stringify({ message: "docs article deleted", slug }))
    return json({ ok: true, slug })
  } catch (error) {
    console.error(JSON.stringify({ message: "github docs delete error", slug, error: error instanceof Error ? error.message : "unknown error" }))
    return json({ ok: false, error: "GitHubへの接続に失敗しました。" }, 502)
  }
}

async function publishDocsArticle(request: Request, env: Env): Promise<Response> {
  const denied = await authorizeDocsAdmin(request, env)
  if (denied) return denied

  let body: DocsPublishBody
  try {
    body = await readJson(request) as DocsPublishBody
  } catch (error) {
    return json({ ok: false, error: error instanceof RangeError ? "記事が大きすぎます。" : "リクエストが不正です。" }, error instanceof RangeError ? 413 : 422)
  }

  const slug = typeof body.slug === "string" ? body.slug : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content : ""
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !title || title.length > 160 || !content.trim()) {
    return json({ ok: false, error: "slug、タイトル、本文を確認してください。" }, 422)
  }
  if (content.length > MAX_DOCS_CONTENT_CHARS) return json({ ok: false, error: "記事が大きすぎます。" }, 413)

  const apiUrl = docsGithubUrl(env, slug)

  try {
    const sha = await githubFileSha(apiUrl, env)
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: githubHeaders(env),
      body: JSON.stringify({
        message: `${sha ? "Update" : "Add"} docs: ${title}`,
        content: encodeBase64(content),
        branch: env.GITHUB_DOCS_BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })
    if (!response.ok) {
      console.error(JSON.stringify({ message: "github docs publish failed", status: response.status, slug }))
      return json({ ok: false, error: `GitHubへの保存に失敗しました (${response.status})。` }, 502)
    }
    const data = await response.json<{ content?: { html_url?: unknown } }>()
    const url = typeof data.content?.html_url === "string" ? data.content.html_url : undefined
    console.log(JSON.stringify({ message: "docs article published", slug, updated: Boolean(sha) }))
    return json({ ok: true, slug, url })
  } catch (error) {
    console.error(JSON.stringify({
      message: "github docs publish error",
      slug,
      error: error instanceof Error ? error.message : "unknown error",
    }))
    return json({ ok: false, error: "GitHubへの接続に失敗しました。" }, 502)
  }
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname === "/docs" || /^\/(en|zh|zh-hant|es|de)\/docs\/?$/.test(pathname)) {
    const location = new URL(DOCS_SITE_URL)
    location.search = url.search
    return withSecurityHeaders(new Response(null, {
      status: 308,
      headers: { Location: location.toString(), "Cache-Control": "public, max-age=86400" },
    }))
  }

  if (pathname === "/api/health") {
    if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405, { Allow: "GET" })
    return json({ status: "ok" })
  }

  if (pathname === "/api/tex-preview") {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, { Allow: "POST" })
    return texPreview(request, env)
  }

  if (pathname === "/api/explain-error") {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, { Allow: "POST" })
    return explainError(request, env)
  }

  if (pathname === "/api/admin/docs/publish") {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, { Allow: "POST" })
    return publishDocsArticle(request, env)
  }

  if (pathname === "/api/admin/docs") {
    if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405, { Allow: "GET" })
    return listDocsArticles(request, env)
  }

  const docsArticleMatch = pathname.match(/^\/api\/admin\/docs\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)
  if (docsArticleMatch) {
    if (request.method === "GET") return getDocsArticle(request, env, docsArticleMatch[1])
    if (request.method === "DELETE") return deleteDocsArticle(request, env, docsArticleMatch[1])
    return json({ error: "Method Not Allowed" }, 405, { Allow: "GET, DELETE" })
  }

  if (pathname.startsWith("/api/")) return json({ error: "Not Found" }, 404)

  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "Method Not Allowed" }, 405, { Allow: "GET, HEAD" })
  }

  const assetResponse = await env.ASSETS.fetch(request)
  if (!/\.[A-Za-z0-9]+$/.test(pathname) && !isPublicPage(pathname)) {
    return withSecurityHeaders(new Response(assetResponse.body, { status: 404, headers: assetResponse.headers }), pathname)
  }
  return withSecurityHeaders(assetResponse, pathname)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env)
    } catch (error) {
      console.error(JSON.stringify({
        message: "unhandled request error",
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : "unknown error",
      }))
      return json({ error: "Internal Server Error" }, 500)
    }
  },
} satisfies ExportedHandler<Env>
