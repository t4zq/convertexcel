$ErrorActionPreference = "Stop"

$caCertPath = Join-Path $PSScriptRoot "..\certs\convertexcel-dev-root-ca.crt"

if (!(Test-Path $caCertPath)) {
  throw "CA certificate not found. Run .\addin\scripts\create-dev-cert.ps1 first."
}

$resolved = Resolve-Path $caCertPath
Import-Certificate -FilePath $resolved -CertStoreLocation Cert:\CurrentUser\Root | Out-Null

Write-Output "Trusted $resolved in Cert:\CurrentUser\Root"
Write-Output "Restart Excel after importing the certificate."
