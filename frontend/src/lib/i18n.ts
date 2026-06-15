export const SUPPORTED_LANGUAGES = ["ja", "en", "zh", "zh-Hant", "ko", "es", "de"] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = "ja"

export const LANGUAGE_NAMES: Record<Language, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
  "zh-Hant": "繁體中文",
  ko: "한국어",
  es: "Español",
  de: "Deutsch",
}

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  ja: "JA",
  en: "EN",
  zh: "简",
  "zh-Hant": "繁",
  ko: "KO",
  es: "ES",
  de: "DE",
}

export const LANGUAGE_PATH_SEGMENTS: Record<Language, string> = {
  ja: "",
  en: "en",
  zh: "zh",
  "zh-Hant": "zh-hant",
  ko: "ko",
  es: "es",
  de: "de",
}

const LANGUAGE_PREFIX_PATTERN = new RegExp(
  `^/(${SUPPORTED_LANGUAGES.map((language) => LANGUAGE_PATH_SEGMENTS[language]).filter(Boolean).join("|")})(?=/|$)`,
  "i",
)

export function isLanguage(value: string | null): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
}

export function languageFromPath(pathname: string): Language {
  const match = pathname.match(LANGUAGE_PREFIX_PATTERN)
  const prefix = match?.[1] ?? null
  return (
    SUPPORTED_LANGUAGES.find(
      (language) => LANGUAGE_PATH_SEGMENTS[language].toLowerCase() === prefix?.toLowerCase(),
    ) ?? DEFAULT_LANGUAGE
  )
}

export function localizePath(pathname: string, language: Language) {
  const withoutLang = pathname.replace(LANGUAGE_PREFIX_PATTERN, "") || "/"
  if (language === "ja") return withoutLang
  const prefix = LANGUAGE_PATH_SEGMENTS[language]
  return withoutLang === "/" ? `/${prefix}` : `/${prefix}${withoutLang}`
}

export function stripLanguagePrefix(pathname: string) {
  return pathname.replace(LANGUAGE_PREFIX_PATTERN, "") || "/"
}

export function localizedSiteUrls(origin: string, path: string) {
  const base = origin.replace(/\/$/, "")
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => {
      const localizedPath = localizePath(path, language)
      return [language, `${base}${localizedPath}`]
    }),
  ) as Record<Language, string>
}

export const seo = {
  ja: {
    convertTitle: "converTeXcel - Excel表をLaTeXの表・グラフ・gnuplotへ変換",
    convertDescription:
      "Excelやスプレッドシートの表を貼り付けるだけで、LaTeXの表、レポート用グラフ、gnuplotを生成。TeXやgnuplotを普段使わない人でも確認しながら整えられる無料変換ツールです。",
    privacyTitle: "プライバシーポリシー - converTeXcel",
    privacyDescription:
      "converTeXcelの入力データ、localStorage、共有リンク、PDFプレビュー時の外部サービス利用、gnuplotのブラウザ内描画について説明します。",
    features: [
      "Excelやスプレッドシートの表をLaTeXの表へ変換",
      "CSVを書き出し",
      "LaTeXで使えるグラフコードを生成",
      "gnuplotを生成しブラウザ内でグラフをプレビュー",
      "texlive.netでPDFプレビューを確認",
    ],
  },
  en: {
    convertTitle: "converTeXcel - Convert Excel Tables to LaTeX, CSV, TikZ, and gnuplot",
    convertDescription:
      "Paste an Excel or spreadsheet table and generate LaTeX tables, CSV, TikZ/PGFPlots, and gnuplot code. A free converter with PDF preview and in-browser graph rendering.",
    privacyTitle: "Privacy Policy - converTeXcel",
    privacyDescription:
      "Learn how converTeXcel handles input data, localStorage, share links, external services used for PDF previews, and in-browser gnuplot rendering.",
    features: [
      "Convert Excel and spreadsheet tables to LaTeX tables",
      "Export CSV",
      "Generate TikZ/PGFPlots code",
      "Generate gnuplot scripts and preview graphs in the browser",
      "Preview PDFs through texlive.net",
    ],
  },
  zh: {
    convertTitle: "converTeXcel - 将 Excel 表格转换为 LaTeX、CSV、TikZ 和 gnuplot",
    convertDescription:
      "粘贴 Excel 或电子表格数据，即可生成 LaTeX 表格、CSV、TikZ/PGFPlots 和 gnuplot 代码。支持 PDF 预览和浏览器内图表渲染的免费转换工具。",
    privacyTitle: "隐私政策 - converTeXcel",
    privacyDescription:
      "了解 converTeXcel 如何处理输入数据、localStorage、共享链接、PDF 预览所使用的外部服务，以及 gnuplot 的浏览器内渲染。",
    features: [
      "将 Excel 和电子表格表格转换为 LaTeX 表格",
      "导出 CSV",
      "生成 TikZ/PGFPlots 代码",
      "生成 gnuplot 脚本并在浏览器中预览图表",
      "通过 texlive.net 预览 PDF",
    ],
  },
  "zh-Hant": {
    convertTitle: "converTeXcel - 將 Excel 表格轉換為 LaTeX、CSV、TikZ 和 gnuplot",
    convertDescription:
      "貼上 Excel 或試算表資料，即可產生 LaTeX 表格、CSV、TikZ/PGFPlots 和 gnuplot 程式碼。這是一個支援 PDF 預覽與瀏覽器內圖表算繪的免費轉換工具。",
    privacyTitle: "隱私權政策 - converTeXcel",
    privacyDescription:
      "了解 converTeXcel 如何處理輸入資料、localStorage、分享連結、PDF 預覽所使用的外部服務，以及 gnuplot 的瀏覽器內算繪。",
    features: [
      "將 Excel 和試算表表格轉換為 LaTeX 表格",
      "匯出 CSV",
      "產生 TikZ/PGFPlots 程式碼",
      "產生 gnuplot 指令稿並在瀏覽器中預覽圖表",
      "透過 texlive.net 預覽 PDF",
    ],
  },
  ko: {
    convertTitle: "converTeXcel - Excel 표를 LaTeX, CSV, TikZ, gnuplot로 변환",
    convertDescription:
      "Excel 또는 스프레드시트 표를 붙여 넣으면 LaTeX 표, CSV, TikZ/PGFPlots, gnuplot 코드를 생성합니다. PDF 미리보기와 브라우저 내 그래프 렌더링을 지원하는 무료 변환 도구입니다.",
    privacyTitle: "개인정보 처리방침 - converTeXcel",
    privacyDescription:
      "converTeXcel이 입력 데이터, localStorage, 공유 링크, PDF 미리보기에 사용하는 외부 서비스, gnuplot의 브라우저 내 렌더링을 어떻게 처리하는지 설명합니다.",
    features: [
      "Excel 및 스프레드시트 표를 LaTeX 표로 변환",
      "CSV 내보내기",
      "TikZ/PGFPlots 코드 생성",
      "gnuplot 스크립트를 생성하고 브라우저에서 그래프 미리보기",
      "texlive.net으로 PDF 미리보기",
    ],
  },
  es: {
    convertTitle: "converTeXcel - Convierte tablas de Excel a LaTeX, CSV, TikZ y gnuplot",
    convertDescription:
      "Pega una tabla de Excel u hoja de cálculo y genera tablas LaTeX, CSV, código TikZ/PGFPlots y gnuplot. Un conversor gratuito con vista previa PDF y renderizado de gráficos en el navegador.",
    privacyTitle: "Política de privacidad - converTeXcel",
    privacyDescription:
      "Conoce cómo converTeXcel gestiona los datos de entrada, localStorage, enlaces compartidos, los servicios externos usados para la vista previa PDF y el renderizado de gnuplot en el navegador.",
    features: [
      "Convertir tablas de Excel y hojas de cálculo a tablas LaTeX",
      "Exportar CSV",
      "Generar código TikZ/PGFPlots",
      "Generar scripts de gnuplot y previsualizar gráficos en el navegador",
      "Previsualizar PDF con texlive.net",
    ],
  },
  de: {
    convertTitle: "converTeXcel - Excel-Tabellen in LaTeX, CSV, TikZ und gnuplot umwandeln",
    convertDescription:
      "Füge eine Excel- oder Tabellenkalkulations-Tabelle ein und erzeuge LaTeX-Tabellen, CSV, TikZ/PGFPlots- und gnuplot-Code. Ein kostenloser Konverter mit PDF-Vorschau und Diagramm-Rendering im Browser.",
    privacyTitle: "Datenschutzerklärung - converTeXcel",
    privacyDescription:
      "Erfahre, wie converTeXcel Eingabedaten, localStorage, Freigabelinks, externe Dienste für PDF-Vorschauen und das gnuplot-Rendering im Browser behandelt.",
    features: [
      "Excel- und Tabellenkalkulations-Tabellen in LaTeX-Tabellen umwandeln",
      "CSV exportieren",
      "TikZ/PGFPlots-Code erzeugen",
      "gnuplot-Skripte erzeugen und Diagramme im Browser vorschauen",
      "PDFs über texlive.net prüfen",
    ],
  },
} as const
