import React from "react"
import ReactDOM from "react-dom/client"

import "@/index.css"
import { AddinErrorBoundary } from "@/addin/AddinErrorBoundary"
import { AddinApp } from "@/addin/AddinApp"
import { StaticI18nProvider } from "@/hooks/useI18n"
import { loadTranslations } from "@/lib/translations"

// アドインは常に日本語。描画前に翻訳を読み込んでからマウントする。
void loadTranslations("ja").then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AddinErrorBoundary>
        <StaticI18nProvider language="ja">
          <AddinApp />
        </StaticI18nProvider>
      </AddinErrorBoundary>
    </React.StrictMode>,
  )
})
