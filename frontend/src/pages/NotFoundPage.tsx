import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/useI18n"
import { useSeo } from "@/hooks/useSeo"
import { localizedSiteUrls } from "@/lib/i18n"

const SITE_URL = "https://convertexcel.net/"
const homeUrls = localizedSiteUrls(SITE_URL, "/")

const copy = {
  ja: {
    title: "ページが見つかりません - converTeXcel",
    description: "指定されたページは見つかりませんでした。",
    heading: "ページが見つかりません",
    body: "URLを確認するか、変換ツールへ戻ってください。",
    action: "変換に戻る",
  },
  en: {
    title: "Page not found - converTeXcel",
    description: "The requested page could not be found.",
    heading: "Page not found",
    body: "Check the URL or return to the converter.",
    action: "Back to converter",
  },
  zh: {
    title: "页面未找到 - converTeXcel",
    description: "找不到请求的页面。",
    heading: "页面未找到",
    body: "请检查 URL，或返回转换工具。",
    action: "返回转换工具",
  },
  "zh-Hant": {
    title: "找不到頁面 - converTeXcel",
    description: "找不到要求的頁面。",
    heading: "找不到頁面",
    body: "請檢查 URL，或返回轉換工具。",
    action: "返回轉換工具",
  },
  ko: {
    title: "페이지를 찾을 수 없습니다 - converTeXcel",
    description: "요청한 페이지를 찾을 수 없습니다.",
    heading: "페이지를 찾을 수 없습니다",
    body: "URL을 확인하거나 변환기로 돌아가세요.",
    action: "변환기로 돌아가기",
  },
  es: {
    title: "Página no encontrada - converTeXcel",
    description: "No se pudo encontrar la página solicitada.",
    heading: "Página no encontrada",
    body: "Comprueba la URL o vuelve al conversor.",
    action: "Volver al conversor",
  },
  de: {
    title: "Seite nicht gefunden - converTeXcel",
    description: "Die angeforderte Seite wurde nicht gefunden.",
    heading: "Seite nicht gefunden",
    body: "Prüfe die URL oder kehre zum Konverter zurück.",
    action: "Zurück zum Konverter",
  },
} as const

export default function NotFoundPage() {
  const { language, pathFor } = useI18n()
  const text = copy[language]

  useSeo({
    title: text.title,
    description: text.description,
    canonical: homeUrls[language],
    language,
    alternates: {
      ...homeUrls,
      "x-default": homeUrls.ja,
    },
    robots: "noindex,follow",
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 p-6">
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{text.heading}</h1>
      <p className="text-muted-foreground text-sm">{text.body}</p>
      <Button asChild>
        <Link to={pathFor("/")}>{text.action}</Link>
      </Button>
    </div>
  )
}
