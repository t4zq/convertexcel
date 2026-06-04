# converTeXcel

## ローカルビルド

このプロジェクトは `src/convert.cpp` を Emscripten でビルドし、
`public/dist/convert.js` と `public/dist/convert.wasm` を生成します。

## プロジェクト構成

```text
.
├── docker-compose.yml      # emscripten/emsdk コンテナでの WASM ビルド定義
├── public/                 # 本番で配布する静的ファイル
│   ├── index.html          # データ変換ツール (UI)
│   ├── convert.html
│   ├── fit.html
│   ├── circuit.html
│   ├── stats.html          # 統計表示ツール
│   ├── privacy.html
│   ├── assets/
│   │   ├── css/style.css
│   │   ├── img/logo.png
│   │   └── js/
│   │       ├── script.js
│   │       ├── fit.js
│   │       ├── circuit.js
│   │       └── stats.js
│   └── dist/               # 生成された WASM バンドル
├── src/convert.cpp         # WASM 変換エンジン
└── scripts/                # ビルドとローカルサーバのヘルパースクリプト
```

## ローカルでのビルドと起動

1つのコマンドで WASM をビルドし、ローカルサーバを起動できます:

```powershell
.\scripts\dev.ps1
```

ブラウザで次を開きます:

```text
http://127.0.0.1:4173
```

停止するには `Ctrl+C` を押してください。

別ポートを使う場合:

```powershell
.\scripts\dev.ps1 -Port 4174
```

ホスト環境の Emscripten を使わず、Docker Desktop の `emscripten/emsdk:latest` イメージでビルドすることもできます:

```powershell
.\scripts\build-wasm-container.ps1
.\scripts\dev.ps1 -Container
```

または Docker Compose を使う場合:

```powershell
docker compose run --rm wasm-build
```

コンテナはこのリポジトリをコンテナ内の `/src` にマウントし、次のファイルを書き出します:

```text
public/dist/convert.js
public/dist/convert.wasm
```

macOS / Linux の場合:

```bash
bash scripts/dev.sh
```

macOS / Linux でコンテナビルドする例:

```bash
bash scripts/build-wasm-container.sh
USE_CONTAINER=1 bash scripts/dev.sh
```

macOS / Linux でも Docker Compose は同様に動作します:

```bash
docker compose run --rm wasm-build
```

必要に応じて別イメージタグやランタイムを指定できます:

```powershell
.\scripts\build-wasm-container.ps1 -Image emscripten/emsdk:latest -Runtime docker
```

または:

```bash
EMSDK_IMAGE=emscripten/emsdk:latest CONTAINER_RUNTIME=docker bash scripts/build-wasm-container.sh
```

### Windows PowerShell

Emscripten をインストールして有効化する手順:

```powershell
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
.\emsdk install latest
.\emsdk activate latest
.\emsdk_env.ps1
```

プロジェクトルートからビルドします:

```powershell
.\scripts\build-wasm.ps1
```

プロジェクト内に `tools/emsdk` が存在する場合、スクリプトはそれを自動で有効化します。

### macOS / Linux

Emscripten をインストールして有効化する手順:

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

プロジェクトルートからビルドします:

```bash
bash scripts/build-wasm.sh
```

プロジェクト内に `tools/emsdk` が存在する場合、スクリプトはそれを自動で有効化します。

GitHub Actions のワークフローは同じシェルスクリプトを使うため、ローカルと CI で同じ WASM 関数がエクスポートされます。

