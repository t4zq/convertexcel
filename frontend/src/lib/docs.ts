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
    id: "graph-templates",
    heading: {
      ja: "グラフテンプレート",
      en: "Graph templates",
      zh: "图表模板",
      "zh-Hant": "圖表範本",
      es: "Plantillas de gráficos",
      de: "Diagrammvorlagen",
    },
    paragraphs: {
      ja: [
        "グラフ設定からボード線図モードを使えます。frequency [Hz] と gain [dB] がある場合、または frequency [Hz], Vin [V], Vout [V] がある場合に、周波数軸を対数にしたボード線図向けのグラフを生成できます。",
        "Vin [V] と Vout [V] からは 20 log10(Vout / Vin) で gain [dB] を計算します。phase [deg] があれば位相として使い、delay [s] または delay [ms] があれば -360 f delay で phase [deg] を計算します。",
        "折れ線近似をオンにすると、低周波側の利得から -3 dB となる遮断周波数 fc を推定し、振幅は fc 以降 -20 dB/dec、位相は 0.1fc, fc, 10fc を 0°, -45°, -90° とする折れ線を重ねます。",
        "自動検出で足りない場合は、グラフ設定のボード線図モードをオンにして、周波数・入力電圧・出力電圧・ゲイン・位相・遅延時間の列を手動で選べます。",
      ],
      en: [
        "Use Bode plot mode from the graph settings. If your data has frequency [Hz] and gain [dB], or frequency [Hz], Vin [V], and Vout [V], converTeXcel can generate a Bode-style graph with a logarithmic frequency axis.",
        "When Vin [V] and Vout [V] are selected, gain [dB] is computed as 20 log10(Vout / Vin). phase [deg] is used directly when present; delay [s] or delay [ms] is converted to phase [deg] with -360 f delay.",
        "When asymptotic approximation is enabled, the cutoff frequency fc is estimated at -3 dB from the low-frequency gain. The gain line stays flat before fc and falls at -20 dB/dec after fc; the phase line uses 0.1fc, fc, and 10fc as 0°, -45°, and -90°.",
        "When auto-detection is not enough, turn on Bode plot mode in the graph settings and choose the frequency, input voltage, output voltage, gain, phase, and delay columns manually.",
      ],
      zh: [
        "可以在图表设置中使用 Bode 图模式。数据包含 frequency [Hz] 和 gain [dB]，或包含 frequency [Hz]、Vin [V]、Vout [V] 时，可以生成频率轴为对数轴的 Bode 图。",
        "选择 Vin [V] 和 Vout [V] 时，会用 20 log10(Vout / Vin) 计算 gain [dB]。如果有 phase [deg] 会直接作为相位；如果有 delay [s] 或 delay [ms]，会用 -360 f delay 转换为 phase [deg]。",
        "开启折线近似后，会根据低频增益估计 -3 dB 的截止频率 fc；幅度在 fc 前保持平坦、fc 后按 -20 dB/dec 下降，相位用 0.1fc、fc、10fc 对应 0°、-45°、-90° 的折线表示。",
        "如果自动检测不够，可以在图表设置中开启 Bode 图模式，手动选择频率、输入电压、输出电压、增益、相位和延迟列。",
      ],
      "zh-Hant": [
        "可以在圖表設定中使用 Bode 圖模式。資料包含 frequency [Hz] 和 gain [dB]，或包含 frequency [Hz]、Vin [V]、Vout [V] 時，可以產生頻率軸為對數軸的 Bode 圖。",
        "選擇 Vin [V] 和 Vout [V] 時，會用 20 log10(Vout / Vin) 計算 gain [dB]。如果有 phase [deg] 會直接作為相位；如果有 delay [s] 或 delay [ms]，會用 -360 f delay 轉換為 phase [deg]。",
        "開啟折線近似後，會根據低頻增益估計 -3 dB 的截止頻率 fc；振幅在 fc 前保持平坦、fc 後以 -20 dB/dec 下降，相位用 0.1fc、fc、10fc 對應 0°、-45°、-90° 的折線表示。",
        "如果自動偵測不夠，可以在圖表設定中開啟 Bode 圖模式，手動選擇頻率、輸入電壓、輸出電壓、增益、相位和延遲欄位。",
      ],
      es: [
        "Usa el modo Bode desde los ajustes de gráfico. Si los datos tienen frequency [Hz] y gain [dB], o frequency [Hz], Vin [V] y Vout [V], converTeXcel puede generar un gráfico Bode con eje de frecuencia logarítmico.",
        "Al seleccionar Vin [V] y Vout [V], gain [dB] se calcula como 20 log10(Vout / Vin). phase [deg] se usa directamente si existe; delay [s] o delay [ms] se convierte a phase [deg] con -360 f delay.",
        "Al activar la aproximación asintótica, fc se estima en -3 dB respecto de la ganancia de baja frecuencia. La magnitud es plana antes de fc y cae a -20 dB/dec después de fc; la fase usa 0.1fc, fc y 10fc como 0°, -45° y -90°.",
        "Si la detección automática no basta, activa el modo Bode en los ajustes de gráfico y elige manualmente las columnas de frecuencia, voltaje de entrada, voltaje de salida, ganancia, fase y retardo.",
      ],
      de: [
        "Nutze den Bode-Diagramm-Modus in den Diagrammeinstellungen. Wenn die Daten frequency [Hz] und gain [dB] oder frequency [Hz], Vin [V] und Vout [V] enthalten, kann converTeXcel ein Bode-Diagramm mit logarithmischer Frequenzachse erzeugen.",
        "Bei ausgewählten Spalten Vin [V] und Vout [V] wird gain [dB] als 20 log10(Vout / Vin) berechnet. phase [deg] wird direkt verwendet; delay [s] oder delay [ms] wird mit -360 f delay in phase [deg] umgerechnet.",
        "Wenn die asymptotische Näherung aktiv ist, wird die Grenzfrequenz fc bei -3 dB gegenüber der Niederfrequenz-Verstärkung geschätzt. Die Amplitude bleibt vor fc flach und fällt danach mit -20 dB/dec; die Phase nutzt 0.1fc, fc und 10fc als 0°, -45° und -90°.",
        "Wenn die automatische Erkennung nicht ausreicht, aktiviere den Bode-Diagramm-Modus und wähle Frequenz, Eingangsspannung, Ausgangsspannung, Verstärkung, Phase und Verzögerung manuell aus.",
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
