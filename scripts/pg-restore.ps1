$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$File
)

$serverEnvPath = Join-Path $PSScriptRoot "..\server\.env"
if (-not (Test-Path $serverEnvPath)) {
  throw "Arquivo server/.env não encontrado."
}

if (-not (Test-Path $File)) {
  throw "Arquivo de backup não encontrado: $File"
}

function Get-EnvMap([string]$path) {
  $map = @{}
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $parts = $line -split "=", 2
    if ($parts.Count -eq 2) {
      $map[$parts[0].Trim()] = $parts[1].Trim().Trim('"')
    }
  }
  return $map
}

function Resolve-PsqlPath {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName "bin\psql.exe" } |
    Where-Object { Test-Path $_ } |
    ForEach-Object { (Get-Item $_).FullName }

  $firstCandidate = $candidates | Select-Object -First 1
  if ($firstCandidate) {
    return $firstCandidate
  }

  throw "psql não encontrado. Adicione PostgreSQL\\bin no PATH."
}

$envMap = Get-EnvMap $serverEnvPath
$dbHost = $envMap["DB_HOST"]
$dbPort = $envMap["DB_PORT"]
$dbUser = $envMap["DB_USER"]
$dbName = $envMap["DB_NAME"]
$dbPassword = $envMap["DB_PASSWORD"]

if (-not $dbHost -or -not $dbPort -or -not $dbUser -or -not $dbName -or -not $dbPassword) {
  throw "Variáveis DB_* incompletas em server/.env"
}

$psql = Resolve-PsqlPath
Write-Host "Usando psql em: $psql"
$env:PGPASSWORD = $dbPassword
& $psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $File
if ($LASTEXITCODE -ne 0) {
  throw "Restore falhou com código $LASTEXITCODE"
}

Write-Host "Restore concluído: $File"
