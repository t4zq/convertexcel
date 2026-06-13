import { genCsv, genGnuplot, genLatex, genTikz } from "@/engine/loader"
import {
  toConvertOptions,
  toTikzOptions,
  type TableSettings,
  type TikzSettings,
} from "@/lib/convert-settings"
import { applyTableAlignment } from "@/lib/latex-postprocess"
import { applySeriesStyles } from "@/lib/tikz-postprocess"

export interface ConversionResult {
  latex: string
  csv: string
  tikz: string
  gnuplot: string
}

export async function convertTable(
  input: string,
  table: TableSettings,
  tikz: TikzSettings,
): Promise<ConversionResult> {
  const opts = toConvertOptions(table)
  const [latex, csv, tikzGraph, gnuplot] = await Promise.all([
    genLatex(input, opts).catch(() => ""),
    genCsv(input, opts).catch(() => ""),
    genTikz(input, toTikzOptions(tikz, table)).catch(() => ""),
    genGnuplot(input, {
      scaleMode: tikz.scaleMode,
      hasHeader: table.hasHeader,
      cleanInput: table.cleanInput,
      xLabel: tikz.xLabel,
      yLabel: tikz.yLabel,
    }).catch(() => ""),
  ])

  return {
    latex: applyTableAlignment(latex, table.columnAlign, table.siunitx),
    csv,
    tikz: applySeriesStyles(
      tikzGraph,
      tikz.seriesColors ?? [],
      tikz.seriesMarks ?? [],
      tikz.fitMethods ?? ["auto"],
    ),
    gnuplot,
  }
}
