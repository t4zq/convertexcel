import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { COOLDOWN_SECONDS } from "@/lib/texlive"

interface PreviewConsentDialogProps {
  open: boolean
  onCancel: () => void
  onAccept: () => void
}

export function PreviewConsentDialog({ open, onCancel, onAccept }: PreviewConsentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PDF プレビューの送信確認</DialogTitle>
          <DialogDescription>
            PDF を作成するため、入力データと生成コードを texlive.net へ送信します。
            連続送信を避けるため、送信後 {COOLDOWN_SECONDS} 秒のクールダウンを設けます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>キャンセル</Button>
          <Button onClick={onAccept}>同意して送信</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
