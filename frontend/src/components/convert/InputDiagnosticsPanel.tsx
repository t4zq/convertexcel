import { useI18n } from "@/hooks/useI18n"
import type { DiagnosticSeverity, InputDiagnostics } from "@/lib/input-diagnostics"

const SEVERITY: Record<DiagnosticSeverity, { label: string; glyph: string; color: string }> = {
  error: { label: "error", glyph: "✕", color: "text-destructive" },
  warning: { label: "warning", glyph: "▲", color: "text-warning" },
  info: { label: "info", glyph: "ℹ", color: "text-info" },
}

export function InputDiagnosticsPanel({ diagnostics }: { diagnostics: InputDiagnostics }) {
  const { t } = useI18n()
  const problems = diagnostics.problems ?? []
  if (problems.length === 0 && diagnostics.rowCount === 0) return null

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
      <div className="grid gap-2 border-b px-3 py-2 text-muted-foreground sm:grid-cols-4">
        <span>形式: <strong className="text-foreground">{diagnostics.format.delimiterLabel}</strong></span>
        <span>行: <strong className="text-foreground">{diagnostics.rowCount}</strong></span>
        <span>列: <strong className="text-foreground">{diagnostics.maxCols}</strong></span>
        <span>正規化: <strong className="text-foreground">{diagnostics.format.changedCells}</strong> セル</span>
      </div>
      {diagnostics.normalizedRows.length > 0 && (
        <div className="border-b px-3 py-2">
          <div className="mb-1 text-muted-foreground">自動整形プレビュー</div>
          <div className="overflow-auto rounded border bg-background/60">
            <table className="min-w-full border-collapse">
              <tbody>
                {diagnostics.normalizedRows.slice(0, 4).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b last:border-b-0">
                    <th className="w-10 border-r px-2 py-1 text-right font-normal text-muted-foreground">
                      {rowIndex + 1}
                    </th>
                    {Array.from({ length: diagnostics.maxCols }, (_, columnIndex) => (
                      <td key={columnIndex} className="max-w-40 truncate border-r px-2 py-1 last:border-r-0">
                        {row[columnIndex] || <span className="text-muted-foreground/60">empty</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {diagnostics.normalizedRows.length > 4 && (
            <div className="mt-1 text-muted-foreground">
              ほか {diagnostics.normalizedRows.length - 4} 行
            </div>
          )}
        </div>
      )}
      {problems.length > 0 && (
        <ul className="max-h-48 divide-y divide-border/60 overflow-auto">
          {problems.map((p, i) => {
            const s = SEVERITY[p.severity]
            return (
              <li key={`${p.code}-${p.line ?? i}-${p.column ?? 0}`} className="flex items-baseline gap-2 px-3 py-1.5">
                <span className={`${s.color} shrink-0`} aria-hidden>{s.glyph}</span>
                <span className={`${s.color} shrink-0 font-semibold`}>{s.label}:</span>
                <span className="text-foreground/90">
                  {t.diagnostics.messages[p.code as keyof typeof t.diagnostics.messages] ?? p.message}
                </span>
                <span className="ml-auto shrink-0 whitespace-nowrap text-muted-foreground/80">
                  {p.line != null && <span className="text-info/80">{t.diagnostics.line(p.line)} </span>}
                  {p.column != null && <span className="text-info/80">列{p.column} </span>}
                  {p.code}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
