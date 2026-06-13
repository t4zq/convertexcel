# converTeXcel Excel Add-in

Windows 版 Excel を初期対象にした開発用 Office.js Task Pane Add-in です。

## 開発

```powershell
.\addin\scripts\create-dev-cert.ps1
.\addin\scripts\trust-dev-cert.ps1
cd frontend
npm run dev:addin
```

開発サーバーは `https://localhost:5174/addin.html` を使います。Excel へ sideload する manifest は `addin/manifest.xml` です。

Office Add-ins は HTTPS が必要です。初回は `addin/certs/convertexcel-dev-root-ca.crt` を信頼済みルート証明書として登録し、Excel を再起動してください。`localhost.crt` は開発サーバーが使う葉証明書なので、手動で信頼する対象ではありません。

## 本番配信（サイドロード）

アドインは本番サイトの `https://convertexcel.net/addin/` 配下に同梱して配信します。

- ビルド: `cd frontend && npm run build:addin` で `frontend/dist/addin/` に出力されます（`base: "/addin/"`）。本番デプロイ（`npm run deploy`）では `scripts/cloudflare-build.mjs` がメインビルドの後にこれを実行し、Cloudflare がメインサイトと同じ `frontend/dist` から配信します。
- 配布する manifest は `addin/manifest.prod.xml`（`https://convertexcel.net/addin/addin` を指す）です。本番ホスティング（Cloudflare）は `.html` を落として拡張子なし URL に 307 リダイレクトするため、Office がリダイレクトを挟まないよう manifest は拡張子なしの正規 URL を指します。利用者はこの XML を Excel に sideload します。開発用の `addin/manifest.xml`（localhost を指す）と混同しないでください。
- dev 用 (`manifest.xml`) と本番用 (`manifest.prod.xml`) は `<Id>` (GUID) を分けてあります。Office は ID 単位で別アドインとして扱うため、同じ Excel に両方を sideload して同時に検証できます。URL 以外（表示名・バージョン・文言）を変更したときは両方の manifest に反映してください。
- 配信先は静的ホスティングなので追加サーバーは不要です。`convertexcel.net` に有効な HTTPS 証明書があれば、利用者側での証明書登録も不要です。

### 利用者向けの導入ページ

- 利用者向けに、manifest の入手と sideload 手順を案内する Web ページ `/excel-addin`（多言語対応）を用意しています（`frontend/src/pages/AddinPage.tsx` / 文言は `frontend/src/lib/addin-guide.ts`）。ヘッダーからも辿れます。
- ビルド時に `manifest.prod.xml` を `frontend/dist/addin/manifest.xml` へコピーし（`vite.addin.config.ts` の `copy-addin-manifest` プラグイン）、`https://convertexcel.net/addin/manifest.xml` で配信します。導入ページの「ダウンロード」ボタンはこの URL を指します。
- `.xml` はリダイレクト対象外なので manifest はこの URL から直接ダウンロードできます。

manifest を更新したら（URL 変更・バージョン上げなど）、配布済みの利用者には再 sideload を案内してください。

## 実装方針

- Excel から読む処理は `frontend/src/addin/excelRangeReader.ts` に閉じ込めます。
- Office の準備状態と選択範囲の取り込みは `frontend/src/addin/useExcelSelection.ts`、Web 版への受け渡しは `frontend/src/addin/useWebAppLink.ts` のフックに分離しています。
- 変換そのものは Web 版で行うため、TSV を共有リンクに載せて `frontend/src/lib/conversion-service.ts` を持つ Web アプリへ渡します。

## 現在の範囲

- 選択範囲を TSV として取り込みます。
- 取り込んだ表を共有リンク経由で Web 版に渡し、表・グラフ・gnuplot の生成と編集は広い Web アプリ側で行います。
- Excel への書き戻しは行いません（変換結果はすべて Web 版で扱います）。
