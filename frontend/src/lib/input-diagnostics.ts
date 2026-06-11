// 入力テキストの簡易診断。エンジンに渡す前段で、行・列の不揃いや
// 対数軸に使えない値などをユーザーへ警告するために使う。

export type DiagnosticSeverity = "error" | "warning" | "info"

export interface Diagnostic {
  severity: DiagnosticSeverity
  // rustc 風の短いコード（パネルで右側にメタ表示する）。
  code: string
  message: string
  // 該当する入力行（1 始まり）。行に紐づかない診断では undefined。
  line?: number
}

export interface InputDiagnostics {
  rows: string[][]
  rowCount: number
  maxCols: number
  expectedCols: number
  unevenRows: number[]
  numericColumns: { index: number; name: string; count: number; nonPositive: number }[]
  problems: Diagnostic[]
}

function parseDiagnosticRows(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop()
  }
  return lines
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ","
      return line.split(delimiter).map((cell) => cell.trim())
    })
}

function isNumericCell(cell: string) {
  return cell !== "" && Number.isFinite(Number(cell))
}

export function diagnoseInput(input: string, hasHeader: boolean, scaleMode: string): InputDiagnostics {
  const rows = parseDiagnosticRows(input)
  const expectedCols = rows[0]?.length ?? 0
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0)
  const unevenRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.length !== expectedCols)
    .map(({ index }) => index + 1)

  const dataStart = hasHeader ? 1 : 0
  const headers = hasHeader ? rows[0] ?? [] : []
  const numericColumns = Array.from({ length: maxCols }, (_, index) => {
    let count = 0
    let nonPositive = 0
    for (let r = dataStart; r < rows.length; r++) {
      const cell = rows[r]?.[index] ?? ""
      if (!isNumericCell(cell)) continue
      const value = Number(cell)
      count += 1
      if (value <= 0) nonPositive += 1
    }
    return {
      index,
      name: headers[index] || `col${index + 1}`,
      count,
      nonPositive,
    }
  }).filter((col) => col.count > 0)

  const problems: Diagnostic[] = []
  if (rows.length === 0) {
    problems.push({ severity: "info", code: "empty-input", message: "入力がありません。表を貼り付けてください。" })
  }
  if (rows.length > 0 && expectedCols < 2) {
    problems.push({ severity: "error", code: "too-few-columns", message: "x 列と y 列の最低 2 列が必要です。" })
  }
  const RAGGED_LIMIT = 8
  for (const line of unevenRows.slice(0, RAGGED_LIMIT)) {
    problems.push({
      severity: "warning",
      code: "ragged-row",
      message: `列数がそろっていません（期待値 ${expectedCols} 列）。`,
      line,
    })
  }
  if (unevenRows.length > RAGGED_LIMIT) {
    problems.push({
      severity: "warning",
      code: "ragged-row",
      message: `ほか ${unevenRows.length - RAGGED_LIMIT} 行で列数が一致しません。`,
    })
  }
  if (rows.length > 0 && numericColumns.length < 2) {
    problems.push({
      severity: "warning",
      code: "few-numeric-columns",
      message: "数値列が 2 列未満のため、グラフ化できる系列が不足しています。",
    })
  }
  if (scaleMode !== "linear") {
    const xColumn = numericColumns.find((col) => col.index === 0)
    const yColumns = numericColumns.filter((col) => col.index > 0)
    if (scaleMode === "loglog" && xColumn?.nonPositive) {
      problems.push({ severity: "error", code: "log-nonpositive-x", message: "両対数では x 列に 0 以下の値を使えません。" })
    }
    if ((scaleMode === "semilog" || scaleMode === "loglog") && yColumns.some((col) => col.nonPositive > 0)) {
      problems.push({ severity: "error", code: "log-nonpositive-y", message: "対数 y 軸では y 系列に 0 以下の値を使えません。" })
    }
  }

  return {
    rows,
    rowCount: rows.length,
    maxCols,
    expectedCols,
    unevenRows,
    numericColumns,
    problems,
  }
}
