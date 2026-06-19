import type { Language } from "@/lib/i18n"

export const ADDIN_MANIFEST_URL = "https://convertexcel.net/addin/manifest.xml"

export type AddinGuideContent = {
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  intro: string
  downloadTitle: string
  downloadDescription: string
  downloadButton: string
  back: string
}

export const addinGuide: Record<Language, AddinGuideContent> = {
  ja: {
    seoTitle: "Excel アドイン - converTeXcel",
    seoDescription: "Excelの選択範囲をconverTeXcelへ取り込むアドインとマニフェストを提供します。",
    eyebrow: "Excel add-in",
    title: "Excel アドイン",
    intro: "Excelで選択した表をconverTeXcelへ直接取り込めます。詳しい導入方法はDocsで説明しています。",
    downloadTitle: "マニフェスト",
    downloadDescription: "Excelへ登録するmanifest.xmlをダウンロードできます。",
    downloadButton: "manifest.xml をダウンロード",
    back: "変換に戻る",
  },
  en: {
    seoTitle: "Excel add-in - converTeXcel",
    seoDescription: "Get the add-in and manifest for importing an Excel selection into converTeXcel.",
    eyebrow: "Excel add-in",
    title: "Excel add-in",
    intro: "Import a selected Excel range directly into converTeXcel. Full installation instructions are available in the docs.",
    downloadTitle: "Manifest",
    downloadDescription: "Download the manifest.xml file used to register the add-in in Excel.",
    downloadButton: "Download manifest.xml",
    back: "Back to converter",
  },
  zh: {
    seoTitle: "Excel 加载项 - converTeXcel",
    seoDescription: "获取用于将Excel选区导入converTeXcel的加载项和清单文件。",
    eyebrow: "Excel 加载项",
    title: "Excel 加载项",
    intro: "可将Excel中选择的区域直接导入converTeXcel。完整安装方法请参阅文档。",
    downloadTitle: "清单文件",
    downloadDescription: "下载用于在Excel中注册加载项的manifest.xml。",
    downloadButton: "下载 manifest.xml",
    back: "返回转换工具",
  },
  "zh-Hant": {
    seoTitle: "Excel 增益集 - converTeXcel",
    seoDescription: "取得用於將Excel選取範圍匯入converTeXcel的增益集與資訊清單。",
    eyebrow: "Excel 增益集",
    title: "Excel 增益集",
    intro: "可將Excel中選取的範圍直接匯入converTeXcel。完整安裝方法請參閱文件。",
    downloadTitle: "資訊清單",
    downloadDescription: "下載用於在Excel中註冊增益集的manifest.xml。",
    downloadButton: "下載 manifest.xml",
    back: "返回轉換工具",
  },
  es: {
    seoTitle: "Complemento de Excel - converTeXcel",
    seoDescription: "Obtén el complemento y el manifiesto para importar una selección de Excel en converTeXcel.",
    eyebrow: "Complemento de Excel",
    title: "Complemento de Excel",
    intro: "Importa un rango seleccionado de Excel directamente en converTeXcel. La instalación completa está en la documentación.",
    downloadTitle: "Manifiesto",
    downloadDescription: "Descarga el archivo manifest.xml para registrar el complemento en Excel.",
    downloadButton: "Descargar manifest.xml",
    back: "Volver al conversor",
  },
  de: {
    seoTitle: "Excel-Add-In - converTeXcel",
    seoDescription: "Add-In und Manifest zum Importieren eines Excel-Bereichs in converTeXcel.",
    eyebrow: "Excel-Add-In",
    title: "Excel-Add-In",
    intro: "Importiert einen ausgewählten Excel-Bereich direkt in converTeXcel. Die vollständige Installation steht in der Dokumentation.",
    downloadTitle: "Manifest",
    downloadDescription: "Laden Sie die manifest.xml zur Registrierung des Add-Ins in Excel herunter.",
    downloadButton: "manifest.xml herunterladen",
    back: "Zurück zum Konverter",
  },
}
