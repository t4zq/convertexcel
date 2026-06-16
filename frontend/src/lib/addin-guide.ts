import type { Language } from "@/lib/i18n"

/** 本番でホストするアドイン manifest の場所（/addin/ 配下に同梱）。 */
export const ADDIN_MANIFEST_URL = "https://convertexcel.net/addin/manifest.xml"
const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

/** 共有フォルダー カタログの公式手順（言語ごとの Microsoft Learn ロケール）。 */
const learnSharedFolderUrl = (locale: string) =>
  `https://learn.microsoft.com/${locale}/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins`

type AddinLink = { label: string; url: string }
/** 1 行のテキスト。途中にリンクを埋め込みたいときは link / textAfter を使う。 */
type Line = { text: string; link?: AddinLink; textAfter?: string }

export type AddinGuideContent = {
  navLabel: string
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  intro: string
  requirementsTitle: string
  requirements: string[]
  downloadTitle: string
  downloadDescription: string
  downloadButton: string
  methodsTitle: string
  methods: Array<{ title: string; steps: Line[] }>
  notesTitle: string
  notes: Line[]
  back: string
}

export const addinGuide: Record<Language, AddinGuideContent> = {
  ja: {
    navLabel: "Excel アドイン",
    seoTitle: "Excel アドインの導入 - converTeXcel",
    seoDescription:
      "converTeXcel の Excel アドイン（manifest.xml）の入手場所と、Excel への読み込み手順を説明します。",
    eyebrow: "Excel add-in",
    title: "Excel アドインの導入",
    intro:
      "選択した表を converTeXcel に取り込むための Excel アドインです。下のマニフェストを Excel に読み込む必要があります。",
    requirementsTitle: "動作条件",
    requirements: [
      "Microsoft 365 Excel - Windows デスクトップ版、または Excel on the web",
      "インターネット接続 - アドインは https://convertexcel.net から読み込まれます。",
      "アカウント登録や追加のインストールは不要です。",
    ],
    downloadTitle: "マニフェストの入手",
    downloadDescription:
      "manifest.xml をダウンロードします。このファイルを Excel に読み込みます。",
    downloadButton: "manifest.xml をダウンロード",
    methodsTitle: "読み込み手順",
    methods: [
      {
        title: "Excel on the web の場合",
        steps: [
          { text: "ブラウザで Excel のブックを開きます。" },
          { text: "［ホーム］→［アドイン］→［詳細設定］を開きます。" },
          { text: "［マイ アドインのアップロード］を選び、ダウンロードした manifest.xml を指定します。" },
          { text: "リボンの converTeXcel グループから「表とグラフに変換」を開きます。" },
        ],
      },
      {
        title: "Windows デスクトップ版 の場合",
        steps: [
          {
            text: "manifest.xml を共有フォルダー（ネットワーク パス）に置きます。",
            link: { label: "詳しい手順（Microsoft Learn）", url: learnSharedFolderUrl("ja-jp") },
          },
          { text: "［ファイル］→［オプション］→［トラスト センター］→［トラスト センターの設定］→［信頼できるアドイン カタログ］を開きます。" },
          { text: "共有フォルダーのパスを追加し、［カタログに表示］にチェックして Excel を再起動します。" },
          { text: "［挿入］→［アドイン］→［詳細］から converTeXcel を選びます。" },
        ],
      },
    ],
    notesTitle: "補足",
    notes: [
      { text: "アドインは選択範囲を読み取るだけで、書き込みは行いません。" },
      { text: "不具合や要望は ", link: { label: "GitHub issue", url: ISSUES_URL }, textAfter: " へお願いします。" },
    ],
    back: "変換に戻る",
  },
  en: {
    navLabel: "Excel add-in",
    seoTitle: "Install the Excel add-in - converTeXcel",
    seoDescription:
      "Where to get the converTeXcel Excel add-in (manifest.xml) and how to load it into Excel.",
    eyebrow: "Excel add-in",
    title: "Install the Excel add-in",
    intro:
      "This Excel add-in imports your selected table into converTeXcel. You need to load the manifest below into Excel.",
    requirementsTitle: "Requirements",
    requirements: [
      "Microsoft 365 Excel - Windows desktop or Excel on the web",
      "An internet connection - the add-in loads from https://convertexcel.net",
      "No account or extra installation is required.",
    ],
    downloadTitle: "Get the manifest",
    downloadDescription: "Download manifest.xml. You load this file into Excel.",
    downloadButton: "Download manifest.xml",
    methodsTitle: "How to load",
    methods: [
      {
        title: "Excel on the web",
        steps: [
          { text: "Open a workbook in Excel in your browser." },
          { text: "Go to Home → Add-ins → More Add-ins." },
          { text: "Choose “Upload My Add-in” and select the manifest.xml you downloaded." },
          { text: "Open “Convert to table and graph” from the converTeXcel group on the ribbon." },
        ],
      },
      {
        title: "Excel for Windows (desktop)",
        steps: [
          {
            text: "Place manifest.xml in a shared folder (a network path). ",
            link: { label: "Detailed steps (Microsoft Learn)", url: learnSharedFolderUrl("en-us") },
          },
          { text: "Go to File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs." },
          { text: "Add the shared folder path, check “Show in Menu”, and restart Excel." },
          { text: "Go to Insert → Add-ins → More and select converTeXcel." },
        ],
      },
    ],
    notesTitle: "Notes",
    notes: [
      { text: "The add-in only reads your selection; it does not write." },
      { text: "For bugs or requests, please open a ", link: { label: "GitHub issue", url: ISSUES_URL }, textAfter: "." },
    ],
    back: "Back to converter",
  },
  zh: {
    navLabel: "Excel 加载项",
    seoTitle: "安装 Excel 加载项 - converTeXcel",
    seoDescription: "获取 converTeXcel 的 Excel 加载项（manifest.xml），以及如何将其加载到 Excel 中。",
    eyebrow: "Excel 加载项",
    title: "安装 Excel 加载项",
    intro:
      "此 Excel 加载项可将所选表格导入 converTeXcel。您需要将下面的清单文件加载到 Excel。",
    requirementsTitle: "运行条件",
    requirements: [
      "Microsoft 365 Excel - Windows 桌面版或网页版 Excel",
      "互联网连接 - 加载项从 https://convertexcel.net 加载",
      "无需账户或额外安装。",
    ],
    downloadTitle: "获取清单文件",
    downloadDescription: "下载 manifest.xml。您需要将此文件加载到 Excel。",
    downloadButton: "下载 manifest.xml",
    methodsTitle: "加载步骤",
    methods: [
      {
        title: "网页版 Excel",
        steps: [
          { text: "在浏览器中打开 Excel 工作簿。" },
          { text: "依次进入“开始”→“加载项”→“更多加载项”。" },
          { text: "选择“上传我的加载项”，然后选择已下载的 manifest.xml。" },
          { text: "在功能区的 converTeXcel 组中打开“转换为表格和图表”。" },
        ],
      },
      {
        title: "Excel（Windows 桌面版）",
        steps: [
          {
            text: "将 manifest.xml 放入共享文件夹（网络路径）。",
            link: { label: "详细步骤（Microsoft Learn）", url: learnSharedFolderUrl("zh-cn") },
          },
          { text: "依次进入“文件”→“选项”→“信任中心”→“信任中心设置”→“受信任的加载项目录”。" },
          { text: "添加共享文件夹路径，勾选“在菜单中显示”，然后重启 Excel。" },
          { text: "依次进入“插入”→“加载项”→“更多”，选择 converTeXcel。" },
        ],
      },
    ],
    notesTitle: "补充说明",
    notes: [
      { text: "加载项仅读取所选内容，不会写入。" },
      { text: "如有缺陷或需求，请通过 ", link: { label: "GitHub issue", url: ISSUES_URL }, textAfter: " 反馈。" },
    ],
    back: "返回转换工具",
  },
  "zh-Hant": {
    navLabel: "Excel 增益集",
    seoTitle: "安裝 Excel 增益集 - converTeXcel",
    seoDescription: "取得 converTeXcel 的 Excel 增益集（manifest.xml），以及如何將其載入 Excel。",
    eyebrow: "Excel 增益集",
    title: "安裝 Excel 增益集",
    intro:
      "此 Excel 增益集可將所選表格匯入 converTeXcel。您需要將下方的資訊清單載入 Excel。",
    requirementsTitle: "執行條件",
    requirements: [
      "Microsoft 365 Excel - Windows 桌面版或網頁版 Excel",
      "網際網路連線 - 增益集會從 https://convertexcel.net 載入",
      "不需要帳號或額外安裝。",
    ],
    downloadTitle: "取得資訊清單",
    downloadDescription: "下載 manifest.xml。您需要將此檔案載入 Excel。",
    downloadButton: "下載 manifest.xml",
    methodsTitle: "載入步驟",
    methods: [
      {
        title: "網頁版 Excel",
        steps: [
          { text: "在瀏覽器中開啟 Excel 活頁簿。" },
          { text: "依序進入「常用」→「增益集」→「更多增益集」。" },
          { text: "選擇「上傳我的增益集」，然後選取已下載的 manifest.xml。" },
          { text: "在功能區的 converTeXcel 群組中開啟「轉換為表格與圖表」。" },
        ],
      },
      {
        title: "Excel（Windows 桌面版）",
        steps: [
          {
            text: "將 manifest.xml 放入共用資料夾（網路路徑）。",
            link: { label: "詳細步驟（Microsoft Learn）", url: learnSharedFolderUrl("zh-tw") },
          },
          { text: "依序進入「檔案」→「選項」→「信任中心」→「信任中心設定」→「受信任的增益集目錄」。" },
          { text: "新增共用資料夾路徑，勾選「在功能表中顯示」，然後重新啟動 Excel。" },
          { text: "依序進入「插入」→「增益集」→「更多」，選取 converTeXcel。" },
        ],
      },
    ],
    notesTitle: "補充說明",
    notes: [
      { text: "增益集僅讀取所選內容，不會寫入。" },
      { text: "如有錯誤或需求，請透過 ", link: { label: "GitHub issue", url: ISSUES_URL }, textAfter: " 回報。" },
    ],
    back: "返回轉換工具",
  },
  es: {
    navLabel: "Complemento de Excel",
    seoTitle: "Instalar el complemento de Excel - converTeXcel",
    seoDescription:
      "Dónde obtener el complemento de Excel de converTeXcel (manifest.xml) y cómo cargarlo en Excel.",
    eyebrow: "Complemento de Excel",
    title: "Instalar el complemento de Excel",
    intro:
      "Este complemento de Excel importa la tabla seleccionada en converTeXcel. Debes cargar el manifiesto de abajo en Excel.",
    requirementsTitle: "Requisitos",
    requirements: [
      "Excel con Microsoft 365 - escritorio en Windows o Excel en la web",
      "Conexión a internet - el complemento se carga desde https://convertexcel.net",
      "No se requiere cuenta ni instalación adicional.",
    ],
    downloadTitle: "Obtener el manifiesto",
    downloadDescription: "Descarga manifest.xml. Este archivo se carga en Excel.",
    downloadButton: "Descargar manifest.xml",
    methodsTitle: "Cómo cargarlo",
    methods: [
      {
        title: "Excel en la web",
        steps: [
          { text: "Abre un libro en Excel en tu navegador." },
          { text: "Ve a Inicio → Complementos → Más complementos." },
          { text: "Elige “Cargar mi complemento” y selecciona el manifest.xml que descargaste." },
          { text: "Abre “Convertir a tabla y gráfico” en el grupo converTeXcel de la cinta." },
        ],
      },
      {
        title: "Excel para Windows (escritorio)",
        steps: [
          {
            text: "Coloca manifest.xml en una carpeta compartida (una ruta de red). ",
            link: { label: "Pasos detallados (Microsoft Learn)", url: learnSharedFolderUrl("es-es") },
          },
          { text: "Ve a Archivo → Opciones → Centro de confianza → Configuración del Centro de confianza → Catálogos de complementos de confianza." },
          { text: "Añade la ruta de la carpeta compartida, marca “Mostrar en el menú” y reinicia Excel." },
          { text: "Ve a Insertar → Complementos → Más y selecciona converTeXcel." },
        ],
      },
    ],
    notesTitle: "Notas",
    notes: [
      { text: "El complemento solo lee tu selección; no escribe." },
      { text: "Para errores o sugerencias, abre una ", link: { label: "incidencia en GitHub", url: ISSUES_URL }, textAfter: "." },
    ],
    back: "Volver al conversor",
  },
  de: {
    navLabel: "Excel-Add-In",
    seoTitle: "Excel-Add-In installieren - converTeXcel",
    seoDescription:
      "Wo Sie das converTeXcel-Excel-Add-In (manifest.xml) erhalten und wie Sie es in Excel laden.",
    eyebrow: "Excel-Add-In",
    title: "Excel-Add-In installieren",
    intro:
      "Dieses Excel-Add-In importiert Ihre ausgewählte Tabelle in converTeXcel. Sie müssen das Manifest unten in Excel laden.",
    requirementsTitle: "Voraussetzungen",
    requirements: [
      "Excel mit Microsoft 365 - Windows-Desktop oder Excel im Web",
      "Eine Internetverbindung - das Add-In wird von https://convertexcel.net geladen",
      "Kein Konto und keine zusätzliche Installation erforderlich.",
    ],
    downloadTitle: "Manifest herunterladen",
    downloadDescription: "Laden Sie manifest.xml herunter. Diese Datei laden Sie in Excel.",
    downloadButton: "manifest.xml herunterladen",
    methodsTitle: "So laden Sie es",
    methods: [
      {
        title: "Excel im Web",
        steps: [
          { text: "Öffnen Sie eine Arbeitsmappe in Excel im Browser." },
          { text: "Gehen Sie zu Start → Add-Ins → Weitere Add-Ins." },
          { text: "Wählen Sie „Eigenes Add-In hochladen“ und die heruntergeladene manifest.xml aus." },
          { text: "Öffnen Sie „In Tabelle und Diagramm umwandeln“ in der converTeXcel-Gruppe im Menüband." },
        ],
      },
      {
        title: "Excel für Windows (Desktop)",
        steps: [
          {
            text: "Legen Sie manifest.xml in einen freigegebenen Ordner (einen Netzwerkpfad). ",
            link: { label: "Ausführliche Schritte (Microsoft Learn)", url: learnSharedFolderUrl("de-de") },
          },
          { text: "Gehen Sie in Excel zu Datei → Optionen → Trust Center → Einstellungen für das Trust Center → Vertrauenswürdige Add-In-Kataloge." },
          { text: "Fügen Sie den Pfad des freigegebenen Ordners hinzu, aktivieren Sie „Im Menü anzeigen“ und starten Sie Excel neu." },
          { text: "Gehen Sie zu Einfügen → Add-Ins → Mehr und wählen Sie converTeXcel." },
        ],
      },
    ],
    notesTitle: "Hinweise",
    notes: [
      { text: "Das Add-In liest nur Ihre Auswahl; es schreibt nicht." },
      { text: "Für Fehler oder Wünsche erstellen Sie bitte ein ", link: { label: "GitHub-Issue", url: ISSUES_URL }, textAfter: "." },
    ],
    back: "Zurück zum Konverter",
  },
}
