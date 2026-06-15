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
  const [engineReady, setEngineReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!outputEnabled) {
      setEngineReady(null)
      return
    }
    let alive = true
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
