import { useState } from "react"
import { AlertTriangle, ChevronDown, ExternalLink, WifiOff, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height"
import { CopyButton } from "@/components/convert/CopyButton"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import type { PreviewError } from "@/hooks/usePreviewSubmission"
import { hasUserFixableError, type TexLogError } from "@/lib/texlive-log"

// privacy-policy.ts / addin-guide.ts と同じ問い合わせ先。
const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

type PreviewErrorPanelProps = {
  error: PreviewError
  onDismiss: () => void
}

export function PreviewErrorPanel({ error, onDismiss }: PreviewErrorPanelProps) {
  const { t } = useI18n()
  const [showLog, setShowLog] = useState(false)
  const reducedMotion = useReducedMotion()
  const te = t.convert.texError

  const locationLabel = (e: TexLogError) => {
    if (e.sourceLine != null) return te.line(e.sourceLine)
    if (e.line != null) return te.compiledLine(e.line)
    return te.noLocation
  }

  if (error.type === "network") {
    return (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-3">
        <div className="flex items-start gap-2">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-destructive">{te.networkTitle}</p>
            <p className="mt-1 text-muted-foreground">{te.network(error.detail)}</p>
          </div>
          <DismissButton onDismiss={onDismiss} label={te.dismiss} />
        </div>
      </div>
    )
  }

  // 原稿を直せば解消できるエラーが1つも無い＝ユーザー側では対処できない可能性が高い。
  const needsReport = !hasUserFixableError(error.errors)

  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-destructive">{te.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{needsReport ? te.introUnknown : te.intro}</p>
        </div>
        <DismissButton onDismiss={onDismiss} label={te.dismiss} />
      </div>

      {error.errors.length > 0 && (
        <ul className="mt-3 space-y-2">
          {error.errors.map((e, index) => {
            const kind = te.kinds[e.kind]
            return (
              <li key={index} className="rounded border border-border bg-background/60 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                    {kind.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{locationLabel(e)}</span>
                </div>
                <p className="mt-1.5 text-foreground">{kind.hint(e.symbol)}</p>
                {e.context && (
                  <pre className="mt-1.5 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">
                    <code>{e.context}</code>
                  </pre>
                )}
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">{e.message}</p>
              </li>
            )
          })}
        </ul>
      )}

      {needsReport && (
        <div className="mt-3 rounded border border-border bg-background/60 px-3 py-2.5">
          <p className="text-sm text-foreground">{te.reportIntro}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span>{te.reportButton}</span>
              </a>
            </Button>
            <CopyButton value={error.rawLog} label={te.copyLog} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowLog((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={showLog}
      >
        <motion.span animate={{ rotate: showLog ? 180 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
        {showLog ? te.hideLog : te.showLog}
      </button>
      <AutoHeight
        deps={[showLog]}
        transition={reducedMotion ? { duration: 0 } : undefined}
        aria-hidden={!showLog}
      >
        {showLog ? <div>
          <div className="mt-2 flex justify-end">
            <CopyButton value={error.rawLog} label={te.copyLog} />
          </div>
          <pre className="mt-2 max-h-72 overflow-auto rounded bg-muted px-2 py-2 text-xs leading-relaxed">
            <code>{error.rawLog}</code>
          </pre>
        </div> : null}
      </AutoHeight>
    </div>
  )
}

function DismissButton({ onDismiss, label }: { onDismiss: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 text-muted-foreground"
      onClick={onDismiss}
      title={label}
      aria-label={label}
    >
      <X className="h-4 w-4" />
    </Button>
  )
}
