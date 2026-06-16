import { Link } from "react-router-dom"

import { DocsLayout } from "@/components/DocsLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { docsCopy, docsSections } from "@/lib/docs"
import { guides, guidesCopy } from "@/lib/guides"
import { localizedSiteUrls } from "@/lib/i18n"

const SITE_URL = "https://convertexcel.net/"
const docsUrls = localizedSiteUrls(SITE_URL, "/docs")

export default function DocsPage() {
  const { language, pathFor } = useI18n()
  const copy = docsCopy[language]
  const guidesText = guidesCopy[language]
  const canonical = docsUrls[language]

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonical,
    language,
    alternates: {
      ...docsUrls,
      "x-default": docsUrls.ja,
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      name: copy.title,
      headline: copy.title,
      url: canonical,
      inLanguage: language,
      description: copy.seoDescription,
    },
  })

  return (
    <DocsLayout>
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{copy.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">{copy.intro}</p>
      </header>

      <div className="space-y-4">
        {docsSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.heading[language]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {section.paragraphs?.[language].map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground">
                  {paragraph}
                </p>
              ))}
              {section.steps && (
                <ol className="list-decimal space-y-1 pl-5">
                  {section.steps[language].map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
              {section.bullets && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.bullets[language].map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.link && (
                <p>
                  <Link to={pathFor(section.link.to)} className="underline underline-offset-4">
                    {section.link.label[language]}
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{guidesText.heading}</h2>
          <p className="text-muted-foreground text-sm">{guidesText.intro}</p>
        </div>
        <div className="space-y-3">
          {guides.map((guide) => (
            <Card key={guide.slug}>
              <CardContent className="py-4 text-sm">
                <Link
                  to={pathFor(`/guides/${guide.slug}`)}
                  className="font-medium underline underline-offset-4"
                >
                  {guide.title[language]}
                </Link>
                <p className="text-muted-foreground mt-1">{guide.description[language]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">
          {copy.back}
        </Link>
      </p>
    </DocsLayout>
  )
}
