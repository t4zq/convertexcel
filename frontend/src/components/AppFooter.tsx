import { NavLink } from "react-router-dom"

import { useI18n } from "@/hooks/useI18n"
import { cn } from "@/lib/utils"

export function AppFooter() {
  const { t, pathFor } = useI18n()

  const links = [
    { to: pathFor("/docs"), label: t.nav.docs },
    { to: pathFor("/updates"), label: t.nav.updates },
    { to: pathFor("/about"), label: t.nav.about },
    { to: pathFor("/contact"), label: t.nav.contact },
    { to: pathFor("/privacy"), label: t.nav.privacy },
  ]

  return (
    <footer className="mt-8 border-t px-4 pt-6 pb-10 sm:px-6">
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label={t.nav.aria}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            viewTransition
            className={({ isActive }) =>
              cn(
                "text-sm underline-offset-4 hover:underline",
                isActive ? "font-medium" : "text-muted-foreground"
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <p className="text-muted-foreground mt-4 text-xs">
        © {new Date().getFullYear()} converTeXcel
      </p>
    </footer>
  )
}
