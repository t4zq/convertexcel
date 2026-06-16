export interface ExcelSelection {
  tsv: string
  rowCount: number
  columnCount: number
  address: string
}

interface RangeSnapshot {
  address: string
  values: unknown[][]
  rowCount: number
  columnCount: number
  rowIndex: number
  columnIndex: number
}

const MAX_DIRECT_CELL_COUNT = 50_000

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

function valuesToTsv(values: unknown[][]): string {
  return values.map((row) => row.map(cellToText).join("\t")).join("\n")
}

function shouldShrinkToUsedRange(range: Excel.Range): boolean {
  return range.rowCount * range.columnCount > MAX_DIRECT_CELL_COUNT
}

function snapshotRange(range: Excel.Range): RangeSnapshot | null {
  if (range.isNullObject) return null
  return {
    address: range.address,
    values: range.values,
    rowCount: range.rowCount,
    columnCount: range.columnCount,
    rowIndex: range.rowIndex,
    columnIndex: range.columnIndex,
  }
}

function combineAreas(areas: RangeSnapshot[], address: string): ExcelSelection {
  const sorted = [...areas].sort((a, b) => a.columnIndex - b.columnIndex || a.rowIndex - b.rowIndex)
  const firstRow = Math.min(...sorted.map((area) => area.rowIndex))
  const lastRow = Math.max(...sorted.map((area) => area.rowIndex + area.rowCount))
  const rowCount = Math.max(0, lastRow - firstRow)
  const columnCount = sorted.reduce((sum, area) => sum + area.columnCount, 0)
  const values = Array.from({ length: rowCount }, (_, rowOffset) => {
    const sheetRowIndex = firstRow + rowOffset
    return sorted.flatMap((area) => {
      const areaRowOffset = sheetRowIndex - area.rowIndex
      if (areaRowOffset < 0 || areaRowOffset >= area.rowCount) {
        return Array.from({ length: area.columnCount }, () => "")
      }
      return Array.from({ length: area.columnCount }, (_, columnOffset) => {
        return area.values[areaRowOffset]?.[columnOffset] ?? ""
      })
    })
  })

  return {
    tsv: valuesToTsv(values),
    rowCount,
    columnCount,
    address,
  }
}

async function readSingleSelectedRange(context: Excel.RequestContext): Promise<ExcelSelection> {
  const range = context.workbook.getSelectedRange()
  range.load(["address", "values", "rowCount", "columnCount"])
  await context.sync()

  return {
    tsv: valuesToTsv(range.values),
    rowCount: range.rowCount,
    columnCount: range.columnCount,
    address: range.address,
  }
}

async function readSelectedRangeAreas(context: Excel.RequestContext): Promise<ExcelSelection> {
  const rangeAreas = context.workbook.getSelectedRanges()
  rangeAreas.load("address")
  rangeAreas.areas.load("items")
  await context.sync()

  for (const range of rangeAreas.areas.items) {
    range.load(["address", "rowCount", "columnCount", "rowIndex", "columnIndex"])
  }
  await context.sync()

  const sourceRanges = rangeAreas.areas.items.map((range) => {
    const source = shouldShrinkToUsedRange(range) ? range.getUsedRangeOrNullObject(true) : range
    source.load(["address", "values", "rowCount", "columnCount", "rowIndex", "columnIndex"])
    return source
  })
  await context.sync()

  const snapshots = sourceRanges
    .map(snapshotRange)
    .filter((range): range is RangeSnapshot => range !== null)

  if (snapshots.length === 0) {
    throw new Error("選択範囲に読み込めるセルがありません。")
  }

  return combineAreas(snapshots, rangeAreas.address)
}

export async function readSelectedRange(): Promise<ExcelSelection> {
  if (typeof Excel === "undefined") {
    throw new Error("Excel の中でアドインを開いてから選択範囲を取り込んでください。")
  }

  return Excel.run(async (context) => {
    if (typeof context.workbook.getSelectedRanges !== "function") {
      return readSingleSelectedRange(context)
    }

    try {
      return await readSelectedRangeAreas(context)
    } catch (err) {
      console.warn("Failed to read selected range areas; falling back to selected range.", err)
      return readSingleSelectedRange(context)
    }
  })
}
