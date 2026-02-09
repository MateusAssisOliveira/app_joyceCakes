# Script de Limpeza do Projeto (Windows)
# Execute este script no PowerShell para remover arquivos obsoletos

Write-Host \"🧹 Limpando arquivos obsoletos...\" -ForegroundColor Cyan
Write-Host \"\"

# Deletar dashboardService.ts (arquivo vazio/órfão)
$file1 = \"src/services/dashboardService.ts\"
if (Test-Path $file1) {
    Remove-Item $file1
    Write-Host \"✅ Removido: $file1\" -ForegroundColor Green
} else {
    Write-Host \"⏭️  Arquivo não encontrado: $file1\" -ForegroundColor Yellow
}

# Deletar db.ts (arquivo redirecionador vazio)
$file2 = \"src/lib/db.ts\"
if (Test-Path $file2) {
    Remove-Item $file2
    Write-Host \"✅ Removido: $file2\" -ForegroundColor Green
} else {
    Write-Host \"⏭️  Arquivo não encontrado: $file2\" -ForegroundColor Yellow
}

Write-Host \"\"
Write-Host \"✅ Limpeza concluída!\" -ForegroundColor Green
Write-Host \"\"
Write-Host \"📊 Mudanças realizadas:\" -ForegroundColor Cyan
Write-Host \"  - ✅ Removidos arquivos órfãos (dashboardService.ts, db.ts)\" -ForegroundColor Green
Write-Host \"  - ✅ Refatoradas 6 funções de inactivate/reactivate\" -ForegroundColor Green
Write-Host \"  - ✅ Criada função genérica setDocumentActive (reutilizável)\" -ForegroundColor Green
Write-Host \"  - ✅ Código mais limpo e organizado\" -ForegroundColor Green
Write-Host \"\"
Write-Host \"🚀 Próximo passo: git diff para ver as mudanças\" -ForegroundColor Yellow
