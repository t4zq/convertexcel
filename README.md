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
  <a href="#한국어">한국어</a> ·
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
├─ worker/                   # Cloudflare Worker (datasets API) + D1 migrations
│  ├─ index.ts               # /api/* handler, falls back to static assets
│  └─ migrations/            # D1 schema (SQL)
├─ scripts/                  # Build/deploy scripts (cloudflare-build.mjs)
├─ memory/                   # Project notes
├─ docker-compose.yml        # Local run for engine / frontend
├─ wrangler.jsonc            # Cloudflare Workers config (Worker + frontend/dist + D1)
└─ package.json              # Root: build / deploy scripts
```

## 日本語

converTeXcel は、Excel やスプレッドシートの表を LaTeX 表、CSV、TikZ/PGFPlots コードへ変換する Web アプリです。計算とコード生成は Rust/WebAssembly によってブラウザ内で実行されます。

### アーキテクチャ

| レイヤ | 技術 | ディレクトリ |
| --- | --- | --- |
| 画面 (UI) | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| 計算エンジン | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers + D1 | `worker/` |

### 画面

- 変換: `/`, `/convert`
- プライバシー: `/privacy`
- 対応言語: 日本語、英語、簡体字中国語、繁体字中国語、韓国語、スペイン語、ドイツ語

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
| API | Cloudflare Workers + D1 | `worker/` |

### Pages

- Converter: `/`, `/convert`
- Privacy: `/privacy`
- Languages: Japanese, English, Simplified Chinese, Traditional Chinese, Korean, Spanish, German

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
| API | Cloudflare Workers + D1 | `worker/` |

### 页面

- 转换: `/`, `/convert`
- 隐私: `/privacy`
- 支持语言: 日语、英语、简体中文、繁体中文、韩语、西班牙语、德语

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
| API | Cloudflare Workers + D1 | `worker/` |

### 頁面

- 轉換: `/`, `/convert`
- 隱私: `/privacy`
- 支援語言: 日文、英文、簡體中文、繁體中文、韓文、西班牙文、德文

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

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` 會先產生 Rust/WASM 引擎，然後執行 Vite build。

## 한국어

converTeXcel은 Excel 또는 스프레드시트 표를 LaTeX 표, CSV, TikZ/PGFPlots 코드로 변환하는 웹 앱입니다. 계산과 코드 생성은 Rust/WebAssembly를 통해 브라우저 안에서 실행됩니다.

### 아키텍처

| 레이어 | 기술 | 디렉터리 |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| 엔진 | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers + D1 | `worker/` |

### 페이지

- 변환: `/`, `/convert`
- 개인정보: `/privacy`
- 지원 언어: 일본어, 영어, 중국어 간체, 중국어 번체, 한국어, 스페인어, 독일어

### Docker로 실행

```powershell
docker compose run --rm engine
docker compose up frontend
```

- 프론트엔드: <http://localhost:5173>
- API health: <http://localhost:8787/api/health> (run `npm run dev:api`)

### 프론트엔드만 로컬 실행

```powershell
cd frontend
npm install
npm run dev
npm run build
```

> 프론트엔드를 실행하거나 빌드하기 전에 engine 빌드로 `frontend/src/engine/pkg/`를 생성해 주세요.

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build`는 Rust/WASM 엔진을 생성한 뒤 Vite build를 실행합니다.

## Español

converTeXcel es una aplicación web que convierte tablas de Excel u hojas de cálculo en tablas LaTeX, CSV y código TikZ/PGFPlots. El cálculo y la generación de código se ejecutan en el navegador con Rust/WebAssembly.

### Arquitectura

| Capa | Tecnología | Directorio |
| --- | --- | --- |
| UI | React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui + react-router | `frontend/` |
| Motor | Rust -> WebAssembly (`wasm-pack`) | `engine/` |
| API | Cloudflare Workers + D1 | `worker/` |

### Páginas

- Conversor: `/`, `/convert`
- Privacidad: `/privacy`
- Idiomas: japonés, inglés, chino simplificado, chino tradicional, coreano, español, alemán

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
| API | Cloudflare Workers + D1 | `worker/` |

### Seiten

- Konverter: `/`, `/convert`
- Datenschutz: `/privacy`
- Sprachen: Japanisch, Englisch, vereinfachtes Chinesisch, traditionelles Chinesisch, Koreanisch, Spanisch, Deutsch

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

### Cloudflare

- Pages build command: `npm run build`
- Pages build output directory: `frontend/dist`
- Workers deploy command: `npm run deploy`

`npm run build` erzeugt zuerst die Rust/WASM-Engine und führt danach Vite build aus.
