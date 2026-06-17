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
  // 該当する入力列（1 始まり）。列に紐づかない診断では undefined。
  column?: number
}

export interface InputDiagnostics {
  rows: string[][]
  normalizedRows: string[][]
  rowCount: number
  maxCols: number
  expectedCols: number
  unevenRows: number[]
  numericColumns: { index: number; name: string; count: number; nonPositive: number }[]
  format: {
    delimiter: "tab" | "comma" | "mixed" | "unknown"
    normalizedCellCount: number
    changedCells: number
    emptyCells: number
  }
  problems: Diagnostic[]
}

type ParsedDiagnosticLine = {
  delimiter: "tab" | "comma" | "unknown"
  rawCells: string[]
  normalizedCells: string[]
}

function normalizeFullwidthAscii(value: string): string {
  return value
    .replace(/[\uFF01-\uFF5E]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
}

function stripWrappingQuotes(value: string): string {
  let next = value.trim()
  for (;;) {
    const first = next[0]
    const last = next[next.length - 1]
    const quoted =
      (first === "\"" && last === "\"") ||
      (first === "'" && last === "'") ||
      (first === "「" && last === "」") ||
      (first === "『" && last === "』")
    if (!quoted || next.length < 2) return next
    next = next.slice(1, -1).trim()
  }
}

function normalizeCell(cell: string): string {
  return stripWrappingQuotes(normalizeFullwidthAscii(cell))
}

function detectDelimiter(line: string): "tab" | "comma" | "unknown" {
  if (line.includes("\t")) return "tab"
  if (line.includes(",")) return "comma"
  return "unknown"
}

function splitDiagnosticLine(line: string): ParsedDiagnosticLine {
  const delimiter = detectDelimiter(line)
  const rawCells =
    delimiter === "tab" ? line.split("\t") : delimiter === "comma" ? line.split(",") : [line]
  return {
    delimiter,
    rawCells,
    normalizedCells: rawCells.map(normalizeCell),
  }
}

function parseDiagnosticLines(text: string): ParsedDiagnosticLine[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop()
  }
  return lines
    .filter((line) => line.trim() !== "")
    .map(splitDiagnosticLine)
}

function isNumericCell(cell: string) {
  return cell !== "" && Number.isFinite(Number(cell))
}

function parseValueWithOptionalError(cell: string): { value: number; error?: number } | null {
  const normalized = normalizeCell(cell)
    .replace(/±/g, "+-")
    .replace(/\s+/g, " ")
    .trim()
  if (isNumericCell(normalized)) return { value: Number(normalized) }

  const match = normalized.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*\+-\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)$/i)
  if (!match) return null
  const value = Number(match[1])
  const error = Number(match[2])
  return Number.isFinite(value) && Number.isFinite(error) ? { value, error } : null
}

function getDelimiterSummary(lines: ParsedDiagnosticLine[]): InputDiagnostics["format"] {
  const delimiters = new Set(lines.map((line) => line.delimiter).filter((delimiter) => delimiter !== "unknown"))
  const delimiter = delimiters.size > 1 ? "mixed" : delimiters.values().next().value ?? "unknown"
  const normalizedCellCount = lines.reduce((sum, line) => sum + line.normalizedCells.length, 0)
  const changedCells = lines.reduce(
    (sum, line) =>
      sum +
      line.rawCells.filter((cell, index) => normalizeCell(cell) !== line.normalizedCells[index]).length,
    0,
  )
  const emptyCells = lines.reduce(
    (sum, line) => sum + line.normalizedCells.filter((cell) => cell === "").length,
    0,
  )

  return {
    delimiter,
    normalizedCellCount,
    changedCells,
    emptyCells,
  }
}

export function diagnoseInput(input: string, hasHeader: boolean, scaleMode: string): InputDiagnostics {
  const parsedLines = parseDiagnosticLines(input)
  const rows = parsedLines.map((line) => line.rawCells.map((cell) => cell.trim()))
  const normalizedRows = parsedLines.map((line) => line.normalizedCells)
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
      const cell = normalizedRows[r]?.[index] ?? ""
      const parsed = parseValueWithOptionalError(cell)
      if (!parsed) continue
      const value = parsed.value
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
  const invalidCells: Diagnostic[] = []
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
      code: "ragged-more",
      message: `ほか ${unevenRows.length - RAGGED_LIMIT} 行で列数が一致しません。`,
    })
  }
  const INVALID_CELL_LIMIT = 8
  for (let rowIndex = dataStart; rowIndex < normalizedRows.length; rowIndex++) {
    for (let columnIndex = 0; columnIndex < maxCols; columnIndex++) {
      const cell = normalizedRows[rowIndex]?.[columnIndex] ?? ""
      if (cell === "") continue
      if (parseValueWithOptionalError(cell)) continue
      invalidCells.push({
        severity: "error",
        code: "invalid-number",
        message: `数値として読めないセルがあります: "${cell}"`,
        line: rowIndex + 1,
        column: columnIndex + 1,
      })
    }
  }
  problems.push(...invalidCells.slice(0, INVALID_CELL_LIMIT))
  if (invalidCells.length > INVALID_CELL_LIMIT) {
    problems.push({
      severity: "error",
      code: "invalid-number-more",
      message: `ほか ${invalidCells.length - INVALID_CELL_LIMIT} 個のセルを数値として読めません。`,
    })
  }
  if (rows.length > 0 && numericColumns.length < 2) {
    problems.push({
      severity: "warning",
      code: "too-few-numeric-columns",
      message: "数値列が 2 列未満のため、グラフ化できる系列が不足しています。",
    })
  }
  if (scaleMode !== "linear") {
    const xColumn = numericColumns.find((col) => col.index === 0)
    const yColumns = numericColumns.filter((col) => col.index > 0)
    if ((scaleMode === "xlog" || scaleMode === "loglog") && xColumn?.nonPositive) {
      problems.push({ severity: "error", code: "log-nonpositive-x", message: "対数 x 軸では x 列に 0 以下の値を使えません。" })
    }
    if ((scaleMode === "semilog" || scaleMode === "loglog") && yColumns.some((col) => col.nonPositive > 0)) {
      problems.push({ severity: "error", code: "log-nonpositive-y", message: "対数 y 軸では y 系列に 0 以下の値を使えません。" })
    }
  }

  return {
    rows,
    normalizedRows,
    rowCount: rows.length,
    maxCols,
    expectedCols,
    unevenRows,
    numericColumns,
    format: getDelimiterSummary(parsedLines),
    problems,
  }
}
