import { Download } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { addinGuide, ADDIN_MANIFEST_URL } from "@/lib/addin-guide"
import { localizedSiteUrls } from "@/lib/i18n"

const SITE_URL = "https://convertexcel.net/"
const addinUrls = localizedSiteUrls(SITE_URL, "/excel-addin")

export default function AddinPage() {
  const { language, pathFor } = useI18n()
  const guide = addinGuide[language]
  const canonical = addinUrls[language]

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.title,
    url: canonical,
    inLanguage: language,
    description: guide.seoDescription,
    step: guide.methods.flatMap((method) =>
      method.steps.map((step, index) => ({
        "@type": "HowToStep",
        name: `${method.title} ${index + 1}`,
        text: step,
      })),
    ),
  }

  useSeo({
    title: guide.seoTitle,
    description: guide.seoDescription,
    canonical,
    language,
    alternates: {
      ...addinUrls,
      "x-default": addinUrls.ja,
    },
    schema: pageSchema,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{guide.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{guide.title}</h1>
        <p className="text-muted-foreground text-sm">{guide.intro}</p>
      </header>

      <Card>
        <CardHeader><CardTitle>{guide.requirementsTitle}</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {guide.requirements.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{guide.downloadTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{guide.downloadDescription}</p>
          <Button asChild>
            <a href={ADDIN_MANIFEST_URL} download="converTeXcel-manifest.xml">
              <Download className="h-4 w-4" />
              {guide.downloadButton}
            </a>
          </Button>
          <p className="text-muted-foreground text-xs">
            {guide.manifestUrlLabel}:{" "}
            <a className="underline underline-offset-4" href={ADDIN_MANIFEST_URL} target="_blank" rel="noopener">
              {ADDIN_MANIFEST_URL}
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{guide.methodsTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-5 text-sm">
          {guide.methods.map((method) => (
            <div key={method.title} className="space-y-2">
              <p className="font-medium">{method.title}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {method.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              {method.docUrl && (
                <p className="text-muted-foreground text-xs">
                  <a className="underline underline-offset-4" href={method.docUrl} target="_blank" rel="noopener">
                    {guide.learnMoreLabel}
                  </a>
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{guide.notesTitle}</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {guide.notes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">{guide.back}</Link>
      </p>
    </div>
  )
}
