import { strToU8, zipSync } from "fflate"

export interface ExportSheet {
  name: string
  values: unknown[][]
  formulas: string[][]
}

const xml = (value: unknown) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;")

function columnName(index: number) {
  let result = ""
  for (let current = index + 1; current > 0; current = Math.floor((current - 1) / 26)) {
    result = String.fromCharCode(65 + ((current - 1) % 26)) + result
  }
  return result
}

function cellXml(reference: string, value: unknown, formula: string) {
  const formulaXml = formula ? `<f>${xml(formula.replace(/^=/, ""))}</f>` : ""
  if (value === null || value === undefined || value === "") {
    return formulaXml ? `<c r="${reference}">${formulaXml}</c>` : ""
  }
  if (typeof value === "number") return `<c r="${reference}">${formulaXml}<v>${value}</v></c>`
  if (typeof value === "boolean") return `<c r="${reference}" t="b">${formulaXml}<v>${value ? 1 : 0}</v></c>`
  if (formulaXml) return `<c r="${reference}" t="str">${formulaXml}<v>${xml(value)}</v></c>`
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`
}

function worksheetXml(sheet: ExportSheet) {
  const rowCount = Math.max(sheet.values.length, sheet.formulas.length, 1)
  const columnCount = Math.max(
    1,
    ...sheet.values.map((row) => row.length),
    ...sheet.formulas.map((row) => row.length),
  )
  const rows: string[] = []
  for (let row = 0; row < rowCount; row += 1) {
    const cells: string[] = []
    for (let column = 0; column < columnCount; column += 1) {
      const reference = `${columnName(column)}${row + 1}`
      const cell = cellXml(reference, sheet.values[row]?.[column], sheet.formulas[row]?.[column] ?? "")
      if (cell) cells.push(cell)
    }
    if (cells.length > 0) rows.push(`<row r="${row + 1}">${cells.join("")}</row>`)
  }
  const dimension = `A1:${columnName(columnCount - 1)}${rowCount}`
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${rows.join("")}</sheetData></worksheet>`
}

export function createXlsx(sheets: ExportSheet[]) {
  const normalized = sheets.length > 0 ? sheets : [{ name: "Sheet1", values: [], formulas: [] }]
  const files: Record<string, Uint8Array> = {}
  const add = (path: string, content: string) => { files[path] = strToU8(content) }
  const overrides = normalized.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")
  add("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`)
  add("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
  add("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${normalized.map((sheet, index) => `<sheet name="${xml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`)
  add("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${normalized.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}<Relationship Id="rId${normalized.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)
  add("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`)
  normalized.forEach((sheet, index) => add(`xl/worksheets/sheet${index + 1}.xml`, worksheetXml(sheet)))
  return new Blob([zipSync(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
