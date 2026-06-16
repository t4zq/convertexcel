// API のベース URL。本番では Cloudflare Worker が同一オリジンの /api を処理する。
// dev (Vite) では vite.config.ts の proxy が /api を `wrangler dev` (:8787) に転送する。
// 別オリジンの Worker を叩きたい場合のみ VITE_API_BASE で上書きする。
export const API_BASE = import.meta.env.VITE_API_BASE ?? ""

export type DatasetRows = string[][]

// ─── データセット永続化 (Rails 薄いAPI) ────────────────────

export async function listDatasets(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/datasets`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return ((await res.json()) as { datasets: string[] }).datasets
}

export async function saveDataset(name: string, rows: DatasetRows): Promise<void> {
  const res = await fetch(`${API_BASE}/api/datasets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rows }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
}

export async function loadDataset(name: string): Promise<DatasetRows> {
  const res = await fetch(`${API_BASE}/api/datasets/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return ((await res.json()) as { rows: DatasetRows }).rows
}
