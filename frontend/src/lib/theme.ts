// ダーク/ライトテーマ。`.dark` クラスを <html> に付け外しする
// （index.css の @custom-variant dark に対応）。

export type Theme = "light" | "dark"

const KEY = "convertexcel:theme"

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
}

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === "light" || v === "dark") return v
  } catch {
    // localStorage 不可なら OS 設定にフォールバック
  }
  return prefersDark() ? "dark" : "light"
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // 容量超過 / 不可環境は無視
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

// 初回描画前に呼び、テーマのちらつき（FOUC）を防ぐ。
export function initTheme() {
  applyTheme(getStoredTheme())
}
