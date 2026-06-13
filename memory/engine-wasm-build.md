---
name: engine-wasm-build
description: How to rebuild the Rust→WASM engine and run its tests in this repo
metadata:
  type: project
---

Rust エンジン (`engine/src/convert.rs`) を変更したら、WASM を再ビルドしないとフロント (`frontend/src/engine/pkg/`) に反映されない。

- **ビルド**: `docker compose run --rm engine`（wasm-pack `--target web` を実行し pkg を出力）。
- **テスト**: `docker compose run --rm --entrypoint sh engine -c "cd /workspace/engine && cargo test"`。
- このマシンには**ネイティブの Rust / wasm-pack が無い**ため Docker 必須。Docker Desktop のデーモンが停止していると失敗する（`docker info` で確認）。
- 再ビルド後、Vite dev サーバーをリロードすれば新しい WASM が読み込まれる。

エンジンの WASM 公開関数のシグネチャを変えたら、手書きの `frontend/src/engine/loader.ts` の `EngineModule` interface とラッパ関数も合わせて更新する（`.d.ts` は wasm-pack が自動生成）。
