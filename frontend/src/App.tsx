import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppHeader } from "@/components/AppHeader"
import StatsPage from "@/pages/StatsPage"
import CircuitPage from "@/pages/CircuitPage"
import ConvertPage from "@/pages/ConvertPage"
import PrivacyPage from "@/pages/PrivacyPage"

export default function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <main>
        <Routes>
          <Route path="/" element={<StatsPage />} />
          <Route path="/circuit" element={<CircuitPage />} />
          <Route path="/convert" element={<ConvertPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
