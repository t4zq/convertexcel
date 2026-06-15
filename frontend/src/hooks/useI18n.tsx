import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  type Language,
  languageFromPath,
  localizePath,
  seo,
} from "@/lib/i18n"
import {
  getCachedTranslations,
  loadTranslations,
  preloadOtherTranslations,
  type Translations,
} from "@/lib/translations"

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: Translations
  seo: (typeof seo)[Language]
  pathFor: (path: string, language?: Language) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

// アクティブ言語の翻訳を返す。未読み込みなら読み込み、完了まで直前の翻訳を保持して
// ちらつきを防ぐ（初回は main.tsx が描画前に await 済みなので必ずキャッシュ命中する）。
function useActiveTranslations(language: Language): Translations {
  const [, forceUpdate] = useState(0)
  const cached = getCachedTranslations(language)
  const lastRef = useRef<Translations | undefined>(undefined)
  if (cached) lastRef.current = cached

  useEffect(() => {
    if (getCachedTranslations(language)) return
    let alive = true
    void loadTranslations(language).then(() => {
      if (alive) forceUpdate((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [language])

  // cached が無い（切替直後に未読み込み）場合は直前の翻訳で暫定描画する。
  return cached ?? lastRef.current!
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const language = languageFromPath(location.pathname)
  const t = useActiveTranslations(language)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // アイドル時に他言語を先読みし、言語切替を即時化する（TBT には影響しない）。
  useEffect(() => {
    preloadOtherTranslations(language)
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const pathFor = (path: string, target = language) => localizePath(path, target)
    return {
      language,
      t,
      seo: seo[language],
      pathFor,
      setLanguage: (target) => {
        const nextPath = localizePath(location.pathname, target)
        navigate(`${nextPath}${location.search}${location.hash}`, { replace: true })
      },
    }
  }, [language, t, location.hash, location.pathname, location.search, navigate])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function StaticI18nProvider({
  children,
  language,
}: {
  children: ReactNode
  language: Language
}) {
  const t = useActiveTranslations(language)

  const value = useMemo<I18nContextValue>(() => {
    const pathFor = (path: string, target = language) => localizePath(path, target)
    return {
      language,
      t,
      seo: seo[language],
      pathFor,
      setLanguage: () => {},
    }
  }, [language, t])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n must be used inside I18nProvider")
  return value
}
