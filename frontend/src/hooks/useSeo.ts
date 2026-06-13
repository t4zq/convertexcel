import { useEffect } from "react"

type SeoOptions = {
  title: string
  description: string
  canonical: string
  language: string
  alternates?: Record<string, string>
  robots?: string
  image?: string
  schema?: Record<string, unknown>
}

const DEFAULT_IMAGE = "https://convertexcel.net/og-image.svg"

const OG_LOCALES: Record<string, string> = {
  ja: "ja_JP",
  en: "en_US",
  zh: "zh_CN",
  "zh-Hant": "zh_TW",
  ko: "ko_KR",
  es: "es_ES",
  de: "de_DE",
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement("link")
    element.rel = "canonical"
    document.head.appendChild(element)
  }
  element.href = url
}

function setAlternates(alternates?: Record<string, string>) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((element) => element.remove())
  if (!alternates) return

  Object.entries(alternates).forEach(([lang, href]) => {
    const element = document.createElement("link")
    element.rel = "alternate"
    element.hreflang = lang
    element.href = href
    element.dataset.seoAlternate = "true"
    document.head.appendChild(element)
  })
}

function setSchema(schema?: Record<string, unknown>) {
  const id = "page-structured-data"
  document.getElementById(id)?.remove()
  if (!schema) return

  const script = document.createElement("script")
  script.id = id
  script.type = "application/ld+json"
  script.text = JSON.stringify(schema)
  document.head.appendChild(script)
}

export function useSeo({
  title,
  description,
  canonical,
  language,
  alternates,
  robots = "index,follow",
  image = DEFAULT_IMAGE,
  schema,
}: SeoOptions) {
  useEffect(() => {
    document.title = title
    document.documentElement.lang = language
    setCanonical(canonical)
    setAlternates(alternates)
    setMeta('meta[name="description"]', "name", "description", description)
    setMeta('meta[name="robots"]', "name", "robots", robots)
    setMeta('meta[property="og:title"]', "property", "og:title", title)
    setMeta('meta[property="og:description"]', "property", "og:description", description)
    setMeta('meta[property="og:url"]', "property", "og:url", canonical)
    setMeta('meta[property="og:type"]', "property", "og:type", "website")
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "converTeXcel")
    setMeta('meta[property="og:locale"]', "property", "og:locale", OG_LOCALES[language] ?? "en_US")
    setMeta('meta[property="og:image"]', "property", "og:image", image)
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", "converTeXcel")
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image")
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title)
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description)
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", image)
    setSchema(schema)
  }, [alternates, canonical, description, image, language, robots, schema, title])
}
