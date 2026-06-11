import { useEffect, useRef, useState } from "react"

const PREFIX = "d="

function encode(text: string): string {
  return btoa(encodeURIComponent(text))
}

function decode(s: string): string | null {
  try {
    return decodeURIComponent(atob(s))
  } catch {
    return null
  }
}

/** ページロード時に URL ハッシュから共有入力を取得する。なければ null。 */
export function getSharedInput(): string | null {
  const hash = window.location.hash.slice(1)
  if (!hash.startsWith(PREFIX)) return null
  return decode(hash.slice(PREFIX.length))
}

/** 入力を URL ハッシュに debounce 同期し、共有リンクのコピーを提供する。 */
export function useShareUrl(input: string) {
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>()
  const writeTimer = useRef<ReturnType<typeof setTimeout>>()

  // 現在の入力に対応する共有 URL（ハッシュ書き込みより先行して計算）。
  const shareUrl = input.trim()
    ? `${location.origin}${location.pathname}${location.search}#${PREFIX}${encode(input)}`
    : `${location.origin}${location.pathname}${location.search}`

  useEffect(() => {
    clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      if (input.trim() === "") {
        history.replaceState(null, "", location.pathname + location.search)
      } else {
        history.replaceState(null, "", "#" + PREFIX + encode(input))
      }
    }, 600)
    return () => clearTimeout(writeTimer.current)
  }, [input])

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    })
  }

  return { copied, copyShareUrl, shareUrl }
}
