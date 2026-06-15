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
