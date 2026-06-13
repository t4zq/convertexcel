import { useEffect, useState } from "react"

import { genCsv, genGnuplot, genLatex, genTikz } from "@/engine/loader"
import {
  toConvertOptions,
  toTikzOptions,
  type TableSettings,
  type TikzSettings,
} from "@/lib/convert-settings"
import { applyTableAlignment } from "@/lib/latex-postprocess"
import { applySeriesStyles } from "@/lib/tikz-postprocess"

// 入力・設定の変更を監視し、LaTeX 表 / CSV / TikZ を自動生成する。
// 生成後のコードは手動編集できるよう setter も返す。
export function useConversionOutputs(
  input: string,
  table: TableSettings,
  tikz: TikzSettings
) {
  const [latexOut, setLatexOut] = useState("")
  const [csvOut, setCsvOut] = useState("")
  const [tikzOut, setTikzOut] = useState("")
  const [gnuplotOut, setGnuplotOut] = useState("")

  useEffect(() => {
    let alive = true
    const opts = toConvertOptions(table)
    Promise.all([
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
    ]).then(([l, c, t, g]) => {
      if (!alive) return
      setLatexOut(applyTableAlignment(l, table.columnAlign, table.siunitx))
      setCsvOut(c)
      setTikzOut(applySeriesStyles(
        t,
        tikz.seriesColors ?? [],
        tikz.seriesMarks ?? [],
        tikz.fitMethods ?? ["auto"],
      ))
      setGnuplotOut(g)
    })
    return () => {
      alive = false
    }
  }, [input, table, tikz])

  return { latexOut, csvOut, tikzOut, gnuplotOut, setLatexOut, setTikzOut, setGnuplotOut }
}
