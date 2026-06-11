import { Check, Copy } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  url: string
  copied: boolean
  onCopy: () => void
}

export function ShareDialog({ open, onClose, url, copied, onCopy }: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>共有</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="rounded-lg border p-3">
            <QRCodeSVG value={url || location.href} size={180} />
          </div>
          <div className="flex w-full items-center gap-2">
            <input
              readOnly
              value={url}
              className="bg-muted text-muted-foreground min-w-0 flex-1 rounded-md border px-3 py-1.5 font-mono text-xs"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button size="icon" variant="ghost" onClick={onCopy} title="URLをコピー">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            QR コードをスキャン、または URL をコピーして共有できます。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
