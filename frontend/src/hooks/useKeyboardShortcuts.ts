import { useEffect, useRef } from "react"

interface KeyboardShortcuts {
  onPreview: () => void
  onSwitchTab: (tab: "latex" | "tikz") => void
}

/**
 * グローバルキーボードショートカット
 *   Ctrl+Enter  : PDF プレビュー
 *   Alt+1       : table.tex タブ
 *   Alt+2       : plot.pgfplots タブ
 */
export function useKeyboardShortcuts({ onPreview, onSwitchTab }: KeyboardShortcuts) {
  const previewRef = useRef(onPreview)
  const switchTabRef = useRef(onSwitchTab)

  useEffect(() => { previewRef.current = onPreview }, [onPreview])
  useEffect(() => { switchTabRef.current = onSwitchTab }, [onSwitchTab])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === "Enter") {
        e.preventDefault()
        previewRef.current()
        return
      }

      if (e.altKey && !ctrl) {
        if (e.key === "1") { e.preventDefault(); switchTabRef.current("latex") }
        if (e.key === "2") { e.preventDefault(); switchTabRef.current("tikz") }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}
