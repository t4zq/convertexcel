import type { Language } from "@/lib/i18n"

export type PrivacyPolicyContent = {
  notice: string
  sections: Array<{
    title: string
    paragraphs?: string[]
    bullets?: string[]
  }>
  dataTable: {
    title: string
    headers: {
      category: string
      purpose: string
      legalBasis: string
      retention: string
    }
    rows: Array<{
      category: string
      purpose: string
      legalBasis: string
      retention: string
    }>
  }
  thirdParties: {
    title: string
    intro: string
    rows: Array<{
      service: string
      purpose: string
      data: string
      timing: string
    }>
  }
  regional: {
    title: string
    items: string[]
  }
}

const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

export const privacyPolicy: Record<Language, PrivacyPolicyContent> = {
  ja: {
    notice:
      "converTeXcel は無料・広告なし・アカウント不要の変換ツールです。変換は主にブラウザ内で行い、個人情報の収集を目的としません。本ページは透明性のための概要です。",
    sections: [
      {
        title: "基本方針",
        bullets: [
          "変換処理は主にブラウザ内の Rust/WebAssembly で行います。",
          "グラフ（gnuplot）のプレビューもブラウザ内で描画し、外部へ送信しません。",
          "PDFプレビューを実行する場合のみ、同意のうえ生成コードと必要なデータを texlive.net へ送信します。",
          "広告トラッキング、行動ターゲティング、データの販売は行いません。",
          "氏名・メールアドレス・アカウント登録は不要です。",
        ],
      },
      {
        title: "データの扱いと権利",
        paragraphs: [
          "入力内容は基本的にブラウザ内にとどまります。localStorage に保存された入力や設定は、ブラウザの設定からいつでも削除できます。",
          "共有リンクは入力内容を URL 自体に含みます。共有先の管理にご注意ください。",
        ],
      },
      {
        title: "お問い合わせ・問題報告",
        paragraphs: [
          `ご質問、不具合の報告、プライバシーに関するご指摘は GitHub の issue からお願いします: ${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "処理するデータ、目的、保存期間",
      headers: {
        category: "データカテゴリ",
        purpose: "目的",
        legalBasis: "法的根拠",
        retention: "保存期間",
      },
      rows: [
        {
          category: "貼り付けた表データ、生成された LaTeX/CSV/TikZ/gnuplot コード",
          purpose: "変換結果の生成・編集・プレビュー",
          legalBasis: "利用者の操作・要求への対応",
          retention: "通常はブラウザ内のみ。localStorage 保存時は利用者が削除するまで。",
        },
        {
          category: "localStorage の入力内容・表示設定",
          purpose: "入力復元、設定保持",
          legalBasis: "利用者の選択",
          retention: "利用者がブラウザで削除するまで、またはアプリが上書きするまで。",
        },
        {
          category: "IPアドレス、User-Agent、リクエストログ等の技術データ",
          purpose: "配信、セキュリティ、障害調査",
          legalBasis: "正当な利益または法的義務",
          retention: "ホスティング/CDN 提供者のログ保持設定に従います。",
        },
      ],
    },
    thirdParties: {
      title: "第三者・国外移転",
      intro: "本サービスは以下の外部サービスを利用する場合があります。",
      rows: [
        {
          service: "texlive.net",
          purpose: "PDFプレビュー生成",
          data: "表/グラフコード、グラフ用CSV、コンパイルに必要なデータ",
          timing: "確認ダイアログで同意した後",
        },
        {
          service: "Cloudflare Pages/Workers または同等のホスティング/CDN",
          purpose: "サイト配信、TLS、セキュリティ、ログ",
          data: "IPアドレス、User-Agent、リクエストメタデータ等",
          timing: "サイトアクセス時",
        },
      ],
    },
    regional: {
      title: "地域別補足",
      items: [
        "適用される法令に応じて、アクセス・訂正・削除・処理制限・異議申立て等の権利が認められる場合があります。権利行使やご懸念は GitHub issue からご連絡ください。",
      ],
    },
  },
  en: {
    notice:
      "converTeXcel is a free converter with no ads and no account. Conversion runs mainly in your browser, and the service is not designed to collect personal data. This page is a transparency summary.",
    sections: [
      {
        title: "Basic policy",
        bullets: [
          "Conversion runs mainly in your browser via Rust/WebAssembly.",
          "Graph (gnuplot) previews are also rendered in the browser and are not sent externally.",
          "Only when you run a PDF preview, the generated code and necessary data are sent to texlive.net after your consent.",
          "No ad tracking, behavioral targeting, or sale of data.",
          "No name, email address, or account registration is required.",
        ],
      },
      {
        title: "Your data and rights",
        paragraphs: [
          "Your input generally stays in your browser. Input and settings stored in localStorage can be deleted from your browser settings at any time.",
          "Share links include your input in the URL itself, so manage who you share them with.",
        ],
      },
      {
        title: "Contact and problem reports",
        paragraphs: [
          `For questions, bug reports, or privacy concerns, please open a GitHub issue: ${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "Data processed, purpose, and retention",
      headers: {
        category: "Data category",
        purpose: "Purpose",
        legalBasis: "Legal basis",
        retention: "Retention",
      },
      rows: [
        {
          category: "Pasted table data and generated LaTeX/CSV/TikZ/gnuplot code",
          purpose: "Generate, edit, and preview conversion results",
          legalBasis: "Responding to your actions and requests",
          retention: "Normally in-browser only; if saved to localStorage, until you delete it.",
        },
        {
          category: "Input and display settings in localStorage",
          purpose: "Restore input and keep settings",
          legalBasis: "Your choice",
          retention: "Until you delete it in your browser or the app overwrites it.",
        },
        {
          category: "Technical data such as IP address, User-Agent, and request logs",
          purpose: "Delivery, security, and incident investigation",
          legalBasis: "Legitimate interest or legal obligation",
          retention: "According to the hosting/CDN provider's log retention settings.",
        },
      ],
    },
    thirdParties: {
      title: "Third parties and international transfers",
      intro: "This service may use the following external services.",
      rows: [
        {
          service: "texlive.net",
          purpose: "Generate PDF preview",
          data: "Table/graph code, graph CSV, and data needed to compile",
          timing: "After you consent in the confirmation dialog",
        },
        {
          service: "Cloudflare Pages/Workers or equivalent hosting/CDN",
          purpose: "Site delivery, TLS, security, logs",
          data: "IP address, User-Agent, request metadata, etc.",
          timing: "When you access the site",
        },
      ],
    },
    regional: {
      title: "Regional notes",
      items: [
        "Depending on applicable law, you may have rights such as access, correction, deletion, restriction, and objection. To exercise rights or raise concerns, please open a GitHub issue.",
      ],
    },
  },
  zh: {
    notice:
      "converTeXcel 是一款免费、无广告、无需账户的转换工具。转换主要在您的浏览器中完成，本服务并非以收集个人信息为目的。本页面为透明度概要。",
    sections: [
      {
        title: "基本方针",
        bullets: [
          "转换处理主要通过浏览器内的 Rust/WebAssembly 完成。",
          "图表（gnuplot）预览同样在浏览器内渲染，不会发送到外部。",
          "仅在您运行 PDF 预览时，会在您同意后将生成的代码及必要数据发送至 texlive.net。",
          "不进行广告追踪、行为定向或数据销售。",
          "无需姓名、电子邮箱或注册账户。",
        ],
      },
      {
        title: "数据处理与您的权利",
        paragraphs: [
          "您的输入通常仅保留在浏览器内。保存在 localStorage 中的输入和设置可随时通过浏览器设置删除。",
          "分享链接会将输入内容包含在 URL 中，请注意分享对象。",
        ],
      },
      {
        title: "联系与问题反馈",
        paragraphs: [
          `如有疑问、缺陷反馈或隐私方面的意见，请通过 GitHub issue 联系：${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "处理的数据、目的与保存期限",
      headers: {
        category: "数据类别",
        purpose: "目的",
        legalBasis: "法律依据",
        retention: "保存期限",
      },
      rows: [
        {
          category: "粘贴的表格数据，生成的 LaTeX/CSV/TikZ/gnuplot 代码",
          purpose: "生成、编辑与预览转换结果",
          legalBasis: "响应您的操作与请求",
          retention: "通常仅在浏览器内；若保存到 localStorage，则保留至您删除为止。",
        },
        {
          category: "localStorage 中的输入内容与显示设置",
          purpose: "恢复输入、保留设置",
          legalBasis: "您的选择",
          retention: "直至您在浏览器中删除，或被应用覆盖。",
        },
        {
          category: "IP 地址、User-Agent、请求日志等技术数据",
          purpose: "分发、安全与故障排查",
          legalBasis: "正当利益或法律义务",
          retention: "依据托管/CDN 提供商的日志保留设置。",
        },
      ],
    },
    thirdParties: {
      title: "第三方与跨境传输",
      intro: "本服务可能使用以下外部服务。",
      rows: [
        {
          service: "texlive.net",
          purpose: "生成 PDF 预览",
          data: "表格/图表代码、图表 CSV 及编译所需数据",
          timing: "在确认对话框中同意后",
        },
        {
          service: "Cloudflare Pages/Workers 或同等托管/CDN",
          purpose: "网站分发、TLS、安全、日志",
          data: "IP 地址、User-Agent、请求元数据等",
          timing: "访问网站时",
        },
      ],
    },
    regional: {
      title: "地区补充",
      items: [
        "根据适用法律，您可能享有访问、更正、删除、限制处理、反对等权利。如需行使权利或提出关切，请通过 GitHub issue 联系。",
      ],
    },
  },
  "zh-Hant": {
    notice:
      "converTeXcel 是一款免費、無廣告、無需帳號的轉換工具。轉換主要在您的瀏覽器中完成，本服務並非以收集個人資訊為目的。本頁面為透明度概要。",
    sections: [
      {
        title: "基本方針",
        bullets: [
          "轉換處理主要透過瀏覽器內的 Rust/WebAssembly 完成。",
          "圖表（gnuplot）預覽同樣在瀏覽器內算繪，不會傳送到外部。",
          "僅在您執行 PDF 預覽時，會在您同意後將產生的程式碼及必要資料傳送至 texlive.net。",
          "不進行廣告追蹤、行為定向或資料販售。",
          "無需姓名、電子郵件或註冊帳號。",
        ],
      },
      {
        title: "資料處理與您的權利",
        paragraphs: [
          "您的輸入內容通常僅保留在瀏覽器內。儲存在 localStorage 中的輸入與設定可隨時透過瀏覽器設定刪除。",
          "分享連結會將輸入內容包含在 URL 中，請注意分享對象。",
        ],
      },
      {
        title: "聯絡與問題回報",
        paragraphs: [
          `如有疑問、錯誤回報或隱私方面的意見，請透過 GitHub issue 聯絡：${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "處理的資料、目的與保存期限",
      headers: {
        category: "資料類別",
        purpose: "目的",
        legalBasis: "法律依據",
        retention: "保存期限",
      },
      rows: [
        {
          category: "貼上的表格資料，產生的 LaTeX/CSV/TikZ/gnuplot 程式碼",
          purpose: "產生、編輯與預覽轉換結果",
          legalBasis: "回應您的操作與請求",
          retention: "通常僅在瀏覽器內；若儲存到 localStorage，則保留至您刪除為止。",
        },
        {
          category: "localStorage 中的輸入內容與顯示設定",
          purpose: "復原輸入、保留設定",
          legalBasis: "您的選擇",
          retention: "直到您在瀏覽器中刪除，或被應用程式覆寫。",
        },
        {
          category: "IP 位址、User-Agent、請求日誌等技術資料",
          purpose: "傳遞、安全與故障排查",
          legalBasis: "正當利益或法律義務",
          retention: "依託管/CDN 供應商的日誌保留設定。",
        },
      ],
    },
    thirdParties: {
      title: "第三方與跨境傳輸",
      intro: "本服務可能使用以下外部服務。",
      rows: [
        {
          service: "texlive.net",
          purpose: "產生 PDF 預覽",
          data: "表格/圖表程式碼、圖表 CSV 及編譯所需資料",
          timing: "在確認對話框中同意後",
        },
        {
          service: "Cloudflare Pages/Workers 或同等託管/CDN",
          purpose: "網站傳遞、TLS、安全、日誌",
          data: "IP 位址、User-Agent、請求中繼資料等",
          timing: "存取網站時",
        },
      ],
    },
    regional: {
      title: "地區補充",
      items: [
        "依適用法律，您可能享有存取、更正、刪除、限制處理、反對等權利。如需行使權利或提出疑慮，請透過 GitHub issue 聯絡。",
      ],
    },
  },
  es: {
    notice:
      "converTeXcel es un conversor gratuito, sin anuncios y sin cuenta. La conversión se realiza principalmente en tu navegador y el servicio no está diseñado para recopilar datos personales. Esta página es un resumen de transparencia.",
    sections: [
      {
        title: "Política básica",
        bullets: [
          "La conversión se realiza principalmente en tu navegador mediante Rust/WebAssembly.",
          "Las vistas previas de gráficos (gnuplot) también se renderizan en el navegador y no se envían al exterior.",
          "Solo al ejecutar una vista previa en PDF se envían el código generado y los datos necesarios a texlive.net tras tu consentimiento.",
          "Sin seguimiento publicitario, segmentación por comportamiento ni venta de datos.",
          "No se requiere nombre, correo electrónico ni registro de cuenta.",
        ],
      },
      {
        title: "Tus datos y derechos",
        paragraphs: [
          "Tu entrada permanece generalmente en tu navegador. La entrada y la configuración guardadas en localStorage pueden eliminarse desde la configuración del navegador en cualquier momento.",
          "Los enlaces para compartir incluyen tu entrada en la propia URL, así que controla con quién los compartes.",
        ],
      },
      {
        title: "Contacto y reporte de problemas",
        paragraphs: [
          `Para preguntas, informes de errores o cuestiones de privacidad, abre una incidencia (issue) en GitHub: ${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "Datos tratados, finalidad y conservación",
      headers: {
        category: "Categoría de datos",
        purpose: "Finalidad",
        legalBasis: "Base jurídica",
        retention: "Conservación",
      },
      rows: [
        {
          category: "Datos de tabla pegados y código LaTeX/CSV/TikZ/gnuplot generado",
          purpose: "Generar, editar y previsualizar los resultados de conversión",
          legalBasis: "Respuesta a tus acciones y solicitudes",
          retention: "Normalmente solo en el navegador; si se guarda en localStorage, hasta que lo elimines.",
        },
        {
          category: "Entrada y ajustes de visualización en localStorage",
          purpose: "Restaurar la entrada y mantener los ajustes",
          legalBasis: "Tu elección",
          retention: "Hasta que lo elimines en tu navegador o la app lo sobrescriba.",
        },
        {
          category: "Datos técnicos como dirección IP, User-Agent y registros de solicitudes",
          purpose: "Entrega, seguridad e investigación de incidentes",
          legalBasis: "Interés legítimo u obligación legal",
          retention: "Según la configuración de retención de registros del proveedor de hosting/CDN.",
        },
      ],
    },
    thirdParties: {
      title: "Terceros y transferencias internacionales",
      intro: "Este servicio puede utilizar los siguientes servicios externos.",
      rows: [
        {
          service: "texlive.net",
          purpose: "Generar vista previa en PDF",
          data: "Código de tabla/gráfico, CSV del gráfico y datos necesarios para compilar",
          timing: "Tras dar tu consentimiento en el diálogo de confirmación",
        },
        {
          service: "Cloudflare Pages/Workers u hosting/CDN equivalente",
          purpose: "Entrega del sitio, TLS, seguridad, registros",
          data: "Dirección IP, User-Agent, metadatos de solicitud, etc.",
          timing: "Al acceder al sitio",
        },
      ],
    },
    regional: {
      title: "Notas regionales",
      items: [
        "Según la ley aplicable, puedes tener derechos como acceso, rectificación, supresión, limitación y oposición. Para ejercerlos o plantear inquietudes, abre una incidencia en GitHub.",
      ],
    },
  },
  de: {
    notice:
      "converTeXcel ist ein kostenloser Konverter ohne Werbung und ohne Konto. Die Umwandlung erfolgt hauptsächlich in Ihrem Browser, und der Dienst ist nicht darauf ausgelegt, personenbezogene Daten zu erheben. Diese Seite ist eine Transparenzzusammenfassung.",
    sections: [
      {
        title: "Grundsätze",
        bullets: [
          "Die Umwandlung erfolgt hauptsächlich im Browser über Rust/WebAssembly.",
          "Diagramm-Vorschauen (gnuplot) werden ebenfalls im Browser gerendert und nicht nach außen gesendet.",
          "Nur wenn Sie eine PDF-Vorschau ausführen, werden der generierte Code und die erforderlichen Daten nach Ihrer Einwilligung an texlive.net gesendet.",
          "Kein Werbe-Tracking, kein verhaltensbasiertes Targeting, kein Datenverkauf.",
          "Kein Name, keine E-Mail-Adresse und keine Kontoregistrierung erforderlich.",
        ],
      },
      {
        title: "Ihre Daten und Rechte",
        paragraphs: [
          "Ihre Eingaben verbleiben in der Regel in Ihrem Browser. In localStorage gespeicherte Eingaben und Einstellungen können Sie jederzeit über die Browsereinstellungen löschen.",
          "Freigabelinks enthalten Ihre Eingabe in der URL selbst; achten Sie daher darauf, mit wem Sie sie teilen.",
        ],
      },
      {
        title: "Kontakt und Problemmeldungen",
        paragraphs: [
          `Bei Fragen, Fehlermeldungen oder Datenschutzanliegen erstellen Sie bitte ein GitHub-Issue: ${ISSUES_URL}`,
        ],
      },
    ],
    dataTable: {
      title: "Verarbeitete Daten, Zweck und Aufbewahrung",
      headers: {
        category: "Datenkategorie",
        purpose: "Zweck",
        legalBasis: "Rechtsgrundlage",
        retention: "Aufbewahrung",
      },
      rows: [
        {
          category: "Eingefügte Tabellendaten und generierter LaTeX/CSV/TikZ/gnuplot-Code",
          purpose: "Erzeugen, Bearbeiten und Vorschau der Umwandlungsergebnisse",
          legalBasis: "Reaktion auf Ihre Aktionen und Anfragen",
          retention: "Normalerweise nur im Browser; bei Speicherung in localStorage, bis Sie sie löschen.",
        },
        {
          category: "Eingaben und Anzeigeeinstellungen in localStorage",
          purpose: "Eingaben wiederherstellen und Einstellungen behalten",
          legalBasis: "Ihre Wahl",
          retention: "Bis Sie sie im Browser löschen oder die App sie überschreibt.",
        },
        {
          category: "Technische Daten wie IP-Adresse, User-Agent und Anfrageprotokolle",
          purpose: "Auslieferung, Sicherheit und Fehleranalyse",
          legalBasis: "Berechtigtes Interesse oder gesetzliche Pflicht",
          retention: "Gemäß den Protokoll-Aufbewahrungseinstellungen des Hosting-/CDN-Anbieters.",
        },
      ],
    },
    thirdParties: {
      title: "Dritte und internationale Übermittlungen",
      intro: "Dieser Dienst kann die folgenden externen Dienste nutzen.",
      rows: [
        {
          service: "texlive.net",
          purpose: "PDF-Vorschau erzeugen",
          data: "Tabellen-/Diagrammcode, Diagramm-CSV und zum Kompilieren nötige Daten",
          timing: "Nach Ihrer Einwilligung im Bestätigungsdialog",
        },
        {
          service: "Cloudflare Pages/Workers oder gleichwertiges Hosting/CDN",
          purpose: "Auslieferung der Website, TLS, Sicherheit, Protokolle",
          data: "IP-Adresse, User-Agent, Anfrage-Metadaten usw.",
          timing: "Beim Zugriff auf die Website",
        },
      ],
    },
    regional: {
      title: "Regionale Hinweise",
      items: [
        "Je nach geltendem Recht haben Sie möglicherweise Rechte wie Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch. Zur Ausübung oder bei Anliegen erstellen Sie bitte ein GitHub-Issue.",
      ],
    },
  },
}
