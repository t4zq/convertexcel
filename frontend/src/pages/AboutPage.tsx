import { Link } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { localizedSiteUrls } from "@/lib/i18n"
import { aboutBody, aboutCopy } from "@/lib/site-pages"

const SITE_URL = "https://convertexcel.net/"
const aboutUrls = localizedSiteUrls(SITE_URL, "/about")

export default function AboutPage() {
  const { language, pathFor, t } = useI18n()
  const copy = aboutCopy[language]
  const canonical = aboutUrls[language]

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonical,
    language,
    alternates: {
      ...aboutUrls,
      "x-default": aboutUrls.ja,
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: copy.title,
      url: canonical,
      inLanguage: language,
      description: copy.seoDescription,
    },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{copy.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">{copy.intro}</p>
      </header>

      <Card>
        <CardContent className="space-y-3 py-6 text-sm">
          {aboutBody[language].map((paragraph) => (
            <p key={paragraph} className="text-muted-foreground">
              {paragraph}
            </p>
          ))}
          <div className="flex flex-wrap gap-4 pt-1">
            <Link to={pathFor("/docs")} className="underline underline-offset-4">
              {t.nav.docs}
            </Link>
            <Link to={pathFor("/contact")} className="underline underline-offset-4">
              {t.nav.contact}
            </Link>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">
          {copy.back}
        </Link>
      </p>
    </div>
  )
}
