import { useState } from "react"
import { Download, LoaderCircle } from "lucide-react"

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
      {svg && !rendering && (
        <div className="flex flex-wrap justify-end gap-2">
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
        </div>
      )}
      <div className="h-[420px] w-full overflow-auto rounded-md border xl:h-[760px]">
        {rendering ? (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-info" />
            {t.convert.gnuplotRendering}
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-destructive text-sm">
            {error}
          </div>
        ) : svg ? (
          <div
            className="flex h-full w-full items-center justify-center bg-white p-2 [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:max-w-full dark:[filter:invert(1)_hue-rotate(180deg)]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-muted-foreground text-sm">
            {t.convert.previewGnuplot}
          </div>
        )}
      </div>
    </div>
  )
}
