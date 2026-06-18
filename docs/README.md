# converTeXcel Docs

Next.js + Fumadocsで構築したconverTeXcelの公開ドキュメントです。

It is a Next.js app with [Static Export](https://nextjs.org/docs/app/guides/static-exports) configured.

## 開発

```bash
npm run dev
npm run types:check
npm run build
```

<http://localhost:3000/docs> を開きます。MDXは `content/docs` に置きます。

数式はKaTeXでレンダリングされます。

```mdx
インライン: $E = mc^2$

$$
y = ax^2 + bx + c
$$
```

## デプロイ

`docs.convertexcel.net` を `convertexcel-docs` Workerへ割り当てたうえで `npm run deploy` を実行します。Next.jsは静的エクスポートされ、`out/`がWorkers Static Assetsとして配信されます。

## 管理画面から公開

既存アプリの `/admin/docs` でMDXを作成し、Worker API経由でGitHubへ保存できます。リポジトリのルートで、初回だけSecretを設定します。

```bash
npx wrangler secret put DOCS_ADMIN_TOKEN
npx wrangler secret put GITHUB_DOCS_TOKEN
```

`GITHUB_DOCS_TOKEN`には、このリポジトリのContentsへ書き込めるfine-grained tokenを使用してください。GitHub側で `docs/**` の変更時に `npm --prefix docs run deploy` を実行すると自動公開できます。

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, [`loader()`](https://fumadocs.dev/docs/headless/source-api) provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

### Fumadocs MDX

A `source.config.ts` config file has been included, you can customise different options like frontmatter schema.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.dev) - learn about Fumadocs
