import { useEffect, useRef, useState } from "react"

import {
  DEFAULT_GNUPLOT_SETTINGS,
  type GnuplotSettings,
  type TableSettings,
  type TikzSettings,
} from "@/lib/convert-settings"

const LEGACY_INPUT_PREFIX = "d="
const SHARE_STATE_PREFIX = "s="

export interface ShareState {
  input: string
  table: TableSettings
  tikz: TikzSettings
  gnuplot: GnuplotSettings
  activeTab: "latex" | "tikz" | "gnuplot"
}

function encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)))
}

function decode(s: string): string | null {
  try {
    // encode() と対になるよう必ず escape を通す。atob の結果は UTF-8 バイトを
    // char code 0-255 として持つバイナリ文字列なので、escape で %XX 化してから
    // decodeURIComponent に渡さないと日本語などが mojibake になる。
    return decodeURIComponent(escape(atob(s)))
  } catch {
    return null
  }
}

function encodeState(state: ShareState): string {
  return encode(JSON.stringify({
    v: 1,
    input: state.input,
    table: state.table,
    tikz: state.tikz,
    gnuplot: state.gnuplot,
    activeTab: state.activeTab,
  }))
}

export function createShareHash(state: ShareState): string {
  return SHARE_STATE_PREFIX + encodeState(state)
}

export function createShareUrl(baseUrl: string, state: ShareState): string {
  return `${baseUrl.replace(/#.*$/, "")}#${createShareHash(state)}`
}

function decodeState(hashValue: string): ShareState | null {
  const raw = decode(hashValue)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<ShareState> & { v?: number }
    if (parsed.v !== 1 || typeof parsed.input !== "string") return null
    if (
      parsed.activeTab !== "latex" &&
      parsed.activeTab !== "tikz" &&
      parsed.activeTab !== "gnuplot"
    )
      return null
    if (!parsed.table || !parsed.tikz) return null
    return {
      input: parsed.input,
      table: parsed.table,
      tikz: parsed.tikz,
      gnuplot: (parsed.gnuplot as GnuplotSettings | undefined) ?? DEFAULT_GNUPLOT_SETTINGS,
      activeTab: parsed.activeTab,
    } as ShareState
  } catch {
    return null
  }
}

/** ページロード時に URL ハッシュから共有入力を取得する。なければ null。 */
export function getSharedInput(): string | null {
  const hash = window.location.hash.slice(1)
  if (!hash.startsWith(LEGACY_INPUT_PREFIX)) return null
  return decode(hash.slice(LEGACY_INPUT_PREFIX.length))
}

/** ページロード時に URL ハッシュから共有状態を取得する。旧形式なら input だけ返す。 */
export function getSharedState(): Partial<ShareState> | null {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith(SHARE_STATE_PREFIX)) {
    return decodeState(hash.slice(SHARE_STATE_PREFIX.length))
  }
  const input = getSharedInput()
  return input === null ? null : { input }
}

/** 入力と設定を URL ハッシュに debounce 同期し、共有リンクのコピーを提供する。 */
export function useShareUrl(state: ShareState, hasShareContent: boolean) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const writeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hash = createShareHash(state)
  // 現在の状態に対応する共有 URL（ハッシュ書き込みより先行して計算）。
  const shareUrl = hasShareContent
    ? `${location.origin}${location.pathname}${location.search}#${hash}`
    : `${location.origin}${location.pathname}${location.search}`

  useEffect(() => {
    clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      if (!hasShareContent) {
        history.replaceState(null, "", location.pathname + location.search)
      } else {
        history.replaceState(null, "", "#" + hash)
      }
    }, 600)
    return () => clearTimeout(writeTimer.current)
  }, [hasShareContent, hash])

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return { copied, copyShareUrl, shareUrl }
}
