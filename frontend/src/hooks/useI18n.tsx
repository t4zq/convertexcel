import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  type Language,
  languageFromPath,
  localizePath,
  seo,
  translations,
} from "@/lib/i18n"

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (typeof translations)[Language]
  seo: (typeof seo)[Language]
  pathFor: (path: string, language?: Language) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const language = languageFromPath(location.pathname)

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const pathFor = (path: string, target = language) => localizePath(path, target)
    return {
      language,
      t: translations[language],
      seo: seo[language],
      pathFor,
      setLanguage: (target) => {
        const nextPath = localizePath(location.pathname, target)
        navigate(`${nextPath}${location.search}${location.hash}`, { replace: true })
      },
    }
  }, [language, location.hash, location.pathname, location.search, navigate])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function StaticI18nProvider({
  children,
  language,
}: {
  children: ReactNode
  language: Language
}) {
  const value = useMemo<I18nContextValue>(() => {
    const pathFor = (path: string, target = language) => localizePath(path, target)
    return {
      language,
      t: translations[language],
      seo: seo[language],
      pathFor,
      setLanguage: () => {},
    }
  }, [language])

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
