import { BookOpen, Download } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { addinGuide, ADDIN_MANIFEST_URL } from "@/lib/addin-guide"
import { localizedSiteUrls } from "@/lib/i18n"

const SITE_URL = "https://convertexcel.net/"
const DOCS_URL = "https://docs.convertexcel.net/docs"
const addinUrls = localizedSiteUrls(SITE_URL, "/excel-addin")
const docsLabels = {
  ja: "詳しい導入手順をDocsで見る",
  en: "Read the installation guide",
  zh: "在文档中查看详细安装步骤",
  "zh-Hant": "在文件中查看詳細安裝步驟",
  es: "Ver la guía de instalación",
  de: "Installationsanleitung lesen",
} as const

export default function AddinPage() {
  const { language, pathFor } = useI18n()
  const guide = addinGuide[language]
  const canonical = addinUrls[language]

  useSeo({
    title: guide.seoTitle,
    description: guide.seoDescription,
    canonical,
    language,
    alternates: { ...addinUrls, "x-default": addinUrls.ja },
    schema: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: guide.title,
      url: canonical,
      inLanguage: language,
      description: guide.seoDescription,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Microsoft 365 Excel",
    },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{guide.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{guide.title}</h1>
        <p className="text-muted-foreground text-sm">{guide.intro}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6 text-sm">
          <h2 className="text-base font-semibold">{guide.downloadTitle}</h2>
          <p className="text-muted-foreground">{guide.downloadDescription}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={ADDIN_MANIFEST_URL} download="converTeXcel-manifest.xml">
                <Download className="h-4 w-4" />
                {guide.downloadButton}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={DOCS_URL}>
                <BookOpen className="h-4 w-4" />
                {docsLabels[language]}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">{guide.back}</Link>
      </p>
    </div>
  )
}
