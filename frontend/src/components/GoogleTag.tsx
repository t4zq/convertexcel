import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function ensureGoogleTag() {
  if (!measurementId || typeof document === "undefined") return false
  if (document.querySelector(`script[data-google-tag="${measurementId}"]`)) return true

  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  script.dataset.googleTag = measurementId
  document.head.appendChild(script)

  window.gtag("js", new Date())
  return true
}

export function GoogleTag() {
  const location = useLocation()

  useEffect(() => {
    if (!ensureGoogleTag() || !measurementId) return
    window.gtag?.("config", measurementId, {
      page_path: `${location.pathname}${location.search}`,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location.pathname, location.search])

  return null
}
