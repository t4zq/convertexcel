#!/usr/bin/env bash
set -euo pipefail

port="${PORT:-4173}"
host="${HOST:-127.0.0.1}"
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$root_dir"
bash scripts/build-wasm.sh

echo "Serving http://${host}:${port}"
echo "Press Ctrl+C to stop."
PORT="$port" HOST="$host" node scripts/serve-local.js
