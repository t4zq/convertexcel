import { Link } from "react-router-dom"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"

const SITE_URL = "https://convertexcel.net/"

export default function PrivacyPage() {
  const { language, t, seo: seoText, pathFor } = useI18n()
  const canonical = language === "en" ? `${SITE_URL}en/privacy` : `${SITE_URL}privacy`
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seoText.privacyTitle,
    url: canonical,
    inLanguage: language,
    description: seoText.privacyDescription,
    isPartOf: {
      "@type": "WebSite",
      name: "converTeXcel",
      url: SITE_URL,
    },
  }

  useSeo({
    title: seoText.privacyTitle,
    description: seoText.privacyDescription,
    canonical,
    language,
    alternates: {
      ja: `${SITE_URL}privacy`,
      en: `${SITE_URL}en/privacy`,
      "x-default": `${SITE_URL}privacy`,
    },
    schema: pageSchema,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{t.privacy.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.privacy.title}</h1>
        <p className="text-muted-foreground text-sm">{t.privacy.date}</p>
      </header>

      <Card>
        <CardHeader><CardTitle>{t.privacy.introTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t.privacy.intro1}</p>
          <p>{t.privacy.intro2}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.privacy.dataTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t.privacy.data1}</p>
          <p>{t.privacy.data2}</p>
          <p>{t.privacy.data3}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.privacy.externalTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{t.privacy.externalIntro}</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.privacy.service}</TableHead>
                <TableHead>{t.privacy.purpose}</TableHead>
                <TableHead>{t.privacy.sentData}</TableHead>
                <TableHead>{t.privacy.timing}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <a className="underline" href="https://texlive.net" target="_blank" rel="noopener">texlive.net</a>
                </TableCell>
                <TableCell>{t.privacy.previewPurpose}</TableCell>
                <TableCell>{t.privacy.previewData}</TableCell>
                <TableCell>{t.privacy.previewTiming}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.privacy.trackingTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{t.privacy.tracking1}</p>
          <p>{t.privacy.tracking2}</p>
          <p>{t.privacy.tracking3}</p>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">{t.privacy.back}</Link>
      </p>
    </div>
  )
}
