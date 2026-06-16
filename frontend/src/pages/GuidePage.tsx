import { Link, useParams } from "react-router-dom"

import { DocsLayout, type DocsTocItem } from "@/components/DocsLayout"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { guides, guidesCopy } from "@/lib/guides"
import { localizedSiteUrls } from "@/lib/i18n"
import NotFoundPage from "@/pages/NotFoundPage"

const SITE_URL = "https://convertexcel.net/"

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>()
  const { language, pathFor } = useI18n()
  const copy = guidesCopy[language]
  const guide = guides.find((g) => g.slug === slug)

  if (!guide) return <NotFoundPage />

  const urls = localizedSiteUrls(SITE_URL, `/guides/${guide.slug}`)
  const canonical = urls[language]

  const toc: DocsTocItem[] = guide.blocks
    .map((block, index) => (block.type === "heading" ? { id: `s-${index}`, label: block.text[language] } : null))
    .filter((item): item is DocsTocItem => item !== null)

  return (
    <GuideArticle
      guide={guide}
      copy={copy}
      canonical={canonical}
      urls={urls}
      language={language}
      pathFor={pathFor}
      toc={toc}
    />
  )
}

type GuideArticleProps = {
  guide: (typeof guides)[number]
  copy: (typeof guidesCopy)[keyof typeof guidesCopy]
  canonical: string
  urls: Record<string, string>
  language: keyof typeof guidesCopy
  pathFor: (path: string) => string
  toc: DocsTocItem[]
}

function GuideArticle({ guide, copy, canonical, urls, language, pathFor, toc }: GuideArticleProps) {
  useSeo({
    title: `${guide.title[language]} - converTeXcel`,
    description: guide.description[language],
    canonical,
    language,
    alternates: {
      ...urls,
      "x-default": urls.ja,
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: guide.title[language],
      name: guide.title[language],
      description: guide.description[language],
      url: canonical,
      inLanguage: language,
      datePublished: guide.date,
    },
  })

  return (
    <DocsLayout toc={toc}>
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{copy.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{guide.title[language]}</h1>
        <p className="text-muted-foreground text-sm">{guide.description[language]}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6 text-sm">
          {guide.blocks.map((block, index) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2 key={index} id={`s-${index}`} className="scroll-mt-6 pt-2 text-base font-semibold tracking-tight">
                    {block.text[language]}
                  </h2>
                )
              case "paragraph":
                return (
                  <p key={index} className="text-muted-foreground">
                    {block.text[language]}
                  </p>
                )
              case "list":
                return (
                  <ul key={index} className="list-disc space-y-1 pl-5 text-muted-foreground">
                    {block.items[language].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              case "code":
                return (
                  <pre key={index} className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                    <code>{block.code}</code>
                  </pre>
                )
              case "reference":
                return (
                  <p key={index} className="text-muted-foreground pt-2 text-xs">
                    <a
                      href={block.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {block.label[language]}
                    </a>
                  </p>
                )
            }
          })}
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/docs")} className="underline underline-offset-4">
          {copy.back}
        </Link>
      </p>
    </DocsLayout>
  )
}
