import { lazy, Suspense } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { CheckCircle2 } from "lucide-react"

import { PanelFallback } from "@/components/convert/panels"
import { Loader } from "@/components/animate-ui/components/loader"
import { AnimatedNumber } from "@/components/motion/AnimatedNumber"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/hooks/useI18n"
import type { OutputTab, usePreviewSubmission } from "@/hooks/usePreviewSubmission"

const GnuplotPreviewPane = lazy(() =>
  import("@/components/convert/GnuplotPreviewPane").then((module) => ({
    default: module.GnuplotPreviewPane,
  }))
)
const PreviewErrorPanel = lazy(() =>
  import("@/components/convert/PreviewErrorPanel").then((module) => ({
    default: module.PreviewErrorPanel,
  }))
)
const PdfPreview = lazy(() =>
  import("@/components/convert/PdfPreview").then((module) => ({
    default: module.PdfPreview,
  }))
)

type PreviewPanelProps = {
  activeTab: OutputTab
  preview: ReturnType<typeof usePreviewSubmission>
  gnuplotSvg: string | null
  gnuplotRendering: boolean
  gnuplotError: string | null
  onImageActionError: () => void
}

export function PreviewPanel({
  activeTab,
  preview,
  gnuplotSvg,
  gnuplotRendering,
  gnuplotError,
  onImageActionError,
}: PreviewPanelProps) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()

  return (
    <div className="h-full space-y-3">
        {activeTab === "gnuplot" ? (
          <Suspense fallback={<PanelFallback minHeight={420} />}>
            <GnuplotPreviewPane
              svg={gnuplotSvg}
              rendering={gnuplotRendering}
              error={gnuplotError}
              onImageActionError={onImageActionError}
            />
          </Suspense>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {preview.previewStatus.phase !== "idle" && (
                <motion.div
                  key="preview-status"
                  role="status"
                  aria-live="polite"
                  className="rounded-md border bg-muted/40 px-3 py-2"
                  initial={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -4 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <AnimatePresence initial={false} mode="wait">
                        <motion.span
                          key={preview.previewStatus.phase === "complete" ? "complete" : "loading"}
                          className="flex h-4 w-4 shrink-0 items-center justify-center"
                          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.7 }}
                        >
                          {preview.previewStatus.phase === "complete" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Loader size={5} className="text-info" />
                          )}
                        </motion.span>
                      </AnimatePresence>
                      <span className="truncate">
                        {preview.previewStatus.phase === "complete"
                          ? t.convert.previewComplete
                          : t.convert.previewProgress(
                              preview.previewStatus.kind === "tikz" ? t.convert.previewKindGraph : t.convert.previewKindTable,
                            )}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      <AnimatedNumber value={preview.previewStatus.progress} />%
                    </span>
                  </div>
                  <Progress
                    value={preview.previewStatus.progress}
                    aria-label={t.convert.previewProgressLabel}
                    className="h-1.5 bg-background [&_[data-slot=progress-indicator]]:bg-info [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {preview.previewError && (
                <motion.div
                  key={`${preview.previewError.type}-preview-error`}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : -8, scale: reducedMotion ? 1 : 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : -6, scale: reducedMotion ? 1 : 0.99 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                >
                  <Suspense fallback={null}>
                    <PreviewErrorPanel error={preview.previewError} onDismiss={preview.dismissPreviewError} />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
            <Suspense fallback={<PanelFallback minHeight={420} />}>
              <PdfPreview pdf={preview.pdf} onRendered={preview.finishPreviewLoad} />
            </Suspense>
          </>
        )}
    </div>
  )
}
