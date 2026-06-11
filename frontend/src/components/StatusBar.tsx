import { useStatusData } from "@/hooks/useStatusBar"

function engineLabel(ready: boolean | null) {
  if (ready === null) return { text: "engine 読込中", color: "text-warning" }
  if (ready) return { text: "engine 準備完了", color: "text-success" }
  return { text: "engine 利用不可", color: "text-destructive" }
}

export function StatusBar() {
  const s = useStatusData()
  const engine = engineLabel(s.engineReady)

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
        <span>{s.chars} 文字</span>
        {s.activeOutput && <span className="text-secondary-foreground">{s.activeOutput}</span>}
        <span>UTF-8</span>
        <span>LF</span>
      </span>
    </footer>
  )
}
