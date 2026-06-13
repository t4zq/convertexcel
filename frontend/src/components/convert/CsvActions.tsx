import { useState } from "react"
import { Copy, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"

export function CsvActions({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([value], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "table.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
      <span className="mr-1 font-medium">CSV</span>
      <div className="flex flex-wrap gap-2">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copy} disabled={!value} title={copied ? t.csv.copied : t.csv.copy}>
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">{copied ? t.csv.copied : t.csv.copy}</span>
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={download} disabled={!value} title={t.csv.download}>
          <Download className="h-3.5 w-3.5" />
          <span className="sr-only">{t.csv.download}</span>
        </Button>
      </div>
    </div>
  )
}
