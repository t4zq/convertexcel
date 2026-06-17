import { Link } from "react-router-dom"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/animate-ui/components/radix/accordion"
import { ContentBlocks } from "@/components/ContentArticle"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { faqPage } from "@/lib/site-content"

const CANONICAL = "https://convertexcel.net/faq"

// FAQ の各セクションを FAQPage 構造化データへ変換（answer は p / リスト ブロックを連結）。
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "ja",
  url: CANONICAL,
  mainEntity: faqPage.sections.map((section) => ({
    "@type": "Question",
    name: section.title,
    acceptedAnswer: {
      "@type": "Answer",
      text: section.blocks
        .flatMap((block) =>
          block.type === "p"
            ? [block.text]
            : block.type === "ul" || block.type === "ol"
              ? block.items
              : [],
        )
        .join(" "),
    },
  })),
}

export default function FaqPage() {
  const { pathFor } = useI18n()

  useSeo({
    title: faqPage.seoTitle,
    description: faqPage.seoDescription,
    canonical: CANONICAL,
    language: "ja",
    schema: faqSchema,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{faqPage.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{faqPage.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{faqPage.intro}</p>
      </header>

      <Card className="px-4 sm:px-6">
        <Accordion type="single" collapsible className="w-full">
          {faqPage.sections.map((section) => (
            <AccordionItem key={section.title} value={section.title}>
              <AccordionTrigger className="text-base">{section.title}</AccordionTrigger>
              <AccordionContent>
                <ContentBlocks blocks={section.blocks} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">ホームに戻る</Link>
      </p>
    </div>
  )
}
