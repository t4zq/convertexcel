param(
  [int]$Port = 4173,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

Push-Location (Join-Path $PSScriptRoot "..")
try {
  & (Join-Path $PSScriptRoot "build-wasm.ps1")

  $env:PORT = $Port.ToString()
  $env:HOST = $HostName

  Write-Host "Serving http://${HostName}:${Port}"
  Write-Host "Press Ctrl+C to stop."
  node scripts\serve-local.js
}
finally {
  Pop-Location
}
