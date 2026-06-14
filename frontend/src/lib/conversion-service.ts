import { genCsv, genGnuplot, genLatex, genTikz } from "@/engine/loader"
import {
  DEFAULT_GNUPLOT_SETTINGS,
  toConvertOptions,
  toTikzOptions,
  type GnuplotSettings,
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
  gnuplot: GnuplotSettings = DEFAULT_GNUPLOT_SETTINGS,
): Promise<ConversionResult> {
  const opts = toConvertOptions(table)
  const [latex, csv, tikzGraph, gnuplotOut] = await Promise.all([
    genLatex(input, opts).catch(() => ""),
    genCsv(input, opts).catch(() => ""),
    genTikz(input, toTikzOptions(tikz, table)).catch(() => ""),
    genGnuplot(input, {
      // ラベル・軸スケール・近似手法は TikZ 設定を共有する。
      scaleMode: tikz.scaleMode,
      hasHeader: table.hasHeader,
      cleanInput: table.cleanInput,
      xLabel: tikz.xLabel,
      yLabel: tikz.yLabel,
      // TikZ と同じく系列ごとの近似手法をカンマ区切りで渡す。
      fitMethod: (tikz.fitMethods?.length ? tikz.fitMethods : ["auto"]).join(","),
      // gnuplot 固有設定。
      keyPos: gnuplot.keyPos,
      grid: gnuplot.grid,
      pointType: gnuplot.pointType,
      pointSize: gnuplot.pointSize,
      title: gnuplot.title,
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
    gnuplot: gnuplotOut,
  }
}
