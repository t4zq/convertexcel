import { useEffect } from "react"

const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim()

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

function ensureAdSenseScript() {
  if (!clientId || typeof document === "undefined") return false
  if (document.querySelector(`script[data-adsense-client="${clientId}"]`)) return true

  const script = document.createElement("script")
  script.async = true
  script.crossOrigin = "anonymous"
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`
  script.dataset.adsenseClient = clientId
  document.head.appendChild(script)
  return true
}

export function AdSenseUnit({
  slot,
  label,
  className,
}: {
  slot?: string
  label: string
  className?: string
}) {
  useEffect(() => {
    if (!clientId || !slot || !ensureAdSenseScript()) return
    window.adsbygoogle = window.adsbygoogle ?? []
    try {
      window.adsbygoogle.push({})
    } catch {
      // AdSense may throw in dev/HMR when the same unit is initialized twice.
    }
  }, [slot])

  if (!clientId || !slot) return null

  return (
    <aside className={className} aria-label={label}>
      <p className="mb-2 text-center text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full overflow-hidden rounded-md border bg-muted/20"
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
