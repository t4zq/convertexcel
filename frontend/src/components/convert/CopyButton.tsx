import { useState } from "react"
import { Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button size="icon" variant="secondary" onClick={copy} disabled={!value} title={copied ? "コピー済み" : label}>
      <Copy className="h-4 w-4" />
      <span className="sr-only">{copied ? "コピー済み" : label}</span>
    </Button>
  )
}
