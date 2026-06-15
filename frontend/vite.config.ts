import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import {
  SUPPORTED_LANGUAGES,
  localizePath,
  localizedSiteUrls,
  seo,
  type Language,
} from "./src/lib/i18n"

const SITE_URL = "https://convertexcel.net"
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`

const OG_LOCALES: Record<Language, string> = {
  ja: "ja_JP",
  en: "en_US",
  zh: "zh_CN",
  "zh-Hant": "zh_TW",
  ko: "ko_KR",
  es: "es_ES",
  de: "de_DE",
}

const ADDIN_SEO: Record<Language, { title: string; description: string }> = {
  ja: {
    title: "Excel アドインの導入 - converTeXcel",
    description: "converTeXcel の Excel アドイン（manifest.xml）の入手場所と、Excel への読み込み手順を説明します。",
  },
  en: {
    title: "Install the Excel add-in - converTeXcel",
    description: "Where to get the converTeXcel Excel add-in (manifest.xml) and how to load it into Excel.",
  },
  zh: {
    title: "安装 Excel 加载项 - converTeXcel",
    description: "获取 converTeXcel 的 Excel 加载项（manifest.xml），以及如何将其加载到 Excel 中。",
  },
  "zh-Hant": {
    title: "安裝 Excel 增益集 - converTeXcel",
    description: "取得 converTeXcel 的 Excel 增益集（manifest.xml），以及如何將其載入 Excel。",
  },
  ko: {
    title: "Excel 추가 기능 설치 - converTeXcel",
    description: "converTeXcel Excel 추가 기능(manifest.xml)을 받는 위치와 Excel에 로드하는 방법을 안내합니다.",
  },
  es: {
    title: "Instalar el complemento de Excel - converTeXcel",
    description: "Dónde obtener el complemento de Excel de converTeXcel (manifest.xml) y cómo cargarlo en Excel.",
  },
  de: {
    title: "Excel-Add-In installieren - converTeXcel",
    description: "Wo Sie das converTeXcel-Excel-Add-In (manifest.xml) erhalten und wie Sie es in Excel laden.",
  },
}

type SeoPage = "convert" | "privacy" | "addin"

type StaticSeo = {
  title: string
  description: string
  canonical: string
  language: Language
  alternates: Record<string, string>
  schema: Record<string, unknown>
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function pagePath(page: SeoPage) {
  if (page === "privacy") return "/privacy"
  if (page === "addin") return "/excel-addin"
  return "/"
}

function absoluteUrl(pathname: string) {
  return pathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathname}`
}

function localizedAbsoluteUrls(pathname: string) {
  return localizedSiteUrls(SITE_URL, pathname)
}

function routePath(language: Language, page: SeoPage) {
  return localizePath(pagePath(page), language)
}

function outputFileName(language: Language, page: SeoPage) {
  const pathname = routePath(language, page)
  return outputFileNameForPath(pathname)
}

function outputFileNameForPath(pathname: string) {
  if (pathname === "/") return "index.html"
  return `${pathname.replace(/^\//, "")}/index.html`
}

function staticSeo(language: Language, page: SeoPage): StaticSeo {
  const path = pagePath(page)
  const canonical = absoluteUrl(routePath(language, page))
  const alternates = {
    ...localizedAbsoluteUrls(path),
    "x-default": absoluteUrl(path),
  }

  if (page === "privacy") {
    const text = seo[language]
    return {
      title: text.privacyTitle,
      description: text.privacyDescription,
      canonical,
      language,
      alternates,
      schema: {
        "@context": "https://schema.org",
        "@type": "PrivacyPolicy",
        name: text.privacyTitle,
        url: canonical,
        inLanguage: language,
        description: text.privacyDescription,
      },
    }
  }

  if (page === "addin") {
    const guide = ADDIN_SEO[language]
    return {
      title: guide.title,
      description: guide.description,
      canonical,
      language,
      alternates,
      schema: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "converTeXcel Excel add-in",
        applicationCategory: "OfficeApplication",
        operatingSystem: "Microsoft Excel",
        url: canonical,
        inLanguage: language,
        description: guide.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "JPY",
        },
      },
    }
  }

  const text = seo[language]
  return {
    title: text.convertTitle,
    description: text.convertDescription,
    canonical,
    language,
    alternates,
    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "converTeXcel",
      url: canonical,
      inLanguage: language,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      description: text.convertDescription,
      featureList: [...text.features],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "JPY",
      },
    },
  }
}

function metaTag(name: string, content: string) {
  return `<meta name="${name}" content="${escapeHtml(content)}" />`
}

function propertyTag(property: string, content: string) {
  return `<meta property="${property}" content="${escapeHtml(content)}" />`
}

function localizedSeoBlock(page: StaticSeo) {
  const alternates = Object.entries(page.alternates)
    .map(([language, href]) => `    <link rel="alternate" hreflang="${language}" href="${escapeHtml(href)}" />`)
    .join("\n")

  return [
    `    ${metaTag("description", page.description)}`,
    `    ${metaTag("robots", "index,follow")}`,
    `    <link rel="canonical" href="${escapeHtml(page.canonical)}" />`,
    alternates,
    `    ${propertyTag("og:title", page.title)}`,
    `    ${propertyTag("og:description", page.description)}`,
    `    ${propertyTag("og:url", page.canonical)}`,
    `    ${propertyTag("og:type", "website")}`,
    `    ${propertyTag("og:site_name", "converTeXcel")}`,
    `    ${propertyTag("og:locale", OG_LOCALES[page.language])}`,
    `    ${propertyTag("og:image", DEFAULT_IMAGE)}`,
    `    ${propertyTag("og:image:alt", "converTeXcel")}`,
    `    ${metaTag("twitter:card", "summary_large_image")}`,
    `    ${metaTag("twitter:title", page.title)}`,
    `    ${metaTag("twitter:description", page.description)}`,
    `    ${metaTag("twitter:image", DEFAULT_IMAGE)}`,
    `    <script id="page-structured-data" type="application/ld+json">${JSON.stringify(page.schema)}</script>`,
    `    <title>${escapeHtml(page.title)}</title>`,
  ].join("\n")
}

function applyStaticSeo(html: string, page: StaticSeo) {
  const seoBlock = localizedSeoBlock(page)
  return html
    .replace(/<html lang="[^"]*">/, `<html lang="${page.language}">`)
    .replace(
      /    <meta\s+name="description"[\s\S]*?    <title>[\s\S]*?<\/title>/,
      seoBlock,
    )
}

function localizedHtmlPlugin(): Plugin {
  async function writeLocalizedHtml(outDir: string, fileName: string, source: string) {
    const target = path.join(outDir, fileName)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, source)
  }

  return {
    name: "localized-html",
    apply: "build",
    transformIndexHtml(html) {
      return applyStaticSeo(html, staticSeo("ja", "convert"))
    },
    async writeBundle(options, bundle) {
      const index = bundle["index.html"]
      if (!index || index.type !== "asset" || typeof index.source !== "string") return
      const outDir = options.dir ?? path.resolve(__dirname, "dist")
      const baseHtml = index.source

      for (const language of SUPPORTED_LANGUAGES) {
        for (const page of ["convert", "privacy", "addin"] as const) {
          const fileName = outputFileName(language, page)
          if (fileName === "index.html") continue
          await writeLocalizedHtml(outDir, fileName, applyStaticSeo(baseHtml, staticSeo(language, page)))
        }
      }

      for (const language of SUPPORTED_LANGUAGES) {
        const fileName = outputFileNameForPath(localizePath("/convert", language))
        await writeLocalizedHtml(
          outDir,
          fileName,
          applyStaticSeo(baseHtml, staticSeo(language, "convert")),
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localizedHtmlPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
