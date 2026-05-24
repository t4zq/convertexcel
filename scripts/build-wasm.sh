#!/usr/bin/env bash
set -euo pipefail

source_file="${1:-convert.cpp}"
out_dir="${2:-dist}"

if ! command -v emcc >/dev/null 2>&1; then
  local_emsdk_env="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/tools/emsdk/emsdk_env.sh"
  if [ -f "$local_emsdk_env" ]; then
    # shellcheck disable=SC1090
    EMSDK_QUIET=1 source "$local_emsdk_env" >/dev/null
  fi
fi

if ! command -v emcc >/dev/null 2>&1; then
  cat >&2 <<'EOF'
emcc was not found.

Install and activate Emscripten first, or install it into this project:
  git clone https://github.com/emscripten-core/emsdk.git
  cd emsdk
  ./emsdk install latest
  ./emsdk activate latest
  source ./emsdk_env.sh

Then run this script again from the project root.
EOF
  exit 1
fi

mkdir -p "$out_dir"

emcc "$source_file" -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=ConvertModule \
  -s 'EXPORTED_FUNCTIONS=[_gen_latex,_gen_csv,_gen_csv_rounded,_gen_csv_sig_figs,_gen_latex_rounded,_gen_latex_sig_figs,_gen_tikz_graph,_gen_tikz_graph_preview,_gen_latex_config,_gen_csv_config,_gen_tikz_graph_config,_gen_csv_attachment,_free]' \
  -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]' \
  -o "$out_dir/convert.js"
