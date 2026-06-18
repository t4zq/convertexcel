/** converTeXcel production Worker. */

const TEXLIVE_CGI = "https://texlive.net/cgi-bin/latexcgi"
const TEXLIVE_ORIGIN = "https://texlive.net"

const MAX_REQUEST_BYTES = 256 * 1024
const MAX_TEX_CHARS = 120_000
const MAX_FILES = 4
const MAX_FILE_CHARS = 64_000
const MAX_TOTAL_FILE_CHARS = 128_000
const MAX_LOG_BYTES = 128 * 1024

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
  "/docs",
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

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url

  if (pathname === "/api/health") {
    if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405, { Allow: "GET" })
    return json({ status: "ok" })
  }

  if (pathname === "/api/tex-preview") {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405, { Allow: "POST" })
    return texPreview(request, env)
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
