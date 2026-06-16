import { Link } from "react-router-dom"

import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { localizedSiteUrls } from "@/lib/i18n"
import {
  CONTACT_EMAIL,
  contactBody,
  contactCopy,
  contactEmailLabel,
  contactIssuesHeading,
  contactIssuesText,
  contactNote,
  ISSUES_URL,
} from "@/lib/site-pages"

const SITE_URL = "https://convertexcel.net/"
const contactUrls = localizedSiteUrls(SITE_URL, "/contact")

export default function ContactPage() {
  const { language, pathFor } = useI18n()
  const copy = contactCopy[language]
  const canonical = contactUrls[language]

  useSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonical,
    language,
    alternates: {
      ...contactUrls,
      "x-default": contactUrls.ja,
    },
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
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
        <CardContent className="space-y-4 py-6 text-sm">
          <p className="text-muted-foreground">{contactBody[language]}</p>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {contactEmailLabel[language]}
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-base font-medium underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {contactIssuesHeading[language]}
            </p>
            <p className="text-muted-foreground">{contactIssuesText[language]}</p>
            <a
              href={ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium underline underline-offset-4"
            >
              GitHub Issues
            </a>
          </div>
          <p className="text-muted-foreground">{contactNote[language]}</p>
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
