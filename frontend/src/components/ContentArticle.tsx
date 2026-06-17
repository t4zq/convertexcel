import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/hooks/useI18n"
import type { ContentBlock, SitePage } from "@/lib/site-content"

function BlockView({ block }: { block: ContentBlock }) {
  const { pathFor } = useI18n()
  switch (block.type) {
    case "h3":
      return <h3 className="pt-2 text-base font-semibold tracking-tight">{block.text}</h3>
    case "p":
      return <p className="leading-relaxed text-muted-foreground">{block.text}</p>
    case "ul":
      return (
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )
    case "ol":
      return (
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      )
    case "code":
      return (
        <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
          <code className="font-mono">{block.code}</code>
        </pre>
      )
    case "links":
      return (
        <ul className="space-y-1 text-sm">
          {block.items.map((link) =>
            link.to ? (
              <li key={link.to}>
                <Link to={pathFor(link.to)} className="underline underline-offset-4">
                  {link.label}
                </Link>
              </li>
            ) : (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="underline underline-offset-4"
                  target={link.href?.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener"
                >
                  {link.label}
                </a>
              </li>
            ),
          )}
        </ul>
      )
  }
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  )
}

export function ContentArticle({ page, backLabel }: { page: SitePage; backLabel: string }) {
  const { pathFor } = useI18n()
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{page.eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{page.intro}</p>
      </header>

      {page.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader><CardTitle className="text-lg">{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {section.blocks.map((block, index) => (
              <BlockView key={index} block={block} />
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-sm">
        <Link to={pathFor("/")} className="underline underline-offset-4">{backLabel}</Link>
      </p>
    </div>
  )
}
