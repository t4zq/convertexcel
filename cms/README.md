# converTeXcel Payload CMS

`docs.convertexcel.net` の記事・画像・動画を管理するPayload CMSです。Cloudflare Workers、D1、R2へデプロイします。

## ローカル開発

1. `.env.example` を `.env` へコピーし、`PAYLOAD_SECRET` を設定する。
2. `npm install`
3. `npm run dev`
4. `http://localhost:3001/admin` を開く。

既存記事を投入する場合は、`PAYLOAD_ADMIN_EMAIL` と `PAYLOAD_ADMIN_PASSWORD` も設定して `npm run seed` を実行します。seedの入力は `../docs/content/payload-docs.json` です。

## Cloudflare

PayloadのWorkersバンドルは無料枠のサイズ上限を超えるため、Paid Workersプランが必要です。

1. `convertexcel-cms` D1データベースと `convertexcel-cms-media` R2バケットを作成する。
2. `wrangler.jsonc` の `DATABASE_ID` を実際のD1 IDへ置き換える。
3. `PAYLOAD_SECRET`、`DOCS_DEPLOY_HOOK_URL`、`NEXT_PUBLIC_SERVER_URL` を本番環境へ設定する。
4. `npm run generate:types`、`npm run deploy` を実行する。

記事公開後、`DOCS_DEPLOY_HOOK_URL` がDocsのビルドを起動します。DocsビルドはPayload REST APIから公開記事だけを取得し、`docs/content/payload-docs.json` を更新して静的サイトを生成します。

GraphQLには依存せず、同期にはPayload REST APIを使用します。
