import type { Grid } from "@/lib/types"

export interface NumericColumn {
  index: number
  name: string
  values: (number | null)[] // 行に対応 (非数値は null)
}

function isNum(s: string): boolean {
  return s !== "" && Number.isFinite(Number(s))
}

/** 1行目をヘッダとして数値列を抽出 (各行に対応した null 付き配列)。 */
export function numericColumns(grid: Grid): NumericColumn[] {
  if (grid.length < 2) return []
  const headers = grid[0]
  const cols = headers.length
  const out: NumericColumn[] = []
  for (let c = 0; c < cols; c++) {
    const values: (number | null)[] = []
    let hasNum = false
    for (let r = 1; r < grid.length; r++) {
      const cell = grid[r][c] ?? ""
      if (isNum(cell)) {
        values.push(Number(cell))
        hasNum = true
      } else {
        values.push(null)
      }
    }
    if (hasNum) out.push({ index: c, name: headers[c] || `col${c + 1}`, values })
  }
  return out
}

/** 2列を取り、両方が数値の行だけのペアを返す。 */
export function pairColumns(
  grid: Grid,
  xIndex: number,
  yIndex: number
): { x: number[]; y: number[] } {
  const x: number[] = []
  const y: number[] = []
  for (let r = 1; r < grid.length; r++) {
    const xv = grid[r]?.[xIndex] ?? ""
    const yv = grid[r]?.[yIndex] ?? ""
    if (isNum(xv) && isNum(yv)) {
      x.push(Number(xv))
      y.push(Number(yv))
    }
  }
  return { x, y }
}

/** 単一列の数値のみ。 */
export function columnNumbers(grid: Grid, index: number): number[] {
  const out: number[] = []
  for (let r = 1; r < grid.length; r++) {
    const v = grid[r]?.[index] ?? ""
    if (isNum(v)) out.push(Number(v))
  }
  return out
}
