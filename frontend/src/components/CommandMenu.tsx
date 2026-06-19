import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen,
  FileSpreadsheet,
  House,
  Mail,
  Newspaper,
  ScrollText,
  Shield,
  type LucideIcon,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useI18n } from "@/hooks/useI18n"

// `g`（または ⌘K / Ctrl+K）で shadcn の Command パレットを開き、ページ遷移する。
// 入力欄やコードエディタにフォーカス中・修飾キー併用時は `g` では開かない。

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (target.isContentEditable) return true
  return Boolean(target.closest(".cm-editor, .monaco-editor"))
}

export function CommandMenu() {
  const navigate = useNavigate()
  const { pathFor, language, t } = useI18n()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // ⌘K / Ctrl+K はどこでもトグル（パレットの定番）。
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "g") return
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      setOpen(true)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const destinations: Array<{ path: string; label: string; icon: LucideIcon }> = [
    { path: "/", label: t.nav.tool, icon: House },
    { path: "/docs", label: t.nav.docs, icon: BookOpen },
    { path: "/excel-addin", label: t.nav.addin, icon: FileSpreadsheet },
    { path: "/contact", label: t.nav.contact, icon: Mail },
    { path: "/updates", label: t.nav.updates, icon: Newspaper },
    { path: "/privacy", label: t.nav.privacy, icon: Shield },
    // ja のルートにしか存在しないページ。
    ...(language === "ja"
      ? [
          { path: "/terms", label: "利用規約", icon: ScrollText },
        ]
      : []),
  ]

  const go = (path: string) => {
    setOpen(false)
    if (path === "/docs") {
      window.location.assign("https://docs.convertexcel.net/docs")
      return
    }
    navigate(pathFor(path))
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t.command.pages}
      description={t.command.placeholder}
    >
      <CommandInput placeholder={t.command.placeholder} />
      <CommandList>
        <CommandEmpty>{t.command.empty}</CommandEmpty>
        <CommandGroup heading={t.command.pages}>
          {destinations.map(({ path, label, icon: Icon }) => (
            <CommandItem key={path} value={`${label} ${path}`} onSelect={() => go(path)}>
              <Icon />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="text-muted-foreground border-t px-3 py-2 text-xs">
        {t.command.hint}
      </div>
    </CommandDialog>
  )
}
