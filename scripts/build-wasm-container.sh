#!/usr/bin/env bash
set -euo pipefail

source_file="${1:-src/convert.cpp}"
out_dir="${2:-public/dist}"
image="${EMSDK_IMAGE:-emscripten/emsdk:latest}"
runtime="${CONTAINER_RUNTIME:-docker}"
root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v "$runtime" >/dev/null 2>&1; then
  echo "$runtime was not found. Start Docker Desktop or install a compatible container runtime." >&2
  exit 1
fi

if [ ! -f "$root_dir/$source_file" ]; then
  echo "Source file was not found: $source_file" >&2
  exit 1
fi

mkdir -p "$root_dir/$out_dir"

"$runtime" run --rm \
  -v "$root_dir:/src" \
  -w /src \
  "$image" \
  emcc "$source_file" -O3 \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=ConvertModule \
    -s 'EXPORTED_FUNCTIONS=[_gen_latex,_gen_csv,_gen_csv_rounded,_gen_csv_sig_figs,_gen_latex_rounded,_gen_latex_sig_figs,_gen_tikz_graph,_gen_tikz_graph_preview,_gen_latex_config,_gen_csv_config,_gen_tikz_graph_config,_gen_csv_attachment,_free]' \
    -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]' \
    -o "$out_dir/convert.js"
