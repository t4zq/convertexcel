import { lazy, Suspense, useRef, useState, type ReactNode } from "react"
import { Maximize2 } from "lucide-react"

import { AutoHeight } from "@/components/animate-ui/primitives/effects/auto-height"
import { useI18n } from "@/hooks/useI18n"
import type { TexLogError } from "@/lib/texlive-log"

export type CodeAssistKind = "latex" | "tikz" | "gnuplot"

export type OriginRect = { top: number; left: number; width: number; height: number }

const CodeAssistEditor = lazy(() =>
  import("@/components/CodeAssistEditor").then((module) => ({
    default: module.CodeAssistEditor,
  }))
)

// This module contains Monaco itself. Keeping the import behind both React.lazy
// and the `fullscreen` condition prevents any Monaco code or worker from loading
// until the user explicitly opens the full-screen editor.
const MonacoFullscreenEditor = lazy(() =>
  import("@/components/MonacoFullscreenEditor").then((module) => ({
    default: module.MonacoFullscreenEditor,
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
  compileErrors,
}: {
  kind: CodeAssistKind
  value: string
  onChange: (value: string) => void
  minHeight: number
  compileErrors?: TexLogError[]
}) {
  const { t } = useI18n()
  const [fullscreen, setFullscreen] = useState(false)
  const [originalValue, setOriginalValue] = useState(value)
  const [originRect, setOriginRect] = useState<OriginRect | null>(null)
  const editorBoxRef = useRef<HTMLDivElement>(null)

  const openFullscreen = () => {
    const rect = editorBoxRef.current?.getBoundingClientRect()
    setOriginRect(
      rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
    )
    setOriginalValue(value)
    setFullscreen(true)
  }

  return (
    <div>
      {fullscreen ? null : (
        <div ref={editorBoxRef} className="relative">
          <Suspense fallback={<EditorFallback minHeight={minHeight} />}>
            <CodeAssistEditor kind={kind} value={value} onChange={onChange} minHeight={minHeight} onRequestFullscreen={openFullscreen} />
          </Suspense>
          <button
            type="button"
            onClick={openFullscreen}
            title={`${t.sheet.fullscreen} (Alt+Enter)`}
            aria-label={t.sheet.fullscreen}
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-md border bg-background/80 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {fullscreen ? (
        <Suspense fallback={<div className="fixed inset-x-0 top-0 bottom-6 z-50 bg-background" />}>
          <MonacoFullscreenEditor
            kind={kind}
            value={value}
            onChange={onChange}
            onClose={() => setFullscreen(false)}
            closeLabel={t.sheet.exitFullscreen}
            originalValue={originalValue}
            compileErrors={compileErrors}
            originRect={originRect}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
