import { useCallback, useEffect, useRef, useState } from "react"

import { type TableSettings } from "@/lib/convert-settings"
import {
  COOLDOWN_SECONDS,
  submitToTexlive,
  wrapLatexDocument,
  wrapTikzDocument,
} from "@/lib/texlive"

export type OutputTab = "latex" | "tikz" | "gnuplot"

type PreviewPhase = "idle" | "submitting" | "compiling" | "complete"

export type PreviewStatus = {
  phase: PreviewPhase
  kind: null | "latex" | "tikz"
  progress: number
}

type UsePreviewSubmissionOptions = {
  activeTab: OutputTab
  cooldown: number
  latexOut: string
  tikzOut: string
  gnuplotOut: string
  source: string
  table: Pick<TableSettings, "hasHeader" | "cleanInput">
  renderGnuplotPreview: () => void | Promise<void>
  startCooldown: (seconds: number) => void
}

const INITIAL_PREVIEW_STATUS: PreviewStatus = {
  phase: "idle",
  kind: null,
  progress: 0,
}

function getReferencedCsvFiles(tikzSource: string): string[] {
  return Array.from(new Set([...tikzSource.matchAll(/\{([^{}]+\.csv)\}/g)].map((match) => match[1])))
}

function advancePreviewProgress(status: PreviewStatus): PreviewStatus {
  if (status.phase !== "submitting" && status.phase !== "compiling") return status
  const limit = status.phase === "submitting" ? 35 : 92
  const step = status.phase === "submitting" ? 4 : Math.max(1, Math.round((limit - status.progress) / 8))
  return { ...status, progress: Math.min(limit, status.progress + step) }
}

export function usePreviewSubmission({
  activeTab,
  cooldown,
  latexOut,
  tikzOut,
  gnuplotOut,
  source,
  table,
  renderGnuplotPreview,
  startCooldown,
}: UsePreviewSubmissionOptions) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewDoneTimerRef = useRef<number | null>(null)
  const [pending, setPending] = useState<null | "latex" | "tikz">(null)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(INITIAL_PREVIEW_STATUS)

  const resetPreviewStatus = useCallback(() => {
    setPreviewStatus(INITIAL_PREVIEW_STATUS)
  }, [])

  const submitPreview = useCallback(
    async (kind: "latex" | "tikz") => {
      const iframeName = iframeRef.current?.name ?? "tex-iframe"
      setPreviewStatus({ phase: "submitting", kind, progress: 8 })

      if (kind === "latex") {
        if (!latexOut.trim()) {
          resetPreviewStatus()
          return
        }
        submitToTexlive(iframeName, wrapLatexDocument(latexOut), [])
      } else {
        if (!tikzOut.trim()) {
          resetPreviewStatus()
          return
        }
        const { genCsvAttachment } = await import("@/engine/loader")
        const csv = await genCsvAttachment(source, table.hasHeader, table.cleanInput)
        const extra = getReferencedCsvFiles(tikzOut).map((name) => ({ name, contents: csv }))
        submitToTexlive(iframeName, wrapTikzDocument(tikzOut), extra)
      }

      setPreviewStatus((current) => ({
        ...current,
        phase: "compiling",
        progress: Math.max(current.progress, 36),
      }))
      startCooldown(COOLDOWN_SECONDS)
    },
    [latexOut, resetPreviewStatus, source, startCooldown, table.cleanInput, table.hasHeader, tikzOut],
  )

  const requestPreview = useCallback(() => {
    if (activeTab === "gnuplot") {
      void renderGnuplotPreview()
      return
    }
    if (cooldown > 0) return

    const output = activeTab === "latex" ? latexOut : tikzOut
    if (!output.trim()) return
    setPending(activeTab)
  }, [activeTab, cooldown, latexOut, renderGnuplotPreview, tikzOut])

  const acceptConsent = useCallback(async () => {
    const kind = pending
    setPending(null)
    if (kind) await submitPreview(kind)
  }, [pending, submitPreview])

  const finishPreviewLoad = useCallback(() => {
    setPreviewStatus((current) => {
      if (current.phase !== "submitting" && current.phase !== "compiling") return current
      return { ...current, phase: "complete", progress: 100 }
    })
    if (previewDoneTimerRef.current !== null) window.clearTimeout(previewDoneTimerRef.current)
    previewDoneTimerRef.current = window.setTimeout(() => {
      resetPreviewStatus()
      previewDoneTimerRef.current = null
    }, 2400)
  }, [resetPreviewStatus])

  useEffect(() => {
    if (previewStatus.phase !== "submitting" && previewStatus.phase !== "compiling") return
    const timer = window.setInterval(() => {
      setPreviewStatus(advancePreviewProgress)
    }, 450)

    return () => window.clearInterval(timer)
  }, [previewStatus.phase])

  useEffect(() => {
    return () => {
      if (previewDoneTimerRef.current !== null) window.clearTimeout(previewDoneTimerRef.current)
    }
  }, [])

  return {
    iframeRef,
    pending,
    previewStatus,
    requestPreview,
    acceptConsent,
    cancelConsent: () => setPending(null),
    finishPreviewLoad,
    canPreviewLatex: cooldown <= 0 && latexOut.trim().length > 0,
    canPreviewTikz: cooldown <= 0 && tikzOut.trim().length > 0,
    canPreviewGnuplot: gnuplotOut.trim().length > 0,
  }
}
