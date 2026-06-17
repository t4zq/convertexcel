import { ContentArticle } from "@/components/ContentArticle"
import { useSeo } from "@/hooks/useSeo"
import { contactPage } from "@/lib/site-content"

const CANONICAL = "https://convertexcel.net/contact"

export default function ContactPage() {
  useSeo({
    title: contactPage.seoTitle,
    description: contactPage.seoDescription,
    canonical: CANONICAL,
    language: "ja",
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: contactPage.title,
      description: contactPage.seoDescription,
      inLanguage: "ja",
      url: CANONICAL,
      isPartOf: { "@type": "WebSite", name: "converTeXcel", url: "https://convertexcel.net/" },
    },
  })

  return <ContentArticle page={contactPage} backLabel="ホームに戻る" />
}
