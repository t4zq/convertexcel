import { NavLink } from "react-router-dom"

import logo from "@/assets/logo.png"
import logoDark from "@/assets/logo-dark.png"
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"

const TOOLS = [
  { to: "/", label: "変換", sub: "LaTeX / CSV", end: true },
]

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <NavLink to="/" className="shrink-0" aria-label="converTeXcel">
          <img src={logo} alt="converTeXcel" className="h-9 w-auto dark:hidden" />
          <img src={logoDark} alt="converTeXcel" className="hidden h-9 w-auto dark:block" />
        </NavLink>
        <nav className="flex flex-1 flex-wrap items-center gap-2" aria-label="ツール切替">
          {TOOLS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )
              }
            >
              <span className="block font-medium">{t.label}</span>
              <span className="block text-xs opacity-80">{t.sub}</span>
            </NavLink>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/privacy"
              className={({ isActive }) =>
                cn(
                  "text-sm underline-offset-4 hover:underline",
                  isActive ? "font-medium" : "text-muted-foreground"
                )
              }
            >
              Privacy
            </NavLink>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
