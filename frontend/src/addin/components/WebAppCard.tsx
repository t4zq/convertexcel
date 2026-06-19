import { ExternalLink } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { CopyFeedback } from "@/components/motion/CopyFeedback"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WebAppCardProps {
  shareUrl: string
  hasContent: boolean
  copied: boolean
  onOpen: () => void
  onCopy: () => void
}

/** 取り込んだ表を Web 版で開く／共有リンクをコピーするカード。 */
export function WebAppCard({ shareUrl, hasContent, copied, onOpen, onCopy }: WebAppCardProps) {
  const reducedMotion = useReducedMotion()
  return (
    <Card className="gap-3 rounded-lg py-3 shadow-xs">
      <CardHeader className="px-3.5">
        <CardTitle className="text-base">Web 版で編集</CardTitle>
        <CardDescription className="mt-1">
          取り込んだ表を Web アプリで開き、表・グラフ・gnuplot を広い画面で編集します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-3.5">
        <Button type="button" className="w-full" onClick={onOpen} disabled={!hasContent}>
          <ExternalLink className="h-4 w-4" />
          Web 版で開く
        </Button>
        <Button type="button" variant="secondary" className="w-full" onClick={onCopy} disabled={!hasContent}>
          <CopyFeedback
            copied={copied}
            idleLabel="Web 版リンクをコピー"
            copiedLabel="リンクをコピーしました"
          />
        </Button>
        <div className="rounded-md border bg-muted/30 p-3">
          <AnimatePresence initial={false} mode="wait">
          {hasContent ? (
            <motion.div
              key="qr"
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.94 }}
            >
              <div className="rounded bg-white p-2">
                <QRCodeSVG value={shareUrl} size={156} />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                スマートフォンや別端末で開く場合は、この QR コードを読み取ります。
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex min-h-[196px] items-center justify-center text-center text-xs text-muted-foreground"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              範囲を取り込むと QR コードを表示します。
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
