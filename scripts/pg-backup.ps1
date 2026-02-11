$ErrorActionPreference = "Stop"

$serverEnvPath = Join-Path $PSScriptRoot "..\server\.env"
if (-not (Test-Path $serverEnvPath)) {
  throw "Arquivo server/.env não encontrado."
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

function Resolve-PgDumpPath {
  $cmd = Get-Command pg_dump -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  $candidates = Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName "bin\pg_dump.exe" } |
    Where-Object { Test-Path $_ } |
    ForEach-Object { (Get-Item $_).FullName }

  $firstCandidate = $candidates | Select-Object -First 1
  if ($firstCandidate) {
    return $firstCandidate
  }

  throw "pg_dump não encontrado. Adicione PostgreSQL\\bin no PATH."
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

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$backupFile = Join-Path $backupDir "joycecakes-$timestamp.sql"
$pgDump = Resolve-PgDumpPath
Write-Host "Usando pg_dump em: $pgDump"

$env:PGPASSWORD = $dbPassword
& $pgDump -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump falhou com código $LASTEXITCODE"
}

Write-Host "Backup criado em: $backupFile"
