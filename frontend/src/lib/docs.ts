import type { Language } from "@/lib/i18n"

type LocalizedText = Record<Language, string>
type LocalizedList = Record<Language, string[]>

export type DocsSection = {
  id: string
  heading: LocalizedText
  paragraphs?: LocalizedList
  steps?: LocalizedList
  bullets?: LocalizedList
  link?: { to: string; label: LocalizedText }
}

export const docsCopy: Record<
  Language,
  {
    eyebrow: string
    title: string
    intro: string
    back: string
    seoTitle: string
    seoDescription: string
  }
> = {
  ja: {
    eyebrow: "Docs",
    title: "使い方ガイド",
    intro: "converTeXcel を初めて使う方向けに、基本的な流れと出力形式を紹介します。",
    back: "変換に戻る",
    seoTitle: "使い方ガイド - converTeXcel",
    seoDescription:
      "converTeXcel の使い方ガイド。Excel やスプレッドシートの表を貼り付けて、LaTeX 表・CSV・TikZ・gnuplot に変換する基本的な流れを紹介します。",
  },
  en: {
    eyebrow: "Docs",
    title: "Getting started",
    intro: "A quick guide to the basic flow and output formats for people new to converTeXcel.",
    back: "Back to converter",
    seoTitle: "Getting started - converTeXcel",
    seoDescription:
      "A getting-started guide for converTeXcel: paste an Excel or spreadsheet table and convert it to LaTeX tables, CSV, TikZ, and gnuplot.",
  },
  zh: {
    eyebrow: "Docs",
    title: "使用指南",
    intro: "面向第一次使用 converTeXcel 的用户，介绍基本流程和输出格式。",
    back: "返回转换工具",
    seoTitle: "使用指南 - converTeXcel",
    seoDescription:
      "converTeXcel 使用指南：粘贴 Excel 或电子表格数据，转换为 LaTeX 表格、CSV、TikZ 和 gnuplot 的基本流程。",
  },
  "zh-Hant": {
    eyebrow: "Docs",
    title: "使用指南",
    intro: "為第一次使用 converTeXcel 的使用者，介紹基本流程與輸出格式。",
    back: "返回轉換工具",
    seoTitle: "使用指南 - converTeXcel",
    seoDescription:
      "converTeXcel 使用指南：貼上 Excel 或試算表資料，轉換為 LaTeX 表格、CSV、TikZ 與 gnuplot 的基本流程。",
  },
  es: {
    eyebrow: "Docs",
    title: "Primeros pasos",
    intro: "Una guía rápida del flujo básico y los formatos de salida para quienes empiezan con converTeXcel.",
    back: "Volver al conversor",
    seoTitle: "Primeros pasos - converTeXcel",
    seoDescription:
      "Guía de primeros pasos de converTeXcel: pega una tabla de Excel u hoja de cálculo y conviértela a tablas LaTeX, CSV, TikZ y gnuplot.",
  },
  de: {
    eyebrow: "Docs",
    title: "Erste Schritte",
    intro: "Eine kurze Anleitung zum grundlegenden Ablauf und zu den Ausgabeformaten für Einsteiger in converTeXcel.",
    back: "Zurück zum Konverter",
    seoTitle: "Erste Schritte - converTeXcel",
    seoDescription:
      "Eine Einstiegsanleitung für converTeXcel: Füge eine Excel- oder Tabellenkalkulations-Tabelle ein und wandle sie in LaTeX-Tabellen, CSV, TikZ und gnuplot um.",
  },
}

export const docsSections: DocsSection[] = [
  {
    id: "what",
    heading: {
      ja: "converTeXcel とは",
      en: "What is converTeXcel?",
      zh: "什么是 converTeXcel？",
      "zh-Hant": "什麼是 converTeXcel？",
      es: "¿Qué es converTeXcel?",
      de: "Was ist converTeXcel?",
    },
    paragraphs: {
      ja: [
        "Excel やスプレッドシートの表を、LaTeX の表・グラフ・gnuplot などに変換する無料ツールです。",
        "TeX や gnuplot を普段使わない人でも、プレビューで確認しながら整えられます。",
      ],
      en: [
        "A free tool that converts Excel and spreadsheet tables into LaTeX tables, graphs, gnuplot, and more.",
        "Even if you don't usually work with TeX or gnuplot, you can adjust things while checking the preview.",
      ],
      zh: [
        "一个将 Excel 和电子表格表格转换为 LaTeX 表格、图表、gnuplot 等的免费工具。",
        "即使平时不使用 TeX 或 gnuplot，也可以一边查看预览一边调整。",
      ],
      "zh-Hant": [
        "一個將 Excel 和試算表表格轉換為 LaTeX 表格、圖表、gnuplot 等的免費工具。",
        "即使平時不使用 TeX 或 gnuplot，也可以一邊查看預覽一邊調整。",
      ],
      es: [
        "Una herramienta gratuita que convierte tablas de Excel y hojas de cálculo en tablas LaTeX, gráficos, gnuplot y más.",
        "Aunque no trabajes habitualmente con TeX o gnuplot, puedes ajustar todo mientras revisas la vista previa.",
      ],
      de: [
        "Ein kostenloses Werkzeug, das Excel- und Tabellenkalkulations-Tabellen in LaTeX-Tabellen, Diagramme, gnuplot und mehr umwandelt.",
        "Auch wer sonst nicht mit TeX oder gnuplot arbeitet, kann alles anhand der Vorschau anpassen.",
      ],
    },
  },
  {
    id: "quick-start",
    heading: {
      ja: "クイックスタート",
      en: "Quick start",
      zh: "快速开始",
      "zh-Hant": "快速開始",
      es: "Inicio rápido",
      de: "Schnellstart",
    },
    steps: {
      ja: [
        "Excel やスプレッドシートで表を選択してコピーします。",
        "入力欄に貼り付けると、自動でプレビューが表示されます。",
        "出力形式（LaTeX 表・CSV・TikZ/PGFPlots・gnuplot）を選びます。",
        "有効数字や単位（siunitx）などの設定を必要に応じて調整します。",
        "PDF プレビューで仕上がりを確認します。",
        "出力をコピー、またはダウンロードしてレポートに貼り付けます。",
      ],
      en: [
        "Select and copy a table in Excel or a spreadsheet.",
        "Paste it into the input area, and a preview appears automatically.",
        "Choose an output format (LaTeX table, CSV, TikZ/PGFPlots, or gnuplot).",
        "Adjust settings such as significant figures and units (siunitx) as needed.",
        "Check the result in the PDF preview.",
        "Copy or download the output and paste it into your report.",
      ],
      zh: [
        "在 Excel 或电子表格中选择并复制表格。",
        "粘贴到输入区后会自动显示预览。",
        "选择输出格式（LaTeX 表格、CSV、TikZ/PGFPlots、gnuplot）。",
        "根据需要调整有效数字、单位（siunitx）等设置。",
        "在 PDF 预览中确认效果。",
        "复制或下载输出，并粘贴到报告中。",
      ],
      "zh-Hant": [
        "在 Excel 或試算表中選擇並複製表格。",
        "貼上到輸入區後會自動顯示預覽。",
        "選擇輸出格式（LaTeX 表格、CSV、TikZ/PGFPlots、gnuplot）。",
        "視需要調整有效數字、單位（siunitx）等設定。",
        "在 PDF 預覽中確認效果。",
        "複製或下載輸出，並貼上到報告中。",
      ],
      es: [
        "Selecciona y copia una tabla en Excel o una hoja de cálculo.",
        "Pégala en el área de entrada y la vista previa aparece automáticamente.",
        "Elige un formato de salida (tabla LaTeX, CSV, TikZ/PGFPlots o gnuplot).",
        "Ajusta opciones como cifras significativas y unidades (siunitx) según necesites.",
        "Revisa el resultado en la vista previa de PDF.",
        "Copia o descarga la salida y pégala en tu informe.",
      ],
      de: [
        "Wähle und kopiere eine Tabelle in Excel oder einer Tabellenkalkulation.",
        "Füge sie in den Eingabebereich ein – eine Vorschau erscheint automatisch.",
        "Wähle ein Ausgabeformat (LaTeX-Tabelle, CSV, TikZ/PGFPlots oder gnuplot).",
        "Passe bei Bedarf Einstellungen wie signifikante Stellen und Einheiten (siunitx) an.",
        "Prüfe das Ergebnis in der PDF-Vorschau.",
        "Kopiere oder lade die Ausgabe herunter und füge sie in deinen Bericht ein.",
      ],
    },
  },
  {
    id: "formats",
    heading: {
      ja: "出力形式",
      en: "Output formats",
      zh: "输出格式",
      "zh-Hant": "輸出格式",
      es: "Formatos de salida",
      de: "Ausgabeformate",
    },
    bullets: {
      ja: [
        "LaTeX の表（booktabs 対応）",
        "CSV",
        "TikZ / PGFPlots のグラフコード",
        "gnuplot スクリプト（ブラウザ内でグラフをプレビュー）",
      ],
      en: [
        "LaTeX tables (booktabs supported)",
        "CSV",
        "TikZ / PGFPlots graph code",
        "gnuplot scripts (preview the graph in the browser)",
      ],
      zh: [
        "LaTeX 表格（支持 booktabs）",
        "CSV",
        "TikZ / PGFPlots 图表代码",
        "gnuplot 脚本（在浏览器中预览图表）",
      ],
      "zh-Hant": [
        "LaTeX 表格（支援 booktabs）",
        "CSV",
        "TikZ / PGFPlots 圖表程式碼",
        "gnuplot 指令稿（在瀏覽器中預覽圖表）",
      ],
      es: [
        "Tablas LaTeX (compatible con booktabs)",
        "CSV",
        "Código de gráficos TikZ / PGFPlots",
        "Scripts de gnuplot (vista previa del gráfico en el navegador)",
      ],
      de: [
        "LaTeX-Tabellen (booktabs wird unterstützt)",
        "CSV",
        "TikZ / PGFPlots-Diagrammcode",
        "gnuplot-Skripte (Diagrammvorschau im Browser)",
      ],
    },
  },
  {
    id: "numbers",
    heading: {
      ja: "数値の整え方",
      en: "Formatting numbers",
      zh: "数值的整理",
      "zh-Hant": "數值的整理",
      es: "Dar formato a los números",
      de: "Zahlen formatieren",
    },
    paragraphs: {
      ja: [
        "有効数字はドロップダウンで選べます。",
        "単位や桁揃えは siunitx で整えられます。",
      ],
      en: [
        "Pick significant figures from a dropdown.",
        "Align units and digits with siunitx.",
      ],
      zh: [
        "可以通过下拉菜单选择有效数字。",
        "可以用 siunitx 整理单位和对齐。",
      ],
      "zh-Hant": [
        "可以透過下拉選單選擇有效數字。",
        "可以用 siunitx 整理單位與對齊。",
      ],
      es: [
        "Elige las cifras significativas en un menú desplegable.",
        "Alinea unidades y dígitos con siunitx.",
      ],
      de: [
        "Wähle signifikante Stellen über ein Dropdown.",
        "Richte Einheiten und Ziffern mit siunitx aus.",
      ],
    },
  },
  {
    id: "addin",
    heading: {
      ja: "Excel アドイン",
      en: "Excel add-in",
      zh: "Excel 加载项",
      "zh-Hant": "Excel 增益集",
      es: "Complemento de Excel",
      de: "Excel-Add-In",
    },
    paragraphs: {
      ja: [
        "Excel 上で範囲を選んで、その場で変換できるアドインも用意しています。",
        "Ctrl で選んだ非連続の列も読み込めます。",
      ],
      en: [
        "There's also an add-in that lets you select a range in Excel and convert it on the spot.",
        "It can read non-contiguous columns selected with Ctrl.",
      ],
      zh: [
        "还提供了一个加载项，可以在 Excel 中选择区域并就地转换。",
        "可以读取用 Ctrl 选择的不连续列。",
      ],
      "zh-Hant": [
        "還提供了一個增益集，可以在 Excel 中選擇範圍並就地轉換。",
        "可以讀取用 Ctrl 選擇的不連續欄位。",
      ],
      es: [
        "También hay un complemento que te permite seleccionar un rango en Excel y convertirlo al momento.",
        "Puede leer columnas no contiguas seleccionadas con Ctrl.",
      ],
      de: [
        "Es gibt auch ein Add-In, mit dem du einen Bereich in Excel auswählen und direkt konvertieren kannst.",
        "Es kann mit Strg ausgewählte, nicht zusammenhängende Spalten lesen.",
      ],
    },
    link: {
      to: "/excel-addin",
      label: {
        ja: "Excel アドインについて",
        en: "About the Excel add-in",
        zh: "了解 Excel 加载项",
        "zh-Hant": "了解 Excel 增益集",
        es: "Sobre el complemento de Excel",
        de: "Über das Excel-Add-In",
      },
    },
  },
  {
    id: "data",
    heading: {
      ja: "データの扱い",
      en: "How your data is handled",
      zh: "数据的处理",
      "zh-Hant": "資料的處理",
      es: "Cómo se tratan tus datos",
      de: "Umgang mit deinen Daten",
    },
    paragraphs: {
      ja: [
        "入力したデータは基本的にブラウザ内で処理されます。詳しくはプライバシーポリシーをご覧ください。",
      ],
      en: [
        "Your input data is processed mainly in the browser. See the privacy policy for details.",
      ],
      zh: [
        "输入的数据主要在浏览器中处理。详情请参阅隐私政策。",
      ],
      "zh-Hant": [
        "輸入的資料主要在瀏覽器中處理。詳情請參閱隱私權政策。",
      ],
      es: [
        "Tus datos de entrada se procesan principalmente en el navegador. Consulta la política de privacidad para más detalles.",
      ],
      de: [
        "Deine Eingabedaten werden hauptsächlich im Browser verarbeitet. Details findest du in der Datenschutzerklärung.",
      ],
    },
    link: {
      to: "/privacy",
      label: {
        ja: "プライバシーポリシー",
        en: "Privacy policy",
        zh: "隐私政策",
        "zh-Hant": "隱私權政策",
        es: "Política de privacidad",
        de: "Datenschutzerklärung",
      },
    },
  },
]
