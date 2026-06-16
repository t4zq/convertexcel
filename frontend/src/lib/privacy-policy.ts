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
      "converTeXcel は無料・アカウント不要の変換ツールです。変換は主にブラウザ内で行い、入力データの収集を目的としません。サービス改善や広告配信のため、Google Analytics と Google AdSense を利用する場合があります。本ページは透明性のための概要です。",
    sections: [
      {
        title: "基本方針",
        bullets: [
          "変換処理は主にブラウザ内の Rust/WebAssembly で行います。",
          "グラフ（gnuplot）のプレビューもブラウザ内で描画し、外部へ送信しません。",
          "PDFプレビューを実行する場合のみ、同意のうえ生成コードと必要なデータを texlive.net へ送信します。",
          "Google Analytics はページ閲覧状況の把握に利用し、貼り付けた表データや生成コードを意図的に送信しません。",
          "Google AdSense による広告が表示される場合があります。広告は変換作業を妨げない位置に限定します。",
          "入力データや生成コードの販売は行いません。",
          "氏名・メールアドレス・アカウント登録は不要です。",
        ],
      },
      {
        title: "Cookie・広告・アクセス解析",
        paragraphs: [
          "Google を含む第三者配信事業者は、Cookie 等を使用して、利用者が本サイトや他のサイトへ過去にアクセスした情報に基づいて広告を配信する場合があります。",
          "Google の広告 Cookie により、Google とそのパートナーは本サイトや他サイトへのアクセス情報に基づいて広告を表示できます。パーソナライズ広告は Google の広告設定（https://www.google.com/settings/ads）から無効にできます。",
          "Google Analytics は、ページURL、参照元、ブラウザや端末の情報、おおまかな地域、イベント情報などを処理する場合があります。表の入力内容や生成コードを分析イベントとして送信しない設計です。",
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
        {
          category: "ページ閲覧、参照元、ブラウザ/端末情報、広告 Cookie 等",
          purpose: "アクセス解析、サービス改善、広告配信、広告効果測定、不正利用防止",
          legalBasis: "利用者の同意が必要な地域では同意、その他の地域では正当な利益",
          retention: "Google Analytics / Google AdSense の設定および Google のポリシーに従います。",
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
        {
          service: "Google Analytics",
          purpose: "アクセス解析、利用状況の把握、サービス改善",
          data: "ページURL、参照元、ブラウザ/端末情報、おおまかな地域、イベント情報等",
          timing: "サイトアクセス時（設定されている場合）",
        },
        {
          service: "Google AdSense",
          purpose: "広告配信、広告効果測定、不正利用防止",
          data: "Cookie、広告識別子、IPアドレス、ブラウザ/端末情報、ページURL等",
          timing: "広告枠が表示されるページの閲覧時（設定されている場合）",
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
      "converTeXcel is a free converter with no account required. Conversion runs mainly in your browser, and the service is not designed to collect your input data. Google Analytics and Google AdSense may be used for service improvement and advertising. This page is a transparency summary.",
    sections: [
      {
        title: "Basic policy",
        bullets: [
          "Conversion runs mainly in your browser via Rust/WebAssembly.",
          "Graph (gnuplot) previews are also rendered in the browser and are not sent externally.",
          "Only when you run a PDF preview, the generated code and necessary data are sent to texlive.net after your consent.",
          "Google Analytics is used to understand page usage, and pasted table data or generated code is not intentionally sent.",
          "Google AdSense ads may be displayed in locations that do not interrupt conversion work.",
          "Input data and generated code are not sold.",
          "No name, email address, or account registration is required.",
        ],
      },
      {
        title: "Cookies, ads, and analytics",
        paragraphs: [
          "Third-party vendors, including Google, may use cookies and similar technologies to serve ads based on your prior visits to this site or other sites.",
          "Google's advertising cookies enable Google and its partners to serve ads based on visits to this site and/or other sites. You can opt out of personalized advertising from Google Ads Settings: https://www.google.com/settings/ads",
          "Google Analytics may process page URL, referrer, browser and device information, approximate region, and event data. Pasted table data and generated code are not sent as analytics events by design.",
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
        {
          category: "Page views, referrer, browser/device information, advertising cookies, etc.",
          purpose: "Analytics, service improvement, ad serving, ad measurement, and abuse prevention",
          legalBasis: "Consent where required by local law, otherwise legitimate interest",
          retention: "According to Google Analytics / Google AdSense settings and Google's policies.",
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
        {
          service: "Google Analytics",
          purpose: "Analytics, usage measurement, and service improvement",
          data: "Page URL, referrer, browser/device information, approximate region, event data, etc.",
          timing: "When you access the site, if configured",
        },
        {
          service: "Google AdSense",
          purpose: "Ad serving, ad measurement, and abuse prevention",
          data: "Cookies, advertising identifiers, IP address, browser/device information, page URL, etc.",
          timing: "When viewing a page with an ad unit, if configured",
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
      "converTeXcel 是一款免费、无需账户的转换工具。转换主要在您的浏览器中完成，本服务并非以收集输入数据为目的。可能会使用 Google Analytics 和 Google AdSense 进行服务改进和广告展示。本页面为透明度概要。",
    sections: [
      {
        title: "基本方针",
        bullets: [
          "转换处理主要通过浏览器内的 Rust/WebAssembly 完成。",
          "图表（gnuplot）预览同样在浏览器内渲染，不会发送到外部。",
          "仅在您运行 PDF 预览时，会在您同意后将生成的代码及必要数据发送至 texlive.net。",
          "Google Analytics 用于了解页面使用情况，不会有意发送粘贴的表格数据或生成代码。",
          "可能会显示 Google AdSense 广告，广告位置会尽量不干扰转换操作。",
          "不会出售输入数据或生成代码。",
          "无需姓名、电子邮箱或注册账户。",
        ],
      },
      {
        title: "Cookie、广告与访问分析",
        paragraphs: [
          "包括 Google 在内的第三方供应商可能会使用 Cookie 等技术，根据您过去访问本网站或其他网站的情况投放广告。",
          "Google 的广告 Cookie 使 Google 及其合作伙伴可以根据您访问本网站和/或互联网上其他网站的情况投放广告。您可以通过 Google 广告设置停用个性化广告：https://www.google.com/settings/ads",
          "Google Analytics 可能处理页面 URL、来源、浏览器和设备信息、大致地区以及事件数据。设计上不会将粘贴的表格数据或生成代码作为分析事件发送。",
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
        {
          category: "页面浏览、来源、浏览器/设备信息、广告 Cookie 等",
          purpose: "访问分析、服务改进、广告投放、广告效果衡量与防止滥用",
          legalBasis: "当地法律要求同意时基于同意，其他情况下基于正当利益",
          retention: "依据 Google Analytics / Google AdSense 的设置及 Google 政策。",
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
        {
          service: "Google Analytics",
          purpose: "访问分析、使用情况把握与服务改进",
          data: "页面 URL、来源、浏览器/设备信息、大致地区、事件数据等",
          timing: "访问网站时（如果已设置）",
        },
        {
          service: "Google AdSense",
          purpose: "广告投放、广告效果衡量与防止滥用",
          data: "Cookie、广告标识符、IP 地址、浏览器/设备信息、页面 URL 等",
          timing: "浏览显示广告位的页面时（如果已设置）",
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
      "converTeXcel 是一款免費、無需帳號的轉換工具。轉換主要在您的瀏覽器中完成，本服務並非以收集輸入資料為目的。可能會使用 Google Analytics 和 Google AdSense 進行服務改善與廣告顯示。本頁面為透明度概要。",
    sections: [
      {
        title: "基本方針",
        bullets: [
          "轉換處理主要透過瀏覽器內的 Rust/WebAssembly 完成。",
          "圖表（gnuplot）預覽同樣在瀏覽器內算繪，不會傳送到外部。",
          "僅在您執行 PDF 預覽時，會在您同意後將產生的程式碼及必要資料傳送至 texlive.net。",
          "Google Analytics 用於了解頁面使用情況，不會有意傳送貼上的表格資料或產生的程式碼。",
          "可能會顯示 Google AdSense 廣告，廣告位置會盡量不干擾轉換操作。",
          "不會販售輸入資料或產生的程式碼。",
          "無需姓名、電子郵件或註冊帳號。",
        ],
      },
      {
        title: "Cookie、廣告與存取分析",
        paragraphs: [
          "包括 Google 在內的第三方供應商可能會使用 Cookie 等技術，根據您過去造訪本網站或其他網站的情況投放廣告。",
          "Google 的廣告 Cookie 使 Google 及其合作夥伴可以根據您造訪本網站和/或網際網路上其他網站的情況投放廣告。您可以透過 Google 廣告設定停用個人化廣告：https://www.google.com/settings/ads",
          "Google Analytics 可能處理頁面 URL、來源、瀏覽器和裝置資訊、大致地區以及事件資料。設計上不會將貼上的表格資料或產生的程式碼作為分析事件傳送。",
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
        {
          category: "頁面瀏覽、來源、瀏覽器/裝置資訊、廣告 Cookie 等",
          purpose: "存取分析、服務改善、廣告投放、廣告效果衡量與防止濫用",
          legalBasis: "當地法律要求同意時基於同意，其他情況下基於正當利益",
          retention: "依 Google Analytics / Google AdSense 的設定及 Google 政策。",
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
        {
          service: "Google Analytics",
          purpose: "存取分析、使用情況掌握與服務改善",
          data: "頁面 URL、來源、瀏覽器/裝置資訊、大致地區、事件資料等",
          timing: "存取網站時（如果已設定）",
        },
        {
          service: "Google AdSense",
          purpose: "廣告投放、廣告效果衡量與防止濫用",
          data: "Cookie、廣告識別碼、IP 位址、瀏覽器/裝置資訊、頁面 URL 等",
          timing: "瀏覽顯示廣告位的頁面時（如果已設定）",
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
      "converTeXcel es un conversor gratuito que no requiere cuenta. La conversión se realiza principalmente en tu navegador y el servicio no está diseñado para recopilar tus datos de entrada. Se pueden usar Google Analytics y Google AdSense para mejorar el servicio y mostrar anuncios. Esta página es un resumen de transparencia.",
    sections: [
      {
        title: "Política básica",
        bullets: [
          "La conversión se realiza principalmente en tu navegador mediante Rust/WebAssembly.",
          "Las vistas previas de gráficos (gnuplot) también se renderizan en el navegador y no se envían al exterior.",
          "Solo al ejecutar una vista previa en PDF se envían el código generado y los datos necesarios a texlive.net tras tu consentimiento.",
          "Google Analytics se usa para entender el uso de las páginas, y los datos de tabla pegados o el código generado no se envían intencionadamente.",
          "Pueden mostrarse anuncios de Google AdSense en ubicaciones que no interrumpan el trabajo de conversión.",
          "No se venden los datos de entrada ni el código generado.",
          "No se requiere nombre, correo electrónico ni registro de cuenta.",
        ],
      },
      {
        title: "Cookies, anuncios y analítica",
        paragraphs: [
          "Terceros, incluido Google, pueden usar cookies y tecnologías similares para mostrar anuncios basados en visitas anteriores a este sitio u otros sitios.",
          "Las cookies publicitarias de Google permiten que Google y sus socios muestren anuncios basados en visitas a este sitio y/o a otros sitios de Internet. Puedes inhabilitar los anuncios personalizados desde la configuración de anuncios de Google: https://www.google.com/settings/ads",
          "Google Analytics puede procesar URL de página, referente, información del navegador y dispositivo, región aproximada y datos de eventos. Por diseño, los datos de tabla pegados y el código generado no se envían como eventos de analítica.",
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
        {
          category: "Vistas de página, referente, información de navegador/dispositivo, cookies publicitarias, etc.",
          purpose: "Analítica, mejora del servicio, publicación de anuncios, medición publicitaria y prevención de abuso",
          legalBasis: "Consentimiento cuando lo exija la ley local; en otros casos, interés legítimo",
          retention: "Según la configuración de Google Analytics / Google AdSense y las políticas de Google.",
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
        {
          service: "Google Analytics",
          purpose: "Analítica, medición de uso y mejora del servicio",
          data: "URL de página, referente, información de navegador/dispositivo, región aproximada, datos de eventos, etc.",
          timing: "Al acceder al sitio, si está configurado",
        },
        {
          service: "Google AdSense",
          purpose: "Publicación de anuncios, medición publicitaria y prevención de abuso",
          data: "Cookies, identificadores publicitarios, dirección IP, información de navegador/dispositivo, URL de página, etc.",
          timing: "Al ver una página con un bloque de anuncios, si está configurado",
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
      "converTeXcel ist ein kostenloser Konverter ohne Kontoerfordernis. Die Umwandlung erfolgt hauptsächlich in Ihrem Browser, und der Dienst ist nicht darauf ausgelegt, Ihre Eingabedaten zu sammeln. Google Analytics und Google AdSense können zur Verbesserung des Dienstes und für Werbung verwendet werden. Diese Seite ist eine Transparenzzusammenfassung.",
    sections: [
      {
        title: "Grundsätze",
        bullets: [
          "Die Umwandlung erfolgt hauptsächlich im Browser über Rust/WebAssembly.",
          "Diagramm-Vorschauen (gnuplot) werden ebenfalls im Browser gerendert und nicht nach außen gesendet.",
          "Nur wenn Sie eine PDF-Vorschau ausführen, werden der generierte Code und die erforderlichen Daten nach Ihrer Einwilligung an texlive.net gesendet.",
          "Google Analytics wird verwendet, um die Seitennutzung zu verstehen; eingefügte Tabellendaten oder generierter Code werden nicht absichtlich gesendet.",
          "Google AdSense-Anzeigen können an Stellen erscheinen, die die Konvertierungsarbeit nicht unterbrechen.",
          "Eingabedaten und generierter Code werden nicht verkauft.",
          "Kein Name, keine E-Mail-Adresse und keine Kontoregistrierung erforderlich.",
        ],
      },
      {
        title: "Cookies, Anzeigen und Analyse",
        paragraphs: [
          "Drittanbieter, einschließlich Google, können Cookies und ähnliche Technologien verwenden, um Anzeigen auf Grundlage früherer Besuche auf dieser oder anderen Websites zu schalten.",
          "Die Werbe-Cookies von Google ermöglichen Google und seinen Partnern, Anzeigen basierend auf Besuchen dieser Website und/oder anderer Websites im Internet zu schalten. Personalisierte Werbung kann über die Google-Anzeigeneinstellungen deaktiviert werden: https://www.google.com/settings/ads",
          "Google Analytics kann Seiten-URL, Referrer, Browser- und Geräteinformationen, ungefähre Region und Ereignisdaten verarbeiten. Eingefügte Tabellendaten und generierter Code werden bewusst nicht als Analyseereignisse gesendet.",
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
        {
          category: "Seitenaufrufe, Referrer, Browser-/Geräteinformationen, Werbe-Cookies usw.",
          purpose: "Analyse, Verbesserung des Dienstes, Anzeigenschaltung, Anzeigenmessung und Missbrauchsvermeidung",
          legalBasis: "Einwilligung, wo lokal gesetzlich erforderlich; andernfalls berechtigtes Interesse",
          retention: "Gemäß den Einstellungen von Google Analytics / Google AdSense und den Google-Richtlinien.",
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
        {
          service: "Google Analytics",
          purpose: "Analyse, Nutzungsmetrik und Verbesserung des Dienstes",
          data: "Seiten-URL, Referrer, Browser-/Geräteinformationen, ungefähre Region, Ereignisdaten usw.",
          timing: "Beim Zugriff auf die Website, sofern konfiguriert",
        },
        {
          service: "Google AdSense",
          purpose: "Anzeigenschaltung, Anzeigenmessung und Missbrauchsvermeidung",
          data: "Cookies, Werbe-IDs, IP-Adresse, Browser-/Geräteinformationen, Seiten-URL usw.",
          timing: "Beim Anzeigen einer Seite mit Anzeigenblock, sofern konfiguriert",
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
