$ErrorActionPreference = "Stop"

$base = if ($env:SYNC_BASE_URL) { $env:SYNC_BASE_URL } else { "http://localhost:4000" }
function Get-KeyFromRootEnv {
  $rootEnv = Join-Path $PSScriptRoot "..\.env"
  if (-not (Test-Path $rootEnv)) { return $null }
  $line = Get-Content $rootEnv | Where-Object { $_ -match '^NEXT_PUBLIC_SYNC_API_KEY=' } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -split "=", 2)[1].Trim().Trim('"')
}

$apiKey = if ($env:SYNC_API_KEY) {
  $env:SYNC_API_KEY
} elseif ($env:NEXT_PUBLIC_SYNC_API_KEY) {
  $env:NEXT_PUBLIC_SYNC_API_KEY
} else {
  Get-KeyFromRootEnv
}
$headers = @{}
if ($apiKey) {
  $headers["x-api-key"] = $apiKey
}

Write-Host "Reliability test em $base"

# 1) Idempotência
$id = [guid]::NewGuid().ToString()
$eventId = [guid]::NewGuid().ToString()
$updatedAt = (Get-Date).ToUniversalTime().ToString("o")
$payload = @{
  machineId = "reliability-A"
  localUpdates = @(
    @{
      eventId = $eventId
      record = @{
        id = $id
        name = "Reliability Product"
        description = "Idempotency"
        price = 10.5
        category = "Teste"
        stock_quantity = 1
        updatedAt = $updatedAt
      }
    }
  )
} | ConvertTo-Json -Depth 8

Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body $payload -Headers $headers | Out-Null
Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body $payload -Headers $headers | Out-Null

$products = Invoke-RestMethod -Uri "$base/api/products" -Method GET
$occurrences = @($products.data | Where-Object { $_.id -eq $id }).Count
if ($occurrences -ne 1) {
  throw "Falha em idempotência: esperado 1 ocorrência, obtido $occurrences"
}

# 2) Conflito stale (update antigo deve ser ignorado)
$futureTime = (Get-Date).ToUniversalTime().AddMinutes(1).ToString("o")
$currentUpdate = @{
  machineId = "reliability-A"
  localUpdates = @(
    @{
      eventId = [guid]::NewGuid().ToString()
      record = @{
        id = $id
        name = "Reliability Product"
        description = "Fresh"
        price = 11.0
        category = "Teste"
        stock_quantity = 1
        updatedAt = $futureTime
      }
    }
  )
} | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body $currentUpdate -Headers $headers | Out-Null

$staleTime = (Get-Date).ToUniversalTime().AddMinutes(-5).ToString("o")
$staleUpdate = @{
  machineId = "reliability-B"
  localUpdates = @(
    @{
      eventId = [guid]::NewGuid().ToString()
      record = @{
        id = $id
        name = "Reliability Product"
        description = "Stale"
        price = 8.0
        category = "Teste"
        stock_quantity = 1
        updatedAt = $staleTime
      }
    }
  )
} | ConvertTo-Json -Depth 8
$staleResp = Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body $staleUpdate -Headers $headers
$hasStaleConflict = @($staleResp.conflicts | Where-Object { $_.resolution -eq "skipped_stale" }).Count -gt 0
if (-not $hasStaleConflict) {
  throw "Falha em conflito stale: expected skipped_stale conflict"
}

# 3) Delete com tombstone
$deletePayload = @{
  machineId = "reliability-B"
  localUpdates = @(
    @{
      eventId = [guid]::NewGuid().ToString()
      record = @{
        id = $id
        _op = "delete"
      }
    }
  )
} | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body $deletePayload -Headers $headers | Out-Null

$fetchAfterDelete = Invoke-RestMethod -Uri "$base/api/sync/products" -Method POST -ContentType "application/json" -Body (@{ machineId = "reliability-A"; localUpdates = @() } | ConvertTo-Json -Depth 5) -Headers $headers
$hasTomb = @($fetchAfterDelete.synced | Where-Object { $_.id -eq $id -and $_._deleted -eq $true }).Count -gt 0
if (-not $hasTomb) {
  throw "Falha em delete tombstone: cliente não recebeu _deleted"
}

Write-Host "Reliability test concluído com sucesso."
