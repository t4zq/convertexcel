import { lazy, Suspense, type ReactNode } from "react"

import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height"

export type CodeAssistKind = "latex" | "tikz" | "gnuplot"

const CodeAssistEditor = lazy(() =>
  import("@/components/CodeAssistEditor").then((module) => ({
    default: module.CodeAssistEditor,
  }))
)

export function EditorFallback({ minHeight }: { minHeight: number }) {
  return (
    <div
      className="rounded-md border bg-muted/30"
      style={{ minHeight }}
      aria-hidden="true"
    />
  )
}

export function PanelFallback({ minHeight = 48 }: { minHeight?: number }) {
  return (
    <div
      className="rounded-md border bg-muted/30"
      style={{ minHeight }}
      aria-hidden="true"
    />
  )
}

export function SettingsReveal({
  open,
  reducedMotion,
  children,
}: {
  open: boolean
  reducedMotion: boolean | null
  children: ReactNode
}) {
  return (
    <AutoHeight
      deps={[open]}
      transition={reducedMotion ? { duration: 0 } : undefined}
      aria-hidden={!open}
    >
      {open ? <div className="pt-1">{children}</div> : null}
    </AutoHeight>
  )
}

export function OutputCodeEditor({
  kind,
  value,
  onChange,
  minHeight,
}: {
  kind: CodeAssistKind
  value: string
  onChange: (value: string) => void
  minHeight: number
}) {
  return (
    <Suspense fallback={<EditorFallback minHeight={minHeight} />}>
      <CodeAssistEditor kind={kind} value={value} onChange={onChange} minHeight={minHeight} />
    </Suspense>
  )
}
