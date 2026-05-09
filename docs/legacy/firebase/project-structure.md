# 🏗️ Estrutura de Arquivos

Entenda como o projeto está organizado.

---

## 📂 Pastas Principais

```
app_joyceCakes/
├── src/                          # Código-fonte da aplicação
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Pages administrativas
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   └── cash-flow/
│   │   ├── globals.css           # Estilos globais
│   │   ├── layout.tsx            # Layout principal
│   │   └── page.tsx              # Home page
│   │
│   ├── components/               # Componentes React reutilizáveis
│   │   ├── admin/                # Componentes administrativos
│   │   │   ├── cash-flow/
│   │   │   ├── inventory/
│   │   │   ├── products/
│   │   │   └── supplies/
│   │   └── ui/                   # Componentes base (Button, Card, etc)
│   │
│   ├── services/                 # Lógica de negócio
│   │   ├── orderService.ts       # Operações com pedidos
│   │   ├── productService.ts     # Operações com produtos
│   │   ├── supplyService.ts      # Operações com estoque
│   │   ├── financialMovementService.ts
│   │   └── userService.ts
│   │
│   ├── firebase/                 # Integração Firebase
│   │   ├── config.ts             # Configuração do Firebase
│   │   ├── client-provider.tsx   # Provider de contexto
│   │   └── firestore/            # Operações Firestore
│   │
│   ├── data/                     # Dados mockados e seed
│   │   ├── db.ts                 # Operações com Firestore
│   │   ├── mock.ts               # Dados para teste
│   │   └── seed.ts               # Popular DB inicial
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                      # Utilidades e helpers
│   │   ├── logger.ts             # Sistema de logs
│   │   ├── error-handler.ts      # Tratamento de erros
│   │   ├── utils.ts              # Funções auxiliares
│   │   └── validators.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── index.ts              # Tipos principais
│   │   └── genkit.d.ts           # Tipos do Genkit
│   │
│   └── ai/                       # Integração com IA
│       ├── genkit.ts
│       └── dev.ts
│
├── server/                       # Backend para sync
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── api/
│   │   │   ├── orders.ts
│   │   │   ├── products.ts
│   │   │   ├── supplies.ts
│   │   │   └── sync.ts
│   │   └── db/
│   │       ├── postgres.ts
│   │       └── sqlite.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                         # Documentação
│   ├── getting-started/
│   ├── user-guide/
│   ├── architecture/
│   ├── deployment/
│   └── reference/
│
├── scripts/                      # Scripts auxiliares
│   └── simulateFinancialFlow.js
│
├── package.json                  # Dependências do projeto
├── tsconfig.json                 # Configuração TypeScript
├── tailwind.config.ts            # Configuração Tailwind
├── next.config.ts                # Configuração Next.js
└── .env.local                    # Variáveis de ambiente
```

---

## 📦 Camadas da Aplicação

### 1️⃣ UI Components (`src/components/`)

```typescript
// Componentes puros, sem lógica de negócio
<Button />
<Card />
<DatePicker />
```

**Responsabilidade:** Renderizar interface

---

### 2️⃣ Pages (`src/app/`)

```typescript
// Páginas do Next.js
export default function DashboardPage() {
  return <DashboardClient />
}
```

**Responsabilidade:** Estrutura de rota

---

### 3️⃣ Client Components (`src/app/*/client.tsx`)

```typescript
'use client'
// Lógica da página + estado
function DashboardClient() {
  const { products } = useCollection('products')
  return <Dashboard products={products} />
}
```

**Responsabilidade:** Orquestração de dados

---

### 4️⃣ Services (`src/services/`)

```typescript
// Lógica de negócio pura
async function createProduct(data: ProductInput) {
  const cost = calculateCost(data.recipe)
  // Validações
  // Cálculos
  // Persistência
  return productService.create({...data, cost})
}
```

**Responsabilidade:** Regras de negócio

---

### 5️⃣ Firebase/Database (`src/firebase/`, `src/data/`)

```typescript
// Acesso ao banco de dados
async function fetchProducts() {
  const collection = db.collection('products')
  return collection.getDocs()
}
```

**Responsabilidade:** I/O persistence

---

## 🔄 Fluxo de Dados

```
User Input (UI)
    ↓
Page Component (DashboardClient)
    ↓
Service Layer (productService)
    ↓
Firebase (Firestore)
    ↓
Response
    ↓
UI Component (Dashboard)
    ↓
Rendered Screen
```

---

## 📁 Convenções

### Nomenclatura de Arquivos

```
✅ product.tsx          (componente)
✅ product-list.tsx     (componente composto)
✅ use-products.ts      (custom hook)
✅ products-client.tsx  (client component)
✅ productService.ts    (service)
✅ product.d.ts         (tipos)

❌ Product.tsx          (PascalCase em React)
❌ product_list.tsx     (snake_case)
```

### Estrutura de Componente

```typescript
// Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Types
interface ProductProps {
  id: string
  name: string
}

// Component
export function Product({ id, name }: ProductProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Logic
  
  // Render
  return <div>{name}</div>
}
```

---

## 🚀 Como Encontrar Código

| Tarefa | Pasta |
|--------|-------|
| Alterar botão | `src/components/ui/button.tsx` |
| Editar dashboard | `src/app/admin/dashboard/` |
| Mudar cálculo de lucro | `src/services/financialMovementService.ts` |
| Adicionar estoque | `src/components/admin/supplies/` |
| Novo tipo | `src/types/index.ts` |

---

**Próximo:** [Tech Stack](tech-stack.md) | [Design System](../../docs/DESIGN_SYSTEM.md)
