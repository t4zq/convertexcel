param(
  [string]$Source = "convert.cpp",
  [string]$OutDir = "dist"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
  $localEmsdkEnv = Join-Path $PSScriptRoot "..\tools\emsdk\emsdk_env.ps1"
  if (Test-Path $localEmsdkEnv) {
    $env:EMSDK_QUIET = "1"
    & $localEmsdkEnv | Out-Null
  }
}

if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
  Write-Error @"
emcc was not found.

Install and activate Emscripten first, or install it into this project:
  git clone https://github.com/emscripten-core/emsdk.git
  cd emsdk
  .\emsdk install latest
  .\emsdk activate latest
  .\emsdk_env.ps1

Then run this script again from the project root.
"@
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$exportedFunctions = @(
  "_gen_latex",
  "_gen_csv",
  "_gen_csv_rounded",
  "_gen_csv_sig_figs",
  "_gen_latex_rounded",
  "_gen_latex_sig_figs",
  "_gen_tikz_graph",
  "_gen_tikz_graph_preview",
  "_gen_latex_config",
  "_gen_csv_config",
  "_gen_tikz_graph_config",
  "_gen_csv_attachment",
  "_free"
) -join ","

emcc $Source -O3 `
  -s WASM=1 `
  -s MODULARIZE=1 `
  -s EXPORT_NAME=ConvertModule `
  -s "EXPORTED_FUNCTIONS=[$exportedFunctions]" `
  -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]' `
  -o (Join-Path $OutDir "convert.js")
