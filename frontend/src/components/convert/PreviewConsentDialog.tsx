import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useI18n } from "@/hooks/useI18n"
import { COOLDOWN_SECONDS } from "@/lib/texlive"

interface PreviewConsentDialogProps {
  open: boolean
  onCancel: () => void
  onAccept: () => void
}

export function PreviewConsentDialog({ open, onCancel, onAccept }: PreviewConsentDialogProps) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.previewConsent.title}</DialogTitle>
          <DialogDescription>
            {t.previewConsent.description(COOLDOWN_SECONDS)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>{t.previewConsent.cancel}</Button>
          <Button onClick={onAccept}>{t.previewConsent.accept}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
