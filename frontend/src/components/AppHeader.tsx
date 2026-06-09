import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

const TOOLS = [
  { to: "/", label: "変換", sub: "LaTeX / CSV", end: true },
  { to: "/stats", label: "統計探索", sub: "検定 / fit" },
]

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
        <NavLink to="/" className="text-lg font-semibold tracking-tight">
          conver<span className="text-[#107c41]">TeX</span>cel
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
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              cn(
                "ml-auto text-sm underline-offset-4 hover:underline",
                isActive ? "font-medium" : "text-muted-foreground"
              )
            }
          >
            Privacy
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
