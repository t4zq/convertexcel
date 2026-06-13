import { useEffect, useState } from "react"

import { genCsv, genLatex, genTikz } from "@/engine/loader"
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

  useEffect(() => {
    let alive = true
    const opts = toConvertOptions(table)
    Promise.all([
      genLatex(input, opts).catch(() => ""),
      genCsv(input, opts).catch(() => ""),
      genTikz(input, toTikzOptions(tikz, table)).catch(() => ""),
    ]).then(([l, c, t]) => {
      if (!alive) return
      setLatexOut(applyTableAlignment(l, table.columnAlign, table.siunitx))
      setCsvOut(c)
      setTikzOut(applySeriesStyles(
        t,
        tikz.seriesColors ?? [],
        tikz.seriesMarks ?? [],
        tikz.fitMethods ?? ["auto"],
      ))
    })
    return () => {
      alive = false
    }
  }, [input, table, tikz])

  return { latexOut, csvOut, tikzOut, setLatexOut, setTikzOut }
}
