import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import { useTheme } from "@/hooks/useTheme"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const label = theme === "dark" ? t.theme.light : t.theme.dark

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={label}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
