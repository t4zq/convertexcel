/** converTeXcel production Worker. */

const TEXLIVE_CGI = "https://texlive.net/cgi-bin/latexcgi"
const TEXLIVE_ORIGIN = "https://texlive.net"

const MAX_REQUEST_BYTES = 256 * 1024
const MAX_TEX_CHARS = 120_000
const MAX_FILES = 4
const MAX_FILE_CHARS = 64_000
const MAX_TOTAL_FILE_CHARS = 128_000
const MAX_LOG_BYTES = 128 * 1024
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
const JA_ONLY_PATHS = new Set(["/guide", "/faq", "/terms"])
const LANGUAGE_PREFIXES = new Set(["en", "zh", "zh-hant", "es", "de"])

type TexFile = { name: string; contents: string }
type TexPreviewBody = { tex?: unknown; files?: unknown }

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
    return json({ ok: true, pdfPath: `${resultUrl.pathname}${resultUrl.search}` })
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
