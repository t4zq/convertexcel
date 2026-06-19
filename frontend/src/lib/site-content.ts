// 読み物コンテンツ（お問い合わせ / 利用規約）。
// 現状は日本語のみ。多言語展開する場合は Record<Language, SitePage> へ拡張する。

export type ContentBlock =
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string }
  | { type: "links"; items: Array<{ label: string; to?: string; href?: string }> }

export type ContentSection = {
  title: string
  blocks: ContentBlock[]
}

export type SitePage = {
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  intro: string
  sections: ContentSection[]
}

export const CONTACT_EMAIL = "contact@convertexcel.net"
const ISSUES_URL = "https://github.com/t4zq/convertexcel/issues"

export const contactPage: SitePage = {
  seoTitle: "お問い合わせ | converTeXcel",
  seoDescription:
    "converTeXcel へのお問い合わせ方法。バグ報告、機能のご要望、プライバシーや広告に関するお問い合わせは、メールまたはGitHubからご連絡いただけます。",
  eyebrow: "Contact",
  title: "お問い合わせ",
  intro:
    "converTeXcel に関するご質問・ご要望・不具合のご報告を歓迎します。以下の方法でご連絡ください。",
  sections: [
    {
      title: "メールでのお問い合わせ",
      blocks: [
        {
          type: "p",
          text: "次のメールアドレス宛にご連絡ください。内容を確認のうえ、必要に応じて返信します。",
        },
        {
          type: "links",
          items: [{ label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` }],
        },
      ],
    },
    {
      title: "GitHubでの不具合・要望の報告",
      blocks: [
        {
          type: "p",
          text: "技術的な不具合の報告や機能のご要望は、GitHubのIssueからもお送りいただけます。",
        },
        {
          type: "links",
          items: [{ label: "GitHub Issues", href: ISSUES_URL }],
        },
      ],
    },
    {
      title: "お問い合わせいただける内容",
      blocks: [
        {
          type: "ul",
          items: [
            "変換結果やコンパイルエラーなど、ツールの不具合に関するご報告",
            "新しい出力形式や設定など、機能のご要望",
            "プライバシー・データの取り扱いに関するご質問",
            "広告に関するお問い合わせ",
            "その他、本サービスに関するご意見",
          ],
        },
        {
          type: "p",
          text: "個人で運営しているため、すべてのお問い合わせに返信できない場合があります。あらかじめご了承ください。",
        },
      ],
    },
  ],
}
export const termsPage: SitePage = {
  seoTitle: "利用規約 | converTeXcel",
  seoDescription:
    "converTeXcel の利用規約。サービス内容、料金と広告、禁止事項、生成物の権利、免責事項、プライバシー、規約の変更などについて定めます。",
  eyebrow: "利用規約",
  title: "利用規約",
  intro:
    "本利用規約（以下「本規約」）は、converTeXcel（以下「本サービス」）の利用条件を定めるものです。本サービスを利用された場合、本規約に同意したものとみなします。",
  sections: [
    {
      title: "第1条（適用）",
      blocks: [
        {
          type: "p",
          text: "本規約は、本サービスの利用に関わる一切の関係に適用されます。利用者は本規約に従って本サービスを利用するものとします。",
        },
      ],
    },
    {
      title: "第2条（サービス内容）",
      blocks: [
        {
          type: "p",
          text: "本サービスは、利用者が入力した表データを、LaTeXの表・pgfplots/gnuplotのグラフコード・CSVなどへ変換し、プレビューを提供するものです。本サービスの内容は、改善のため予告なく変更・追加・終了することがあります。",
        },
      ],
    },
    {
      title: "第3条（料金と広告）",
      blocks: [
        {
          type: "p",
          text: "本サービスは無料で提供されます。運営費をまかなうため、本サービスには第三者配信の広告（Google AdSense等）が表示されます。広告配信におけるCookie等の利用については、プライバシーポリシーをご確認ください。",
        },
      ],
    },
    {
      title: "第4条（禁止事項）",
      blocks: [
        {
          type: "p",
          text: "利用者は、本サービスの利用にあたり、次の行為をしてはなりません。",
        },
        {
          type: "ul",
          items: [
            "法令または公序良俗に違反する行為",
            "本サービスのサーバーやネットワークに過度の負荷をかける行為、不正アクセスを試みる行為",
            "本サービスの運営を妨害する行為",
            "外部サービス（texlive.net等）に対する自動化された大量送信など、迷惑となる行為",
            "その他、運営者が不適切と判断する行為",
          ],
        },
      ],
    },
    {
      title: "第5条（生成物の権利）",
      blocks: [
        {
          type: "p",
          text: "利用者が入力したデータ、および本サービスがそのデータから生成した表・グラフ・コードは、利用者が自由に利用できます。レポート・論文・商用文書を含め、用途に制限はありません。",
        },
      ],
    },
    {
      title: "第6条（免責事項）",
      blocks: [
        {
          type: "p",
          text: "本サービスは現状有姿で提供され、生成結果の正確性・完全性・特定目的への適合性を保証するものではありません。生成されたコードやデータの利用、本サービスの利用または利用不能、外部サービスの停止・変更によって生じた損害について、運営者は一切の責任を負いません。重要な用途では、利用者ご自身で結果を確認してください。",
        },
      ],
    },
    {
      title: "第7条（プライバシー）",
      blocks: [
        {
          type: "p",
          text: "本サービスにおける個人情報・データの取り扱いについては、プライバシーポリシーに定めるとおりとします。",
        },
        {
          type: "links",
          items: [{ label: "プライバシーポリシー", to: "/privacy" }],
        },
      ],
    },
    {
      title: "第8条（規約の変更）",
      blocks: [
        {
          type: "p",
          text: "運営者は、必要と判断した場合、利用者に通知することなく本規約を変更できます。変更後の本規約は、本ページに掲載した時点から効力を生じます。",
        },
      ],
    },
    {
      title: "第9条（準拠法）",
      blocks: [
        {
          type: "p",
          text: "本規約の解釈および適用は、日本法に準拠するものとします。",
        },
      ],
    },
    {
      title: "制定日",
      blocks: [{ type: "p", text: "2026年6月17日" }],
    },
  ],
}
