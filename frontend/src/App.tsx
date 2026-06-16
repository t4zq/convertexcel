import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { GoogleTag } from "@/components/GoogleTag"
import { StatusBar } from "@/components/StatusBar"
import { I18nProvider } from "@/hooks/useI18n"
import { StatusBarProvider } from "@/hooks/useStatusBar"
import { LANGUAGE_PATH_SEGMENTS, SUPPORTED_LANGUAGES } from "@/lib/i18n"

const AboutPage = lazy(() => import("@/pages/AboutPage"))
const AddinPage = lazy(() => import("@/pages/AddinPage"))
const ContactPage = lazy(() => import("@/pages/ContactPage"))
const ConvertPage = lazy(() => import("@/pages/ConvertPage"))
const DocsPage = lazy(() => import("@/pages/DocsPage"))
const GuidePage = lazy(() => import("@/pages/GuidePage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"))
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
      <Route key={`${prefix}/docs`} path={`${prefix}/docs`} element={<DocsPage />} />,
      <Route key={`${prefix}/guides/:slug`} path={`${prefix}/guides/:slug`} element={<GuidePage />} />,
      <Route key={`${prefix}/about`} path={`${prefix}/about`} element={<AboutPage />} />,
      <Route key={`${prefix}/contact`} path={`${prefix}/contact`} element={<ContactPage />} />,
      <Route key={`${prefix}/updates`} path={`${prefix}/updates`} element={<UpdatesPage />} />,
    ]
  })

export default function App() {
  return (
    <StatusBarProvider>
      <BrowserRouter>
        <I18nProvider>
          <GoogleTag />
          <AppHeader />
          <main className="pb-8">
            <Suspense fallback={<div className="p-4 sm:p-6" />}>
              <Routes>
                <Route path="/" element={<ConvertPage />} />
                <Route path="/convert" element={<ConvertPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/excel-addin" element={<AddinPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/guides/:slug" element={<GuidePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/updates" element={<UpdatesPage />} />
                {localizedRoutes}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <AppFooter />
          <StatusBar />
        </I18nProvider>
      </BrowserRouter>
    </StatusBarProvider>
  )
}
