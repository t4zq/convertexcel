import { NavLink } from "react-router-dom"

import logo from "@/assets/logo-2x.webp"
import logoDark from "@/assets/logo-dark-2x.webp"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useI18n } from "@/hooks/useI18n"
import { LANGUAGE_NAMES, LANGUAGE_SHORT_LABELS, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const { language, setLanguage, t, pathFor } = useI18n()
  const tools = [
    { to: pathFor("/"), label: t.nav.tool, sub: t.nav.toolSub, end: true },
  ]

  return (
    <header className="border-b">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <NavLink to={pathFor("/")} className="shrink-0" aria-label="converTeXcel">
          <img src={logo} alt="converTeXcel" width={209} height={36} className="h-9 w-auto dark:hidden" />
          <img src={logoDark} alt="converTeXcel" width={209} height={36} className="hidden h-9 w-auto dark:block" />
        </NavLink>
        <nav className="flex flex-1 flex-wrap items-center gap-2" aria-label={t.nav.aria}>
          {tools.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )
              }
            >
              <span className="block font-medium">{item.label}</span>
              <span className="block text-xs opacity-80">{item.sub}</span>
            </NavLink>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to={pathFor("/excel-addin")}
              className={({ isActive }) =>
                cn(
                  "text-sm underline-offset-4 hover:underline",
                  isActive ? "font-medium" : "text-muted-foreground"
                )
              }
            >
              {t.nav.addin}
            </NavLink>
            <NavLink
              to={pathFor("/privacy")}
              className={({ isActive }) =>
                cn(
                  "text-sm underline-offset-4 hover:underline",
                  isActive ? "font-medium" : "text-muted-foreground"
                )
              }
            >
              {t.nav.privacy}
            </NavLink>
            <div className="inline-flex rounded-md border bg-muted p-0.5 gap-0.5" aria-label={t.nav.language}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium transition-colors",
                    language === lang
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title={LANGUAGE_NAMES[lang]}
                >
                  {LANGUAGE_SHORT_LABELS[lang]}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
