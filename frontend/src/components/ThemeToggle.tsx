import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={label}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
