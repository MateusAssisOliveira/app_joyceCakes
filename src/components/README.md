# Pasta `components/` – Componentes reutilizáveis

Aqui ficam **pedaços de UI** usados nas páginas. Nenhum arquivo aqui define rota (URL).

| Pasta | Conteúdo |
|-------|----------|
| **ui/** | Componentes base (shadcn): Button, Card, Dialog, Input, Table, etc. |
| **admin/** | Componentes usados só no admin: forms, dialogs, tabelas, gráficos por feature (cash-flow, orders, products, supplies, recipes). |

**Não coloque aqui:** arquivos `page.tsx` ou a “página inteira” de uma rota → isso fica em **`src/app/admin/`**.

Mapa completo: **[docs/ESTRUTURA_DO_PROJETO.md](../../docs/ESTRUTURA_DO_PROJETO.md)**.
