import { Link } from "react-router-dom"

import { useI18n } from "@/hooks/useI18n"

// 日本語のみ用意したコンテンツページ（root のみにルートあり）。
// 他言語では 404 を避けるため、language === "ja" のときだけ表示する。
const JA_ONLY_LINKS = [
  { to: "/contact", label: "お問い合わせ" },
  { to: "/terms", label: "利用規約" },
]

export function SiteFooter() {
  const { language, t, pathFor } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t bg-background">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-6 pb-12 text-sm text-muted-foreground sm:px-6">
        <Link to={pathFor("/")} className="transition-colors hover:text-foreground hover:underline">
          {t.nav.tool}
        </Link>
        <a href="https://docs.convertexcel.net/docs" className="transition-colors hover:text-foreground hover:underline">
          {t.nav.docs}
        </a>
        {language === "ja" &&
          JA_ONLY_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition-colors hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        <Link to={pathFor("/excel-addin")} className="transition-colors hover:text-foreground hover:underline">
          {t.nav.addin}
        </Link>
        <Link to={pathFor("/privacy")} className="transition-colors hover:text-foreground hover:underline">
          {t.nav.privacy}
        </Link>
        <span className="ml-auto">© {year} converTeXcel</span>
      </nav>
    </footer>
  )
}
