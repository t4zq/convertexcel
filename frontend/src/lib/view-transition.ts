// View Transitions API のヘルパ。非対応ブラウザ・モーション低減設定では
// 何もせずフォールバックする（プログレッシブエンハンスメント）。

export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  )
}
