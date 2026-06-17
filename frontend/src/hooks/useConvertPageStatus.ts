import { useEffect, useState } from "react"

import { type InputDiagnostics } from "@/lib/input-diagnostics"
import { useStatusSetter } from "@/hooks/useStatusBar"
import { type OutputTab } from "@/hooks/usePreviewSubmission"

function getActiveOutputName(activeTab: OutputTab): string {
  if (activeTab === "latex") return "table.tex"
  if (activeTab === "tikz") return "plot.pgfplots"
  return "plot.gp"
}

export function useConvertPageStatus(
  diagnostics: InputDiagnostics,
  inputLength: number,
  activeTab: OutputTab,
  outputEnabled = true,
) {
  const setStatus = useStatusSetter()
  const [engineReady, setEngineReady] = useState<boolean | null | "idle">("idle")

  useEffect(() => {
    if (!outputEnabled) {
      // 変換ステップを開くまではエンジンを起動しない（未起動 = idle）。
      setEngineReady("idle")
      return
    }
    let alive = true
    setEngineReady(null) // 起動した瞬間だけ「読込中」
    import("@/engine/loader")
      .then(({ isWasmAvailable }) => isWasmAvailable())
      .then((ok) => alive && setEngineReady(ok))
    return () => {
      alive = false
    }
  }, [outputEnabled])

  useEffect(() => {
    setStatus({
      errors: diagnostics.problems.filter((problem) => problem.severity === "error").length,
      warnings: diagnostics.problems.filter((problem) => problem.severity === "warning").length,
      rows: diagnostics.rowCount,
      cols: diagnostics.maxCols,
      chars: inputLength,
      activeOutput: outputEnabled ? getActiveOutputName(activeTab) : "",
      engineReady,
    })
  }, [activeTab, diagnostics, engineReady, inputLength, outputEnabled, setStatus])
}
