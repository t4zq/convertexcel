import { useEffect } from "react"

type SeoOptions = {
  title: string
  description: string
  canonical: string
  language: string
  alternates?: Record<string, string>
  robots?: string
  schema?: Record<string, unknown>
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

export function useSeo({ title, description, canonical, language, alternates, robots = "index,follow", schema }: SeoOptions) {
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
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title)
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description)
    setSchema(schema)
  }, [alternates, canonical, description, language, robots, schema, title])
}
