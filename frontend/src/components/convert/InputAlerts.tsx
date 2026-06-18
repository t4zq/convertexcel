import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { useI18n } from "@/hooks/useI18n"
import type { InputDiagnostics } from "@/lib/input-diagnostics"

// 入力データの診断のうち、エラー / 警告だけをコンパクトに表示する。
// （旧 diagnostics パネルの統計・整形プレビュー・info は表示しない）
export function InputAlerts({ diagnostics }: { diagnostics: InputDiagnostics }) {
  const { t } = useI18n()
  const reducedMotion = useReducedMotion()
  const problems = (diagnostics.problems ?? []).filter(
    (p) => p.severity === "error" || p.severity === "warning",
  )

  return (
    <div aria-live="polite">
      <AnimatePresence initial={false}>
        {problems.length > 0 && (
          <motion.ul
            className="space-y-1.5 overflow-hidden rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs"
            initial={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: reducedMotion ? 0 : -4 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <AnimatePresence initial={false}>
              {problems.map((p, i) => {
                const isError = p.severity === "error"
                return (
                  <motion.li
                    layout={!reducedMotion}
                    key={`${p.code}-${p.line ?? i}-${p.column ?? 0}`}
                    className="flex items-baseline gap-2"
                    initial={{ opacity: 0, x: reducedMotion ? 0 : -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: reducedMotion ? 0 : 6 }}
                  >
                    <span className={isError ? "text-destructive" : "text-warning"} aria-hidden>
                      {isError ? "✕" : "▲"}
                    </span>
                    <span className="text-foreground/90">
                      {t.diagnostics.messages[p.code as keyof typeof t.diagnostics.messages] ?? p.message}
                    </span>
                    {p.line != null && (
                      <span className="ml-auto shrink-0 whitespace-nowrap text-info/80">
                        {t.diagnostics.line(p.line)}
                        {p.column != null ? ` 列${p.column}` : ""}
                      </span>
                    )}
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
