$ErrorActionPreference = "Stop"

$baseUrl = if ($env:SYNC_BASE_URL) { $env:SYNC_BASE_URL } else { "http://localhost:4000" }
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

Write-Host "Smoke test em $baseUrl"

$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
Write-Host "Health:" ($health | ConvertTo-Json -Compress)

$reconcileGet = Invoke-RestMethod -Uri "$baseUrl/api/sync/reconcile" -Method GET -Headers $headers
Write-Host "Reconcile GET OK. Tabelas:" $reconcileGet.serverSummary.Count

$clientSummary = @{}
foreach ($item in $reconcileGet.serverSummary) {
  $clientSummary[$item.table] = @{
    count = $item.count
    latestUpdatedAt = $item.latestUpdatedAt
  }
}

$body = @{
  machineId = "smoke-script"
  clientSummary = $clientSummary
} | ConvertTo-Json -Depth 8

$reconcilePost = Invoke-RestMethod -Uri "$baseUrl/api/sync/reconcile" -Method POST -ContentType "application/json" -Body $body -Headers $headers
Write-Host "Reconcile POST isConsistent:" $reconcilePost.isConsistent

$history = Invoke-RestMethod -Uri "$baseUrl/api/sync/reconcile/history?limit=3" -Method GET -Headers $headers
Write-Host "History count:" $history.count

Write-Host "Smoke test concluido."
