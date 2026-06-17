import { ContentArticle } from "@/components/ContentArticle"
import { useSeo } from "@/hooks/useSeo"
import { aboutPage } from "@/lib/site-content"

const CANONICAL = "https://convertexcel.net/about"

export default function AboutPage() {
  useSeo({
    title: aboutPage.seoTitle,
    description: aboutPage.seoDescription,
    canonical: CANONICAL,
    language: "ja",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: aboutPage.title,
      description: aboutPage.seoDescription,
      inLanguage: "ja",
      url: CANONICAL,
      isPartOf: { "@type": "WebSite", name: "converTeXcel", url: "https://convertexcel.net/" },
    },
  })

  return <ContentArticle page={aboutPage} backLabel="ホームに戻る" />
}
