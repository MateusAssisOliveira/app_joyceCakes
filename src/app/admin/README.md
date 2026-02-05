# Pasta `app/admin/` – Rotas e páginas do painel admin

Aqui ficam **apenas** as rotas e o conteúdo de cada tela do admin.

- Cada subpasta com **`page.tsx`** = uma URL: `/admin/dashboard`, `/admin/orders`, etc.
- O **`page.tsx`** importa um componente **`*-client.tsx`** (ex.: `CashFlowClient`, `InventoryClient`) que fica **nesta mesma pasta** ou na subpasta.
- Esse **-client** monta a tela usando componentes de **`@/components/admin/`** (dialogs, formulários, tabelas).

**Não coloque aqui:** formulários, dialogs ou tabelas reutilizáveis → esses vão em **`src/components/admin/`**.

Mapa completo: **[docs/ESTRUTURA_DO_PROJETO.md](../../../docs/ESTRUTURA_DO_PROJETO.md)**.
