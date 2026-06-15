import { useEffect, useState } from "react"

import type { GnuplotSettings, TableSettings, TikzSettings } from "@/lib/convert-settings"

// 入力・設定の変更を監視し、LaTeX 表 / CSV / TikZ / gnuplot を自動生成する。
// 生成後のコードは手動編集できるよう setter も返す。
export function useConversionOutputs(
  input: string,
  table: TableSettings,
  tikz: TikzSettings,
  gnuplot: GnuplotSettings,
  enabled = true,
) {
  const [latexOut, setLatexOut] = useState("")
  const [csvOut, setCsvOut] = useState("")
  const [tikzOut, setTikzOut] = useState("")
  const [gnuplotOut, setGnuplotOut] = useState("")

  useEffect(() => {
    if (!enabled) return
    let alive = true
    import("@/lib/conversion-service")
      .then(({ convertTable }) => convertTable(input, table, tikz, gnuplot))
      .then((result) => {
        if (!alive) return
        setLatexOut(result.latex)
        setCsvOut(result.csv)
        setTikzOut(result.tikz)
        setGnuplotOut(result.gnuplot)
      })
    return () => {
      alive = false
    }
  }, [enabled, input, table, tikz, gnuplot])

  return { latexOut, csvOut, tikzOut, gnuplotOut, setLatexOut, setTikzOut, setGnuplotOut }
}
