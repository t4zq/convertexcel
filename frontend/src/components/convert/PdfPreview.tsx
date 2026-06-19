import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Download, FileText, Minus, Plus } from "lucide-react"
import { getDocument, GlobalWorkerOptions, type PDFDocumentLoadingTask, type PDFDocumentProxy } from "pdfjs-dist"
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"

import { Loader } from "@/components/animate-ui/components/loader"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

type PdfPreviewProps = {
  pdf: Blob | null
  onRendered: () => void
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.25

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

export function PdfPreview({ pdf, onRendered }: PdfPreviewProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [documentProxy, setDocumentProxy] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1)
  const [loading, setLoading] = useState(false)
  const [renderError, setRenderError] = useState(false)

  useEffect(() => {
    if (!pdf) {
      setDocumentProxy(null)
      setPageNumber(1)
      setRenderError(false)
      return
    }

    let cancelled = false
    let loadingTask: PDFDocumentLoadingTask | null = null
    setLoading(true)
    setRenderError(false)

    void pdf.arrayBuffer()
      .then((buffer) => {
        loadingTask = getDocument({ data: new Uint8Array(buffer) })
        if (cancelled) void loadingTask.destroy()
        return loadingTask.promise
      })
      .then(async (loaded) => {
        if (cancelled) {
          return
        }
        const firstPage = await loaded.getPage(1)
        if (cancelled) return
        const baseViewport = firstPage.getViewport({ scale: 1 })
        const availableWidth = Math.max(280, (containerRef.current?.clientWidth ?? baseViewport.width) - 32)
        setScale(clampScale(Math.min(1.25, availableWidth / baseViewport.width)))
        setPageNumber(1)
        setDocumentProxy(loaded)
      })
      .catch(() => {
        if (!cancelled) setRenderError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (loadingTask) void loadingTask.destroy()
    }
  }, [pdf])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!documentProxy || !canvas) return

    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null
    setLoading(true)
    setRenderError(false)

    void documentProxy
      .getPage(pageNumber)
      .then((page) => {
        if (cancelled) return null
        const viewport = page.getViewport({ scale })
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        const context = canvas.getContext("2d", { alpha: false })
        if (!context) throw new Error("Canvas 2D context is unavailable")

        canvas.width = Math.floor(viewport.width * pixelRatio)
        canvas.height = Math.floor(viewport.height * pixelRatio)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        })
        return renderTask.promise
      })
      .then(() => {
        if (!cancelled) onRendered()
      })
      .catch((error: unknown) => {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          setRenderError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [documentProxy, onRendered, pageNumber, scale])

  const download = () => {
    if (!pdf) return
    const url = URL.createObjectURL(pdf)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "converTeXcel-preview.pdf"
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const pageCount = documentProxy?.numPages ?? 0

  return (
    <div className="overflow-hidden rounded-md border bg-muted/30">
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b bg-background px-2 py-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!documentProxy || pageNumber <= 1}
            onClick={() => setPageNumber((value) => Math.max(1, value - 1))}
            title={t.convert.pdfPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t.convert.pdfPrevious}</span>
          </Button>
          <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
            {pageCount > 0 ? t.convert.pdfPage(pageNumber, pageCount) : "- / -"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!documentProxy || pageNumber >= pageCount}
            onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))}
            title={t.convert.pdfNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{t.convert.pdfNext}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!documentProxy || scale <= MIN_SCALE} onClick={() => setScale((value) => clampScale(value - SCALE_STEP))} title={t.convert.pdfZoomOut}>
            <Minus className="h-4 w-4" />
            <span className="sr-only">{t.convert.pdfZoomOut}</span>
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(scale * 100)}%</span>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!documentProxy || scale >= MAX_SCALE} onClick={() => setScale((value) => clampScale(value + SCALE_STEP))} title={t.convert.pdfZoomIn}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">{t.convert.pdfZoomIn}</span>
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!pdf} onClick={download} title={t.convert.pdfDownload}>
            <Download className="h-4 w-4" />
            <span className="sr-only">{t.convert.pdfDownload}</span>
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="relative flex h-[378px] w-full items-start justify-center overflow-auto p-4 xl:h-[718px]">
        {!pdf ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <FileText className="h-8 w-8 opacity-40" />
            <span>{t.convert.pdfEmpty}</span>
          </div>
        ) : renderError ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">{t.convert.pdfRenderError}</div>
        ) : (
          <canvas ref={canvasRef} className="shrink-0 bg-white shadow-md" aria-label={t.convert.pdfCanvasLabel} />
        )}
        {loading && pdf && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
            <Loader size={7} className="text-info" />
          </div>
        )}
      </div>
    </div>
  )
}
