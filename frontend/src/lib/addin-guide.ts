import type { Language } from "@/lib/i18n"

/** 本番でホストするアドイン manifest の場所（/addin/ 配下に同梱）。 */
export const ADDIN_MANIFEST_URL = "https://convertexcel.net/addin/manifest.xml"
const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

/** 共有フォルダー カタログの公式手順（言語ごとの Microsoft Learn ロケール）。 */
const learnSharedFolderUrl = (locale: string) =>
  `https://learn.microsoft.com/${locale}/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins`

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
  manifestUrlLabel: string
  methodsTitle: string
  methods: Array<{ title: string; steps: string[]; docUrl?: string }>
  learnMoreLabel: string
  notesTitle: string
  notes: string[]
  back: string
}

export const addinGuide: Record<Language, AddinGuideContent> = {
  ja: {
    navLabel: "Excel アドイン",
    seoTitle: "Excel アドインの導入 - converTeXcel",
    seoDescription:
      "converTeXcel の Excel アドイン（manifest.xml）の入手場所と、Excel への sideload（読み込み）手順を説明します。",
    eyebrow: "Excel add-in",
    title: "Excel アドインの導入",
    intro:
      "選択した表を converTeXcel に取り込むための Excel アドインです。下のマニフェストを Excel に読み込む（sideload）と、リボンからタスクペインを開けます。",
    requirementsTitle: "動作条件",
    requirements: [
      "Microsoft 365 の Excel（Windows デスクトップ版、または Excel on the web）",
      "インターネット接続（アドインは https://convertexcel.net から読み込まれます）",
      "アカウント登録や追加のインストールは不要です。",
    ],
    downloadTitle: "マニフェストの入手",
    downloadDescription:
      "アドインの定義ファイル（manifest.xml）をダウンロードします。このファイルを Excel に読み込みます。",
    downloadButton: "manifest.xml をダウンロード",
    manifestUrlLabel: "直接の場所",
    methodsTitle: "読み込み手順（sideload）",
    methods: [
      {
        title: "Excel on the web の場合",
        steps: [
          "ブラウザで Excel のブックを開きます。",
          "［挿入］タブ →［アドイン］→［個人用アドイン］を開きます。",
          "［個人用アドインのアップロード］を選び、ダウンロードした manifest.xml を指定します。",
          "リボンの converTeXcel グループから「表とグラフに変換」を開きます。",
        ],
      },
      {
        title: "Excel（Windows デスクトップ版）の場合",
        steps: [
          "manifest.xml を共有フォルダー（ネットワーク パス）に置きます。",
          "［ファイル］→［オプション］→［トラスト センター］→［トラスト センターの設定］→［信頼できるアドイン カタログ］を開きます。",
          "共有フォルダーのパスを追加し、［カタログに表示］にチェックして Excel を再起動します。",
          "［挿入］→［個人用アドイン］→［共有フォルダー］から converTeXcel を選びます。",
        ],
        docUrl: learnSharedFolderUrl("ja-jp"),
      },
    ],
    learnMoreLabel: "詳しい手順（Microsoft Learn）",
    notesTitle: "補足",
    notes: [
      "アドインは選択範囲を読み取るだけで、ブックへの書き込みは行いません。",
      `不具合や要望は GitHub issue へお願いします: ${ISSUES_URL}`,
      "組織で配布する場合は、Microsoft 365 管理センターの「統合アプリ」から集中展開もできます。",
    ],
    back: "変換に戻る",
  },
  en: {
    navLabel: "Excel add-in",
    seoTitle: "Install the Excel add-in - converTeXcel",
    seoDescription:
      "Where to get the converTeXcel Excel add-in (manifest.xml) and how to sideload it into Excel.",
    eyebrow: "Excel add-in",
    title: "Install the Excel add-in",
    intro:
      "This Excel add-in imports your selected table into converTeXcel. Sideload the manifest below into Excel to open the task pane from the ribbon.",
    requirementsTitle: "Requirements",
    requirements: [
      "Excel with Microsoft 365 (Windows desktop or Excel on the web)",
      "An internet connection (the add-in loads from https://convertexcel.net)",
      "No account or extra installation is required.",
    ],
    downloadTitle: "Get the manifest",
    downloadDescription:
      "Download the add-in definition file (manifest.xml). You load this file into Excel.",
    downloadButton: "Download manifest.xml",
    manifestUrlLabel: "Direct location",
    methodsTitle: "How to sideload",
    methods: [
      {
        title: "Excel on the web",
        steps: [
          "Open a workbook in Excel in your browser.",
          "Go to the Insert tab → Add-ins → My Add-ins.",
          "Choose “Upload My Add-in” and select the manifest.xml you downloaded.",
          "Open “Convert to table and graph” from the converTeXcel group on the ribbon.",
        ],
      },
      {
        title: "Excel for Windows (desktop)",
        steps: [
          "Place manifest.xml in a shared folder (a network path).",
          "In Excel, go to File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs.",
          "Add the shared folder path, check “Show in Menu”, and restart Excel.",
          "Go to Insert → My Add-ins → Shared Folder and select converTeXcel.",
        ],
        docUrl: learnSharedFolderUrl("en-us"),
      },
    ],
    learnMoreLabel: "Detailed steps (Microsoft Learn)",
    notesTitle: "Notes",
    notes: [
      "The add-in only reads your selection; it does not write to the workbook.",
      `For bugs or requests, please open a GitHub issue: ${ISSUES_URL}`,
      "For organizations, you can also deploy it centrally from Integrated Apps in the Microsoft 365 admin center.",
    ],
    back: "Back to converter",
  },
  zh: {
    navLabel: "Excel 加载项",
    seoTitle: "安装 Excel 加载项 - converTeXcel",
    seoDescription:
      "获取 converTeXcel 的 Excel 加载项（manifest.xml），以及如何将其旁加载到 Excel 中。",
    eyebrow: "Excel 加载项",
    title: "安装 Excel 加载项",
    intro:
      "此 Excel 加载项可将所选表格导入 converTeXcel。将下面的清单文件旁加载到 Excel 后，即可从功能区打开任务窗格。",
    requirementsTitle: "运行条件",
    requirements: [
      "带 Microsoft 365 的 Excel（Windows 桌面版或网页版 Excel）",
      "互联网连接（加载项从 https://convertexcel.net 加载）",
      "无需账户或额外安装。",
    ],
    downloadTitle: "获取清单文件",
    downloadDescription: "下载加载项定义文件（manifest.xml）。您需要将此文件加载到 Excel。",
    downloadButton: "下载 manifest.xml",
    manifestUrlLabel: "直接地址",
    methodsTitle: "旁加载步骤",
    methods: [
      {
        title: "网页版 Excel",
        steps: [
          "在浏览器中打开 Excel 工作簿。",
          "依次进入“插入”选项卡 →“加载项”→“我的加载项”。",
          "选择“上传我的加载项”，然后选择已下载的 manifest.xml。",
          "在功能区的 converTeXcel 组中打开“转换为表格和图表”。",
        ],
      },
      {
        title: "Excel（Windows 桌面版）",
        steps: [
          "将 manifest.xml 放入共享文件夹（网络路径）。",
          "依次进入“文件”→“选项”→“信任中心”→“信任中心设置”→“受信任的加载项目录”。",
          "添加共享文件夹路径，勾选“在菜单中显示”，然后重启 Excel。",
          "依次进入“插入”→“我的加载项”→“共享文件夹”，选择 converTeXcel。",
        ],
        docUrl: learnSharedFolderUrl("zh-cn"),
      },
    ],
    learnMoreLabel: "详细步骤（Microsoft Learn）",
    notesTitle: "补充说明",
    notes: [
      "加载项仅读取所选内容，不会写入工作簿。",
      `如有缺陷或需求，请通过 GitHub issue 反馈：${ISSUES_URL}`,
      "如需在组织内分发，也可在 Microsoft 365 管理中心的“集成应用”中集中部署。",
    ],
    back: "返回转换工具",
  },
  "zh-Hant": {
    navLabel: "Excel 增益集",
    seoTitle: "安裝 Excel 增益集 - converTeXcel",
    seoDescription:
      "取得 converTeXcel 的 Excel 增益集（manifest.xml），以及如何將其側載到 Excel。",
    eyebrow: "Excel 增益集",
    title: "安裝 Excel 增益集",
    intro:
      "此 Excel 增益集可將所選表格匯入 converTeXcel。將下方的資訊清單側載到 Excel 後，即可從功能區開啟工作窗格。",
    requirementsTitle: "執行條件",
    requirements: [
      "具備 Microsoft 365 的 Excel（Windows 桌面版或網頁版 Excel）",
      "網際網路連線（增益集會從 https://convertexcel.net 載入）",
      "不需要帳號或額外安裝。",
    ],
    downloadTitle: "取得資訊清單",
    downloadDescription: "下載增益集定義檔（manifest.xml）。您需要將此檔案載入 Excel。",
    downloadButton: "下載 manifest.xml",
    manifestUrlLabel: "直接位置",
    methodsTitle: "側載步驟",
    methods: [
      {
        title: "網頁版 Excel",
        steps: [
          "在瀏覽器中開啟 Excel 活頁簿。",
          "依序進入「插入」索引標籤 →「增益集」→「我的增益集」。",
          "選擇「上傳我的增益集」，然後選取已下載的 manifest.xml。",
          "在功能區的 converTeXcel 群組中開啟「轉換為表格與圖表」。",
        ],
      },
      {
        title: "Excel（Windows 桌面版）",
        steps: [
          "將 manifest.xml 放入共用資料夾（網路路徑）。",
          "依序進入「檔案」→「選項」→「信任中心」→「信任中心設定」→「受信任的增益集目錄」。",
          "新增共用資料夾路徑，勾選「在功能表中顯示」，然後重新啟動 Excel。",
          "依序進入「插入」→「我的增益集」→「共用資料夾」，選取 converTeXcel。",
        ],
        docUrl: learnSharedFolderUrl("zh-tw"),
      },
    ],
    learnMoreLabel: "詳細步驟（Microsoft Learn）",
    notesTitle: "補充說明",
    notes: [
      "增益集僅讀取所選內容，不會寫入活頁簿。",
      `如有錯誤或需求，請透過 GitHub issue 回報：${ISSUES_URL}`,
      "如需在組織內散佈，也可在 Microsoft 365 系統管理中心的「整合式應用程式」中集中部署。",
    ],
    back: "返回轉換工具",
  },
  ko: {
    navLabel: "Excel 추가 기능",
    seoTitle: "Excel 추가 기능 설치 - converTeXcel",
    seoDescription:
      "converTeXcel Excel 추가 기능(manifest.xml)을 받는 위치와 Excel에 사이드로드하는 방법을 안내합니다.",
    eyebrow: "Excel 추가 기능",
    title: "Excel 추가 기능 설치",
    intro:
      "선택한 표를 converTeXcel로 가져오는 Excel 추가 기능입니다. 아래 매니페스트를 Excel에 사이드로드하면 리본에서 작업 창을 열 수 있습니다.",
    requirementsTitle: "사용 조건",
    requirements: [
      "Microsoft 365의 Excel(Windows 데스크톱 또는 웹용 Excel)",
      "인터넷 연결(추가 기능은 https://convertexcel.net 에서 로드됩니다)",
      "계정 등록이나 추가 설치가 필요하지 않습니다.",
    ],
    downloadTitle: "매니페스트 받기",
    downloadDescription:
      "추가 기능 정의 파일(manifest.xml)을 다운로드합니다. 이 파일을 Excel에 로드합니다.",
    downloadButton: "manifest.xml 다운로드",
    manifestUrlLabel: "직접 위치",
    methodsTitle: "사이드로드 방법",
    methods: [
      {
        title: "웹용 Excel",
        steps: [
          "브라우저에서 Excel 통합 문서를 엽니다.",
          "삽입 탭 → 추가 기능 → 내 추가 기능으로 이동합니다.",
          "“내 추가 기능 업로드”를 선택하고 다운로드한 manifest.xml을 지정합니다.",
          "리본의 converTeXcel 그룹에서 “표와 그래프로 변환”을 엽니다.",
        ],
      },
      {
        title: "Excel(Windows 데스크톱)",
        steps: [
          "manifest.xml을 공유 폴더(네트워크 경로)에 둡니다.",
          "파일 → 옵션 → 보안 센터 → 보안 센터 설정 → 신뢰할 수 있는 추가 기능 카탈로그로 이동합니다.",
          "공유 폴더 경로를 추가하고 “메뉴에 표시”를 선택한 후 Excel을 다시 시작합니다.",
          "삽입 → 내 추가 기능 → 공유 폴더에서 converTeXcel을 선택합니다.",
        ],
        docUrl: learnSharedFolderUrl("ko-kr"),
      },
    ],
    learnMoreLabel: "자세한 단계(Microsoft Learn)",
    notesTitle: "참고",
    notes: [
      "추가 기능은 선택 영역을 읽기만 하며 통합 문서에 쓰지 않습니다.",
      `버그나 요청은 GitHub issue로 알려 주세요: ${ISSUES_URL}`,
      "조직에서 배포하려면 Microsoft 365 관리 센터의 통합 앱에서 중앙 배포할 수도 있습니다.",
    ],
    back: "변환기로 돌아가기",
  },
  es: {
    navLabel: "Complemento de Excel",
    seoTitle: "Instalar el complemento de Excel - converTeXcel",
    seoDescription:
      "Dónde obtener el complemento de Excel de converTeXcel (manifest.xml) y cómo cargarlo (sideload) en Excel.",
    eyebrow: "Complemento de Excel",
    title: "Instalar el complemento de Excel",
    intro:
      "Este complemento de Excel importa la tabla seleccionada en converTeXcel. Carga el manifiesto de abajo en Excel para abrir el panel de tareas desde la cinta.",
    requirementsTitle: "Requisitos",
    requirements: [
      "Excel con Microsoft 365 (escritorio en Windows o Excel en la web)",
      "Conexión a internet (el complemento se carga desde https://convertexcel.net)",
      "No se requiere cuenta ni instalación adicional.",
    ],
    downloadTitle: "Obtener el manifiesto",
    downloadDescription:
      "Descarga el archivo de definición del complemento (manifest.xml). Este archivo se carga en Excel.",
    downloadButton: "Descargar manifest.xml",
    manifestUrlLabel: "Ubicación directa",
    methodsTitle: "Cómo cargarlo (sideload)",
    methods: [
      {
        title: "Excel en la web",
        steps: [
          "Abre un libro en Excel en tu navegador.",
          "Ve a la pestaña Insertar → Complementos → Mis complementos.",
          "Elige “Cargar mi complemento” y selecciona el manifest.xml que descargaste.",
          "Abre “Convertir a tabla y gráfico” en el grupo converTeXcel de la cinta.",
        ],
      },
      {
        title: "Excel para Windows (escritorio)",
        steps: [
          "Coloca manifest.xml en una carpeta compartida (una ruta de red).",
          "En Excel, ve a Archivo → Opciones → Centro de confianza → Configuración del Centro de confianza → Catálogos de complementos de confianza.",
          "Añade la ruta de la carpeta compartida, marca “Mostrar en el menú” y reinicia Excel.",
          "Ve a Insertar → Mis complementos → Carpeta compartida y selecciona converTeXcel.",
        ],
        docUrl: learnSharedFolderUrl("es-es"),
      },
    ],
    learnMoreLabel: "Pasos detallados (Microsoft Learn)",
    notesTitle: "Notas",
    notes: [
      "El complemento solo lee tu selección; no escribe en el libro.",
      `Para errores o sugerencias, abre una incidencia en GitHub: ${ISSUES_URL}`,
      "Para organizaciones, también puedes implementarlo de forma centralizada desde Aplicaciones integradas en el centro de administración de Microsoft 365.",
    ],
    back: "Volver al conversor",
  },
  de: {
    navLabel: "Excel-Add-In",
    seoTitle: "Excel-Add-In installieren - converTeXcel",
    seoDescription:
      "Wo Sie das converTeXcel-Excel-Add-In (manifest.xml) erhalten und wie Sie es in Excel querladen (sideloaden).",
    eyebrow: "Excel-Add-In",
    title: "Excel-Add-In installieren",
    intro:
      "Dieses Excel-Add-In importiert Ihre ausgewählte Tabelle in converTeXcel. Laden Sie das Manifest unten in Excel quer (Sideload), um den Aufgabenbereich über das Menüband zu öffnen.",
    requirementsTitle: "Voraussetzungen",
    requirements: [
      "Excel mit Microsoft 365 (Windows-Desktop oder Excel im Web)",
      "Eine Internetverbindung (das Add-In wird von https://convertexcel.net geladen)",
      "Kein Konto und keine zusätzliche Installation erforderlich.",
    ],
    downloadTitle: "Manifest herunterladen",
    downloadDescription:
      "Laden Sie die Add-In-Definitionsdatei (manifest.xml) herunter. Diese Datei laden Sie in Excel.",
    downloadButton: "manifest.xml herunterladen",
    manifestUrlLabel: "Direkter Speicherort",
    methodsTitle: "So laden Sie es quer (Sideload)",
    methods: [
      {
        title: "Excel im Web",
        steps: [
          "Öffnen Sie eine Arbeitsmappe in Excel im Browser.",
          "Gehen Sie zur Registerkarte Einfügen → Add-Ins → Meine Add-Ins.",
          "Wählen Sie „Eigenes Add-In hochladen“ und die heruntergeladene manifest.xml aus.",
          "Öffnen Sie „In Tabelle und Diagramm umwandeln“ in der converTeXcel-Gruppe im Menüband.",
        ],
      },
      {
        title: "Excel für Windows (Desktop)",
        steps: [
          "Legen Sie manifest.xml in einen freigegebenen Ordner (einen Netzwerkpfad).",
          "Gehen Sie in Excel zu Datei → Optionen → Trust Center → Einstellungen für das Trust Center → Vertrauenswürdige Add-In-Kataloge.",
          "Fügen Sie den Pfad des freigegebenen Ordners hinzu, aktivieren Sie „Im Menü anzeigen“ und starten Sie Excel neu.",
          "Gehen Sie zu Einfügen → Meine Add-Ins → Freigegebener Ordner und wählen Sie converTeXcel.",
        ],
        docUrl: learnSharedFolderUrl("de-de"),
      },
    ],
    learnMoreLabel: "Ausführliche Schritte (Microsoft Learn)",
    notesTitle: "Hinweise",
    notes: [
      "Das Add-In liest nur Ihre Auswahl; es schreibt nicht in die Arbeitsmappe.",
      `Für Fehler oder Wünsche erstellen Sie bitte ein GitHub-Issue: ${ISSUES_URL}`,
      "Für Organisationen können Sie es auch zentral über Integrierte Apps im Microsoft 365 Admin Center bereitstellen.",
    ],
    back: "Zurück zum Konverter",
  },
}
