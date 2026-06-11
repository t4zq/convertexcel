import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppHeader } from "@/components/AppHeader"
import { StatusBar } from "@/components/StatusBar"
import { StatusBarProvider } from "@/hooks/useStatusBar"
import ConvertPage from "@/pages/ConvertPage"
import PrivacyPage from "@/pages/PrivacyPage"

export default function App() {
  return (
    <StatusBarProvider>
      <BrowserRouter>
        <AppHeader />
        <main className="pb-8">
          <Routes>
            <Route path="/" element={<ConvertPage />} />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<ConvertPage />} />
          </Routes>
        </main>
        <StatusBar />
      </BrowserRouter>
    </StatusBarProvider>
  )
}
