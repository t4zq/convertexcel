import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { localizedSiteUrls } from "@/lib/i18n"
import { updateNotes, updatesCopy } from "@/lib/update-notes"

const SITE_URL = "https://convertexcel.net/"
const updateUrls = localizedSiteUrls(SITE_URL, "/updates")

export default function UpdatesPage() {
  const { language, pathFor } = useI18n()
  const copy = updatesCopy[language]
  const canonical = updateUrls[language]

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonical,
    language,
    alternates: {
      ...updateUrls,
      "x-default": updateUrls.ja,
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: copy.title,
      url: canonical,
      inLanguage: language,
      description: copy.seoDescription,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: updateNotes.map((note, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${note.version}: ${note.title[language]}`,
          datePublished: note.date,
        })),
      },
    },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{copy.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">{copy.intro}</p>
      </header>

      <div className="space-y-4">
        {updateNotes.map((note, index) => (
          <Card key={note.version}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">{note.version}</span>
                {index === 0 && (
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {copy.latest}
                  </span>
                )}
                <time className="text-muted-foreground text-sm" dateTime={note.date}>
                  {note.date}
                </time>
              </div>
              <CardTitle>{note.title[language]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{note.summary[language]}</p>
              <ul className="list-disc space-y-1 pl-5">
                {note.changes[language].map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">
          {copy.back}
        </Link>
      </p>
    </div>
  )
}
