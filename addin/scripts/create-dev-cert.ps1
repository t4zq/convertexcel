$ErrorActionPreference = "Stop"

$certDir = Join-Path $PSScriptRoot "..\certs"
New-Item -ItemType Directory -Force $certDir | Out-Null

$caCertPath = Join-Path $certDir "convertexcel-dev-root-ca.crt"
$leafCertPath = Join-Path $certDir "localhost.crt"
$leafKeyPath = Join-Path $certDir "localhost.key"

function ConvertTo-Pem {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Label,
    [Parameter(Mandatory = $true)]
    [byte[]] $Bytes
  )

  $base64 = [Convert]::ToBase64String($Bytes)
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("-----BEGIN $Label-----")
  for ($i = 0; $i -lt $base64.Length; $i += 64) {
    $length = [Math]::Min(64, $base64.Length - $i)
    $lines.Add($base64.Substring($i, $length))
  }
  $lines.Add("-----END $Label-----")
  return [string]::Join([Environment]::NewLine, $lines) + [Environment]::NewLine
}

function Export-RsaPrivateKeyPem {
  param(
    [Parameter(Mandatory = $true)]
    [System.Security.Cryptography.RSA] $Key
  )

  if ($Key.GetType().GetMethod("ExportPkcs8PrivateKey", [Type[]] @())) {
    return ConvertTo-Pem "PRIVATE KEY" $Key.ExportPkcs8PrivateKey()
  }

  if ($Key.GetType().GetMethod("ExportRSAPrivateKey", [Type[]] @())) {
    return ConvertTo-Pem "RSA PRIVATE KEY" $Key.ExportRSAPrivateKey()
  }

  if ($Key.GetType().FullName -eq "System.Security.Cryptography.RSACng") {
    return ConvertTo-Pem "PRIVATE KEY" $Key.Key.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
  }

  throw "This PowerShell/.NET runtime cannot export the generated RSA private key."
}

$caKey = [System.Security.Cryptography.RSA]::Create(4096)
$caRequest = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
  "CN=converTeXcel Dev Root CA",
  $caKey,
  [System.Security.Cryptography.HashAlgorithmName]::SHA256,
  [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)
$caRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($true, $false, 0, $true)
)
$caRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
    [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyCertSign -bor
      [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::CrlSign,
    $true
  )
)
$caRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509SubjectKeyIdentifierExtension]::new($caRequest.PublicKey, $false)
)

$caCert = $caRequest.CreateSelfSigned(
  [DateTimeOffset]::Now.AddDays(-1),
  [DateTimeOffset]::Now.AddYears(5)
)

$leafKey = [System.Security.Cryptography.RSA]::Create(2048)
$leafRequest = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
  "CN=localhost",
  $leafKey,
  [System.Security.Cryptography.HashAlgorithmName]::SHA256,
  [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)

$san = [System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
$san.AddDnsName("localhost")
$san.AddIpAddress([System.Net.IPAddress]::Parse("127.0.0.1"))

$eku = [System.Security.Cryptography.OidCollection]::new()
$null = $eku.Add([System.Security.Cryptography.Oid]::new("1.3.6.1.5.5.7.3.1")) # Server Authentication

$leafRequest.CertificateExtensions.Add($san.Build())
$leafRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false, $false, 0, $true)
)
$leafRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
    [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor
      [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment,
    $true
  )
)
$leafRequest.CertificateExtensions.Add(
  [System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]::new($eku, $true)
)

$serial = New-Object byte[] 16
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($serial)
$rng.Dispose()
$leafCert = $leafRequest.Create(
  $caCert,
  [DateTimeOffset]::Now.AddDays(-1),
  [DateTimeOffset]::Now.AddYears(2),
  $serial
)

[System.IO.File]::WriteAllText(
  $caCertPath,
  (ConvertTo-Pem "CERTIFICATE" $caCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
)
[System.IO.File]::WriteAllText(
  $leafCertPath,
  (ConvertTo-Pem "CERTIFICATE" $leafCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
)
[System.IO.File]::WriteAllText($leafKeyPath, (Export-RsaPrivateKeyPem $leafKey))

Write-Output "Created $caCertPath"
Write-Output "Created $leafCertPath"
Write-Output "Created $leafKeyPath"
Write-Output "Trust the CA certificate, not localhost.crt: $caCertPath"
