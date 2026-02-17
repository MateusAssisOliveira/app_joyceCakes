$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) {
  throw "npm.cmd nao encontrado no PATH."
}

Write-Host "[dev:all] Iniciando servidor sync..."
$serverProcess = Start-Process `
  -FilePath $npmCmd `
  -ArgumentList @("--prefix", "server", "run", "dev") `
  -WorkingDirectory $root `
  -PassThru

Start-Sleep -Seconds 2

try {
  Write-Host "[dev:all] Iniciando frontend LAN..."
  & $npmCmd run dev:lan
} finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Write-Host "[dev:all] Encerrando servidor sync..."
    Stop-Process -Id $serverProcess.Id -Force
  }
}
