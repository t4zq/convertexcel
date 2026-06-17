import { useI18n } from "@/hooks/useI18n"
import { useStatusData } from "@/hooks/useStatusBar"

function engineLabel(
  ready: boolean | null | "idle",
  labels: { loading: string; ready: string; unavailable: string; idle: string },
) {
  if (ready === "idle") return { text: labels.idle, color: "text-muted-foreground" }
  if (ready === null) return { text: labels.loading, color: "text-warning" }
  if (ready) return { text: labels.ready, color: "text-success" }
  return { text: labels.unavailable, color: "text-destructive" }
}

export function StatusBar() {
  const s = useStatusData()
  const { t } = useI18n()
  const engine = engineLabel(s.engineReady, t.status)

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex h-6 select-none items-center gap-3 border-t bg-secondary px-0 font-mono text-[11px] text-secondary-foreground">
      <span className="flex h-full items-center bg-primary px-3 font-medium text-primary-foreground">
        converTeXcel
      </span>

      <span className="flex items-center gap-1">
        <span className={engine.color}>●</span>
        {engine.text}
      </span>

      <span className="flex items-center gap-2">
        <span className={s.errors > 0 ? "text-destructive" : "text-muted-foreground"}>✕ {s.errors}</span>
        <span className={s.warnings > 0 ? "text-warning" : "text-muted-foreground"}>▲ {s.warnings}</span>
      </span>

      <span className="ml-auto flex items-center gap-3 pr-3 text-muted-foreground">
        <span>{s.rows}×{s.cols}</span>
        <span>{s.chars} {t.status.chars}</span>
        {s.activeOutput && <span className="text-secondary-foreground">{s.activeOutput}</span>}
        <span>UTF-8</span>
        <span>LF</span>
      </span>
    </footer>
  )
}
