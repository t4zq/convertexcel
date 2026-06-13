import React from "react"
import ReactDOM from "react-dom/client"

import "@/index.css"
import { AddinErrorBoundary } from "@/addin/AddinErrorBoundary"
import { AddinApp } from "@/addin/AddinApp"
import { StaticI18nProvider } from "@/hooks/useI18n"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AddinErrorBoundary>
      <StaticI18nProvider language="ja">
        <AddinApp />
      </StaticI18nProvider>
    </AddinErrorBoundary>
  </React.StrictMode>,
)
