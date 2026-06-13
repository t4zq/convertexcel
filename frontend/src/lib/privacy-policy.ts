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

export const privacyPolicy: Record<Language, PrivacyPolicyContent> = {
  ja: {
    notice:
      "本ページは主要な個人情報保護法制を参考にした透明性通知です。運営者名・住所・問い合わせ先は公開しない方針のため、特定地域の法令上求められる表示事項を完全に満たすものではありません。",
    sections: [
      {
        title: "管理者情報",
        paragraphs: [
          "本サービスの管理者は converTeXcel の運営者です。運営者名、住所、メールアドレス等の連絡先は本ページでは公開しません。",
          "連絡先を公開しないため、法令上の権利行使や苦情申立ての受付方法が必要な地域では、別途公開方法を検討する必要があります。",
        ],
      },
      {
        title: "基本方針",
        bullets: [
          "変換処理は原則としてブラウザ内の Rust/WebAssembly で行います。",
          "グラフ（gnuplot）のプレビューもブラウザ内（WebAssembly）で描画し、外部へ送信しません。",
          "PDFプレビューを実行する場合のみ、利用者の同意後に生成コードと必要なデータを texlive.net へ送信します。",
          "広告トラッキング、行動ターゲティング、販売目的の第三者提供は行いません。",
          "氏名、メールアドレス、アカウント登録を変換機能の利用条件にしません。",
        ],
      },
      {
        title: "利用者の権利",
        paragraphs: [
          "適用法令に応じて、利用者はアクセス、訂正、削除、利用停止、処理制限、異議申立て、データポータビリティ、同意撤回、監督機関への苦情申立て等の権利を有する場合があります。",
          "localStorage に保存されたデータはブラウザ設定から削除できます。共有リンクはURL自体に入力内容を含むため、共有先の管理に注意してください。",
        ],
      },
      {
        title: "安全管理・未成年者",
        paragraphs: [
          "本サービスは、入力データの最小化、ブラウザ内処理、HTTPS配信、不要なサーバー保存の回避によりリスクを低減します。",
          "未成年者の個人情報や機密情報を表データに含めないでください。法令上保護者同意が必要な場合、利用者側で確認してください。",
        ],
      },
      {
        title: "変更",
        paragraphs: [
          "本ポリシーはサービス内容、利用する外部サービス、適用法令の変更に応じて更新します。重要な変更はこのページで告知します。",
        ],
      },
    ],
    dataTable: {
      title: "処理するデータ、目的、法的根拠、保存期間",
      headers: {
        category: "データカテゴリ",
        purpose: "目的",
        legalBasis: "法的根拠",
        retention: "保存期間",
      },
      rows: [
        {
          category: "貼り付けた表データ、生成されたLaTeX/CSV/TikZ/gnuplotコード",
          purpose: "変換結果の生成、編集、プレビュー",
          legalBasis: "契約履行または利用者の要求への対応。同意が必要な地域では利用者の操作・同意。",
          retention: "通常はブラウザ内のみ。localStorage保存が有効な場合は利用者が削除するまで。",
        },
        {
          category: "localStorageの入力内容・表示設定",
          purpose: "入力復元、設定保持、利便性向上",
          legalBasis: "正当な利益または利用者の同意/選択",
          retention: "利用者がブラウザで削除するまで、またはアプリが上書きするまで。",
        },
        {
          category: "共有リンクに含まれる入力データ",
          purpose: "入力内容を他者または別端末で復元",
          legalBasis: "利用者の明示的な共有操作",
          retention: "本サービスは通常サーバー保存しません。URLを受け取った第三者側で保持される場合があります。",
        },
        {
          category: "PDFプレビュー送信データ",
          purpose: "texlive.netでPDFを生成",
          legalBasis: "送信前ダイアログでの同意",
          retention: "本サービス側では保存しません。texlive.net側の処理・ログ保持は同サービスの運用に従います。",
        },
        {
          category: "IPアドレス、User-Agent、リクエストログ等の技術データ",
          purpose: "配信、セキュリティ、不正利用対策、障害調査",
          legalBasis: "正当な利益、法的義務、または地域法で求められる根拠",
          retention: "ホスティング/CDN提供者のログ保持設定に従います。運営者は本番設定で期間を明記してください。",
        },
      ],
    },
    thirdParties: {
      title: "第三者・国外移転",
      intro:
        "本サービスは以下の外部サービスを利用する場合があります。国・地域、契約、標準契約条項、十分性認定、または利用者同意が必要な場合は本番運用で確認してください。",
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
          service: "Google Search Console",
          purpose: "検索結果での表示状況確認",
          data: "検索パフォーマンス集計データ。アプリ内に追跡タグは追加しません。",
          timing: "運営者がSearch Consoleを利用する場合",
        },
      ],
    },
    regional: {
      title: "地域別補足",
      items: [
        "EU/EEA・スペイン・ドイツ: GDPRに基づき、管理者情報、処理目的、法的根拠、保存期間、権利、監督機関への苦情、国外移転情報を表示します。",
        "日本: 個人情報保護法に基づき、利用目的、公表事項、安全管理措置、第三者提供、国外提供、開示等請求への対応を明確化します。",
        "中国本土: PIPLの適用対象となる場合、処理者の連絡先、処理目的・方法・カテゴリ・保存期間、権利行使方法、国外提供先、別個同意等を確認します。",
        "台湾: PDPAに基づき、収集目的、カテゴリ、利用期間・地域・対象・方法、権利行使方法、不提供時の影響を表示します。",
        "韓国: PIPAに基づき、処理目的、保有期間、第三者提供、委託、破棄手続、権利行使、苦情窓口を表示します。",
      ],
    },
  },
  en: {
    notice:
      "This page is a transparency notice informed by major privacy frameworks. Because the operator name, address, and contact details are not published, it may not fully satisfy notice requirements in some jurisdictions.",
    sections: [
      {
        title: "Controller information",
        paragraphs: [
          "The controller for this service is the operator of converTeXcel. The operator name, address, email address, and other contact details are not published on this page.",
          "Because no contact channel is published, jurisdictions that require a method for rights requests or complaints may require a separate publication method.",
        ],
      },
      {
        title: "Core principles",
        bullets: [
          "Conversion normally runs in the browser using Rust/WebAssembly.",
          "gnuplot graph previews are also rendered in the browser (WebAssembly) and are not sent externally.",
          "PDF preview data is sent to texlive.net only after the user confirms the submission.",
          "No advertising tracking, behavioral targeting, or sale of personal data is performed.",
          "Names, email addresses, and account registration are not required to use the converter.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "Depending on applicable law, you may have rights to access, correction, deletion, restriction, objection, portability, withdrawal of consent, and complaint to a supervisory authority.",
          "Data stored in localStorage can be deleted from your browser settings. Share links contain the input in the URL, so manage recipients carefully.",
        ],
      },
      {
        title: "Security and minors",
        paragraphs: [
          "The service reduces risk through data minimization, browser-side processing, HTTPS delivery, and avoiding unnecessary server-side storage.",
          "Do not include minors' personal data or confidential information in table data. If parental consent is required by law, confirm it before use.",
        ],
      },
      {
        title: "Changes",
        paragraphs: [
          "This policy may be updated when the service, external services, or applicable laws change. Material changes will be reflected on this page.",
        ],
      },
    ],
    dataTable: {
      title: "Data processed, purposes, legal bases, and retention",
      headers: {
        category: "Data category",
        purpose: "Purpose",
        legalBasis: "Legal basis",
        retention: "Retention",
      },
      rows: [
        {
          category: "Pasted table data and generated LaTeX/CSV/TikZ/gnuplot code",
          purpose: "Generate, edit, and preview conversion output",
          legalBasis: "Performance of a requested service or user request. Consent/user action where required.",
          retention: "Normally browser-only. If localStorage is used, until the user deletes it or it is overwritten.",
        },
        {
          category: "Input and display settings in localStorage",
          purpose: "Restore input, preserve settings, improve convenience",
          legalBasis: "Legitimate interests or user consent/choice",
          retention: "Until deleted in the browser or overwritten by the app.",
        },
        {
          category: "Input encoded in share links",
          purpose: "Restore input for another person or device",
          legalBasis: "The user's explicit share action",
          retention: "Usually not stored by this service. Recipients or third-party systems may retain the URL.",
        },
        {
          category: "PDF preview submission data",
          purpose: "Generate a PDF through texlive.net",
          legalBasis: "Consent in the confirmation dialog",
          retention: "Not stored by this service. texlive.net processing and logs follow that service's operation.",
        },
        {
          category: "IP address, User-Agent, request logs, and similar technical data",
          purpose: "Delivery, security, abuse prevention, and troubleshooting",
          legalBasis: "Legitimate interests, legal obligation, or other basis required by local law",
          retention: "According to hosting/CDN log settings. The operator should publish the configured period.",
        },
      ],
    },
    thirdParties: {
      title: "Third parties and international transfers",
      intro:
        "The service may use the following external services. Countries, contracts, standard contractual clauses, adequacy decisions, or user consent should be confirmed in production where required.",
      rows: [
        {
          service: "texlive.net",
          purpose: "PDF preview generation",
          data: "Table/graph code, graph CSV, and data required for compilation",
          timing: "After consent in the confirmation dialog",
        },
        {
          service: "Cloudflare Pages/Workers or equivalent hosting/CDN",
          purpose: "Site delivery, TLS, security, and logs",
          data: "IP address, User-Agent, request metadata, and similar technical data",
          timing: "When accessing the site",
        },
        {
          service: "Google Search Console",
          purpose: "Review search result visibility",
          data: "Aggregated search performance data. No tracking tag is added inside the app.",
          timing: "If the operator uses Search Console",
        },
      ],
    },
    regional: {
      title: "Regional supplements",
      items: [
        "EU/EEA, Spain, and Germany: GDPR disclosures cover controller details, purposes, legal bases, retention, rights, complaints, and international transfers.",
        "Japan: APPI disclosures should cover purposes of use, public matters, security measures, third-party provision, foreign transfers, and disclosure requests.",
        "Mainland China: If PIPL applies, confirm handler contact, purposes, methods, categories, retention, rights, overseas recipients, and separate consent.",
        "Taiwan: PDPA notices should cover purpose, categories, period, territory, recipients, methods, rights, and consequences of non-provision.",
        "Korea: PIPA notices should cover purposes, retention, third-party provision, outsourcing, destruction, rights, and complaint contacts.",
      ],
    },
  },
  zh: {
    notice:
      "本页面是参考主要隐私法规编写的透明度通知。由于不公开运营者名称、地址和联系方式，本页面可能无法完全满足部分地区的通知要求。",
    sections: [
      {
        title: "处理者和联系方式",
        paragraphs: [
          "本服务的处理者为 converTeXcel 的运营者。本页面不公开运营者名称、地址、电子邮箱或其他联系方式。",
          "由于未公开联系方式，若某些地区要求提供权利请求或投诉渠道，可能需要另行考虑公开方式。",
        ],
      },
      {
        title: "基本原则",
        bullets: [
          "转换通常通过 Rust/WebAssembly 在浏览器中运行。",
          "图表（gnuplot）预览也在浏览器中（WebAssembly）渲染，不会向外部发送。",
          "只有在用户确认后，PDF 预览数据才会发送至 texlive.net。",
          "不进行广告跟踪、行为定向或出售个人信息。",
          "使用转换功能不需要姓名、邮箱或账户注册。",
        ],
      },
      {
        title: "您的权利",
        paragraphs: [
          "根据适用法律，您可能享有访问、更正、删除、限制处理、反对、数据可携、撤回同意以及向监管机构投诉等权利。",
          "localStorage 中的数据可通过浏览器设置删除。共享链接会在 URL 中包含输入内容，请谨慎管理接收方。",
        ],
      },
      {
        title: "安全与未成年人",
        paragraphs: [
          "本服务通过数据最小化、浏览器端处理、HTTPS 传输和避免不必要的服务器保存来降低风险。",
          "请勿在表格数据中包含未成年人个人信息或机密信息。如法律要求监护人同意，请在使用前确认。",
        ],
      },
      {
        title: "变更",
        paragraphs: ["当服务、外部服务或适用法律发生变化时，本政策可能更新。重大变更会反映在本页面。"],
      },
    ],
    dataTable: {
      title: "处理的数据、目的、法律依据和保存期限",
      headers: {
        category: "数据类别",
        purpose: "目的",
        legalBasis: "法律依据",
        retention: "保存期限",
      },
      rows: [
        {
          category: "粘贴的表格数据和生成的 LaTeX/CSV/TikZ/gnuplot 代码",
          purpose: "生成、编辑和预览转换结果",
          legalBasis: "履行用户请求的服务；在需要时基于用户操作或同意。",
          retention: "通常仅在浏览器中处理。如使用 localStorage，则直到用户删除或被应用覆盖。",
        },
        {
          category: "localStorage 中的输入和显示设置",
          purpose: "恢复输入、保存设置、提升便利性",
          legalBasis: "正当利益或用户同意/选择",
          retention: "直到用户在浏览器中删除，或被应用覆盖。",
        },
        {
          category: "共享链接中编码的输入内容",
          purpose: "在他人或其他设备上恢复输入",
          legalBasis: "用户的明确共享操作",
          retention: "本服务通常不保存。接收方或第三方系统可能保存该 URL。",
        },
        {
          category: "PDF 预览提交数据",
          purpose: "通过 texlive.net 生成 PDF",
          legalBasis: "确认对话框中的同意",
          retention: "本服务不保存。texlive.net 的处理和日志遵循其服务运营。",
        },
        {
          category: "IP 地址、User-Agent、请求日志等技术数据",
          purpose: "分发、安全、防滥用和故障排查",
          legalBasis: "正当利益、法定义务或当地法律要求的其他依据",
          retention: "依托管/CDN 日志设置而定。运营者应公开实际配置期限。",
        },
      ],
    },
    thirdParties: {
      title: "第三方和跨境传输",
      intro: "本服务可能使用以下外部服务。正式运营时，应确认国家/地区、合同、标准合同条款、充分性决定或用户同意等要求。",
      rows: [
        {
          service: "texlive.net",
          purpose: "生成 PDF 预览",
          data: "表格/图表代码、图表 CSV 和编译所需数据",
          timing: "在确认对话框同意后",
        },
        {
          service: "Cloudflare Pages/Workers 或同等托管/CDN",
          purpose: "网站分发、TLS、安全和日志",
          data: "IP 地址、User-Agent、请求元数据等技术数据",
          timing: "访问网站时",
        },
        {
          service: "Google Search Console",
          purpose: "确认搜索结果中的展示情况",
          data: "汇总的搜索表现数据。应用内不添加跟踪标签。",
          timing: "运营者使用 Search Console 时",
        },
      ],
    },
    regional: {
      title: "地区补充",
      items: [
        "欧盟/欧洲经济区、西班牙、德国：GDPR 披露包括控制者信息、目的、法律依据、保存期限、权利、投诉和跨境传输。",
        "日本：APPI 披露应包括利用目的、公表事项、安全管理措施、第三方提供、国外提供和披露请求。",
        "中国大陆：如适用 PIPL，应确认处理者联系方式、目的、方式、类别、保存期限、权利、境外接收方和单独同意。",
        "台湾：PDPA 通知应包括目的、类别、期间、地区、对象、方式、权利以及不提供的影响。",
        "韩国：PIPA 通知应包括目的、保存期限、第三方提供、委托、销毁、权利和投诉联系方式。",
      ],
    },
  },
  "zh-Hant": {
    notice:
      "本頁面是參考主要隱私法規編寫的透明度通知。由於不公開營運者名稱、地址和聯絡方式，本頁面可能無法完全滿足部分地區的通知要求。",
    sections: [
      {
        title: "處理者和聯絡方式",
        paragraphs: [
          "本服務的處理者為 converTeXcel 的營運者。本頁面不公開營運者名稱、地址、電子郵件或其他聯絡方式。",
          "由於未公開聯絡方式，若某些地區要求提供權利請求或申訴管道，可能需要另行考慮公開方式。",
        ],
      },
      {
        title: "基本原則",
        bullets: [
          "轉換通常透過 Rust/WebAssembly 在瀏覽器中執行。",
          "圖表（gnuplot）預覽也在瀏覽器中（WebAssembly）算繪，不會向外部傳送。",
          "只有在使用者確認後，PDF 預覽資料才會送至 texlive.net。",
          "不進行廣告追蹤、行為定向或出售個人資料。",
          "使用轉換功能不需要姓名、電子郵件或帳戶註冊。",
        ],
      },
      {
        title: "您的權利",
        paragraphs: [
          "依適用法律，您可能享有查詢、閱覽、複製、更正、刪除、停止處理或利用、限制處理、反對、資料可攜、撤回同意及向主管機關申訴等權利。",
          "localStorage 中的資料可透過瀏覽器設定刪除。分享連結會在 URL 中包含輸入內容，請謹慎管理接收方。",
        ],
      },
      {
        title: "安全與未成年人",
        paragraphs: [
          "本服務透過資料最小化、瀏覽器端處理、HTTPS 傳輸和避免不必要的伺服器保存來降低風險。",
          "請勿在表格資料中包含未成年人個人資料或機密資訊。如法律要求監護人同意，請在使用前確認。",
        ],
      },
      {
        title: "變更",
        paragraphs: ["當服務、外部服務或適用法律發生變化時，本政策可能更新。重大變更會反映在本頁面。"],
      },
    ],
    dataTable: {
      title: "處理的資料、目的、法律依據和保存期限",
      headers: {
        category: "資料類別",
        purpose: "目的",
        legalBasis: "法律依據",
        retention: "保存期限",
      },
      rows: [
        {
          category: "貼上的表格資料和產生的 LaTeX/CSV/TikZ/gnuplot 程式碼",
          purpose: "產生、編輯和預覽轉換結果",
          legalBasis: "履行使用者請求的服務；在需要時基於使用者操作或同意。",
          retention: "通常僅在瀏覽器中處理。如使用 localStorage，則直到使用者刪除或被應用覆寫。",
        },
        {
          category: "localStorage 中的輸入和顯示設定",
          purpose: "恢復輸入、保存設定、提升便利性",
          legalBasis: "正當利益或使用者同意/選擇",
          retention: "直到使用者在瀏覽器中刪除，或被應用覆寫。",
        },
        {
          category: "分享連結中編碼的輸入內容",
          purpose: "在他人或其他裝置上恢復輸入",
          legalBasis: "使用者的明確分享操作",
          retention: "本服務通常不保存。接收方或第三方系統可能保存該 URL。",
        },
        {
          category: "PDF 預覽提交資料",
          purpose: "透過 texlive.net 產生 PDF",
          legalBasis: "確認對話框中的同意",
          retention: "本服務不保存。texlive.net 的處理和日誌依其服務營運。",
        },
        {
          category: "IP 位址、User-Agent、請求日誌等技術資料",
          purpose: "傳遞、安全、防濫用和故障排查",
          legalBasis: "正當利益、法定義務或當地法律要求的其他依據",
          retention: "依託管/CDN 日誌設定而定。營運者應公開實際設定期限。",
        },
      ],
    },
    thirdParties: {
      title: "第三方和跨境傳輸",
      intro: "本服務可能使用以下外部服務。正式營運時，應確認國家/地區、契約、標準契約條款、充分性決定或使用者同意等要求。",
      rows: [
        {
          service: "texlive.net",
          purpose: "產生 PDF 預覽",
          data: "表格/圖表程式碼、圖表 CSV 和編譯所需資料",
          timing: "在確認對話框同意後",
        },
        {
          service: "Cloudflare Pages/Workers 或同等託管/CDN",
          purpose: "網站傳遞、TLS、安全和日誌",
          data: "IP 位址、User-Agent、請求中繼資料等技術資料",
          timing: "造訪網站時",
        },
        {
          service: "Google Search Console",
          purpose: "確認搜尋結果中的顯示情況",
          data: "彙總的搜尋表現資料。應用內不新增追蹤標籤。",
          timing: "營運者使用 Search Console 時",
        },
      ],
    },
    regional: {
      title: "地區補充",
      items: [
        "歐盟/歐洲經濟區、西班牙、德國：GDPR 揭露包括控制者資訊、目的、法律依據、保存期限、權利、申訴和跨境傳輸。",
        "日本：APPI 揭露應包括利用目的、公開事項、安全管理措施、第三方提供、國外提供和揭露請求。",
        "中國大陸：如適用 PIPL，應確認處理者聯絡方式、目的、方式、類別、保存期限、權利、境外接收方和單獨同意。",
        "台灣：PDPA 通知應包括目的、類別、期間、地區、對象、方式、權利以及不提供的影響。",
        "韓國：PIPA 通知應包括目的、保存期限、第三方提供、委託、銷毀、權利和申訴聯絡方式。",
      ],
    },
  },
  ko: {
    notice:
      "이 페이지는 주요 개인정보 보호 법제를 참고한 투명성 고지입니다. 운영자명, 주소, 연락처를 공개하지 않으므로 일부 지역의 고지 요건을 완전히 충족하지 못할 수 있습니다.",
    sections: [
      {
        title: "처리자 및 연락처",
        paragraphs: [
          "본 서비스의 처리자는 converTeXcel 운영자입니다. 이 페이지에는 운영자명, 주소, 이메일 주소 또는 기타 연락처를 공개하지 않습니다.",
          "연락처를 공개하지 않으므로 권리 행사 또는 민원 접수 방법을 요구하는 지역에서는 별도의 공개 방법이 필요할 수 있습니다.",
        ],
      },
      {
        title: "기본 원칙",
        bullets: [
          "변환은 일반적으로 Rust/WebAssembly를 사용해 브라우저 안에서 실행됩니다.",
          "그래프(gnuplot) 미리보기도 브라우저(WebAssembly)에서 렌더링되며 외부로 전송되지 않습니다.",
          "PDF 미리보기 데이터는 사용자가 제출을 확인한 뒤에만 texlive.net으로 전송됩니다.",
          "광고 추적, 행동 기반 타기팅, 개인정보 판매를 하지 않습니다.",
          "변환기 사용에 이름, 이메일 주소, 계정 등록이 필요하지 않습니다.",
        ],
      },
      {
        title: "이용자의 권리",
        paragraphs: [
          "적용 법률에 따라 열람, 정정, 삭제, 처리 제한, 이의 제기, 이동권, 동의 철회, 감독기관 신고 등의 권리가 있을 수 있습니다.",
          "localStorage 데이터는 브라우저 설정에서 삭제할 수 있습니다. 공유 링크는 URL에 입력 내용을 포함하므로 수신자를 신중히 관리해 주세요.",
        ],
      },
      {
        title: "보안 및 미성년자",
        paragraphs: [
          "본 서비스는 데이터 최소화, 브라우저 측 처리, HTTPS 전송, 불필요한 서버 저장 회피로 위험을 낮춥니다.",
          "표 데이터에 미성년자의 개인정보나 기밀 정보를 포함하지 마세요. 법률상 보호자 동의가 필요한 경우 사용 전에 확인해 주세요.",
        ],
      },
      {
        title: "변경",
        paragraphs: ["서비스, 외부 서비스 또는 관련 법률이 변경되면 본 정책이 업데이트될 수 있습니다. 중요한 변경 사항은 이 페이지에 반영됩니다."],
      },
    ],
    dataTable: {
      title: "처리 데이터, 목적, 법적 근거 및 보관 기간",
      headers: {
        category: "데이터 범주",
        purpose: "목적",
        legalBasis: "법적 근거",
        retention: "보관 기간",
      },
      rows: [
        {
          category: "붙여 넣은 표 데이터와 생성된 LaTeX/CSV/TikZ/gnuplot 코드",
          purpose: "변환 결과 생성, 편집, 미리보기",
          legalBasis: "요청된 서비스 이행 또는 이용자 요청. 필요한 경우 이용자 조작/동의.",
          retention: "일반적으로 브라우저 내에서만 처리됩니다. localStorage 사용 시 이용자가 삭제하거나 앱이 덮어쓸 때까지.",
        },
        {
          category: "localStorage의 입력 및 표시 설정",
          purpose: "입력 복원, 설정 유지, 편의성 향상",
          legalBasis: "정당한 이익 또는 이용자 동의/선택",
          retention: "브라우저에서 삭제되거나 앱이 덮어쓸 때까지.",
        },
        {
          category: "공유 링크에 인코딩된 입력",
          purpose: "다른 사람 또는 기기에서 입력 복원",
          legalBasis: "이용자의 명시적 공유 조작",
          retention: "본 서비스는 일반적으로 저장하지 않습니다. 수신자나 제3자 시스템이 URL을 보관할 수 있습니다.",
        },
        {
          category: "PDF 미리보기 제출 데이터",
          purpose: "texlive.net을 통한 PDF 생성",
          legalBasis: "확인 대화상자의 동의",
          retention: "본 서비스는 저장하지 않습니다. texlive.net의 처리 및 로그는 해당 서비스 운영에 따릅니다.",
        },
        {
          category: "IP 주소, User-Agent, 요청 로그 등 기술 데이터",
          purpose: "전송, 보안, 남용 방지, 장애 조사",
          legalBasis: "정당한 이익, 법적 의무 또는 현지 법률상 요구되는 근거",
          retention: "호스팅/CDN 로그 설정에 따릅니다. 운영자는 실제 설정 기간을 공개해야 합니다.",
        },
      ],
    },
    thirdParties: {
      title: "제3자 및 국외 이전",
      intro: "본 서비스는 다음 외부 서비스를 사용할 수 있습니다. 실제 운영 시 국가/지역, 계약, 표준계약조항, 적정성 결정 또는 이용자 동의 필요 여부를 확인해야 합니다.",
      rows: [
        {
          service: "texlive.net",
          purpose: "PDF 미리보기 생성",
          data: "표/그래프 코드, 그래프 CSV, 컴파일에 필요한 데이터",
          timing: "확인 대화상자에서 동의한 후",
        },
        {
          service: "Cloudflare Pages/Workers 또는 동등한 호스팅/CDN",
          purpose: "사이트 전송, TLS, 보안, 로그",
          data: "IP 주소, User-Agent, 요청 메타데이터 등 기술 데이터",
          timing: "사이트 접속 시",
        },
        {
          service: "Google Search Console",
          purpose: "검색 결과 표시 상태 확인",
          data: "집계된 검색 성능 데이터. 앱 안에 추적 태그는 추가하지 않습니다.",
          timing: "운영자가 Search Console을 사용하는 경우",
        },
      ],
    },
    regional: {
      title: "지역별 보충",
      items: [
        "EU/EEA, 스페인, 독일: GDPR 고지는 관리자 정보, 목적, 법적 근거, 보관 기간, 권리, 민원 및 국외 이전을 포함합니다.",
        "일본: APPI 고지는 이용 목적, 공표 사항, 안전관리 조치, 제3자 제공, 국외 제공, 공개 등 청구 대응을 포함해야 합니다.",
        "중국 본토: PIPL이 적용되는 경우 처리자 연락처, 목적, 방법, 범주, 보관 기간, 권리, 국외 수령자 및 별도 동의를 확인합니다.",
        "대만: PDPA 고지는 목적, 범주, 기간, 지역, 수령자, 방법, 권리 및 미제공 시 영향을 포함해야 합니다.",
        "한국: PIPA 고지는 목적, 보유 기간, 제3자 제공, 위탁, 파기, 권리 및 민원 연락처를 포함해야 합니다.",
      ],
    },
  },
  es: {
    notice:
      "Esta página es un aviso de transparencia inspirado en los principales marcos de privacidad. Como no se publican el nombre, la dirección ni los datos de contacto del operador, puede no cumplir plenamente ciertos requisitos de aviso en algunas jurisdicciones.",
    sections: [
      {
        title: "Información del responsable",
        paragraphs: [
          "El responsable del servicio es el operador de converTeXcel. Esta página no publica el nombre, dirección, correo electrónico ni otros datos de contacto del operador.",
          "Al no publicarse un canal de contacto, las jurisdicciones que exijan un método para solicitudes de derechos o reclamaciones pueden requerir una forma de publicación separada.",
        ],
      },
      {
        title: "Principios básicos",
        bullets: [
          "La conversión normalmente se ejecuta en el navegador con Rust/WebAssembly.",
          "Las vistas previas de gráficos (gnuplot) también se renderizan en el navegador (WebAssembly) y no se envían al exterior.",
          "Los datos de vista previa PDF se envían a texlive.net solo después de la confirmación del usuario.",
          "No se realiza seguimiento publicitario, segmentación conductual ni venta de datos personales.",
          "No se requieren nombres, correos electrónicos ni registro de cuenta para usar el conversor.",
        ],
      },
      {
        title: "Tus derechos",
        paragraphs: [
          "Según la ley aplicable, puedes tener derechos de acceso, rectificación, supresión, limitación, oposición, portabilidad, retirada del consentimiento y reclamación ante una autoridad de control.",
          "Los datos en localStorage pueden eliminarse desde la configuración del navegador. Los enlaces compartidos contienen la entrada en la URL, por lo que conviene gestionar los destinatarios con cuidado.",
        ],
      },
      {
        title: "Seguridad y menores",
        paragraphs: [
          "El servicio reduce riesgos mediante minimización de datos, procesamiento en el navegador, entrega HTTPS y evitando almacenamiento innecesario en servidor.",
          "No incluyas datos personales de menores ni información confidencial en las tablas. Si la ley exige consentimiento parental, confírmalo antes de usar el servicio.",
        ],
      },
      {
        title: "Cambios",
        paragraphs: ["Esta política puede actualizarse cuando cambien el servicio, los servicios externos o las leyes aplicables. Los cambios importantes aparecerán en esta página."],
      },
    ],
    dataTable: {
      title: "Datos tratados, fines, bases jurídicas y conservación",
      headers: {
        category: "Categoría de datos",
        purpose: "Finalidad",
        legalBasis: "Base jurídica",
        retention: "Conservación",
      },
      rows: [
        {
          category: "Datos de tabla pegados y código LaTeX/CSV/TikZ/gnuplot generado",
          purpose: "Generar, editar y previsualizar resultados",
          legalBasis: "Ejecución de un servicio solicitado o petición del usuario. Consentimiento/acción cuando sea necesario.",
          retention: "Normalmente solo en el navegador. Si se usa localStorage, hasta que el usuario lo elimine o la app lo sobrescriba.",
        },
        {
          category: "Entrada y ajustes en localStorage",
          purpose: "Restaurar entrada, conservar ajustes y mejorar la comodidad",
          legalBasis: "Intereses legítimos o consentimiento/elección del usuario",
          retention: "Hasta su eliminación en el navegador o sobrescritura por la app.",
        },
        {
          category: "Entrada codificada en enlaces compartidos",
          purpose: "Restaurar la entrada para otra persona o dispositivo",
          legalBasis: "Acción explícita de compartir del usuario",
          retention: "Normalmente no se almacena por este servicio. Destinatarios o terceros pueden conservar la URL.",
        },
        {
          category: "Datos enviados para vista previa PDF",
          purpose: "Generar un PDF mediante texlive.net",
          legalBasis: "Consentimiento en el diálogo de confirmación",
          retention: "Este servicio no los almacena. El tratamiento y logs de texlive.net siguen su propia operación.",
        },
        {
          category: "Dirección IP, User-Agent, logs de solicitud y datos técnicos similares",
          purpose: "Entrega, seguridad, prevención de abuso y resolución de problemas",
          legalBasis: "Intereses legítimos, obligación legal u otra base exigida por la ley local",
          retention: "Según la configuración de logs del hosting/CDN. El operador debe publicar el periodo configurado.",
        },
      ],
    },
    thirdParties: {
      title: "Terceros y transferencias internacionales",
      intro: "El servicio puede usar los siguientes servicios externos. En producción deben confirmarse países, contratos, cláusulas contractuales tipo, decisiones de adecuación o consentimiento cuando proceda.",
      rows: [
        {
          service: "texlive.net",
          purpose: "Generación de vista previa PDF",
          data: "Código de tabla/gráfico, CSV del gráfico y datos necesarios para compilar",
          timing: "Después del consentimiento en el diálogo de confirmación",
        },
        {
          service: "Cloudflare Pages/Workers o hosting/CDN equivalente",
          purpose: "Entrega del sitio, TLS, seguridad y logs",
          data: "Dirección IP, User-Agent, metadatos de solicitud y datos técnicos similares",
          timing: "Al acceder al sitio",
        },
        {
          service: "Google Search Console",
          purpose: "Revisar visibilidad en resultados de búsqueda",
          data: "Datos agregados de rendimiento de búsqueda. No se añade etiqueta de seguimiento dentro de la app.",
          timing: "Si el operador usa Search Console",
        },
      ],
    },
    regional: {
      title: "Suplementos regionales",
      items: [
        "UE/EEE, España y Alemania: las divulgaciones del RGPD cubren responsable, fines, bases jurídicas, conservación, derechos, reclamaciones y transferencias internacionales.",
        "Japón: APPI debe cubrir fines de uso, información pública, medidas de seguridad, cesiones a terceros, transferencias al extranjero y solicitudes de divulgación.",
        "China continental: si aplica PIPL, deben confirmarse contacto del encargado, fines, métodos, categorías, conservación, derechos, destinatarios extranjeros y consentimiento separado.",
        "Taiwán: PDPA debe cubrir finalidad, categorías, periodo, territorio, destinatarios, métodos, derechos y consecuencias de no proporcionar datos.",
        "Corea: PIPA debe cubrir fines, conservación, cesión a terceros, subcontratación, destrucción, derechos y contacto para reclamaciones.",
      ],
    },
  },
  de: {
    notice:
      "Diese Seite ist ein Transparenzhinweis, der an wichtige Datenschutzrahmen angelehnt ist. Da Betreibername, Anschrift und Kontaktdaten nicht veröffentlicht werden, erfüllt sie möglicherweise nicht alle Informationspflichten bestimmter Rechtsordnungen.",
    sections: [
      {
        title: "Informationen zum Verantwortlichen",
        paragraphs: [
          "Verantwortlicher für diesen Dienst ist der Betreiber von converTeXcel. Betreibername, Anschrift, E-Mail-Adresse und sonstige Kontaktdaten werden auf dieser Seite nicht veröffentlicht.",
          "Da kein Kontaktkanal veröffentlicht wird, können Rechtsordnungen, die einen Weg für Betroffenenanfragen oder Beschwerden verlangen, eine gesonderte Veröffentlichung erforderlich machen.",
        ],
      },
      {
        title: "Grundsätze",
        bullets: [
          "Die Umwandlung läuft normalerweise im Browser mit Rust/WebAssembly.",
          "gnuplot-Diagrammvorschauen werden ebenfalls im Browser (WebAssembly) gerendert und nicht extern gesendet.",
          "PDF-Vorschaudaten werden nur nach Bestätigung durch den Nutzer an texlive.net gesendet.",
          "Es gibt kein Werbe-Tracking, kein Behavioral Targeting und keinen Verkauf personenbezogener Daten.",
          "Für die Nutzung des Konverters sind keine Namen, E-Mail-Adressen oder Kontoregistrierung erforderlich.",
        ],
      },
      {
        title: "Ihre Rechte",
        paragraphs: [
          "Je nach anwendbarem Recht können Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit, Widerruf der Einwilligung und Beschwerde bei einer Aufsichtsbehörde bestehen.",
          "Daten in localStorage können in den Browsereinstellungen gelöscht werden. Freigabelinks enthalten die Eingabe in der URL; Empfänger sollten daher sorgfältig gewählt werden.",
        ],
      },
      {
        title: "Sicherheit und Minderjährige",
        paragraphs: [
          "Der Dienst reduziert Risiken durch Datenminimierung, browserseitige Verarbeitung, HTTPS-Auslieferung und Vermeidung unnötiger serverseitiger Speicherung.",
          "Nehmen Sie keine personenbezogenen Daten Minderjähriger oder vertraulichen Informationen in Tabellendaten auf. Falls elterliche Einwilligung erforderlich ist, prüfen Sie dies vor der Nutzung.",
        ],
      },
      {
        title: "Änderungen",
        paragraphs: ["Diese Erklärung kann aktualisiert werden, wenn sich Dienst, externe Dienste oder anwendbares Recht ändern. Wesentliche Änderungen erscheinen auf dieser Seite."],
      },
    ],
    dataTable: {
      title: "Verarbeitete Daten, Zwecke, Rechtsgrundlagen und Aufbewahrung",
      headers: {
        category: "Datenkategorie",
        purpose: "Zweck",
        legalBasis: "Rechtsgrundlage",
        retention: "Aufbewahrung",
      },
      rows: [
        {
          category: "Eingefügte Tabellendaten und erzeugter LaTeX/CSV/TikZ/gnuplot-Code",
          purpose: "Erzeugen, Bearbeiten und Vorschau von Umwandlungsergebnissen",
          legalBasis: "Erfüllung eines angefragten Dienstes oder Nutzeranfrage. Einwilligung/Nutzerhandlung, soweit erforderlich.",
          retention: "Normalerweise nur im Browser. Bei localStorage bis zur Löschung durch den Nutzer oder Überschreibung durch die App.",
        },
        {
          category: "Eingaben und Anzeigeeinstellungen in localStorage",
          purpose: "Eingabe wiederherstellen, Einstellungen erhalten, Bedienkomfort verbessern",
          legalBasis: "Berechtigte Interessen oder Einwilligung/Wahl des Nutzers",
          retention: "Bis zur Löschung im Browser oder Überschreibung durch die App.",
        },
        {
          category: "In Freigabelinks kodierte Eingabe",
          purpose: "Eingabe für andere Personen oder Geräte wiederherstellen",
          legalBasis: "Ausdrückliche Freigabehandlung des Nutzers",
          retention: "Wird von diesem Dienst normalerweise nicht gespeichert. Empfänger oder Drittsysteme können die URL speichern.",
        },
        {
          category: "Daten zur PDF-Vorschau",
          purpose: "PDF-Erzeugung über texlive.net",
          legalBasis: "Einwilligung im Bestätigungsdialog",
          retention: "Dieser Dienst speichert sie nicht. Verarbeitung und Logs bei texlive.net folgen dem Betrieb dieses Dienstes.",
        },
        {
          category: "IP-Adresse, User-Agent, Request-Logs und ähnliche technische Daten",
          purpose: "Auslieferung, Sicherheit, Missbrauchsprävention und Fehleranalyse",
          legalBasis: "Berechtigte Interessen, rechtliche Verpflichtung oder andere lokal erforderliche Grundlage",
          retention: "Gemäß Hosting-/CDN-Logeinstellungen. Der Betreiber sollte die konfigurierte Dauer veröffentlichen.",
        },
      ],
    },
    thirdParties: {
      title: "Dritte und internationale Übermittlungen",
      intro: "Der Dienst kann folgende externe Dienste nutzen. Länder, Verträge, Standardvertragsklauseln, Angemessenheitsbeschlüsse oder Einwilligungen sind im Produktivbetrieb zu prüfen.",
      rows: [
        {
          service: "texlive.net",
          purpose: "PDF-Vorschau",
          data: "Tabellen-/Diagrammcode, Diagramm-CSV und zur Kompilierung erforderliche Daten",
          timing: "Nach Einwilligung im Bestätigungsdialog",
        },
        {
          service: "Cloudflare Pages/Workers oder gleichwertiges Hosting/CDN",
          purpose: "Seitenauslieferung, TLS, Sicherheit und Logs",
          data: "IP-Adresse, User-Agent, Request-Metadaten und ähnliche technische Daten",
          timing: "Beim Zugriff auf die Website",
        },
        {
          service: "Google Search Console",
          purpose: "Überprüfung der Sichtbarkeit in Suchergebnissen",
          data: "Aggregierte Suchleistungsdaten. In der App wird kein Tracking-Tag hinzugefügt.",
          timing: "Wenn der Betreiber Search Console nutzt",
        },
      ],
    },
    regional: {
      title: "Regionale Ergänzungen",
      items: [
        "EU/EWR, Spanien und Deutschland: DSGVO-Hinweise umfassen Verantwortlichen, Zwecke, Rechtsgrundlagen, Aufbewahrung, Rechte, Beschwerden und internationale Übermittlungen.",
        "Japan: APPI-Hinweise sollten Nutzungszwecke, öffentliche Angaben, Sicherheitsmaßnahmen, Drittweitergaben, Auslandsübermittlungen und Offenlegungsanfragen abdecken.",
        "Festlandchina: Falls PIPL gilt, sind Kontakt des Verarbeiters, Zwecke, Methoden, Kategorien, Aufbewahrung, Rechte, ausländische Empfänger und gesonderte Einwilligung zu prüfen.",
        "Taiwan: PDPA-Hinweise sollten Zweck, Kategorien, Zeitraum, Gebiet, Empfänger, Methoden, Rechte und Folgen der Nichtbereitstellung enthalten.",
        "Korea: PIPA-Hinweise sollten Zwecke, Aufbewahrung, Drittweitergabe, Outsourcing, Löschung, Rechte und Beschwerdekontakte enthalten.",
      ],
    },
  },
}
