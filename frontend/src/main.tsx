import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/index.css"
import App from "@/App"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { initTheme } from "@/lib/theme"
import { languageFromPath } from "@/lib/i18n"
import { loadTranslations } from "@/lib/translations"

// 描画前にテーマを適用してちらつきを防ぐ。
initTheme()

// アクティブ言語（パスから確定）の翻訳を描画前に読み込み、文字のちらつきを防ぐ。
// 全言語を entry に同梱せず1言語だけ読むことで初期 eval を減らし TBT を改善する。
const initialLanguage = languageFromPath(window.location.pathname)

loadTranslations(initialLanguage).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
})
