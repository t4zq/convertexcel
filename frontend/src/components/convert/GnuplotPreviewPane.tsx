import { useState } from "react"
import { Download, LoaderCircle } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { CopyFeedback } from "@/components/motion/CopyFeedback"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import { copyPngToClipboard, downloadBlob, svgToPngBlob } from "@/lib/svg-to-png"

type GnuplotPreviewPaneProps = {
  svg: string | null
  rendering: boolean
  error: string | null
  onImageActionError: () => void
}

export function GnuplotPreviewPane({
  svg,
  rendering,
  error,
  onImageActionError,
}: GnuplotPreviewPaneProps) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()
  const [imageCopied, setImageCopied] = useState(false)

  const copyImage = async () => {
    if (!svg) return
    try {
      const png = await svgToPngBlob(svg)
      await copyPngToClipboard(png)
      setImageCopied(true)
      setTimeout(() => setImageCopied(false), 1500)
    } catch {
      onImageActionError()
    }
  }

  const saveImage = async () => {
    if (!svg) return
    try {
      const png = await svgToPngBlob(svg)
      downloadBlob(png, "plot.png")
    } catch {
      onImageActionError()
    }
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
      {svg && !rendering && (
        <motion.div
          className="flex flex-wrap justify-end gap-2"
          initial={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
        >
          <Button size="sm" variant="secondary" onClick={copyImage} title={imageCopied ? t.convert.imageCopied : t.convert.copyImage}>
            <CopyFeedback
              copied={imageCopied}
              idleLabel={t.convert.copyImage}
              copiedLabel={t.convert.imageCopied}
            />
          </Button>
          <Button size="sm" variant="secondary" onClick={saveImage} title={t.convert.saveImage}>
            <Download className="h-4 w-4" />
            <span>{t.convert.saveImage}</span>
          </Button>
        </motion.div>
      )}
      </AnimatePresence>
      <div className="h-[420px] w-full overflow-auto rounded-md border xl:h-[760px]">
        <AnimatePresence initial={false} mode="wait">
        {rendering ? (
          <motion.div key="rendering" className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm" {...stateMotion(reducedMotion)}>
            <LoaderCircle className="h-4 w-4 animate-spin text-info" />
            {t.convert.gnuplotRendering}
          </motion.div>
        ) : error ? (
          <motion.div key="error" className="flex h-full items-center justify-center px-4 text-center text-destructive text-sm" {...stateMotion(reducedMotion)}>
            {error}
          </motion.div>
        ) : svg ? (
          <motion.div
            key="preview"
            className="flex h-full w-full items-center justify-center bg-white p-2 [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:max-w-full dark:[filter:invert(1)_hue-rotate(180deg)]"
            dangerouslySetInnerHTML={{ __html: svg }}
            {...stateMotion(reducedMotion)}
          />
        ) : (
          <motion.div key="empty" className="flex h-full items-center justify-center px-4 text-center text-muted-foreground text-sm" {...stateMotion(reducedMotion)}>
            {t.convert.previewGnuplot}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function stateMotion(reducedMotion: boolean | null) {
  return {
    initial: { opacity: 0, scale: reducedMotion ? 1 : 0.985 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: reducedMotion ? 1 : 0.985 },
    transition: { duration: reducedMotion ? 0 : 0.18 },
  }
}
