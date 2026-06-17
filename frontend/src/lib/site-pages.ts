import type { Language } from "@/lib/i18n"

type LocalizedText = Record<Language, string>
type LocalizedList = Record<Language, string[]>

export type PageCopy = {
  eyebrow: string
  title: string
  intro: string
  back: string
  seoTitle: string
  seoDescription: string
}

// 公開用の問い合わせアドレス（Cloudflare Email Routing で個人の受信箱へ転送する）。
export const CONTACT_EMAIL = "contact@convertexcel.net"

// 不具合報告の誘導先（GitHub Issues）。
export const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

export const aboutCopy: Record<Language, PageCopy> = {
  ja: {
    eyebrow: "About",
    title: "converTeXcel について",
    intro: "このサイトと開発者についてのご紹介です。",
    back: "変換に戻る",
    seoTitle: "converTeXcel について - converTeXcel",
    seoDescription:
      "converTeXcel は Excel やスプレッドシートの表を LaTeX・CSV・TikZ・gnuplot に変換する無料ツールです。サイトの目的と運営について紹介します。",
  },
  en: {
    eyebrow: "About",
    title: "About converTeXcel",
    intro: "About this site and its developer.",
    back: "Back to converter",
    seoTitle: "About - converTeXcel",
    seoDescription:
      "converTeXcel is a free tool that converts Excel and spreadsheet tables to LaTeX, CSV, TikZ, and gnuplot. Learn about the site's purpose and who runs it.",
  },
  zh: {
    eyebrow: "About",
    title: "关于 converTeXcel",
    intro: "关于本网站及其开发者。",
    back: "返回转换工具",
    seoTitle: "关于 - converTeXcel",
    seoDescription:
      "converTeXcel 是一个将 Excel 和电子表格表格转换为 LaTeX、CSV、TikZ 和 gnuplot 的免费工具。介绍网站的目的与运营。",
  },
  "zh-Hant": {
    eyebrow: "About",
    title: "關於 converTeXcel",
    intro: "關於本網站及其開發者。",
    back: "返回轉換工具",
    seoTitle: "關於 - converTeXcel",
    seoDescription:
      "converTeXcel 是一個將 Excel 和試算表表格轉換為 LaTeX、CSV、TikZ 和 gnuplot 的免費工具。介紹網站的目的與營運。",
  },
  es: {
    eyebrow: "About",
    title: "Acerca de converTeXcel",
    intro: "Sobre este sitio y su desarrollador.",
    back: "Volver al conversor",
    seoTitle: "Acerca de - converTeXcel",
    seoDescription:
      "converTeXcel es una herramienta gratuita que convierte tablas de Excel y hojas de cálculo a LaTeX, CSV, TikZ y gnuplot. Conoce el propósito del sitio y quién lo gestiona.",
  },
  de: {
    eyebrow: "About",
    title: "Über converTeXcel",
    intro: "Über diese Seite und ihren Entwickler.",
    back: "Zurück zum Konverter",
    seoTitle: "Über uns - converTeXcel",
    seoDescription:
      "converTeXcel ist ein kostenloses Werkzeug, das Excel- und Tabellenkalkulations-Tabellen in LaTeX, CSV, TikZ und gnuplot umwandelt. Erfahre mehr über den Zweck der Seite und wer sie betreibt.",
  },
}

export const aboutBody: LocalizedList = {
  ja: [
    "converTeXcel は、Excel やスプレッドシートの表を LaTeX の表・CSV・TikZ・gnuplot に変換する無料のオンラインツールです。",
    "大学のレポートや論文で表やグラフを作る人が、コピー＆ペーストで手早く整えられることを目指しています。インストール不要で、ブラウザだけで使えます。",
    "個人が開発・運営しているサイトです。機能のご要望や不具合のご連絡を歓迎しています。",
  ],
  en: [
    "converTeXcel is a free online tool that converts Excel and spreadsheet tables into LaTeX tables, CSV, TikZ, and gnuplot.",
    "It aims to help people who build tables and graphs for university reports and papers do it quickly by copy and paste. No installation — it runs entirely in the browser.",
    "The site is developed and run by an individual as a personal project. Feature requests and bug reports are always welcome.",
  ],
  zh: [
    "converTeXcel 是一个免费的在线工具，可将 Excel 和电子表格表格转换为 LaTeX 表格、CSV、TikZ 和 gnuplot。",
    "它旨在帮助为大学报告和论文制作表格与图表的人通过复制粘贴快速完成。无需安装，仅在浏览器中即可使用。",
    "本网站由个人开发和运营。欢迎提出功能建议和报告问题。",
  ],
  "zh-Hant": [
    "converTeXcel 是一個免費的線上工具，可將 Excel 和試算表表格轉換為 LaTeX 表格、CSV、TikZ 和 gnuplot。",
    "它旨在幫助為大學報告和論文製作表格與圖表的人透過複製貼上快速完成。無需安裝，僅在瀏覽器中即可使用。",
    "本網站由個人開發與營運。歡迎提出功能建議與回報問題。",
  ],
  es: [
    "converTeXcel es una herramienta en línea gratuita que convierte tablas de Excel y hojas de cálculo en tablas LaTeX, CSV, TikZ y gnuplot.",
    "Su objetivo es ayudar a quienes crean tablas y gráficos para informes y trabajos universitarios a hacerlo rápidamente copiando y pegando. Sin instalación: funciona por completo en el navegador.",
    "El sitio lo desarrolla y mantiene una persona como proyecto personal. Las sugerencias de funciones y los informes de errores son siempre bienvenidos.",
  ],
  de: [
    "converTeXcel ist ein kostenloses Online-Tool, das Excel- und Tabellenkalkulations-Tabellen in LaTeX-Tabellen, CSV, TikZ und gnuplot umwandelt.",
    "Es soll Menschen, die Tabellen und Diagramme für Hochschulberichte und Arbeiten erstellen, helfen, dies schnell per Kopieren und Einfügen zu erledigen. Keine Installation – es läuft vollständig im Browser.",
    "Die Seite wird von einer Einzelperson als persönliches Projekt entwickelt und betrieben. Funktionswünsche und Fehlerberichte sind jederzeit willkommen.",
  ],
}

export const contactCopy: Record<Language, PageCopy> = {
  ja: {
    eyebrow: "Contact",
    title: "お問い合わせ",
    intro: "ご質問・ご要望・不具合のご報告はこちらからお願いします。",
    back: "変換に戻る",
    seoTitle: "お問い合わせ - converTeXcel",
    seoDescription:
      "converTeXcel へのご質問・ご要望・不具合のご報告はこのページからご連絡ください。",
  },
  en: {
    eyebrow: "Contact",
    title: "Contact",
    intro: "Questions, feature requests, and bug reports are welcome.",
    back: "Back to converter",
    seoTitle: "Contact - converTeXcel",
    seoDescription:
      "Get in touch with converTeXcel for questions, feature requests, or bug reports.",
  },
  zh: {
    eyebrow: "Contact",
    title: "联系我们",
    intro: "欢迎提出问题、功能建议或反馈问题。",
    back: "返回转换工具",
    seoTitle: "联系我们 - converTeXcel",
    seoDescription: "如有关于 converTeXcel 的问题、功能建议或问题反馈，请通过此页面联系。",
  },
  "zh-Hant": {
    eyebrow: "Contact",
    title: "聯絡我們",
    intro: "歡迎提出問題、功能建議或回報問題。",
    back: "返回轉換工具",
    seoTitle: "聯絡我們 - converTeXcel",
    seoDescription: "如有關於 converTeXcel 的問題、功能建議或問題回報，請透過此頁面聯絡。",
  },
  es: {
    eyebrow: "Contact",
    title: "Contacto",
    intro: "Las preguntas, sugerencias de funciones e informes de errores son bienvenidos.",
    back: "Volver al conversor",
    seoTitle: "Contacto - converTeXcel",
    seoDescription:
      "Ponte en contacto con converTeXcel para preguntas, sugerencias de funciones o informes de errores.",
  },
  de: {
    eyebrow: "Contact",
    title: "Kontakt",
    intro: "Fragen, Funktionswünsche und Fehlerberichte sind willkommen.",
    back: "Zurück zum Konverter",
    seoTitle: "Kontakt - converTeXcel",
    seoDescription:
      "Kontaktiere converTeXcel bei Fragen, Funktionswünschen oder Fehlerberichten.",
  },
}

export const contactBody: LocalizedText = {
  ja: "下記のメールアドレスまでご連絡ください。できる限り返信しますが、個人運営のため数日いただく場合があります。",
  en: "Please contact us at the email address below. We try to reply, but since the site is run by one person it may take a few days.",
  zh: "请通过下方的电子邮件地址与我们联系。我们会尽量回复，但由于是个人运营，可能需要几天时间。",
  "zh-Hant": "請透過下方的電子郵件地址與我們聯絡。我們會盡量回覆，但由於是個人營運，可能需要幾天時間。",
  es: "Ponte en contacto con nosotros en la dirección de correo de abajo. Intentamos responder, pero como el sitio lo lleva una sola persona, puede tardar unos días.",
  de: "Bitte kontaktiere uns unter der folgenden E-Mail-Adresse. Wir versuchen zu antworten, aber da die Seite von einer Person betrieben wird, kann es einige Tage dauern.",
}

export const contactEmailLabel: LocalizedText = {
  ja: "メールでのお問い合わせ",
  en: "Email",
  zh: "电子邮件",
  "zh-Hant": "電子郵件",
  es: "Correo electrónico",
  de: "E-Mail",
}

export const contactIssuesHeading: LocalizedText = {
  ja: "不具合のご報告",
  en: "Bug reports",
  zh: "问题反馈",
  "zh-Hant": "問題回報",
  es: "Informes de errores",
  de: "Fehlerberichte",
}

export const contactIssuesText: LocalizedText = {
  ja: "不具合のご報告は GitHub の Issues からお願いします。",
  en: "Please report bugs through GitHub Issues.",
  zh: "问题（Bug）请通过 GitHub Issues 报告。",
  "zh-Hant": "問題（Bug）請透過 GitHub Issues 回報。",
  es: "Por favor, informa de los errores a través de GitHub Issues.",
  de: "Bitte melde Fehler über GitHub Issues.",
}

export const contactNote: LocalizedText = {
  ja: "不具合のご報告の際は、お使いのブラウザと、可能であれば入力したデータの例を添えていただけると助かります。",
  en: "When reporting a bug, it helps to include your browser and, if possible, an example of the data you entered.",
  zh: "反馈问题时，请尽量附上您使用的浏览器，以及（如果可以）输入数据的示例。",
  "zh-Hant": "回報問題時，請盡量附上您使用的瀏覽器，以及（如果可以）輸入資料的範例。",
  es: "Al informar de un error, ayuda incluir tu navegador y, si es posible, un ejemplo de los datos que introdujiste.",
  de: "Beim Melden eines Fehlers hilft es, deinen Browser und – wenn möglich – ein Beispiel der eingegebenen Daten anzugeben.",
}
