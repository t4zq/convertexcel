param(
  [string]$Source = "src\convert.cpp",
  [string]$OutDir = "public\dist"
)

$ErrorActionPreference = "Stop"

$emccCmd = "emcc"
if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
  $emsdkRoot = Resolve-Path (Join-Path $PSScriptRoot "..\tools\emsdk") -ErrorAction SilentlyContinue
  $localEmcc = if ($emsdkRoot) { Join-Path $emsdkRoot "upstream\emscripten\emcc.bat" } else { $null }
  if ($localEmcc -and (Test-Path $localEmcc)) {
    $emccCmd = $localEmcc
    # Set environment variables expected by emcc
    $env:EMSDK = $emsdkRoot.Path
    $pythonDir = Get-ChildItem (Join-Path $emsdkRoot "python") -Directory -ErrorAction SilentlyContinue | Select-Object -Last 1
    if ($pythonDir) { $env:EMSDK_PYTHON = Join-Path $pythonDir.FullName "python.exe" }
    $nodeDir = Get-ChildItem (Join-Path $emsdkRoot "node") -Directory -ErrorAction SilentlyContinue | Select-Object -Last 1
    if ($nodeDir) { $env:EMSDK_NODE = Join-Path $nodeDir.FullName "bin\node.exe" }
    $env:PATH = "$emsdkRoot;$(Join-Path $emsdkRoot 'upstream\emscripten');$env:PATH"
  } else {
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

& $emccCmd $Source -O3 `
  -s WASM=1 `
  -s MODULARIZE=1 `
  -s EXPORT_NAME=ConvertModule `
  -s "EXPORTED_FUNCTIONS=[$exportedFunctions]" `
  -s 'EXPORTED_RUNTIME_METHODS=["cwrap","UTF8ToString"]' `
  -o (Join-Path $OutDir "convert.js")
