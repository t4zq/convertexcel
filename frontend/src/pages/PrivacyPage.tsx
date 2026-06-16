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
import { localizedSiteUrls } from "@/lib/i18n"
import { privacyPolicy } from "@/lib/privacy-policy"

const SITE_URL = "https://convertexcel.net/"
const privacyUrls = localizedSiteUrls(SITE_URL, "/privacy")
const serviceLinks: Record<string, string> = {
  "texlive.net": "https://texlive.net",
  "Google Analytics": "https://policies.google.com/technologies/partner-sites",
  "Google AdSense": "https://policies.google.com/technologies/ads",
}

export default function PrivacyPage() {
  const { language, t, seo: seoText, pathFor } = useI18n()
  const policy = privacyPolicy[language]
  const canonical = privacyUrls[language]
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
      ...privacyUrls,
      "x-default": privacyUrls.ja,
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
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>{policy.notice}</p>
        </CardContent>
      </Card>

      {policy.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul className="list-disc space-y-1 pl-5">
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle>{policy.dataTable.title}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto text-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{policy.dataTable.headers.category}</TableHead>
                <TableHead>{policy.dataTable.headers.purpose}</TableHead>
                <TableHead>{policy.dataTable.headers.legalBasis}</TableHead>
                <TableHead>{policy.dataTable.headers.retention}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policy.dataTable.rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="min-w-48 align-top">{row.category}</TableCell>
                  <TableCell className="min-w-48 align-top">{row.purpose}</TableCell>
                  <TableCell className="min-w-56 align-top">{row.legalBasis}</TableCell>
                  <TableCell className="min-w-56 align-top">{row.retention}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{policy.thirdParties.title}</CardTitle></CardHeader>
        <CardContent className="space-y-3 overflow-x-auto text-sm">
          <p>{policy.thirdParties.intro}</p>
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
              {policy.thirdParties.rows.map((row) => (
                <TableRow key={row.service}>
                  <TableCell className="min-w-44 align-top">
                    {serviceLinks[row.service] ? (
                      <a className="underline" href={serviceLinks[row.service]} target="_blank" rel="noopener">{row.service}</a>
                    ) : row.service}
                  </TableCell>
                  <TableCell className="min-w-48 align-top">{row.purpose}</TableCell>
                  <TableCell className="min-w-56 align-top">{row.data}</TableCell>
                  <TableCell className="min-w-48 align-top">{row.timing}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{policy.regional.title}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {policy.regional.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">{t.privacy.back}</Link>
      </p>
    </div>
  )
}
