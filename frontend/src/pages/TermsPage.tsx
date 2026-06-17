import { ContentArticle } from "@/components/ContentArticle"
import { useSeo } from "@/hooks/useSeo"
import { termsPage } from "@/lib/site-content"

const CANONICAL = "https://convertexcel.net/terms"

export default function TermsPage() {
  useSeo({
    title: termsPage.seoTitle,
    description: termsPage.seoDescription,
    canonical: CANONICAL,
    language: "ja",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: termsPage.title,
      description: termsPage.seoDescription,
      inLanguage: "ja",
      url: CANONICAL,
      isPartOf: { "@type": "WebSite", name: "converTeXcel", url: "https://convertexcel.net/" },
    },
  })

  return <ContentArticle page={termsPage} backLabel="ホームに戻る" />
}
