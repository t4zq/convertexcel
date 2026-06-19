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
import {
  contactPage,
  termsPage,
  type SitePage,
} from "./src/lib/site-content"

const SITE_URL = "https://convertexcel.net"
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`

const OG_LOCALES: Record<Language, string> = {
  ja: "ja_JP",
  en: "en_US",
  zh: "zh_CN",
  "zh-Hant": "zh_TW",
  es: "es_ES",
  de: "de_DE",
}

const ADDIN_SEO: Record<Language, { title: string; description: string }> = {
  ja: {
    title: "Excel アドイン - converTeXcel",
    description: "Excelの選択範囲をconverTeXcelへ取り込むアドインとマニフェストを提供します。",
  },
  en: {
    title: "Excel add-in - converTeXcel",
    description: "Get the add-in and manifest for importing an Excel selection into converTeXcel.",
  },
  zh: {
    title: "Excel 加载项 - converTeXcel",
    description: "获取用于将Excel选区导入converTeXcel的加载项和清单文件。",
  },
  "zh-Hant": {
    title: "Excel 增益集 - converTeXcel",
    description: "取得用於將Excel選取範圍匯入converTeXcel的增益集與資訊清單。",
  },
  es: {
    title: "Complemento de Excel - converTeXcel",
    description: "Obtén el complemento y el manifiesto para importar una selección de Excel en converTeXcel.",
  },
  de: {
    title: "Excel-Add-In - converTeXcel",
    description: "Add-In und Manifest zum Importieren eines Excel-Bereichs in converTeXcel.",
  },
}

const UPDATES_SEO: Record<Language, { title: string; description: string }> = {
  ja: {
    title: "アップデート情報 - converTeXcel",
    description: "converTeXcel の機能更新、Excel アドイン、LaTeX 変換、ローカルデバッグ改善などの変更履歴です。",
  },
  en: {
    title: "Updates - converTeXcel",
    description: "Release notes for converTeXcel, including Excel add-in, LaTeX conversion, and local debugging updates.",
  },
  zh: {
    title: "更新信息 - converTeXcel",
    description: "converTeXcel 的更新记录，包括 Excel 加载项、LaTeX 转换和本地调试改进。",
  },
  "zh-Hant": {
    title: "更新資訊 - converTeXcel",
    description: "converTeXcel 的更新紀錄，包括 Excel 增益集、LaTeX 轉換與本機偵錯改善。",
  },
  es: {
    title: "Novedades - converTeXcel",
    description: "Historial de cambios de converTeXcel, incluido el complemento de Excel, la conversión LaTeX y la depuración local.",
  },
  de: {
    title: "Updates - converTeXcel",
    description: "Änderungshistorie für converTeXcel, einschließlich Excel-Add-In, LaTeX-Konvertierung und lokaler Debugging-Verbesserungen.",
  },
}

type SeoPage = "convert" | "privacy" | "addin" | "updates"

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
  if (page === "updates") return "/updates"
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

  if (page === "updates") {
    const updates = UPDATES_SEO[language]
    return {
      title: updates.title,
      description: updates.description,
      canonical,
      language,
      alternates,
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: updates.title,
        url: canonical,
        inLanguage: language,
        description: updates.description,
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

// 日本語のみ用意した読み物ページの静的 SEO 生成対象。
const JA_CONTENT_PAGES: Array<{ path: string; page: SitePage; schemaType: string }> = [
  { path: "/contact", page: contactPage, schemaType: "ContactPage" },
  { path: "/terms", page: termsPage, schemaType: "WebPage" },
]

function staticSeoForContent(pathname: string, page: SitePage, schemaType: string): StaticSeo {
  const canonical = absoluteUrl(pathname)
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    canonical,
    language: "ja",
    // 単一言語ページのため hreflang は付けない。
    alternates: {},
    schema: {
      "@context": "https://schema.org",
      "@type": schemaType,
      name: page.title,
      ...(schemaType === "Article" ? { headline: page.title } : {}),
      url: canonical,
      inLanguage: "ja",
      description: page.seoDescription,
      isPartOf: { "@type": "WebSite", name: "converTeXcel", url: `${SITE_URL}/` },
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

// 出力バンドルから言語別翻訳チャンク (src/lib/translations/<lang>.ts) のファイル名を抽出する。
function translationChunks(bundle: Record<string, { type: string; facadeModuleId?: string | null; fileName: string }>) {
  const map = {} as Record<Language, string>
  // Rollup の facadeModuleId は OS を問わず posix 区切り。
  const dir = "src/lib/translations/"
  for (const chunk of Object.values(bundle)) {
    if (chunk.type !== "chunk" || !chunk.facadeModuleId) continue
    const id = chunk.facadeModuleId.replace(/\\/g, "/")
    const idx = id.indexOf(dir)
    if (idx === -1) continue
    const rest = id.slice(idx + dir.length) // 例: "ja.ts"
    if (!rest.endsWith(".ts") || rest.includes("/")) continue
    const lang = rest.slice(0, -3) as Language
    if (SUPPORTED_LANGUAGES.includes(lang)) map[lang] = chunk.fileName
  }
  return map
}

// Google Analytics (gtag.js)。ビルド時のみ注入するため dev / preview では読み込まれない。
const GA_MEASUREMENT_ID = "G-2Z44NE8Y06"

function injectAnalytics(html: string) {
  const snippet = [
    `    <!-- Google tag (gtag.js) -->`,
    `    <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>`,
    `    <script>`,
    `      window.dataLayer = window.dataLayer || [];`,
    `      function gtag(){dataLayer.push(arguments);}`,
    `      gtag('js', new Date());`,
    `      gtag('config', '${GA_MEASUREMENT_ID}');`,
    `    </script>`,
    ``,
  ].join("\n")
  return html.replace("</head>", `${snippet}  </head>`)
}

// アクティブ言語の翻訳チャンクを modulepreload で並列取得させ、entry→翻訳の直列待ちを防ぐ。
function injectModulePreload(html: string, fileName: string | undefined) {
  if (!fileName) return html
  const tag = `    <link rel="modulepreload" href="/${fileName}" />\n`
  return html.replace("</head>", `${tag}  </head>`)
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
      return injectAnalytics(applyStaticSeo(html, staticSeo("ja", "convert")))
    },
    async writeBundle(options, bundle) {
      const index = bundle["index.html"]
      if (!index || index.type !== "asset" || typeof index.source !== "string") return
      const outDir = options.dir ?? path.resolve(__dirname, "dist")
      const baseHtml = index.source
      const langChunk = translationChunks(bundle as never)

      // ベース index.html (日本語) にも翻訳チャンクの modulepreload を付与する。
      await writeLocalizedHtml(outDir, "index.html", injectModulePreload(baseHtml, langChunk.ja))

      for (const language of SUPPORTED_LANGUAGES) {
        for (const page of ["convert", "privacy", "addin", "updates"] as const) {
          const fileName = outputFileName(language, page)
          if (fileName === "index.html") continue
          const html = injectModulePreload(applyStaticSeo(baseHtml, staticSeo(language, page)), langChunk[language])
          await writeLocalizedHtml(outDir, fileName, html)
        }
      }

      for (const language of SUPPORTED_LANGUAGES) {
        const fileName = outputFileNameForPath(localizePath("/convert", language))
        const html = injectModulePreload(applyStaticSeo(baseHtml, staticSeo(language, "convert")), langChunk[language])
        await writeLocalizedHtml(outDir, fileName, html)
      }

      // 日本語のみの読み物ページ（root のみ）を静的生成する。
      for (const { path: pagePathname, page, schemaType } of JA_CONTENT_PAGES) {
        const fileName = outputFileNameForPath(pagePathname)
        const html = injectModulePreload(
          applyStaticSeo(baseHtml, staticSeoForContent(pagePathname, page, schemaType)),
          langChunk.ja,
        )
        await writeLocalizedHtml(outDir, fileName, html)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    tailwindcss(),
    localizedHtmlPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ["**/dist/**", "**/*.tsbuildinfo"],
    },
    // /api を `wrangler dev` (Worker + ローカル D1) に転送し、フルスタックで開発できるようにする。
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
