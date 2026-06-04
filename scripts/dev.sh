#!/usr/bin/env bash
set -euo pipefail

port="${PORT:-4173}"
host="${HOST:-127.0.0.1}"
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
use_container="${USE_CONTAINER:-0}"

cd "$root_dir"
if [ "$use_container" = "1" ]; then
  bash scripts/build-wasm-container.sh
else
  bash scripts/build-wasm.sh
fi

echo "Serving http://${host}:${port}"
echo "Press Ctrl+C to stop."
PORT="$port" HOST="$host" node scripts/serve-local.js
