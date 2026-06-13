import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppHeader } from "@/components/AppHeader"
import { StatusBar } from "@/components/StatusBar"
import { I18nProvider } from "@/hooks/useI18n"
import { StatusBarProvider } from "@/hooks/useStatusBar"
import { LANGUAGE_PATH_SEGMENTS, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import AddinPage from "@/pages/AddinPage"
import ConvertPage from "@/pages/ConvertPage"
import NotFoundPage from "@/pages/NotFoundPage"
import PrivacyPage from "@/pages/PrivacyPage"

const localizedRoutes = SUPPORTED_LANGUAGES
  .filter((language) => language !== "ja")
  .flatMap((language) => {
    const prefix = `/${LANGUAGE_PATH_SEGMENTS[language]}`
    return [
      <Route key={prefix} path={prefix} element={<ConvertPage />} />,
      <Route key={`${prefix}/convert`} path={`${prefix}/convert`} element={<ConvertPage />} />,
      <Route key={`${prefix}/privacy`} path={`${prefix}/privacy`} element={<PrivacyPage />} />,
      <Route key={`${prefix}/excel-addin`} path={`${prefix}/excel-addin`} element={<AddinPage />} />,
    ]
  })

export default function App() {
  return (
    <StatusBarProvider>
      <BrowserRouter>
        <I18nProvider>
          <AppHeader />
          <main className="pb-8">
            <Routes>
              <Route path="/" element={<ConvertPage />} />
              <Route path="/convert" element={<ConvertPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/excel-addin" element={<AddinPage />} />
              {localizedRoutes}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <StatusBar />
        </I18nProvider>
      </BrowserRouter>
    </StatusBarProvider>
  )
}
