// 読み物コンテンツ（ガイド / FAQ / About / お問い合わせ / 利用規約）。
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

export const guidePage: SitePage = {
  seoTitle: "使い方ガイド - Excel表をLaTeX・グラフへ変換する手順 | converTeXcel",
  seoDescription:
    "converTeXcel の使い方を手順で解説します。Excelやスプレッドシートの表を貼り付けて、LaTeXの表（booktabs / siunitx）、pgfplots・gnuplotのグラフ、CSVを生成し、PDFで確認するまでの流れと設定のコツをまとめました。",
  eyebrow: "使い方ガイド",
  title: "Excel表をLaTeX・グラフへ変換する使い方",
  intro:
    "converTeXcel は、Excelやスプレッドシートの表を貼り付けるだけで、LaTeXの表・pgfplotsのグラフ・gnuplotスクリプト・CSVを生成できる無料ツールです。TeXの記法を覚えていなくても、画面で確認しながらレポート用の出力を整えられます。ここでは基本的な流れと、きれいに仕上げるためのポイントを順を追って説明します。",
  sections: [
    {
      title: "全体の流れ（4ステップ）",
      blocks: [
        {
          type: "ol",
          items: [
            "Excelやスプレッドシートで表を選択してコピーし、入力欄に貼り付けます。",
            "入力設定で、ヘッダー行の有無・数値の丸め・表のスタイルなどを整えます。",
            "出力タブ（表 / pgfplots / gnuplot / CSV）から欲しい形式を選びます。",
            "PDFプレビューやグラフ描画で見た目を確認し、コードをコピーしてレポートに貼り付けます。",
          ],
        },
        {
          type: "p",
          text: "入力欄が空のときは例のデータが薄く表示されます。自分のデータを貼り付けると、その内容に切り替わって出力が生成されます。",
        },
      ],
    },
    {
      title: "ステップ1: データを貼り付ける",
      blocks: [
        {
          type: "p",
          text: "ExcelやGoogleスプレッドシートでセル範囲を選択してコピーし、「貼り付け」タブのテキストエリアに貼り付けます。Excelからのコピーはタブ区切り、CSVファイルからのコピーはカンマ区切りとして自動的に認識されます。",
        },
        {
          type: "p",
          text: "キーボードからの手入力や、行・列を追加しながら入力したい場合は「フォーム入力」タブを使うと、ヘッダー名と数値をセル単位で入力できます。",
        },
        {
          type: "p",
          text: "貼り付け例（タブ区切り。1列目が x、2列目以降が y 系列）:",
        },
        {
          type: "code",
          code: "x\ty1\ty2\n1\t2.3\t4.5\n2\t3.1\t5.2\n3\t4.8\t5.9\n4\t6.0\t6.1\n5\t7.2\t6.4",
        },
      ],
    },
    {
      title: "ステップ2: 入力設定を整える",
      blocks: [
        {
          type: "p",
          text: "「入力設定」を開くと、データの読み取り方と表の体裁を調整できます。主な項目は次のとおりです。",
        },
        {
          type: "ul",
          items: [
            "ヘッダー行あり: 先頭行を列見出しとして扱います。",
            "丸め: なし / 小数点桁 / 有効数字 から選び、桁数を指定できます。",
            "booktabs: 罫線をbooktabsスタイル（\\toprule, \\midrule, \\bottomrule）にして、論文・レポート向けの見やすい表にします。",
            "siunitx: 数値列を S 列で揃え、単位や桁区切りを正しく組版します。",
            "入力を正規化: 余分な空白や全角・半角の揺れを整えます。",
          ],
        },
        {
          type: "p",
          text: "画面右側の「diagnostics（診断）」には、列数の不一致や数値として読めないセルなどの問題が表示されます。グラフがうまく出ないときは、まずここを確認してください。",
        },
      ],
    },
    {
      title: "ステップ3: 出力形式を選ぶ",
      blocks: [
        { type: "h3", text: "LaTeXの表（table.tex）" },
        {
          type: "p",
          text: "貼り付けた表を、そのままレポートに貼れるLaTeXの表コードに変換します。booktabs と siunitx を有効にすると、次のような体裁の整った表が得られます。",
        },
        {
          type: "code",
          code: "\\begin{table}[htbp]\n  \\centering\n  \\caption{測定結果}\n  \\begin{tabular}{S S S}\n    \\toprule\n    {$x$} & {$y_1$} & {$y_2$} \\\\\n    \\midrule\n    1 & 2.3 & 4.5 \\\\\n    2 & 3.1 & 5.2 \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}",
        },
        { type: "h3", text: "pgfplotsのグラフ（plot.pgfplots）" },
        {
          type: "p",
          text: "同じデータからLaTeX上で描画できるpgfplots（TikZ）のグラフコードを生成します。軸ラベル・凡例・点や線の種類に加え、最小二乗法による近似曲線（直線・2次・指数・対数・べき乗など）や、片対数・両対数の軸スケールも設定できます。LaTeX文書内でそのままコンパイルすれば、本文のフォントと統一された高品質なグラフになります。",
        },
        { type: "h3", text: "gnuplotスクリプト（plot.gp）" },
        {
          type: "p",
          text: "gnuplot用のスクリプトを生成し、ブラウザ内でその場でグラフを描画してSVG/画像として確認・保存できます（このプレビューは外部送信なしでブラウザ内処理です）。gnuplotを使い慣れている場合や、LaTeX以外でグラフが欲しい場合に便利です。",
        },
        { type: "h3", text: "CSV" },
        {
          type: "p",
          text: "整形・正規化した表をCSVとして書き出せます。別のツールに渡したいときに使います。",
        },
      ],
    },
    {
      title: "ステップ4: プレビューして貼り付ける",
      blocks: [
        {
          type: "ul",
          items: [
            "表・pgfplotsは「PDF確認」ボタンで texlive.net 上でコンパイルし、実際の見た目をPDFで確認できます（送信前に確認ダイアログが出ます）。",
            "gnuplotは「グラフを描画」でブラウザ内に即座に描画されます。",
            "仕上がったらコードをコピーして、LaTeX文書やレポートに貼り付けてください。",
          ],
        },
        {
          type: "p",
          text: "表やグラフをコンパイルしたときにエラーが出た場合は、エラー内容を日本語で要約して該当箇所の目安を表示します。よくあるエラーの対処はFAQも参照してください。",
        },
      ],
    },
    {
      title: "便利な機能",
      blocks: [
        {
          type: "ul",
          items: [
            "共有リンク: 入力内容と設定をURLに含めて共有できます。QRコードの表示にも対応しています。",
            "ダーク/ライトテーマと多言語表示に対応しています。",
            "キーボードショートカット: Ctrl+Enter でプレビュー、Alt+1〜3 で出力タブ切替などが使えます。",
            "Excelアドイン: Excel上で選択した範囲をワンクリックで取り込めます。",
          ],
        },
        {
          type: "links",
          items: [
            { label: "Excelアドインの導入手順", to: "/excel-addin" },
            { label: "よくある質問（FAQ）", to: "/faq" },
            { label: "今すぐ変換ツールを使う", to: "/" },
          ],
        },
      ],
    },
  ],
}

export const faqPage: SitePage = {
  seoTitle: "よくある質問（FAQ） | converTeXcel",
  seoDescription:
    "converTeXcel に関するよくある質問。料金、アカウント、データの扱い、対応形式、LaTeXの表やpgfplots・gnuplotグラフ、PDFプレビューやエラーの対処、対応ブラウザなどをまとめました。",
  eyebrow: "FAQ",
  title: "よくある質問",
  intro:
    "converTeXcel についてよく寄せられる質問をまとめました。ここで解決しない場合は、お問い合わせページからご連絡ください。",
  sections: [
    {
      title: "料金はかかりますか？",
      blocks: [
        {
          type: "p",
          text: "いいえ。すべての機能を無料で利用できます。運営費は本サイトに表示される広告でまかなっています。",
        },
      ],
    },
    {
      title: "アカウント登録は必要ですか？",
      blocks: [
        {
          type: "p",
          text: "不要です。氏名やメールアドレスの登録なしに、すぐに変換を始められます。",
        },
      ],
    },
    {
      title: "入力したデータはどこかに送信されますか？",
      blocks: [
        {
          type: "p",
          text: "変換処理は主にブラウザ内（Rust/WebAssembly）で行われ、入力データが自動的にサーバーへ送られることはありません。例外は、あなたが「PDF確認」を実行したときだけで、その場合は確認ダイアログで同意したうえで、表・グラフコードとグラフ用データを texlive.net へ送信してPDFを生成します。gnuplotのプレビューはブラウザ内描画のため外部送信されません。",
        },
        {
          type: "links",
          items: [{ label: "詳細はプライバシーポリシー", to: "/privacy" }],
        },
      ],
    },
    {
      title: "どんな入力形式に対応していますか？",
      blocks: [
        {
          type: "p",
          text: "タブ区切り（Excelからのコピー）とカンマ区切り（CSV）に対応しています。1列目をx軸、2列目以降をy系列として扱います。先頭行を見出しにする場合は「ヘッダー行あり」を有効にしてください。",
        },
      ],
    },
    {
      title: "booktabs や siunitx とは何ですか？",
      blocks: [
        {
          type: "p",
          text: "どちらもLaTeXのパッケージです。booktabs は罫線を整えて論文・レポート向けの読みやすい表を作るためのもの、siunitx は数値や単位をきれいに揃えて組版するためのものです。converTeXcel ではチェックを入れるだけで対応したコードを生成します。出力をコンパイルするには、LaTeX文書のプリアンブルで \\usepackage{booktabs} や \\usepackage{siunitx} を読み込んでください。",
        },
      ],
    },
    {
      title: "pgfplots と gnuplot はどう違いますか？",
      blocks: [
        {
          type: "p",
          text: "pgfplots はLaTeX内でグラフを描くパッケージで、本文と同じフォント・品質でグラフを埋め込めるのが利点です。gnuplot は独立したグラフ描画ツールで、本ツールではブラウザ内ですぐにプレビューできます。LaTeXレポートに埋め込むなら pgfplots、手早く描画結果を見たい・LaTeX以外で使うなら gnuplot が向いています。",
        },
      ],
    },
    {
      title: "近似曲線（フィッティング）は引けますか？",
      blocks: [
        {
          type: "p",
          text: "はい。pgfplotsのグラフ設定で、直線・2次・3次・指数・対数・べき乗の近似を選べます。系列ごとに個別の近似を設定することもできます。",
        },
      ],
    },
    {
      title: "PDFプレビューが表示されません。",
      blocks: [
        {
          type: "ul",
          items: [
            "通信環境を確認し、しばらく待ってから再試行してください（外部の texlive.net を利用します）。",
            "連続送信を防ぐクールダウン中は送信できません。表示が消えるまでお待ちください。",
            "コンパイルエラーの場合は、エラー内容と該当行の目安が表示されます。未定義コマンドはパッケージの読み込み漏れ、括弧の過不足は { } の対応を確認してください。",
          ],
        },
      ],
    },
    {
      title: "対応ブラウザ・スマホでも使えますか？",
      blocks: [
        {
          type: "p",
          text: "最新版の Chrome / Edge / Firefox / Safari に対応しています。スマートフォンのブラウザでも利用できますが、コード編集や2画面表示はパソコンの大きな画面のほうが快適です。",
        },
      ],
    },
    {
      title: "生成したコードを論文やレポートに使ってよいですか？",
      blocks: [
        {
          type: "p",
          text: "はい。あなたが入力したデータから生成された表・グラフ・コードは、あなたのものとして自由に利用できます。学校のレポート、論文、商用文書などにご利用いただけます。",
        },
      ],
    },
    {
      title: "Excelアドインはどうやって入れますか？",
      blocks: [
        {
          type: "p",
          text: "Excelアドインの導入手順ページから manifest.xml を入手し、Excelに読み込むことで、選択範囲をワンクリックで取り込めるようになります。",
        },
        {
          type: "links",
          items: [{ label: "Excelアドインの導入手順", to: "/excel-addin" }],
        },
      ],
    },
  ],
}

export const aboutPage: SitePage = {
  seoTitle: "converTeXcel について | Excel表からLaTeX・グラフを作る無料ツール",
  seoDescription:
    "converTeXcel は、Excelやスプレッドシートの表からLaTeXの表・pgfplots/gnuplotのグラフ・CSVを生成する無料ツールです。開発の背景、特徴、技術、運営者情報を紹介します。",
  eyebrow: "About",
  title: "converTeXcel について",
  intro:
    "converTeXcel（コンバーテクセル）は、Excelやスプレッドシートの表を、LaTeXの表やレポート用グラフへすばやく変換するための無料Webツールです。理系のレポートや論文を書く人が、データの整形に費やす時間を減らせるように作りました。",
  sections: [
    {
      title: "開発の背景",
      blocks: [
        {
          type: "p",
          text: "実験レポートや論文では、Excelで集計したデータをLaTeXの表やグラフに作り直す作業が頻繁に発生します。booktabsで罫線を整え、siunitxで桁を揃え、pgfplotsで近似曲線を引く——これらは慣れていないと手間がかかり、記法のミスでコンパイルが通らないことも珍しくありません。converTeXcel は、こうした「データはあるのに整形が面倒」という場面を、貼り付けるだけで解決することを目指しています。",
        },
      ],
    },
    {
      title: "特徴",
      blocks: [
        {
          type: "ul",
          items: [
            "Excel/スプレッドシートの表を貼り付けるだけでLaTeXの表を生成（booktabs・siunitx対応）。",
            "pgfplots（TikZ）とgnuplotのグラフコードを生成。近似曲線や対数軸にも対応。",
            "PDFプレビューと、gnuplotのブラウザ内描画で仕上がりを確認。",
            "CSVの書き出し、共有リンク、Excelアドインなどの補助機能。",
            "登録不要・無料。多言語・ダーク/ライトテーマ対応。",
          ],
        },
      ],
    },
    {
      title: "技術とプライバシー",
      blocks: [
        {
          type: "p",
          text: "変換処理の多くは、ブラウザ内で動作するRust/WebAssemblyのエンジンで行われます。入力データは原則としてブラウザ内にとどまり、PDFプレビュー時にのみ、同意のうえ外部サービス（texlive.net）へ送信されます。データの扱いについてはプライバシーポリシーで詳しく説明しています。",
        },
        {
          type: "links",
          items: [
            { label: "プライバシーポリシー", to: "/privacy" },
            { label: "使い方ガイド", to: "/guide" },
          ],
        },
      ],
    },
    {
      title: "運営・お問い合わせ",
      blocks: [
        {
          type: "p",
          text: "本サイトは個人により運営されています。本サービスは無料で提供し、運営費は広告（Google AdSense）でまかなっています。ご質問・ご要望・不具合のご連絡はお問い合わせページからお願いします。",
        },
        {
          type: "links",
          items: [{ label: "お問い合わせ", to: "/contact" }],
        },
      ],
    },
  ],
}

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
