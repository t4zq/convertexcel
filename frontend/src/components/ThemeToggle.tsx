import type { MouseEvent } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import { useTheme } from "@/hooks/useTheme"
import { prefersReducedMotion, supportsViewTransitions } from "@/lib/view-transition"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const label = theme === "dark" ? t.theme.light : t.theme.dark

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (!supportsViewTransitions() || prefersReducedMotion()) {
      toggle()
      return
    }

    // 位置はパーセントで指定する。`::view-transition-new(root)` の clip-path 座標空間は
    // devicePixelRatio によってデバイスピクセル基準になり px 指定だと HiDPI でズレる
    // （クリック位置が中央上にずれる）ため、dpr 非依存な % を使う。
    // 半径 150% は任意のクリック点から対角コーナーまで（最大 ≈141%）を確実に覆う。
    const xPct = (event.clientX / window.innerWidth) * 100
    const yPct = (event.clientY / window.innerHeight) * 100

    const root = document.documentElement
    root.dataset.vtTheme = ""
    const transition = document.startViewTransition(() => {
      flushSync(() => toggle())
    })

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0% at ${xPct}% ${yPct}%)`,
              `circle(150% at ${xPct}% ${yPct}%)`,
            ],
          },
          {
            duration: 450,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        )
      })
      .catch(() => {
        // アニメーション準備に失敗してもテーマ切替自体は完了している。
      })

    transition.finished.finally(() => {
      delete root.dataset.vtTheme
    })
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} title={label}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
