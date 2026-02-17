$ErrorActionPreference = "Stop"

function Find-PostgresService {
  $services = Get-Service | Where-Object {
    $_.Name -match "^postgresql" -or $_.DisplayName -match "PostgreSQL"
  }

  if (-not $services) {
    return $null
  }

  $running = $services | Where-Object { $_.Status -eq "Running" } | Select-Object -First 1
  if ($running) {
    return $running
  }

  return $services | Select-Object -First 1
}

$pgService = Find-PostgresService

if (-not $pgService) {
  Write-Host "[postgres] Nenhum serviço PostgreSQL encontrado no Windows Services. Pulando auto-start."
  exit 0
}

if ($pgService.Status -eq "Running") {
  Write-Host "[postgres] Serviço '$($pgService.Name)' já está em execução."
  exit 0
}

Write-Host "[postgres] Serviço '$($pgService.Name)' está parado. Tentando iniciar..."

try {
  Start-Service -Name $pgService.Name
} catch {
  Write-Error "[postgres] Falha ao iniciar serviço '$($pgService.Name)'. Execute o terminal como Administrador."
  exit 1
}

try {
  $pgService.WaitForStatus("Running", [TimeSpan]::FromSeconds(15))
} catch {
  Write-Error "[postgres] Serviço '$($pgService.Name)' não entrou em Running em 15s."
  exit 1
}

Write-Host "[postgres] Serviço '$($pgService.Name)' iniciado com sucesso."
exit 0
