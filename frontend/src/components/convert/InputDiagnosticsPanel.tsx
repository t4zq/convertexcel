import { useI18n } from "@/hooks/useI18n"
import type { DiagnosticSeverity, InputDiagnostics } from "@/lib/input-diagnostics"

const SEVERITY: Record<DiagnosticSeverity, { label: string; glyph: string; color: string }> = {
  error: { label: "error", glyph: "✕", color: "text-destructive" },
  warning: { label: "warning", glyph: "▲", color: "text-warning" },
  info: { label: "info", glyph: "ℹ", color: "text-info" },
}

export function InputDiagnosticsPanel({ diagnostics }: { diagnostics: InputDiagnostics }) {
  const { language, t } = useI18n()
  const problems = diagnostics.problems ?? []
  if (problems.length === 0) return null

  const counts = {
    error: problems.filter((p) => p.severity === "error").length,
    warning: problems.filter((p) => p.severity === "warning").length,
    info: problems.filter((p) => p.severity === "info").length,
  }

  return (
    <div className="overflow-hidden rounded-md border bg-muted/40 font-mono text-xs">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-destructive/60" />
            <span className="size-2 rounded-full bg-warning/60" />
            <span className="size-2 rounded-full bg-success/60" />
          </span>
          <span className="tracking-widest uppercase">{t.diagnostics.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {counts.error > 0 && (
            <span className="text-destructive">{SEVERITY.error.glyph} {counts.error}</span>
          )}
          {counts.warning > 0 && (
            <span className="text-warning">{SEVERITY.warning.glyph} {counts.warning}</span>
          )}
          {counts.info > 0 && (
            <span className="text-info">{SEVERITY.info.glyph} {counts.info}</span>
          )}
        </div>
      </div>
      <ul className="max-h-48 divide-y divide-border/60 overflow-auto">
        {problems.map((p, i) => {
          const s = SEVERITY[p.severity]
          return (
            <li key={`${p.code}-${p.line ?? i}`} className="flex items-baseline gap-2 px-3 py-1.5">
              <span className={`${s.color} shrink-0`} aria-hidden>{s.glyph}</span>
              <span className={`${s.color} shrink-0 font-semibold`}>{s.label}:</span>
              <span className="text-foreground/90">
                {language === "en"
                  ? t.diagnostics.messages[p.code as keyof typeof t.diagnostics.messages] ?? p.message
                  : p.message}
              </span>
              <span className="ml-auto shrink-0 whitespace-nowrap text-muted-foreground/80">
                {p.line != null && <span className="text-info/80">{t.diagnostics.line(p.line)} </span>}
                {p.code}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
