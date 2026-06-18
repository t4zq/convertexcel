import { useState } from "react"
import { AlertTriangle, ChevronDown, ExternalLink, MapPin, Sparkles, WifiOff, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height"
import { CopyButton } from "@/components/convert/CopyButton"
import { ExplanationText } from "@/components/convert/ExplanationText"
import { Button } from "@/components/ui/button"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { useI18n } from "@/hooks/useI18n"
import type { PreviewError } from "@/hooks/usePreviewSubmission"
import { explainTexErrors } from "@/lib/explain"
import { hasUserFixableError, type TexLogError } from "@/lib/texlive-log"

// privacy-policy.ts / addin-guide.ts と同じ問い合わせ先。
const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

// 解決できないエラーを報告しやすいよう、件名・本文を埋めた issue 作成リンクを作る。
// GitHub は /issues/new?title=...&body=... のクエリで初期値を渡せる。
function buildReportUrl(error: Extract<PreviewError, { type: "compile" }>): string {
  const lines = error.errors.map((e, i) => `${i + 1}. [${e.kind}] ${e.message}`).join("\n")
  const log = error.rawLog.slice(0, 4000)
  const body = [
    "## 状況 / What happened",
    "（プレビュー時にコンパイルに失敗しました。再現手順や入力データがあれば追記してください。）",
    "",
    "## 検出されたエラー / Detected errors",
    lines || "(なし)",
    "",
    "## ログ / Log",
    "```",
    log,
    "```",
  ].join("\n")
  const params = new URLSearchParams({
    title: `[preview] コンパイル失敗: ${error.errors[0]?.message ?? "unknown"}`.slice(0, 120),
    body,
    labels: "preview-error",
  })
  return `${ISSUES_URL}/new?${params.toString()}`
}

type PreviewErrorPanelProps = {
  error: PreviewError
  onDismiss: () => void
}

type AiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; explanation: string; userFixable: boolean }
  | { phase: "error"; detail: string }

export function PreviewErrorPanel({ error, onDismiss }: PreviewErrorPanelProps) {
  const { t, language } = useI18n()
  const [showLog, setShowLog] = useState(false)
  const [ai, setAi] = useState<AiState>({ phase: "idle" })
  const reducedMotion = useReducedMotion()
  const te = t.convert.texError

  const requestExplanation = async () => {
    if (error.type !== "compile") return
    setAi({ phase: "loading" })
    const result = await explainTexErrors(error.errors, language, error.rawLog)
    setAi(
      result.ok
        ? { phase: "done", explanation: result.explanation, userFixable: result.userFixable }
        : { phase: "error", detail: result.error },
    )
  }

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

  // 機械的な分類（parseTexLog）で既知の対処可能なエラーを特定できたか。
  // できた → 既存のヒントで足りるので AI ボタンも issues 誘導も出さない。
  // できなかった → AI ボタンを出し、AI に「ユーザーが直せるか」を判定させて
  //                issues 誘導の有無を決める。
  const couldNotClassify = !hasUserFixableError(error.errors)

  // 行番号は AI に推測させず、parseTexLog が算出した sourceLine / line から機械的に出す。
  // 本文行（sourceLine）が分かるものを優先し、無ければ生成文書の行（line）を使う。
  const locatedError =
    error.errors.find((e) => e.sourceLine != null) ?? error.errors.find((e) => e.line != null)
  const mechanicalLocation = locatedError ? locationLabel(locatedError) : null

  // 解決できないエラーの報告導線。AI が userFixable=false と判定したとき、
  // または AI 自体が失敗したとき（分類も解説もできていない）に出す。
  const reportBlock = (
    <div className="mt-3 rounded border border-border bg-background/60 px-3 py-2.5">
      <p className="text-sm text-foreground">{te.reportIntro}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={buildReportUrl(error)} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            <span>{te.reportButton}</span>
          </a>
        </Button>
        <CopyButton value={error.rawLog} label={te.copyLog} />
      </div>
    </div>
  )

  return (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-destructive">{te.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{couldNotClassify ? te.introUnknown : te.intro}</p>
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

      {/* 機械的に分類できなかったエラーだけ AI に解説させる。 */}
      {couldNotClassify && (
        <div className="mt-3">
          {ai.phase !== "done" && (
            <Button
              size="sm"
              variant="outline"
              onClick={requestExplanation}
              disabled={ai.phase === "loading"}
            >
              <Sparkles className={`h-4 w-4 ${ai.phase === "loading" ? "animate-pulse text-primary" : ""}`} />
              {ai.phase === "loading" ? <TextShimmer>{te.ai.loading}</TextShimmer> : <span>{te.ai.button}</span>}
            </Button>
          )}

          {ai.phase === "done" && (
            <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{te.ai.heading}</p>
              </div>
              {mechanicalLocation && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {mechanicalLocation}
                </p>
              )}
              <div className="mt-2">
                <ExplanationText text={ai.explanation} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{te.ai.disclaimer}</p>
            </div>
          )}

          {ai.phase === "error" && (
            <p className="mt-2 text-sm text-muted-foreground">{te.ai.failed(ai.detail)}</p>
          )}

          {/* AI が「直せない」と判定、または AI 自体が失敗したときだけ issues 誘導。 */}
          {((ai.phase === "done" && !ai.userFixable) || ai.phase === "error") && reportBlock}
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
