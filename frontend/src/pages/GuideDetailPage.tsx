import { Link, useParams } from "react-router-dom"

import { DocsLayout } from "@/components/DocsLayout"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { guides, guidesCopy, type Guide } from "@/lib/guides"
import { localizedSiteUrls } from "@/lib/i18n"
import NotFoundPage from "@/pages/NotFoundPage"

const SITE_URL = "https://convertexcel.net/"

function GuideArticle({ guide }: { guide: Guide }) {
  const { language, pathFor } = useI18n()
  const copy = guidesCopy[language]
  const urls = localizedSiteUrls(SITE_URL, `/guides/${guide.slug}`)
  const canonical = urls[language]

  useSeo({
    title: `${guide.title[language]} - converTeXcel`,
    description: guide.description[language],
    canonical,
    language,
    alternates: { ...urls, "x-default": urls.ja },
    schema: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: guide.title[language],
      description: guide.description[language],
      datePublished: guide.date,
      inLanguage: language,
      url: canonical,
    },
  })

  return (
    <DocsLayout>
      <article className="space-y-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{copy.eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{guide.title[language]}</h1>
          <p className="text-muted-foreground text-sm">{guide.description[language]}</p>
          <time className="text-muted-foreground block text-xs" dateTime={guide.date}>{guide.date}</time>
        </header>

        <div className="space-y-4 text-sm leading-7">
          {guide.blocks.map((block, index) => {
            if (block.type === "heading") return <h2 key={index} className="pt-2 text-lg font-semibold">{block.text[language]}</h2>
            if (block.type === "paragraph") return <p key={index}>{block.text[language]}</p>
            if (block.type === "list") {
              return <ul key={index} className="list-disc space-y-1 pl-5">{block.items[language].map((item) => <li key={item}>{item}</li>)}</ul>
            }
            if (block.type === "code") {
              return <pre key={index} className="overflow-x-auto rounded-md border bg-muted p-4 text-xs"><code>{block.code}</code></pre>
            }
            return <p key={index}><a href={block.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">{block.label[language]}</a></p>
          })}
        </div>

        <p><Link to={pathFor("/docs")} className="text-sm underline underline-offset-4">{copy.back}</Link></p>
      </article>
    </DocsLayout>
  )
}

export default function GuideDetailPage() {
  const { slug } = useParams()
  const guide = guides.find((candidate) => candidate.slug === slug)
  return guide ? <GuideArticle guide={guide} /> : <NotFoundPage />
}
