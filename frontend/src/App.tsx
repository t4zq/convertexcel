import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppHeader } from "@/components/AppHeader"
import { CommandMenu } from "@/components/CommandMenu"
import { SiteFooter } from "@/components/SiteFooter"
import { StatusBar } from "@/components/StatusBar"
import { I18nProvider } from "@/hooks/useI18n"
import { StatusBarProvider } from "@/hooks/useStatusBar"
import { LANGUAGE_PATH_SEGMENTS, SUPPORTED_LANGUAGES } from "@/lib/i18n"

const AddinPage = lazy(() => import("@/pages/AddinPage"))
const ConvertPage = lazy(() => import("@/pages/ConvertPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"))
const ContactPage = lazy(() => import("@/pages/ContactPage"))
const TermsPage = lazy(() => import("@/pages/TermsPage"))
const UpdatesPage = lazy(() => import("@/pages/UpdatesPage"))

const localizedRoutes = SUPPORTED_LANGUAGES
  .filter((language) => language !== "ja")
  .flatMap((language) => {
    const prefix = `/${LANGUAGE_PATH_SEGMENTS[language]}`
    return [
      <Route key={prefix} path={prefix} element={<ConvertPage />} />,
      <Route key={`${prefix}/convert`} path={`${prefix}/convert`} element={<ConvertPage />} />,
      <Route key={`${prefix}/privacy`} path={`${prefix}/privacy`} element={<PrivacyPage />} />,
      <Route key={`${prefix}/excel-addin`} path={`${prefix}/excel-addin`} element={<AddinPage />} />,
      <Route key={`${prefix}/contact`} path={`${prefix}/contact`} element={<ContactPage />} />,
      <Route key={`${prefix}/updates`} path={`${prefix}/updates`} element={<UpdatesPage />} />,
    ]
  })

export default function App() {
  return (
    <StatusBarProvider>
      <BrowserRouter>
        <I18nProvider>
          <CommandMenu />
          <AppHeader />
          <main className="pb-8">
            <Suspense fallback={<div className="p-4 sm:p-6" />}>
              <Routes>
                <Route path="/" element={<ConvertPage />} />
                <Route path="/convert" element={<ConvertPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/excel-addin" element={<AddinPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/updates" element={<UpdatesPage />} />
                {localizedRoutes}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <SiteFooter />
          <StatusBar />
        </I18nProvider>
      </BrowserRouter>
    </StatusBarProvider>
  )
}
