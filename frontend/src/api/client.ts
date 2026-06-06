import type { Grid, StatsResult } from "@/lib/types"

// Rails API のベース URL。dev では Vite の別オリジン (5173) から
// Rails (3000) を直接叩く。CORS は Rails 側で許可する。
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000"

export async function computeStatsAPI(grid: Grid): Promise<StatsResult> {
  const res = await fetch(`${API_BASE}/api/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows: grid }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return (await res.json()) as StatsResult
}

// ─── データセット永続化 (Rails 薄いAPI) ────────────────────

export async function listDatasets(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/datasets`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return ((await res.json()) as { datasets: string[] }).datasets
}

export async function saveDataset(name: string, rows: Grid): Promise<void> {
  const res = await fetch(`${API_BASE}/api/datasets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rows }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
}

export async function loadDataset(name: string): Promise<Grid> {
  const res = await fetch(`${API_BASE}/api/datasets/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return ((await res.json()) as { rows: Grid }).rows
}
