import { useCallback, useEffect, useState } from "react"

import { renderGnuplotSvg } from "@/lib/gnuplot"

export function useGnuplotPreview(script: string, errorMessage: string, autoPreview = false) {
  const [svg, setSvg] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const renderPreview = useCallback(async () => {
    if (!script.trim()) return
    setRendering(true)
    setError(null)
    try {
      setSvg(await renderGnuplotSvg(script))
    } catch {
      setSvg(null)
      setError(errorMessage)
    } finally {
      setRendering(false)
    }
  }, [script, errorMessage])

  const markImageActionFailed = useCallback(() => {
    setError(errorMessage)
  }, [errorMessage])

  useEffect(() => {
    setSvg(null)
    setError(null)
  }, [script])

  useEffect(() => {
    if (!autoPreview || !script.trim()) return
    const timer = window.setTimeout(() => {
      void renderPreview()
    }, 450)
    return () => window.clearTimeout(timer)
  }, [autoPreview, renderPreview, script])

  return {
    svg,
    rendering,
    error,
    renderPreview,
    markImageActionFailed,
  }
}
