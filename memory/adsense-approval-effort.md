---
name: adsense-approval-effort
description: AdSense審査通過のため docs/about/contact ページを追加中。contact@ は Cloudflare Email Routing で Gmail 転送（要ダッシュボード設定）
metadata:
  type: project
---

converTeXcel は Google AdSense の審査通過を目指している（広告対応は更新ノート v0.8.0）。審査の主な弱点はツールサイト特有の「低価値コンテンツ」判定と運営者情報の不足。

対応として 2026-06-16 に多言語ページを追加:
- `/docs`（使い方ガイド）, `/about`（運営者情報）, `/contact`（問い合わせ）
- ページ本体は [[update-notes.ts]] と同じパターン（lib に content、pages にコンポーネント、App.tsx ルート、各翻訳の nav キー、sitemap）。
- 二次リンク（Docs/Updates/About/Contact/Privacy）は `AppFooter`（全ページ共通フッター）に集約。ヘッダーは 変換 + Excel アドイン + 言語 + テーマのみ。StatusBar は別の固定バー（24px）なのでフッターは pb-10 でクリアさせている。
- コンテンツ価値向上のため解説記事を追加（lib/guides.ts、`/guides/:slug` を GuidePage が slug で描画、Docs ページ下部から内部リンク）。現状6本: excel-to-latex-table / siunitx-numbers-units / graphs-from-data / pgfplots-basics / pgfplots-error-bars / pgfplots-from-csv。コード例は言語中立（英語ラベル）で共有、散文のみ6言語。GuideBlock に reference 型（外部出典リンク）あり。記事追加は guides 配列に足して sitemap に6言語分追記するだけ。
- pgfplots 記事は手元の pgfplots.pdf（リポジトリ root、*.pdf は .gitignore 済み）を**事実確認のみ**に使い本文は完全オリジナル。マニュアル転載は著作権/AdSenseスクレイピング規約の両面でNG。各記事に CTAN（ctan.org/pkg/pgfplots）への出典リンクを付与。
- Docs/Guides は wiki 風レイアウト `DocsLayout`（左サイドバー: はじめに+全ガイド、記事ページは「このページの内容」TOC も。本文は右 max-w-3xl）。DocsPage / GuidePage が共有。見出しは id=`s-{blockIndex}` でアンカー、TOC は #s-N へジャンプ。サイドバーは lg:sticky。
- Contact ページはメール（[[adsense-approval-effort]] の contact@）に加え、不具合は GitHub Issues（ISSUES_URL = github.com/t4zq/convertexcel/issues）へ誘導。
- ads.txt は frontend/public/ads.txt に配置済み（pub-8873009775575279）。/ads.txt で配信される。

**未完了（ユーザー側のダッシュボード作業）:**
- Cloudflare Email Routing を有効化し、`contact@convertexcel.net` → 個人 Gmail へ転送するルールを作成。宛先 Gmail の verify はメール内リンクのクリックが必要なのでこちらからは不可。
- 有効化すると MX が Cloudflare のメールサーバに置き換わる点に注意。
- 承認後は `convertexcel.net/ads.txt` に publisher ID を配置する必要がある。

個人運営なのでメールアドレスは公開したくないとのこと。フォーム方式（メール非表示）ではなく、転送エイリアスを表示する方式（A）を選択済み。
