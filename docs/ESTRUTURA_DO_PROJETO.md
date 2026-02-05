# Estrutura do Projeto – Doce Caixa

Este documento explica **onde fica cada tipo de arquivo** e **o que cada pasta contém**. Use como referência ao abrir o projeto.

---

## Regra geral

| Onde | O que fica |
|------|------------|
| **`src/app/`** | Rotas (URLs), páginas (`page.tsx`) e o **cliente da página** (ex.: `cash-flow-client.tsx`) que essa rota usa. |
| **`src/components/`** | Componentes reutilizáveis: formulários, diálogos, tabelas, gráficos. **Nada de rotas aqui.** |
| **`src/services/`** | Lógica de negócio e acesso a dados (Firebase, APIs). |
| **`src/types/`** | Tipos TypeScript (interfaces, tipos) usados no app. |
| **`src/lib/`** | Utilitários gerais (formatação, helpers, config de UI). |
| **`src/firebase/`** | Configuração e hooks do Firebase (auth, Firestore). |
| **`src/data/`** | Dados em memória / mock (desenvolvimento ou fallback). |
| **`src/hooks/`** | Hooks React reutilizáveis (ex.: `useToast`, `useMobile`). |

---

## Mapa de pastas em detalhe

### `src/app/` – Rotas e páginas

Contém **apenas** o que define as URLs e o conteúdo de cada tela.

```
app/
├── layout.tsx          → Layout raiz (todas as páginas)
├── page.tsx             → Página inicial (ex.: login ou landing)
├── globals.css
├── printing.css
└── admin/               → Tudo que é /admin/*
    ├── layout.tsx       → Layout do admin (sidebar, proteção de rota)
    ├── admin-panel.tsx  → Painel com sidebar
    ├── active-link.tsx  → Link ativo do menu
    ├── dynamic-header.tsx
    ├── loading.tsx      → Loading do admin
    │
    ├── dashboard/
    │   └── page.tsx     → GET /admin/dashboard
    │
    ├── cash-flow/
    │   ├── page.tsx     → GET /admin/cash-flow
    │   └── cash-flow-client.tsx   → Lógica e UI da página de caixa
    │
    ├── orders/
    │   ├── page.tsx     → GET /admin/orders (PDV)
    │   ├── point-of-sale-client.tsx
    │   └── edit/
    │       └── page.tsx → GET /admin/orders/edit
    │
    ├── inventory/
    │   ├── page.tsx     → GET /admin/inventory (estoque)
    │   └── inventory-client.tsx
    │
    ├── products/
    │   ├── page.tsx     → GET /admin/products
    │   └── products-client.tsx
    │
    ├── recipes/
    │   ├── page.tsx     → GET /admin/recipes (fichas técnicas)
    │   └── recipes-client.tsx
    │
    ├── calculator/
    │   ├── page.tsx     → GET /admin/calculator
    │   └── calculator-client.tsx
    │
    └── supplies/
        ├── supply-details-sheet.tsx
        ├── supply-form-dialog.tsx
        └── report/
            ├── page.tsx         → GET /admin/supplies/report
            └── report-client.tsx
```

**Regra em `app/admin/`:**  
Cada rota tem um `page.tsx` que importa um **-client** (ex.: `CashFlowClient`). Esse **-client** é o único arquivo “pesado” da página e pode importar componentes de `@/components/admin/`.

---

### `src/components/` – Componentes reutilizáveis

Aqui ficam **pedaços de UI e lógica reutilizável**. Nenhum arquivo aqui define rota.

```
components/
├── ui/                  → Componentes base (shadcn): Button, Card, Dialog, etc.
├── FirebaseErrorListener.tsx
│
└── admin/               → Componentes usados só nas telas do admin
    ├── page-header.tsx
    ├── metric-card.tsx
    ├── low-stock-alert.tsx
    ├── order-receipt.tsx
    ├── cash-control.tsx
    ├── recent-movements.tsx
    ├── sales-chart.tsx
    ├── cash-flow-chart.tsx
    ├── top-products-chart.tsx
    ├── payment-methods-chart.tsx
    │
    ├── cash-flow/
    │   ├── open-cash-register-dialog.tsx
    │   ├── add-movement-dialog.tsx
    │   ├── cash-flow-header.tsx
    │   ├── cash-flow-metrics.tsx
    │   └── recent-movements-table.tsx
    │
    ├── orders/
    │   └── new-order-dialog.tsx
    │
    ├── products/
    │   └── product-form.tsx
    │
    ├── recipes/
    │   ├── recipe-form.tsx
    │   ├── recipe-form-dialog.tsx
    │   └── recipe-list.tsx
    │
    └── supplies/
        ├── supply-table.tsx
        ├── supply-form-dialog.tsx
        ├── supply-details-sheet.tsx
        ├── supply-actions.tsx
        ├── supply-import-dialog.tsx
        └── price-history-dialog.tsx
```

**Regra:**  
Se for **página inteira ou rota** → fica em `app/`.  
Se for **bloco reutilizável** (form, dialog, tabela, gráfico) → fica em `components/`.

---

### `src/services/` – Regras de negócio e dados

Cada arquivo cuida de um domínio. A UI chama os serviços; os serviços falam com Firebase/dados.

| Arquivo | Responsabilidade |
|---------|------------------|
| `orderService.ts` | Pedidos: criar, listar, atualizar status. |
| `productService.ts` | Produtos: CRUD, listagem. |
| `supplyService.ts` | Insumos/estoque: CRUD, importação. |
| `recipeService.ts` | Fichas técnicas (receitas). |
| `financialMovementService.ts` | Movimentações de caixa. |
| `dashboardService.ts` | Métricas e dados do dashboard. |
| `userService.ts` | Usuários / auth. |

---

### `src/types/` – Tipos TypeScript

Um único ponto para interfaces e tipos do domínio: `Order`, `Product`, `Supply`, etc.  
Arquivo principal: `index.ts`.

---

### `src/firebase/` – Firebase

Config, provider, hooks de auth e Firestore (`useUser`, `useCollection`, `useDoc`).  
A aplicação usa isso como “fonte de dados” em produção.

---

### `src/data/` – Dados em memória / mock

`db.ts`, `mock.ts`, `seed.ts`: dados simulados para desenvolvimento ou testes.  
Em produção o app usa principalmente Firebase.

---

### `src/lib/` – Utilitários

- `utils.ts`: funções gerais (ex.: `cn` para classes).
- `placeholder-images.ts`: imagens de lugar.
- `db.ts`: só redireciona para usar `@/services` (não contém dados).

---

## Fluxo ao abrir uma tela

1. **URL** (ex.: `/admin/cash-flow`) → arquivo em `app/admin/cash-flow/page.tsx`.
2. **page.tsx** renderiza um componente **-client** (ex.: `CashFlowClient`), que está na mesma pasta ou em `app/admin/`.
3. O **-client** monta a tela usando componentes de `@/components/admin/` (dialogs, tabelas, etc.) e chama funções de `@/services/` e hooks de `@/firebase/`.

Assim você sabe: **rota e “donos” da página** em `app/`, **peças reutilizáveis** em `components/`, **regras e dados** em `services/`.

---

## Resumo rápido

| Quero... | Onde procurar |
|----------|----------------|
| Alterar uma **URL** ou o que aparece em **uma página** | `src/app/admin/<pasta>/` (page.tsx + *-client.tsx) |
| Alterar um **formulário**, **dialog**, **tabela** ou **gráfico** | `src/components/admin/` (por feature: cash-flow, orders, products, supplies, recipes) |
| Alterar **lógica de pedidos/produtos/caixa/estoque** | `src/services/` |
| Alterar **tipos** (Order, Product, etc.) | `src/types/index.ts` |
| Alterar **login / Firebase** | `src/firebase/` |
| Componentes **genéricos** (botão, card, input) | `src/components/ui/` |

Se seguir essas regras, ao abrir uma pasta você saberá exatamente o que ela contém.

---

## Limpeza feita

Foram removidos arquivos **duplicados** que não eram importados (a página usava sempre a versão em `app/admin/`):

- `components/admin/calculator/calculator-client.tsx` → a rota usa `app/admin/calculator/calculator-client.tsx`
- `components/admin/products/products-client.tsx` → a rota usa `app/admin/products/products-client.tsx`
- `components/admin/supplies/inventory-client.tsx` → a rota usa `app/admin/inventory/inventory-client.tsx`

A pasta `components/admin/calculator/` pode estar vazia; você pode apagá-la se quiser.
