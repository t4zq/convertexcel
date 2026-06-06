# converTeXcel

## 新アーキテクチャ (TypeScript / Rust / Ruby on Rails)

React UI、Rust/WASM 計算エンジン、Rails API の 3 レイヤ構成です。

| レイヤ | 技術 | ディレクトリ |
| --- | --- | --- |
| 画面 (UI) | React 19 + Vite + TS + Tailwind v4 + **shadcn/ui** + react-router + **Plotly** | `frontend/` |
| 計算エンジン | **Rust** → WebAssembly (`wasm-pack`) | `engine/` |
| API | **Ruby on Rails** 7 (API-only, 薄い) | `api/` |

数値計算はすべて **Rust(WASM)** がブラウザ内で実行します。Rails は計算を持たず、
health とデータセット(grid)の永続化のみを担う薄い API です。

### 画面 (frontend/src/pages)
- **統計探索** `/` — 記述統計 / Pearson 相関ヒートマップ / グラフ(散布・折れ線＋スムージング) / 曲線フィット(線形・多項式・指数・べき乗・三角, AIC 最小推奨) / Welch の t 検定
- **回路解析** `/circuit` — 周波数特性(Bode, -3dB カットオフ・傾き・τ) / 過渡応答(時定数) / インピーダンス(共振)
- **変換** `/convert` — LaTeX 表 / CSV / TikZ(PGFPlots) 生成、texlive.net による PDF プレビュー(同意ダイアログ＋15秒クールダウン)
- **プライバシー** `/privacy`

### エンジン (engine/src)
- `convert.rs` — LaTeX/CSV/TikZ/近似の生成
- `stats.rs` — 曲線フィット / Welch t 検定 / 記述統計
- `signal.rs` — スムージング(移動平均/メジアン/IIR低域/FFT低域) / LTTB 間引き
- `circuit.rs` — Bode / 過渡応答 / インピーダンス解析

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

