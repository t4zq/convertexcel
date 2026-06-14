import { useEffect, useRef } from "react"

interface KeyboardShortcuts {
  onPreview: () => void
  onCopyActive: () => void
  onToggleInputSettings: () => void
  onToggleGraphSettings: () => void
  onSwitchTab: (tab: "latex" | "tikz" | "gnuplot") => void
}

/**
 * グローバルキーボードショートカット
 *   Ctrl+Enter  : PDF プレビュー
 *   Alt+1/2/3   : 出力タブ切替
 *   Alt+C       : 現在の出力をコピー
 *   Alt+I       : 入力設定を開閉
 *   Alt+G       : グラフ設定を開閉
 */
export function useKeyboardShortcuts({
  onPreview,
  onCopyActive,
  onToggleInputSettings,
  onToggleGraphSettings,
  onSwitchTab,
}: KeyboardShortcuts) {
  const previewRef = useRef(onPreview)
  const copyActiveRef = useRef(onCopyActive)
  const toggleInputSettingsRef = useRef(onToggleInputSettings)
  const toggleGraphSettingsRef = useRef(onToggleGraphSettings)
  const switchTabRef = useRef(onSwitchTab)

  useEffect(() => { previewRef.current = onPreview }, [onPreview])
  useEffect(() => { copyActiveRef.current = onCopyActive }, [onCopyActive])
  useEffect(() => { toggleInputSettingsRef.current = onToggleInputSettings }, [onToggleInputSettings])
  useEffect(() => { toggleGraphSettingsRef.current = onToggleGraphSettings }, [onToggleGraphSettings])
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
        if (e.key === "3") { e.preventDefault(); switchTabRef.current("gnuplot") }
        if (e.key.toLowerCase() === "c") { e.preventDefault(); copyActiveRef.current() }
        if (e.key.toLowerCase() === "i") { e.preventDefault(); toggleInputSettingsRef.current() }
        if (e.key.toLowerCase() === "g") { e.preventDefault(); toggleGraphSettingsRef.current() }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}
