import { useCallback, useMemo, useState } from "react"

import { createShareUrl } from "@/hooks/useShareUrl"
import {
  DEFAULT_GNUPLOT_SETTINGS,
  DEFAULT_TABLE_SETTINGS,
  getDefaultTikzSettings,
} from "@/lib/convert-settings"

const WEB_APP_URL = import.meta.env.VITE_CONVERTEXCEL_WEB_URL ?? `${window.location.origin}/`
const COPIED_FLASH_MS = 1600

export interface WebAppLink {
  shareUrl: string
  /** Web 版に渡せる入力があるか（ボタンの活性判定に使う）。 */
  hasContent: boolean
  copied: boolean
  openInWebApp: () => void
  copyLink: () => Promise<void>
}

/** 取り込んだ表を Web 版へ受け渡すための共有 URL とその操作を提供するフック。 */
export function useWebAppLink(input: string): WebAppLink {
  const [copied, setCopied] = useState(false)
  const hasContent = input.trim().length > 0

  const shareUrl = useMemo(
    () =>
      hasContent
        ? createShareUrl(WEB_APP_URL, {
            input,
            table: DEFAULT_TABLE_SETTINGS,
            tikz: getDefaultTikzSettings("ja"),
            gnuplot: DEFAULT_GNUPLOT_SETTINGS,
            activeTab: "latex",
          })
        : WEB_APP_URL,
    [input, hasContent],
  )

  const openInWebApp = useCallback(() => {
    if (!hasContent) return
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }, [hasContent, shareUrl])

  const copyLink = useCallback(async () => {
    if (!hasContent) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), COPIED_FLASH_MS)
  }, [hasContent, shareUrl])

  return { shareUrl, hasContent, copied, openInWebApp, copyLink }
}
