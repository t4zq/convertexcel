import type { ColumnStats, CorrelationMatrix, Grid, StatsResult } from "@/lib/types"

// ─── 貼り付けテキストのパース ───────────────────────────────
// Excel からの貼り付けはタブ区切り、CSV はカンマ区切り。
// 行内にタブがあればタブを、なければカンマを区切りとして扱う。

export function parseGrid(text: string): Grid {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  // 末尾の空行を落とす
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop()
  }
  return lines.map((line) => {
    const delimiter = line.includes("\t") ? "\t" : ","
    return line.split(delimiter).map((cell) => cell.trim())
  })
}

// ─── TS フォールバック計算 (Rust/Rails と同一仕様) ───────────

function isNumeric(s: string): boolean {
  if (s === "") return false
  const v = Number(s)
  return Number.isFinite(v)
}

// 線形補間の分位数 (numpy 既定 'linear' 相当)
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  if (sorted.length === 1) return sorted[0]
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (base + 1 < sorted.length) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  }
  return sorted[base]
}

interface NumericColumn {
  name: string
  values: number[] // 数値に変換できた値のみ
}

function numericColumns(grid: Grid): NumericColumn[] {
  if (grid.length < 2) return []
  const headers = grid[0]
  const cols = headers.length
  const result: NumericColumn[] = []
  for (let c = 0; c < cols; c++) {
    const values: number[] = []
    for (let r = 1; r < grid.length; r++) {
      const cell = grid[r][c] ?? ""
      if (isNumeric(cell)) values.push(Number(cell))
    }
    // 1つでも数値があれば数値列とみなす
    if (values.length > 0) {
      result.push({ name: headers[c] || `col${c + 1}`, values })
    }
  }
  return result
}

function describeColumn(col: NumericColumn): ColumnStats {
  const xs = col.values
  const n = xs.length
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const variance =
    n > 1 ? xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0
  const sorted = [...xs].sort((a, b) => a - b)
  return {
    column: col.name,
    n,
    mean,
    std: Math.sqrt(variance),
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[n - 1],
  }
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 2) return NaN
  let sa = 0
  let sb = 0
  for (let i = 0; i < n; i++) {
    sa += a[i]
    sb += b[i]
  }
  const ma = sa / n
  const mb = sb / n
  let cov = 0
  let va = 0
  let vb = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma
    const db = b[i] - mb
    cov += da * db
    va += da * da
    vb += db * db
  }
  if (va === 0 || vb === 0) return NaN
  return cov / Math.sqrt(va * vb)
}

// 相関は「両列ともに数値」の共通行のみを使う。
function correlationMatrix(grid: Grid): CorrelationMatrix {
  if (grid.length < 2) return { columns: [], matrix: [] }
  const headers = grid[0]
  const numericIdx: number[] = []
  for (let c = 0; c < headers.length; c++) {
    let count = 0
    for (let r = 1; r < grid.length; r++) {
      if (isNumeric(grid[r][c] ?? "")) count++
    }
    if (count > 0) numericIdx.push(c)
  }
  const columns = numericIdx.map((c) => headers[c] || `col${c + 1}`)
  const matrix: number[][] = numericIdx.map(() => numericIdx.map(() => NaN))

  for (let i = 0; i < numericIdx.length; i++) {
    for (let j = i; j < numericIdx.length; j++) {
      const ci = numericIdx[i]
      const cj = numericIdx[j]
      const a: number[] = []
      const b: number[] = []
      for (let r = 1; r < grid.length; r++) {
        const va = grid[r][ci] ?? ""
        const vb = grid[r][cj] ?? ""
        if (isNumeric(va) && isNumeric(vb)) {
          a.push(Number(va))
          b.push(Number(vb))
        }
      }
      const r = i === j ? 1 : pearson(a, b)
      matrix[i][j] = r
      matrix[j][i] = r
    }
  }
  return { columns, matrix }
}

export function computeStatsTS(grid: Grid): StatsResult {
  const cols = numericColumns(grid)
  return {
    descriptive: cols.map(describeColumn),
    correlation: correlationMatrix(grid),
  }
}
