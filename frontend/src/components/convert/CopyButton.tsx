import { useState } from "react"

import { CopyFeedback } from "@/components/motion/CopyFeedback"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button size="sm" variant="secondary" onClick={copy} disabled={!value} title={copied ? t.csv.copied : label}>
      <CopyFeedback copied={copied} idleLabel={label} copiedLabel={t.csv.copied} />
    </Button>
  )
}
