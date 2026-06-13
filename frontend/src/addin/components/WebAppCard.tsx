import { Check, Copy, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WebAppCardProps {
  hasContent: boolean
  copied: boolean
  onOpen: () => void
  onCopy: () => void
}

/** 取り込んだ表を Web 版で開く／共有リンクをコピーするカード。 */
export function WebAppCard({ hasContent, copied, onOpen, onCopy }: WebAppCardProps) {
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
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "リンクをコピーしました" : "Web 版リンクをコピー"}
        </Button>
      </CardContent>
    </Card>
  )
}
