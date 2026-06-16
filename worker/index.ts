/**
 * converTeXcel Worker。
 *
 * - `/api/*` … データセット(grid)の永続化 API。保存先は D1 (binding: DB)。
 *   旧 Rails の datasets_controller と同じ振る舞い (index/create/show) を踏襲。
 * - それ以外 … 静的アセット (binding: ASSETS, SPA フォールバック付き)。
 */

interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

type DatasetRow = string[]

// 旧 Rails が `origins "*"` だったため、アドイン等の別オリジン呼び出しを維持する。
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

async function listDatasets(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT name FROM datasets ORDER BY name",
  ).all<{ name: string }>()
  return json({ datasets: results.map((r) => r.name) })
}

async function createDataset(env: Env, request: Request): Promise<Response> {
  let body: { name?: unknown; rows?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ error: "リクエストボディが不正です" }, 422)
  }

  const name = String(body.name ?? "").trim()
  if (name === "") return json({ error: "name は必須です" }, 422)

  const rows: DatasetRow[] = Array.isArray(body.rows)
    ? body.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c)) : []))
    : []

  const updatedAt = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO datasets (name, rows, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(name) DO UPDATE SET rows = excluded.rows, updated_at = excluded.updated_at`,
  )
    .bind(name, JSON.stringify(rows), updatedAt)
    .run()

  return json({ name, count: rows.length }, 201)
}

// ─── texlive.net PDF プレビューのプロキシ ──────────────────
//
// texlive.net の CGI はコンパイル結果へ 301 リダイレクトするが、その 301 には
// CORS ヘッダが無いため、ブラウザからの cross-origin fetch では追えない
// (リダイレクト先の .pdf / .log には ACAO:* が付くが、途中の 301 で弾かれる)。
// そこで Worker 側で `redirect: "manual"` のままリダイレクト先を読み取り、
// 成功なら PDF のパスを、失敗ならログ本文を返す。
const TEXLIVE_CGI = "https://texlive.net/cgi-bin/latexcgi"
const TEXLIVE_ORIGIN = "https://texlive.net"

async function texPreview(request: Request): Promise<Response> {
  let body: { tex?: unknown; files?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return json({ ok: false, reason: "compile", log: "リクエストボディが不正です" }, 422)
  }

  const tex = typeof body.tex === "string" ? body.tex : ""
  if (tex.trim() === "") return json({ ok: false, reason: "compile", log: "tex は必須です" }, 422)

  const files = Array.isArray(body.files)
    ? body.files.filter(
        (f): f is { name: string; contents: string } =>
          !!f &&
          typeof f === "object" &&
          typeof (f as { name?: unknown }).name === "string" &&
          typeof (f as { contents?: unknown }).contents === "string",
      )
    : []

  const form = new FormData()
  form.append("filecontents[]", tex)
  form.append("filename[]", "document.tex")
  for (const f of files) {
    form.append("filecontents[]", f.contents)
    form.append("filename[]", f.name)
  }
  form.append("engine", "lualatex")
  form.append("return", "pdf")

  let res: Response
  try {
    res = await fetch(TEXLIVE_CGI, { method: "POST", body: form, redirect: "manual" })
  } catch (error) {
    return json(
      { ok: false, reason: "network", log: `texlive.net への接続に失敗しました: ${String(error)}` },
      502,
    )
  }

  const location = res.headers.get("location") ?? ""
  if (/\.pdf(\?|$)/.test(location)) {
    // location は "/latexcgi/document_XXXX.pdf"。pdf.js ビューアで表示するパスを返す。
    return json({ ok: true, pdfPath: location })
  }
  if (/\.log(\?|$)/.test(location)) {
    const logRes = await fetch(new URL(location, TEXLIVE_ORIGIN).toString())
    const log = await logRes.text()
    return json({ ok: false, reason: "compile", log })
  }

  // リダイレクトされなかった場合は本文をログ扱いにする。
  const text = await res.text().catch(() => "")
  return json({ ok: false, reason: "compile", log: text || `想定外の応答 (HTTP ${res.status})` })
}

async function showDataset(env: Env, name: string): Promise<Response> {
  const entry = await env.DB.prepare(
    "SELECT rows, updated_at FROM datasets WHERE name = ?1",
  )
    .bind(name)
    .first<{ rows: string; updated_at: string }>()

  if (!entry) return json({ error: "見つかりません" }, 404)

  return json({
    name,
    rows: JSON.parse(entry.rows) as DatasetRow[],
    updated_at: entry.updated_at,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    if (!pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request)
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (pathname === "/api/health") {
      return json({ status: "ok" })
    }

    if (pathname === "/api/tex-preview") {
      if (request.method === "POST") return texPreview(request)
      return json({ error: "Method Not Allowed" }, 405)
    }

    if (pathname === "/api/datasets") {
      if (request.method === "GET") return listDatasets(env)
      if (request.method === "POST") return createDataset(env, request)
      return json({ error: "Method Not Allowed" }, 405)
    }

    const showMatch = pathname.match(/^\/api\/datasets\/(.+)$/)
    if (showMatch && request.method === "GET") {
      return showDataset(env, decodeURIComponent(showMatch[1]))
    }

    return json({ error: "Not Found" }, 404)
  },
} satisfies ExportedHandler<Env>
