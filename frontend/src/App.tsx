import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppHeader } from "@/components/AppHeader"
import ConvertPage from "@/pages/ConvertPage"
import PrivacyPage from "@/pages/PrivacyPage"

export default function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <main>
        <Routes>
          <Route path="/" element={<ConvertPage />} />
          <Route path="/convert" element={<ConvertPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<ConvertPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
