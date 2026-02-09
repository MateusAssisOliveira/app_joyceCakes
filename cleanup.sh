#!/bin/bash
# Script de Limpeza do Projeto
# Execute este script para remover arquivos obsoletos

echo "🧹 Limpando arquivos obsoletos..."

# Deletar dashboardService.ts (arquivo vazio/órfão)
if [ -f "src/services/dashboardService.ts" ]; then
    rm src/services/dashboardService.ts
    echo "✅ Removido: src/services/dashboardService.ts"
else
    echo "⏭️  Arquivo não encontrado: src/services/dashboardService.ts"
fi

# Deletar db.ts (arquivo redirecionador vazio)
if [ -f "src/lib/db.ts" ]; then
    rm src/lib/db.ts
    echo "✅ Removido: src/lib/db.ts"
else
    echo "⏭️  Arquivo não encontrado: src/lib/db.ts"
fi

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📊 Mudanças realizadas:"
echo "  - ✅ Removidos arquivos órfãos (dashboardService.ts, db.ts)"
echo "  - ✅ Refatoradas 6 funções de inactivate/reactivate"
echo "  - ✅ Criada função genérica setDocumentActive (reutilizável)"
echo "  - ✅ Código mais limpo e organizado"
echo ""
echo "🚀 Próximo passo: git diff para ver as mudanças"
