<p align="center">
  <img src="frontend/src/assets/logo-2x.webp" alt="converTeXcel" width="760">
</p>

<p align="center">
  <strong>Excel to LaTeX / CSV / TikZ Converter</strong>
</p>

<p align="center">
  <a href="#日本語">日本語</a> ·
  <a href="#english">English</a> ·
  <a href="#简体中文">简体中文</a> ·
  <a href="#繁體中文">繁體中文</a> ·
  <a href="#español">Español</a> ·
  <a href="#deutsch">Deutsch</a>
</p>

## Directory layout / ディレクトリ構成

```text
convertexcel/
├─ frontend/                 # React + Vite frontend (web app UI)
│  ├─ src/
│  │  ├─ addin/              # Excel add-in source (Office.js task pane)
│  │  ├─ pages/              # Routed pages (ConvertPage, PrivacyPage, AddinPage)
│  │  ├─ components/         # UI components
│  │  ├─ hooks/              # React hooks
│  │  ├─ lib/                # Conversion settings, i18n, privacy/add-in content
│  │  └─ engine/pkg/         # Rust -> WASM build output (generated)
│  ├─ public/                # Static assets (icons, sitemap, robots)
│  ├─ addin.html             # Add-in entry HTML
│  └─ vite.addin.config.ts   # Vite config dedicated to the add-in build
├─ addin/                    # Excel add-in distribution files
│  ├─ manifest.xml           # Dev manifest (localhost)
│  ├─ manifest.prod.xml      # Production manifest (convertexcel.net)
│  └─ scripts/               # Dev certificate scripts
├─ engine/                   # Rust -> WebAssembly calculation engine
│  └─ src/
├─ worker/                   # Cloudflare Worker (PDF preview proxy + static assets)
│  └─ index.ts               # /api/* handler, falls back to static assets
├─ scripts/                  # Build/deploy scripts (cloudflare-build.mjs)
├─ memory/                   # Project notes
├─ docker-compose.yml        # Local run for engine / frontend
├─ wrangler.jsonc            # Cloudflare Workers config (Worker + frontend/dist)
└─ package.json              # Root: build / deploy scripts
```

## Local debug quick start / ローカルデバッグ早見表

### Web app + API

```powershell
npm install
npm --prefix frontend install
npm run dev
```

- Frontend: <http://localhost:5173>
- API health: <http://localhost:8787/api/health>
- Excel add-in: <https://localhost:5174/addin.html>（証明書ファイルがある場合）
- 初回または `frontend/src/engine/pkg/` が無い場合は、`npm run dev` が先に `docker compose run --rm engine` 相当の engine ビルドを実行します。
- engine を作り直したい場合: `$env:FORCE_ENGINE_BUILD="1"; npm run dev`
- アドイン dev server を起動したくない場合: `$env:SKIP_ADDIN_DEV="1"; npm run dev`
- Optional ports: `$env:FRONTEND_PORT="5174"; $env:WORKER_PORT="8788"; npm run dev`

### Excel add-in

初回だけ開発用 HTTPS 証明書を作成して信頼します。信頼後は Excel を完全に再起動してください。

```powershell
npm run addin:cert:create
npm run addin:cert:trust
npm run dev
```

- Add-in task pane: <https://localhost:5174/addin.html>
- Excel に sideload する manifest: `addin/manifest.xml`
- Excel が「アドイン エラー」を出す場合は、まずブラウザで <https://localhost:5174/addin.html> を開きます。証明書エラーが出る場合は `npm run addin:cert:trust` の後に Excel を再起動してください。
- アドイン専用ビルド: `npm run build:addin`
- アドイン確認: `npm run check:addin`

今まで通り分けて起動したい場合:

```powershell
npm run dev:engine
npm run dev:api
npm run dev:frontend
```

別ターミナルで簡易確認:

```powershell
npm run check:local
```

`check:local` は Worker と frontend の TypeScript チェックを実行し、`npm run dev` が起動中なら frontend と `/api/health` も軽く確認します。

`check:addin` はアドイン用証明書ファイル、TypeScript、アドインビルドを確認し、`npm run dev:addin` が起動中なら `https://localhost:5174/addin.html` も軽く確認します。

## Analytics and ads / アクセス解析・広告

Google Analytics と Google AdSense は、以下の Vite 環境変数が設定されている場合だけ読み込まれます。未設定のローカル開発や審査前ビルドでは外部スクリプトも広告枠も出ません。

```text
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_OUTPUT_SLOT=1234567890
```

- `VITE_GA_MEASUREMENT_ID`: Google Analytics / Google tag ID
- `VITE_ADSENSE_CLIENT_ID`: AdSense publisher client ID
- `VITE_ADSENSE_OUTPUT_SLOT`: 変換結果とプレビューの下に表示する広告ユニットの slot ID

## 日本語

converTeXcel は、Excel やスプレッドシートの表を LaTeX 表、CSV、TikZ/PGFPlots コードへ変換する Web アプリです。計算とコード生成は Rust/WebAssembly によってブラウザ内で実行されます。

### アーキテクチャ

| レイヤ | 技術 | ディレクトリ |
| --- | --- | --- |
| 画面 (UI) | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| 計算エンジン | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### 画面

- 変換: `/`, `/convert`
- プライバシー: `/privacy`
- 対応言語: 日本語、英語、簡体字中国語、繁体字中国語、スペイン語、ドイツ語

### Docker で起動

```powershell
docker compose run --rm engine
docker compose up frontend
```

- Frontend: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### フロントのみローカル実行

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> `frontend/src/engine/pkg/` は先に engine ビルドで生成してください。

> PDF プレビューは Worker の `/api/tex-preview` 経由で texlive.net をコンパイルします（texlive.net の 301 リダイレクトに CORS が無く、ブラウザから直接叩けないため）。ローカルで PDF プレビューを使うには `npm run dev:api`（`wrangler dev`, :8787）も起動してください。Vite が `/api` を :8787 へ転送します。

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` は Rust/WASM エンジンを生成してから Vite build を実行します。

## English

converTeXcel is a web app that converts Excel or spreadsheet tables into LaTeX tables, CSV, and TikZ/PGFPlots code. Calculation and code generation run in the browser through Rust/WebAssembly.

### Architecture

| Layer | Technology | Directory |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| Engine | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### Pages

- Converter: `/`, `/convert`
- Privacy: `/privacy`
- Languages: Japanese, English, Simplified Chinese, Traditional Chinese, Spanish, German

### Run with Docker

```powershell
docker compose run --rm engine
docker compose up frontend
```

- Frontend: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### Run the frontend locally

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> Generate `frontend/src/engine/pkg/` with the engine build before running or building the frontend.

> PDF preview compiles on texlive.net through the Worker's `/api/tex-preview` (texlive.net's 301 redirect has no CORS, so the browser can't call it directly). To use PDF preview locally, also run `npm run dev:api` (`wrangler dev`, :8787); Vite proxies `/api` to :8787.

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` generates the Rust/WASM engine and then runs the Vite build.

## 简体中文

converTeXcel 是一个 Web 应用，可将 Excel 或电子表格数据转换为 LaTeX 表格、CSV 和 TikZ/PGFPlots 代码。计算与代码生成通过 Rust/WebAssembly 在浏览器中完成。

### 架构

| 层 | 技术 | 目录 |
| --- | --- | --- |
| 界面 | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| 引擎 | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### 页面

- 转换: `/`, `/convert`
- 隐私: `/privacy`
- 支持语言: 日语、英语、简体中文、繁体中文、西班牙语、德语

### 使用 Docker 运行

```powershell
docker compose run --rm engine
docker compose up frontend
```

- 前端: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### 仅本地运行前端

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> 运行或构建前端前，请先通过 engine 构建生成 `frontend/src/engine/pkg/`。

> PDF 预览通过 Worker 的 `/api/tex-preview` 在 texlive.net 上编译（texlive.net 的 301 重定向没有 CORS，浏览器无法直接调用）。本地使用 PDF 预览还需运行 `npm run dev:api`（`wrangler dev`，:8787）；Vite 会将 `/api` 转发到 :8787。

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` 会先生成 Rust/WASM 引擎，然后执行 Vite build。

## 繁體中文

converTeXcel 是一個 Web 應用程式，可將 Excel 或試算表資料轉換為 LaTeX 表格、CSV 和 TikZ/PGFPlots 程式碼。計算與程式碼產生會透過 Rust/WebAssembly 在瀏覽器中完成。

### 架構

| 層 | 技術 | 目錄 |
| --- | --- | --- |
| 介面 | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| 引擎 | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### 頁面

- 轉換: `/`, `/convert`
- 隱私: `/privacy`
- 支援語言: 日文、英文、簡體中文、繁體中文、西班牙文、德文

### 使用 Docker 執行

```powershell
docker compose run --rm engine
docker compose up frontend
```

- 前端: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### 只在本機執行前端

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> 執行或建置前端前，請先透過 engine 建置產生 `frontend/src/engine/pkg/`。

> PDF 預覽透過 Worker 的 `/api/tex-preview` 在 texlive.net 上編譯（texlive.net 的 301 轉址沒有 CORS，瀏覽器無法直接呼叫）。本機使用 PDF 預覽還需執行 `npm run dev:api`（`wrangler dev`，:8787）；Vite 會將 `/api` 轉發到 :8787。

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` 會先產生 Rust/WASM 引擎，然後執行 Vite build。

## Español

converTeXcel es una aplicación web que convierte tablas de Excel u hojas de cálculo en tablas LaTeX, CSV y código TikZ/PGFPlots. El cálculo y la generación de código se ejecutan en el navegador con Rust/WebAssembly.

### Arquitectura

| Capa | Tecnología | Directorio |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| Motor | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### Páginas

- Conversor: `/`, `/convert`
- Privacidad: `/privacy`
- Idiomas: japonés, inglés, chino simplificado, chino tradicional, español, alemán

### Ejecutar con Docker

```powershell
docker compose run --rm engine
docker compose up frontend
```

- Frontend: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### Ejecutar solo el frontend localmente

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> Genera `frontend/src/engine/pkg/` con la compilación del motor antes de ejecutar o compilar el frontend.

> La vista previa PDF compila en texlive.net a través de `/api/tex-preview` del Worker (la redirección 301 de texlive.net no tiene CORS, así que el navegador no puede llamarlo directamente). Para usar la vista previa PDF en local, ejecuta también `npm run dev:api` (`wrangler dev`, :8787); Vite redirige `/api` a :8787.

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` genera el motor Rust/WASM y después ejecuta Vite build.

## Deutsch

converTeXcel ist eine Web-App, die Excel- oder Tabellenkalkulations-Tabellen in LaTeX-Tabellen, CSV und TikZ/PGFPlots-Code umwandelt. Berechnung und Codegenerierung laufen mit Rust/WebAssembly im Browser.

### Architektur

| Schicht | Technologie | Verzeichnis |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| Engine | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers | `worker/` |

### Seiten

- Konverter: `/`, `/convert`
- Datenschutz: `/privacy`
- Sprachen: Japanisch, Englisch, vereinfachtes Chinesisch, traditionelles Chinesisch, Spanisch, Deutsch

### Mit Docker starten

```powershell
docker compose run --rm engine
docker compose up frontend
```

- Frontend: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### Nur das Frontend lokal ausführen

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> Erzeuge `frontend/src/engine/pkg/` vor dem Starten oder Bauen des Frontends durch den Engine-Build.

> Die PDF-Vorschau kompiliert über `/api/tex-preview` des Workers auf texlive.net (der 301-Redirect von texlive.net hat kein CORS, der Browser kann ihn also nicht direkt aufrufen). Um die PDF-Vorschau lokal zu nutzen, starte zusätzlich `npm run dev:api` (`wrangler dev`, :8787); Vite leitet `/api` an :8787 weiter.

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` erzeugt zuerst die Rust/WASM-Engine und führt danach Vite build aus.
