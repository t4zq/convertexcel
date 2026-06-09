// Rails API のベース URL。dev では Vite の別オリジン (5173) から
// Rails (3000) を直接叩く。CORS は Rails 側で許可する。
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000"

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
