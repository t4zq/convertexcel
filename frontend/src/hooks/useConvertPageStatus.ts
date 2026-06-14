import { useEffect, useState } from "react"

import { isWasmAvailable } from "@/engine/loader"
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
) {
  const setStatus = useStatusSetter()
  const [engineReady, setEngineReady] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    isWasmAvailable().then((ok) => alive && setEngineReady(ok))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    setStatus({
      errors: diagnostics.problems.filter((problem) => problem.severity === "error").length,
      warnings: diagnostics.problems.filter((problem) => problem.severity === "warning").length,
      rows: diagnostics.rowCount,
      cols: diagnostics.maxCols,
      chars: inputLength,
      activeOutput: getActiveOutputName(activeTab),
      engineReady,
    })
  }, [activeTab, diagnostics, engineReady, inputLength, setStatus])
}
