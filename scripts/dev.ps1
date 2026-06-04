param(
  [int]$Port = 4173,
  [string]$HostName = "127.0.0.1",
  [switch]$Container
)

$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")
try {
  if ($Container) {
    & (Join-Path $PSScriptRoot "build-wasm-container.ps1")
  } else {
    & (Join-Path $PSScriptRoot "build-wasm.ps1")
  }

  $env:PORT = $Port.ToString()
  $env:HOST = $HostName

  Write-Host "Serving http://${HostName}:${Port}"
  Write-Host "Press Ctrl+C to stop."
  node scripts\serve-local.js
}
finally {
  Pop-Location
}
