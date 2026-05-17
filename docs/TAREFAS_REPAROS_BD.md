# Tarefas de reparo do banco

Checklist para organizar os ajustes entre o schema atual do Supabase e o que a aplicacao espera.

## Como executar no Supabase

1. Abra o painel do Supabase do projeto.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Abra no VS Code o arquivo:
   `docs/supabase/migrations/20260517_supplies_profiles_repair.sql`
5. Copie todo o conteudo desse arquivo.
6. Cole no SQL Editor do Supabase.
7. Clique em **Run**.
8. Se executar sem erro, recarregue o app no navegador.
9. Teste criar uma nova ficha de insumo.

Se aparecer erro no SQL Editor, nao rode outros comandos por cima. Copie a mensagem de erro e coloque aqui para investigarmos.

## SQL que precisa rodar agora

O arquivo principal e:

`docs/supabase/migrations/20260517_supplies_profiles_repair.sql`

Ele resolve estes erros:

- `Could not find the 'brand' column of 'supplies'`
- `permission denied for table profiles`
- incompatibilidade entre colunas `snake_case` do banco e colunas `camelCase` usadas pelo app em `supplies`

## Urgente

- [ ] Executar no Supabase SQL Editor a migration:
  `docs/supabase/migrations/20260517_supplies_profiles_repair.sql`
- [ ] Confirmar que a coluna `public.supplies.brand` existe.
- [ ] Confirmar que `public.supplies` possui tambem as colunas usadas pelo app:
  `tenantId`, `costPerUnit`, `purchaseFormat`, `packageCost`, `packageQuantity`,
  `lastPurchaseDate`, `expirationDate`, `minStock`, `isActive`, `createdAt`, `updatedAt`.
- [ ] Confirmar que o trigger `trg_sync_supplies_case_columns` foi criado.
- [ ] Confirmar que `public.profiles` permite leitura do proprio usuario autenticado.
- [ ] Recarregar o app e testar criar uma nova ficha de insumo.

## Validacao apos executar

- [ ] Criar uma nova ficha de insumo com nome, marca, categoria, tipo e estoque minimo.
- [ ] Verificar se o item aparece na lista de insumos.
- [ ] Abrir o item e registrar uma entrada de estoque.
- [ ] Verificar se a movimentacao aparece no historico.
- [ ] Confirmar no console do navegador que nao aparecem mais:
  - `Could not find the 'brand' column of 'supplies'`
  - `permission denied for table profiles`

## Padronizacao futura

- [ ] Escolher um padrao definitivo de nomes de coluna:
  - manter o app em camelCase e ajustar o banco; ou
  - migrar o app para snake_case e ajustar os services/adapters.
- [ ] Revisar outras tabelas que tambem misturam padroes:
  `products`, `orders`, `cash_registers`, `financial_movements`, `technical_sheets`.
- [ ] Criar migrations definitivas depois que o app estiver estavel.
- [ ] Remover colunas duplicadas somente depois de confirmar que nenhum fluxo antigo depende delas.

## Observacoes

- O arquivo `squema_bd.txt` e apenas um export/contexto do schema atual; nao deve ser executado direto.
- A migration de reparo foi feita para ser idempotente e nao apagar dados.
- A prioridade agora e destravar o cadastro de insumos e o acesso ao profile.
