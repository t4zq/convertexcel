import { ContentArticle } from "@/components/ContentArticle"
import { useSeo } from "@/hooks/useSeo"
import { guidePage } from "@/lib/site-content"

const CANONICAL = "https://convertexcel.net/guide"

export default function GuidePage() {
  useSeo({
    title: guidePage.seoTitle,
    description: guidePage.seoDescription,
    canonical: CANONICAL,
    language: "ja",
    schema: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guidePage.title,
      description: guidePage.seoDescription,
      inLanguage: "ja",
      url: CANONICAL,
      isPartOf: { "@type": "WebSite", name: "converTeXcel", url: "https://convertexcel.net/" },
    },
  })

  return <ContentArticle page={guidePage} backLabel="ホームに戻る" />
}
