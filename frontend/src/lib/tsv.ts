export type TabularCell = string | number | boolean | null | undefined | void

// 空行を除外し、先頭行にタブがなければカンマ区切りとして扱う。
// 返り値は常に矩形へ正規化する。
export function parseTsv(value: string): string[][] {
  const lines = value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "")

  if (lines.length === 0) return []

  const delimiter = lines[0].includes("\t") ? "\t" : ","
  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()))
  const columnCount = Math.max(...rows.map((row) => row.length))

  return rows.map((row) => [
    ...row,
    ...Array<string>(columnCount - row.length).fill(""),
  ])
}

export function serializeTsv(rows: readonly (readonly TabularCell[])[]): string {
  return rows
    .map((row) => row.map((cell) => (cell == null ? "" : String(cell))).join("\t"))
    .join("\n")
}
