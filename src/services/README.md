# Pasta `services/` – Lógica de negócio e acesso a dados

Cada arquivo cuida de **um domínio**. A UI chama essas funções; não acessa Firebase/dados diretamente.

| Arquivo | O que faz |
|---------|-----------|
| `orderService.ts` | Pedidos: criar, listar, atualizar status. |
| `productService.ts` | Produtos: CRUD, listagem. |
| `supplyService.ts` | Insumos/estoque: CRUD, importação. |
| `recipeService.ts` | Fichas técnicas (receitas). |
| `financialMovementService.ts` | Movimentações de caixa. |
| `dashboardService.ts` | Métricas e dados do dashboard. |
| `userService.ts` | Usuários / autenticação. |

Importe sempre de `@/services` (barrel em `index.ts`).
