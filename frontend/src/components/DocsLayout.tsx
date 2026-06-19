import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"

import { useI18n } from "@/hooks/useI18n"
import { guides, guidesCopy } from "@/lib/guides"
import { cn } from "@/lib/utils"

export type DocsTocItem = { id: string; label: string }

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block rounded px-2 py-1 text-sm transition-colors",
    isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
  )

const groupLabelClass = "px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"

export function DocsLayout({ toc, children }: { toc?: DocsTocItem[]; children: ReactNode }) {
  const { language, pathFor } = useI18n()
  const guidesText = guidesCopy[language]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6 lg:flex-row">
      <aside className="lg:sticky lg:top-4 lg:h-fit lg:w-56 lg:shrink-0">
        <nav className="space-y-4" aria-label={guidesText.heading}>
          <div className="space-y-1">
            <p className={groupLabelClass}>{guidesText.overview}</p>
            <a href="https://docs.convertexcel.net/docs" className="text-muted-foreground hover:text-foreground block rounded px-2 py-1 text-sm transition-colors">
              converTeXcel Docs
            </a>
          </div>
          <div className="space-y-1">
            <p className={groupLabelClass}>{guidesText.heading}</p>
            {guides.map((guide) => (
              <NavLink key={guide.slug} to={pathFor(`/guides/${guide.slug}`)} className={linkClass}>
                {guide.title[language]}
              </NavLink>
            ))}
          </div>
          {toc && toc.length > 0 && (
            <div className="hidden space-y-1 lg:block">
              <p className={groupLabelClass}>{guidesText.onThisPage}</p>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-muted-foreground hover:text-foreground block rounded px-2 py-1 text-sm transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </nav>
      </aside>
      <div className="min-w-0 max-w-3xl flex-1 space-y-6">{children}</div>
    </div>
  )
}
