# Rust → WebAssembly ビルド用イメージ。
# 実ビルドは docker-compose の volume マウント + command で実行する。
FROM rust:1-bookworm

RUN rustup target add wasm32-unknown-unknown \
 && cargo install wasm-pack --version 0.15.0 --locked

WORKDIR /workspace/engine
