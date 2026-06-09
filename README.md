<p align="center">
  <img src="frontend/src/assets/logo.png" alt="converTeXcel" width="760">
</p>

<p align="center">
  <strong>Excel to LaTeX Converter</strong>
</p>

## 新アーキテクチャ (TypeScript / Rust / Ruby on Rails)

React UI、Rust/WASM 計算エンジン、Rails API の 3 レイヤ構成です。

| レイヤ | 技術 | ディレクトリ |
| --- | --- | --- |
| 画面 (UI) | React 19 + Vite + TS + Tailwind v4 + **shadcn/ui** + react-router | `frontend/` |
| 計算エンジン | **Rust** → WebAssembly (`wasm-pack`) | `engine/` |
| API | **Ruby on Rails** 7 (API-only, 薄い) | `api/` |

数値計算はすべて **Rust(WASM)** がブラウザ内で実行します。Rails は計算を持たず、
health とデータセット(grid)の永続化のみを担う薄い API です。

### 画面 (frontend/src/pages)
- **変換** `/` `/convert` — LaTeX 表 / CSV / TikZ(PGFPlots) 生成、texlive.net による PDF プレビュー(同意ダイアログ＋15秒クールダウン)
- **プライバシー** `/privacy`

### エンジン (engine/src)
- `convert.rs` — LaTeX/CSV/TikZ/近似の生成

### Docker で起動 (推奨)

ローカルに Rust / Ruby を入れずに、すべて Docker で完結します。

```powershell
# 1) Rust → WASM を frontend/src/engine/pkg に生成 (フロント起動の前に必須)
docker compose run --rm engine

# 2) API とフロントを起動
docker compose up api frontend
```

- フロント: <http://localhost:5173>
- API: <http://localhost:3000/api/health>

データセット API の確認:

```powershell
curl -X POST http://localhost:3000/api/datasets `
  -H "Content-Type: application/json" `
  -d '{"name":"sample","rows":[["x","y"],["1","2"]]}'
curl http://localhost:3000/api/datasets
curl http://localhost:3000/api/datasets/sample
```

### フロントのみローカル実行 (Node)

```powershell
cd frontend
npm install
# 先に engine ビルドで src/engine/pkg を生成しておくこと (docker compose run --rm engine)
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド
```

> 注: WASM の glue/wasm は `frontend/src/engine/pkg/` に生成され Vite が処理します。
> フロントのビルド/起動の前に必ず engine ビルドを実行してください。

shadcn の設定は `frontend/components.json` (style: new-york / baseColor: neutral)。
コンポーネント追加は `npx shadcn@latest add <name>` で `frontend/src/components/ui/` に入ります。

### Cloudflare Pages

Cloudflare Pages ではリポジトリルートを root directory として使い、次を設定します。

- Build command: `npm run build`
- Build output directory: `frontend/dist`

`npm run build` は `scripts/cloudflare-build.mjs` を呼び出し、Rust/WASM エンジンを
`frontend/src/engine/pkg` に生成してから Vite build を実行します。

### Cloudflare Workers Builds

Workers Builds で `wrangler versions upload` を使う場合、先に `frontend/dist` を生成する必要があります。

- Deploy command: `npm run deploy`

`npm run deploy` は `npm run build && npx wrangler versions upload` を実行します。
`npx wrangler versions upload` だけを指定すると、`frontend/dist` が存在しないため失敗します。

