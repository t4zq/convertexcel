import type { TableSettings } from "@/lib/convert-settings"

const ALIGN_CHAR: Record<TableSettings["columnAlign"], "l" | "c" | "r"> = {
  left: "l",
  center: "c",
  right: "r",
}

export function applyTableAlignment(
  latexCode: string,
  columnAlign: TableSettings["columnAlign"],
  siunitx: boolean,
) {
  if (siunitx || columnAlign === "center") return latexCode

  const align = ALIGN_CHAR[columnAlign] ?? "c"
  return latexCode.replace(/\\begin\{tabular\}\{([lcr]+)\}/, (match, colspec: string) => {
    if (!colspec) return match
    return `\\begin{tabular}{${align.repeat(colspec.length)}}`
  })
}
