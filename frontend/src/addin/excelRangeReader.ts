export interface ExcelSelection {
  tsv: string
  rowCount: number
  columnCount: number
  address: string
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

function valuesToTsv(values: unknown[][]): string {
  return values.map((row) => row.map(cellToText).join("\t")).join("\n")
}

export async function readSelectedRange(): Promise<ExcelSelection> {
  if (typeof Excel === "undefined") {
    throw new Error("Excel の中でアドインを開いてから選択範囲を取り込んでください。")
  }

  return Excel.run(async (context) => {
    const range = context.workbook.getSelectedRange()
    range.load(["address", "values", "rowCount", "columnCount"])
    await context.sync()

    return {
      tsv: valuesToTsv(range.values),
      rowCount: range.rowCount,
      columnCount: range.columnCount,
      address: range.address,
    }
  })
}
