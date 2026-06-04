param(
  [string]$Source = "src/convert.cpp",
  [string]$OutDir = "public/dist",
  [string]$Image = "emscripten/emsdk:latest",
  [string]$Runtime = "docker"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command $Runtime -ErrorAction SilentlyContinue)) {
  Write-Error "$Runtime was not found. Start Docker Desktop or install a compatible container runtime."
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourcePath = Join-Path $root $Source
if (-not (Test-Path $sourcePath)) {
  Write-Error "Source file was not found: $Source"
}

New-Item -ItemType Directory -Force -Path (Join-Path $root $OutDir) | Out-Null

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

$containerSource = $Source -replace "\\", "/"
$containerOut = (($OutDir -replace "\\", "/").TrimEnd("/")) + "/convert.js"

& $Runtime run --rm `
  -v "${root}:/src" `
  -w /src `
  $Image `
  emcc $containerSource -O3 `
    -s WASM=1 `
    -s MODULARIZE=1 `
    -s EXPORT_NAME=ConvertModule `
    -s "EXPORTED_FUNCTIONS=[$exportedFunctions]" `
    -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]' `
    -o $containerOut
