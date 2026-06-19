import { GradientText } from "@/components/animate-ui/primitives/texts/gradient"

// テーマ対応の控えめなグラデーション（neutral 基調に馴染むよう foreground/primary を往復）。
const HEADING_GRADIENT =
  "linear-gradient(90deg, var(--primary) 0%, var(--foreground) 35%, var(--muted-foreground) 50%, var(--foreground) 65%, var(--primary) 100%)"

// トップページ下部に表示する日本語の解説セクション。
// 検索エンジン・広告審査向けに、ツールの内容を読み物として説明する。
// 日本語のみ用意しているため、ConvertPage 側で language === "ja" のときだけ描画する。
export function LandingSeoContent() {
  return (
    <section className="mx-auto mt-12 max-w-3xl space-y-8 border-t pt-10 text-sm leading-relaxed">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          <GradientText text="converTeXcel とは" gradient={HEADING_GRADIENT} />
        </h2>
        <p className="text-muted-foreground">
          converTeXcelは、Excel やスプレッドシートの表を貼り付けるだけで、
          LaTeX の表・グラフ や gnuplot のグラフ・CSV を生成できる無料の変換ツールです。
          TeX の記法を知らなくても、画面でプレビューを確認しながら、レポートや論文に貼り付けられる
          きれいな出力を作れます。変換処理の多くはブラウザ内で行われるため、
          入力データは原則として手元のブラウザにとどまります。
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          <GradientText text="主な機能" gradient={HEADING_GRADIENT} />
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Excel/スプレッドシートの表を LaTeX の表へ変換</li>
          <li>TikZ・pgfplotsのグラフコードを生成</li>
          <li>gnuplot スクリプトを生成し、ブラウザ内でグラフを描画</li>
          <li>texlive.net による PDF プレビューで仕上がりを確認</li>
          <li>CSV 書き出し・共有リンク・Excel アドインなどの補助機能</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          <GradientText text="こんな場面に" gradient={HEADING_GRADIENT} />
        </h2>
        <p className="text-muted-foreground">
          実験レポートの測定データを表とグラフにまとめたいとき、論文用に体裁の整った表が必要なとき、
          普段はWordを使っているけどExcel のグラフではなく LaTeX 上のきれいなグラフに描き直したいとき、データはあるのに整形が面倒、という場面で役立ちます。
          詳しい使い方や出力例はドキュメントにまとめています。
        </p>
        <a href="https://docs.convertexcel.net/docs" className="underline underline-offset-4 hover:text-foreground">
          ドキュメントを読む
        </a>
      </div>
    </section>
  )
}
