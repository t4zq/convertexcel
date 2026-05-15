# converTeXcel

タブ区切り・カンマ区切りのデータを LaTeX 表・CSV・TikZ グラフに変換するウェブアプリです。

## 機能

- **LaTeX 表** – データを `tabular` 環境に変換（小数点丸め・有効数字指定対応）
- **CSV** – データを CSV 形式に変換
- **TikZ グラフ** – データを PGFPlots グラフコードに変換（線形・片対数・両対数スケール対応）
- **PDF プレビュー** – [texlive.net](https://texlive.net) を利用した LaTeX / TikZ のリアルタイムプレビュー

## ビルド方法

WebAssembly モジュール（`dist/convert.js`）は [Emscripten](https://emscripten.org/) でビルドします。

```bash
# Emscripten のセットアップ（初回のみ）
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# ビルド
emcc convert.cpp -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=ConvertModule \
  -s EXPORTED_FUNCTIONS='[_gen_latex,_gen_csv,_gen_latex_rounded,_gen_latex_sig_figs,_gen_tikz_graph,_gen_tikz_graph_preview,_free]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","UTF8ToString"]' \
  -o dist/convert.js
```

GitHub Actions（`.github/workflows/build.yml`）により、`main` ブランチおよびプルリクエストへのプッシュ時に自動ビルドが実行されます。

## ローカルでの動作確認

ビルド済みの `dist/convert.js` が存在する状態で、`index.html` を HTTP サーバ経由で開いてください。

```bash
# Python の簡易サーバを利用する場合
python3 -m http.server 8080
# ブラウザで http://localhost:8080 を開く
```

## Claude Code（GitHub App）のセットアップ

このリポジトリで Claude Code を利用するには、以下の手順で GitHub App をインストールしてください。

1. [https://github.com/settings/installations](https://github.com/settings/installations) を開きます。
2. リストに **Claude** または **Claude Code** が表示されている場合はそれを選択し、手順 5 へ進みます。
3. 表示されていない場合は、Claude を提供するサービスの公式ページから GitHub App のインストールページにアクセスし、**Install** を実行してください。
4. インストール時に、アクセスを許可するリポジトリとして **t4zq/converTeXcel** を選択します。
5. インストール済みの場合は **Repository access** に `t4zq/converTeXcel` が含まれていることを確認し、含まれていなければ追加します。
6. **Permissions** → **Contents** が **Read and write** になっているか確認し、必要であれば変更して保存します。
7. 再度 [https://github.com/settings/installations](https://github.com/settings/installations) を開き、**Claude** が表示されていることを確認します。

## ライセンス

MIT
