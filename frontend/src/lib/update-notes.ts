import type { Language } from "@/lib/i18n"

type LocalizedText = Record<Language, string>
type LocalizedList = Record<Language, string[]>

export type UpdateNote = {
  version: string
  date: string
  title: LocalizedText
  summary: LocalizedText
  changes: LocalizedList
}

export const updatesCopy: Record<
  Language,
  {
    eyebrow: string
    title: string
    intro: string
    latest: string
    back: string
    seoTitle: string
    seoDescription: string
  }
> = {
  ja: {
    eyebrow: "Updates",
    title: "アップデート情報",
    intro: "機能更新やPRごとの変更点をここに追記していきます。",
    latest: "最新",
    back: "変換に戻る",
    seoTitle: "アップデート情報 - converTeXcel",
    seoDescription: "converTeXcel の機能更新、Excel アドイン、LaTeX 変換、ローカルデバッグ改善などの変更履歴です。",
  },
  en: {
    eyebrow: "Updates",
    title: "Updates",
    intro: "Feature updates and PR-level changes will be added here over time.",
    latest: "Latest",
    back: "Back to converter",
    seoTitle: "Updates - converTeXcel",
    seoDescription: "Release notes for converTeXcel, including Excel add-in, LaTeX conversion, and local debugging updates.",
  },
  zh: {
    eyebrow: "Updates",
    title: "更新信息",
    intro: "功能更新和每个 PR 的变更会持续记录在这里。",
    latest: "最新",
    back: "返回转换工具",
    seoTitle: "更新信息 - converTeXcel",
    seoDescription: "converTeXcel 的更新记录，包括 Excel 加载项、LaTeX 转换和本地调试改进。",
  },
  "zh-Hant": {
    eyebrow: "Updates",
    title: "更新資訊",
    intro: "功能更新與每個 PR 的變更會持續記錄在這裡。",
    latest: "最新",
    back: "返回轉換工具",
    seoTitle: "更新資訊 - converTeXcel",
    seoDescription: "converTeXcel 的更新紀錄，包括 Excel 增益集、LaTeX 轉換與本機偵錯改善。",
  },
  es: {
    eyebrow: "Updates",
    title: "Novedades",
    intro: "Las mejoras de funciones y los cambios por PR se irán registrando aquí.",
    latest: "Más reciente",
    back: "Volver al conversor",
    seoTitle: "Novedades - converTeXcel",
    seoDescription: "Historial de cambios de converTeXcel, incluido el complemento de Excel, la conversión LaTeX y la depuración local.",
  },
  de: {
    eyebrow: "Updates",
    title: "Updates",
    intro: "Funktionsupdates und Änderungen pro PR werden hier fortlaufend ergänzt.",
    latest: "Neueste",
    back: "Zurück zum Konverter",
    seoTitle: "Updates - converTeXcel",
    seoDescription: "Änderungshistorie für converTeXcel, einschließlich Excel-Add-In, LaTeX-Konvertierung und lokaler Debugging-Verbesserungen.",
  },
}

export const updateNotes: UpdateNote[] = [
  {
    version: "v0.9.0",
    date: "2026-06-16",
    title: {
      ja: "ドキュメントと解説記事を追加",
      en: "Documentation and guide articles",
      zh: "新增文档和解说文章",
      "zh-Hant": "新增文件與解說文章",
      es: "Documentación y artículos de guía",
      de: "Dokumentation und Anleitungsartikel",
    },
    summary: {
      ja: "使い方ガイドと解説記事を wiki 風のレイアウトで追加し、サイト情報・お問い合わせページを整えました。",
      en: "Added a getting-started guide and how-to articles in a wiki-style layout, plus About and Contact pages.",
      zh: "以 wiki 风格的布局新增了使用指南和解说文章，并完善了网站信息和联系页面。",
      "zh-Hant": "以 wiki 風格的版面新增了使用指南與解說文章，並完善了網站資訊與聯絡頁面。",
      es: "Se añadieron una guía de inicio y artículos prácticos con un diseño tipo wiki, además de las páginas Acerca de y Contacto.",
      de: "Eine Einstiegsanleitung und How-to-Artikel im Wiki-Stil hinzugefügt, dazu Seiten für Über uns und Kontakt.",
    },
    changes: {
      ja: [
        "使い方ガイドと、LaTeX の表・siunitx・pgfplots などの解説記事を追加しました。",
        "ドキュメントを左サイドバー付きの wiki 風レイアウトにし、記事間を移動しやすくしました。",
        "サイト情報（About）とお問い合わせ（Contact）ページを追加しました。",
        "不具合の報告を GitHub Issues から行えるようにしました。",
        "各ページへのリンクをフッターに集約しました。",
      ],
      en: [
        "Added a getting-started guide and how-to articles on LaTeX tables, siunitx, pgfplots, and more.",
        "Gave the documentation a wiki-style layout with a left sidebar for moving between articles.",
        "Added About and Contact pages.",
        "Bug reports can now be filed through GitHub Issues.",
        "Consolidated page links into the footer.",
      ],
      zh: [
        "新增了使用指南，以及 LaTeX 表格、siunitx、pgfplots 等解说文章。",
        "将文档改为带左侧边栏的 wiki 风格布局，便于在文章间切换。",
        "新增了网站信息（About）和联系（Contact）页面。",
        "现在可以通过 GitHub Issues 报告问题。",
        "将各页面链接集中到了页脚。",
      ],
      "zh-Hant": [
        "新增了使用指南，以及 LaTeX 表格、siunitx、pgfplots 等解說文章。",
        "將文件改為帶左側邊欄的 wiki 風格版面，便於在文章間切換。",
        "新增了網站資訊（About）與聯絡（Contact）頁面。",
        "現在可以透過 GitHub Issues 回報問題。",
        "將各頁面連結集中到了頁尾。",
      ],
      es: [
        "Se añadieron una guía de inicio y artículos prácticos sobre tablas LaTeX, siunitx, pgfplots y más.",
        "Se dio a la documentación un diseño tipo wiki con barra lateral izquierda para moverse entre artículos.",
        "Se añadieron las páginas Acerca de y Contacto.",
        "Ahora puedes informar de errores a través de GitHub Issues.",
        "Se agruparon los enlaces de las páginas en el pie de página.",
      ],
      de: [
        "Eine Einstiegsanleitung und How-to-Artikel zu LaTeX-Tabellen, siunitx, pgfplots und mehr hinzugefügt.",
        "Der Dokumentation ein Wiki-Layout mit linker Seitenleiste gegeben, um zwischen Artikeln zu wechseln.",
        "Seiten für Über uns und Kontakt hinzugefügt.",
        "Fehler können nun über GitHub Issues gemeldet werden.",
        "Seitenlinks in der Fußzeile zusammengefasst.",
      ],
    },
  },
  {
    version: "v0.8.0",
    date: "2026-06-16",
    title: {
      ja: "Google Analytics / AdSense 対応",
      en: "Google Analytics / AdSense support",
      zh: "支持 Google Analytics / AdSense",
      "zh-Hant": "支援 Google Analytics / AdSense",
      es: "Compatibilidad con Google Analytics / AdSense",
      de: "Unterstützung für Google Analytics / AdSense",
    },
    summary: {
      ja: "Google Analytics と Google AdSense を環境変数で有効化できるようにし、プライバシーポリシーを更新しました。",
      en: "Google Analytics and Google AdSense can now be enabled through environment variables, with the privacy policy updated accordingly.",
      zh: "现在可以通过环境变量启用 Google Analytics 和 Google AdSense，并相应更新了隐私政策。",
      "zh-Hant": "現在可以透過環境變數啟用 Google Analytics 和 Google AdSense，並同步更新了隱私權政策。",
      es: "Google Analytics y Google AdSense ahora pueden activarse mediante variables de entorno, con la política de privacidad actualizada.",
      de: "Google Analytics und Google AdSense können nun per Umgebungsvariablen aktiviert werden; die Datenschutzerklärung wurde entsprechend aktualisiert.",
    },
    changes: {
      ja: [
        "Google Analytics の Google tag を VITE_GA_MEASUREMENT_ID が設定されている場合だけ読み込むようにしました。",
        "Google AdSense の広告枠を変換結果とプレビューの下に控えめに配置しました。",
        "AdSense の client ID と slot ID は VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_OUTPUT_SLOT で設定できます。",
        "プライバシーポリシーに Google Analytics、Google AdSense、広告 Cookie、パーソナライズ広告のオプトアウト案内を追記しました。",
      ],
      en: [
        "The Google Analytics Google tag loads only when VITE_GA_MEASUREMENT_ID is configured.",
        "A restrained Google AdSense unit was placed below the converted output and preview.",
        "AdSense client and slot IDs can be configured with VITE_ADSENSE_CLIENT_ID and VITE_ADSENSE_OUTPUT_SLOT.",
        "The privacy policy now covers Google Analytics, Google AdSense, advertising cookies, and personalized ads opt-out.",
      ],
      zh: [
        "仅在设置 VITE_GA_MEASUREMENT_ID 时加载 Google Analytics 的 Google tag。",
        "在转换结果和预览下方添加了克制的 Google AdSense 广告位。",
        "AdSense client ID 和 slot ID 可通过 VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_OUTPUT_SLOT 设置。",
        "隐私政策已补充 Google Analytics、Google AdSense、广告 Cookie 和个性化广告停用说明。",
      ],
      "zh-Hant": [
        "僅在設定 VITE_GA_MEASUREMENT_ID 時載入 Google Analytics 的 Google tag。",
        "在轉換結果與預覽下方加入了克制的 Google AdSense 廣告位。",
        "AdSense client ID 與 slot ID 可透過 VITE_ADSENSE_CLIENT_ID / VITE_ADSENSE_OUTPUT_SLOT 設定。",
        "隱私權政策已補充 Google Analytics、Google AdSense、廣告 Cookie 與個人化廣告停用說明。",
      ],
      es: [
        "La etiqueta de Google Analytics solo se carga cuando VITE_GA_MEASUREMENT_ID está configurado.",
        "Se añadió un bloque discreto de Google AdSense debajo del resultado convertido y la vista previa.",
        "Los ID de cliente y slot de AdSense se configuran con VITE_ADSENSE_CLIENT_ID y VITE_ADSENSE_OUTPUT_SLOT.",
        "La política de privacidad ahora cubre Google Analytics, Google AdSense, cookies publicitarias y la desactivación de anuncios personalizados.",
      ],
      de: [
        "Das Google Analytics Google Tag wird nur geladen, wenn VITE_GA_MEASUREMENT_ID konfiguriert ist.",
        "Ein dezenter Google AdSense-Block wurde unter Ausgabe und Vorschau platziert.",
        "AdSense Client-ID und Slot-ID werden über VITE_ADSENSE_CLIENT_ID und VITE_ADSENSE_OUTPUT_SLOT konfiguriert.",
        "Die Datenschutzerklärung enthält nun Google Analytics, Google AdSense, Werbe-Cookies und den Opt-out für personalisierte Werbung.",
      ],
    },
  },
  {
    version: "v0.7.0",
    date: "2026-06-16",
    title: {
      ja: "Excel アドインと変換設定の更新",
      en: "Excel add-in and conversion settings update",
      zh: "Excel 加载项和转换设置更新",
      "zh-Hant": "Excel 增益集與轉換設定更新",
      es: "Actualización del complemento de Excel y ajustes de conversión",
      de: "Update für Excel-Add-In und Konvertierungseinstellungen",
    },
    summary: {
      ja: "Excel で離れた列を選択しても読み込めるようにし、変換設定とローカルデバッグの流れを整理しました。",
      en: "The Excel add-in can now read non-contiguous column selections, with cleaner conversion settings and local debugging flow.",
      zh: "Excel 加载项现在可以读取不连续的列选择，同时整理了转换设置和本地调试流程。",
      "zh-Hant": "Excel 增益集現在可以讀取不連續的欄位選取，並整理了轉換設定與本機偵錯流程。",
      es: "El complemento de Excel ahora lee selecciones de columnas no contiguas y mejora los ajustes de conversión y el flujo de depuración local.",
      de: "Das Excel-Add-In kann nun nicht zusammenhängende Spaltenauswahlen lesen, außerdem wurden Konvertierungseinstellungen und lokales Debugging verbessert.",
    },
    changes: {
      ja: [
        "Excel アドインで Ctrl 選択した A, C, D 列のような非連続範囲を読み込めるようにしました。",
        "アドインの Web 版リンクをコピーするボタンの下に QR コードを表示しました。",
        "siunitx（単位・桁揃え）を入力設定に置き、デフォルトでオンにしました。",
        "booktabs 表設定と列揃えは table.tex 側の表設定に移動しました。",
        "diagnostics 表示を多言語対応にしました。",
        "入力欄と出力欄の境界を初期表示で中央に置き、ドラッグ時の動きを調整しました。",
        "ローカルデバッグ用に add-in HTTPS サーバー、証明書チェック、ビルド確認コマンドを整理しました。",
      ],
      en: [
        "The Excel add-in can read non-contiguous selections such as Ctrl-selected A, C, and D columns.",
        "A QR code is now shown below the add-in's copy button for the web app link.",
        "siunitx alignment is now in the input settings and enabled by default.",
        "booktabs and column alignment settings moved to the table.tex output settings.",
        "Diagnostics labels and messages are now localized.",
        "Input and output split borders now start centered and drag more smoothly.",
        "Local add-in debugging now has clearer HTTPS server, certificate check, and build verification commands.",
      ],
      zh: [
        "Excel 加载项现在可以读取 Ctrl 选择的 A、C、D 列等不连续区域。",
        "在加载项的 Web 版链接复制按钮下方显示二维码。",
        "siunitx 对齐设置移到输入设置，并默认开启。",
        "booktabs 和列对齐设置移到 table.tex 输出设置。",
        "diagnostics 标签和消息已支持多语言。",
        "输入区和输出区的分隔线默认居中，并改善拖动手感。",
        "整理了本地加载项调试的 HTTPS 服务器、证书检查和构建验证命令。",
      ],
      "zh-Hant": [
        "Excel 增益集現在可以讀取 Ctrl 選取的 A、C、D 欄等不連續範圍。",
        "在增益集的 Web 版連結複製按鈕下方顯示 QR code。",
        "siunitx 對齊設定移到輸入設定，並預設開啟。",
        "booktabs 與欄位對齊設定移到 table.tex 輸出設定。",
        "diagnostics 標籤與訊息已支援多語言。",
        "輸入區與輸出區的分隔線預設置中，並改善拖曳手感。",
        "整理了本機增益集偵錯的 HTTPS 伺服器、憑證檢查與建置驗證命令。",
      ],
      es: [
        "El complemento de Excel puede leer selecciones no contiguas como columnas A, C y D seleccionadas con Ctrl.",
        "Se muestra un código QR debajo del botón para copiar el enlace de la versión web en el complemento.",
        "La opción siunitx está en los ajustes de entrada y queda activada por defecto.",
        "Las opciones booktabs y alineación de columnas pasaron a los ajustes de salida de table.tex.",
        "Las etiquetas y mensajes de diagnostics ahora están localizados.",
        "Los divisores de entrada y salida empiezan centrados y se arrastran con más suavidad.",
        "El flujo de depuración local del complemento ahora tiene comandos más claros para HTTPS, certificados y verificación de build.",
      ],
      de: [
        "Das Excel-Add-In kann nicht zusammenhängende Auswahlen wie mit Strg gewählte Spalten A, C und D lesen.",
        "Unter der Schaltfläche zum Kopieren des Web-App-Links wird im Add-In ein QR-Code angezeigt.",
        "Die siunitx-Ausrichtung liegt nun in den Eingabeeinstellungen und ist standardmäßig aktiviert.",
        "booktabs und Spaltenausrichtung wurden in die table.tex-Ausgabeeinstellungen verschoben.",
        "Diagnostics-Beschriftungen und Meldungen sind nun lokalisiert.",
        "Die Trenner für Eingabe und Ausgabe starten mittig und lassen sich flüssiger ziehen.",
        "Der lokale Add-In-Debugging-Ablauf hat klarere Befehle für HTTPS-Server, Zertifikatsprüfung und Build-Verifikation.",
      ],
    },
  },
  {
    version: "v0.6.0",
    date: "2026-05-27",
    title: {
      ja: "大容量データとノイズ耐性の強化",
      en: "Better handling of large and noisy data",
      zh: "增强大数据量与抗噪能力",
      "zh-Hant": "強化大量資料與抗雜訊能力",
      es: "Mejor manejo de datos grandes y con ruido",
      de: "Bessere Verarbeitung großer und verrauschter Daten",
    },
    summary: {
      ja: "オシロスコープのような大量でノイズの多いデータでも安定して変換できるよう改善しました。",
      en: "Conversion is now more stable for large, noisy data such as oscilloscope output.",
      zh: "对示波器等大量且带噪声的数据，转换更加稳定。",
      "zh-Hant": "對示波器等大量且帶雜訊的資料，轉換更加穩定。",
      es: "La conversión es más estable con datos grandes y ruidosos, como los de un osciloscopio.",
      de: "Die Konvertierung ist nun stabiler für große, verrauschte Daten wie Oszilloskop-Ausgaben.",
    },
    changes: {
      ja: [
        "オシロスコープ由来のような大容量データの取り込みに対応しました。",
        "ノイズを含むデータでも変換が安定するよう調整しました。",
      ],
      en: [
        "Added support for importing large datasets such as oscilloscope captures.",
        "Tuned the conversion to stay stable on data that contains noise.",
      ],
      zh: [
        "支持导入示波器采集等大容量数据。",
        "调整了转换流程，使其在含噪声的数据上更稳定。",
      ],
      "zh-Hant": [
        "支援匯入示波器擷取等大容量資料。",
        "調整了轉換流程，使其在含雜訊的資料上更穩定。",
      ],
      es: [
        "Se añadió la importación de conjuntos de datos grandes, como capturas de osciloscopio.",
        "Se ajustó la conversión para mantenerse estable con datos que contienen ruido.",
      ],
      de: [
        "Import großer Datensätze wie Oszilloskop-Aufnahmen hinzugefügt.",
        "Die Konvertierung wurde so abgestimmt, dass sie bei verrauschten Daten stabil bleibt.",
      ],
    },
  },
  {
    version: "v0.5.0",
    date: "2026-05-26",
    title: {
      ja: "デザイン刷新と貼り付け時の自動プレビュー",
      en: "Design refresh and auto preview on paste",
      zh: "界面焕新与粘贴自动预览",
      "zh-Hant": "介面煥新與貼上自動預覽",
      es: "Renovación del diseño y vista previa automática al pegar",
      de: "Design-Auffrischung und automatische Vorschau beim Einfügen",
    },
    summary: {
      ja: "全体のデザインを見直し、データを貼り付けると自動でプレビューを表示するようにしました。",
      en: "Refreshed the overall design and now show a preview automatically when you paste data.",
      zh: "重新梳理了整体设计，并在粘贴数据后自动显示预览。",
      "zh-Hant": "重新梳理了整體設計，並在貼上資料後自動顯示預覽。",
      es: "Se renovó el diseño general y ahora se muestra una vista previa automáticamente al pegar datos.",
      de: "Das Gesamtdesign wurde überarbeitet, und beim Einfügen von Daten wird nun automatisch eine Vorschau angezeigt.",
    },
    changes: {
      ja: [
        "データを貼り付けると自動的にプレビューが表示されるようにしました。",
        "変換タブの不具合を修正しました。",
        "アプリ全体の見た目を調整しました。",
      ],
      en: [
        "Pasting data now shows a preview automatically.",
        "Fixed issues in the convert tab.",
        "Adjusted the overall look of the app.",
      ],
      zh: [
        "粘贴数据后会自动显示预览。",
        "修复了转换标签页的问题。",
        "调整了应用的整体外观。",
      ],
      "zh-Hant": [
        "貼上資料後會自動顯示預覽。",
        "修正了轉換分頁的問題。",
        "調整了應用程式的整體外觀。",
      ],
      es: [
        "Al pegar datos ahora se muestra una vista previa automáticamente.",
        "Se corrigieron problemas en la pestaña de conversión.",
        "Se ajustó el aspecto general de la aplicación.",
      ],
      de: [
        "Beim Einfügen von Daten wird nun automatisch eine Vorschau angezeigt.",
        "Probleme im Konvertierungs-Tab behoben.",
        "Das Gesamterscheinungsbild der App angepasst.",
      ],
    },
  },
  {
    version: "v0.4.0",
    date: "2026-05-24",
    title: {
      ja: "PDFプレビューとグラフ調整",
      en: "PDF preview and graph controls",
      zh: "PDF 预览与图表调整",
      "zh-Hant": "PDF 預覽與圖表調整",
      es: "Vista previa de PDF y controles de gráficos",
      de: "PDF-Vorschau und Diagramm-Steuerung",
    },
    summary: {
      ja: "PDFプレビューの状態表示やグラフの収まり調整を追加し、プライバシーポリシーを整備しました。",
      en: "Added PDF preview status and graph fitting controls, and set up the privacy policy.",
      zh: "新增了 PDF 预览状态显示和图表适配控制，并完善了隐私政策。",
      "zh-Hant": "新增了 PDF 預覽狀態顯示和圖表適配控制，並完善了隱私權政策。",
      es: "Se añadieron el estado de la vista previa de PDF y controles de ajuste de gráficos, y se preparó la política de privacidad.",
      de: "PDF-Vorschaustatus und Diagramm-Anpassungssteuerung hinzugefügt sowie die Datenschutzerklärung eingerichtet.",
    },
    changes: {
      ja: [
        "PDFプレビューの読み込み状態を表示するようにしました。",
        "グラフの収まり（fitting）を調整できるようにしました。",
        "プライバシーポリシーのページを追加しました。",
        "配信まわりの構成を整えました。",
      ],
      en: [
        "Added a loading status indicator for the PDF preview.",
        "Added controls for fitting the graph.",
        "Added a privacy policy page.",
        "Tidied up the delivery configuration.",
      ],
      zh: [
        "新增了 PDF 预览的加载状态显示。",
        "新增了图表适配（fitting）控制。",
        "新增了隐私政策页面。",
        "整理了部署相关配置。",
      ],
      "zh-Hant": [
        "新增了 PDF 預覽的載入狀態顯示。",
        "新增了圖表適配（fitting）控制。",
        "新增了隱私權政策頁面。",
        "整理了部署相關設定。",
      ],
      es: [
        "Se añadió un indicador de estado de carga para la vista previa de PDF.",
        "Se añadieron controles para ajustar el gráfico.",
        "Se añadió una página de política de privacidad.",
        "Se ordenó la configuración de despliegue.",
      ],
      de: [
        "Eine Ladeanzeige für die PDF-Vorschau hinzugefügt.",
        "Steuerelemente zum Anpassen des Diagramms hinzugefügt.",
        "Eine Datenschutzseite hinzugefügt.",
        "Die Bereitstellungskonfiguration aufgeräumt.",
      ],
    },
  },
  {
    version: "v0.3.0",
    date: "2025-12-27",
    title: {
      ja: "TikZ グラフプレビュー",
      en: "TikZ graph preview",
      zh: "TikZ 图表预览",
      "zh-Hant": "TikZ 圖表預覽",
      es: "Vista previa de gráficos TikZ",
      de: "TikZ-Diagrammvorschau",
    },
    summary: {
      ja: "TikZ で生成したグラフをその場でプレビューできるようにしました。",
      en: "You can now preview TikZ-generated graphs on the spot.",
      zh: "现在可以即时预览由 TikZ 生成的图表。",
      "zh-Hant": "現在可以即時預覽由 TikZ 生成的圖表。",
      es: "Ahora puedes previsualizar al momento los gráficos generados con TikZ.",
      de: "TikZ-erzeugte Diagramme lassen sich nun direkt in der Vorschau ansehen.",
    },
    changes: {
      ja: [
        "TikZ グラフのプレビュー機能を追加しました。",
        "グラフ生成まわりを更新しました。",
      ],
      en: [
        "Added a preview for TikZ graphs.",
        "Updated the graph generation internals.",
      ],
      zh: [
        "新增了 TikZ 图表预览功能。",
        "更新了图表生成相关逻辑。",
      ],
      "zh-Hant": [
        "新增了 TikZ 圖表預覽功能。",
        "更新了圖表生成相關邏輯。",
      ],
      es: [
        "Se añadió una vista previa para gráficos TikZ.",
        "Se actualizaron los componentes de generación de gráficos.",
      ],
      de: [
        "Eine Vorschau für TikZ-Diagramme hinzugefügt.",
        "Die Diagrammerzeugung intern aktualisiert.",
      ],
    },
  },
  {
    version: "v0.2.0",
    date: "2025-12-10",
    title: {
      ja: "有効数字まわりと表示の改善",
      en: "Significant figures and display improvements",
      zh: "有效数字与显示改进",
      "zh-Hant": "有效數字與顯示改進",
      es: "Mejoras en cifras significativas y visualización",
      de: "Verbesserungen bei signifikanten Stellen und Darstellung",
    },
    summary: {
      ja: "有効数字の扱いを改善し、表示まわりの調整と不具合修正を行いました。",
      en: "Improved how significant figures are handled, with display tweaks and bug fixes.",
      zh: "改进了有效数字的处理，并调整了显示、修复了问题。",
      "zh-Hant": "改進了有效數字的處理，並調整了顯示、修正了問題。",
      es: "Se mejoró el manejo de cifras significativas, con ajustes de visualización y correcciones.",
      de: "Die Behandlung signifikanter Stellen wurde verbessert, mit Darstellungs-Anpassungen und Fehlerbehebungen.",
    },
    changes: {
      ja: [
        "有効数字の扱いを改善しました。",
        "表示まわりを調整しました。",
        "いくつかの不具合を修正しました。",
      ],
      en: [
        "Improved how significant figures are handled.",
        "Adjusted the display.",
        "Fixed several issues.",
      ],
      zh: [
        "改进了有效数字的处理。",
        "调整了显示。",
        "修复了若干问题。",
      ],
      "zh-Hant": [
        "改進了有效數字的處理。",
        "調整了顯示。",
        "修正了若干問題。",
      ],
      es: [
        "Se mejoró el manejo de cifras significativas.",
        "Se ajustó la visualización.",
        "Se corrigieron varios problemas.",
      ],
      de: [
        "Die Behandlung signifikanter Stellen verbessert.",
        "Die Darstellung angepasst.",
        "Mehrere Probleme behoben.",
      ],
    },
  },
  {
    version: "v0.1.0",
    date: "2025-11-13",
    title: {
      ja: "初期リリース",
      en: "Initial release",
      zh: "首次发布",
      "zh-Hant": "首次發布",
      es: "Versión inicial",
      de: "Erste Veröffentlichung",
    },
    summary: {
      ja: "Excel のデータを LaTeX の表に変換する基本機能を公開しました。",
      en: "Released the core feature for converting Excel data into LaTeX tables.",
      zh: "发布了将 Excel 数据转换为 LaTeX 表格的核心功能。",
      "zh-Hant": "發布了將 Excel 資料轉換為 LaTeX 表格的核心功能。",
      es: "Se lanzó la función principal para convertir datos de Excel en tablas LaTeX.",
      de: "Die Kernfunktion zum Konvertieren von Excel-Daten in LaTeX-Tabellen wurde veröffentlicht.",
    },
    changes: {
      ja: [
        "有効数字を選べるドロップダウンを追加しました。",
        "変換処理の基盤を整えました。",
      ],
      en: [
        "Added a dropdown for choosing significant figures.",
        "Set up the conversion engine.",
      ],
      zh: [
        "新增了选择有效数字的下拉菜单。",
        "搭建了转换处理的基础。",
      ],
      "zh-Hant": [
        "新增了選擇有效數字的下拉選單。",
        "搭建了轉換處理的基礎。",
      ],
      es: [
        "Se añadió un menú desplegable para elegir las cifras significativas.",
        "Se estableció el motor de conversión.",
      ],
      de: [
        "Ein Dropdown zur Auswahl der signifikanten Stellen hinzugefügt.",
        "Die Konvertierungs-Engine eingerichtet.",
      ],
    },
  },
]
