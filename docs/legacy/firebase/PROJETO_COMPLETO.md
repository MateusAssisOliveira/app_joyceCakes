
# 📁 Documentação Completa do Projeto: Doce Caixa

## 💻 Código Fonte

---

### 📄 .env

```text

```

---

### 📄 README.md

```markdown
# Guia de Funcionamento da Aplicação "Doce Caixa"

Este documento explica como as diferentes partes da sua aplicação de dashboard funcionam e interagem entre si, com foco no fluxo de dados.

## 1. Arquitetura Geral

A aplicação segue uma arquitetura de 3 camadas para separar as responsabilidades, o que a torna organizada e fácil de manter.

1.  **Camada de UI (Interface do Usuário)** - `(src/app)`
    *   São os componentes que você vê na tela (páginas, botões, tabelas).
    *   Eles são responsáveis por exibir os dados e capturar as interações do usuário (como um clique de botão).
    *   **Importante:** A UI **nunca** fala diretamente com o banco de dados. Ela sempre passa por um "intermediário".

2.  **Camada de Serviço (O Intermediário)** - `(src/services)`
    *   Esta camada atua como uma ponte entre a UI e os dados.
    *   Ela contém funções com nomes claros como `getOrders()` ou `addSupply()`.
    *   **Vantagem:** Se um dia trocarmos o banco de dados, só precisamos alterar a Camada de Serviço. A UI continuará funcionando da mesma forma, sem precisar de alterações.

3.  **Camada de Dados (O "Banco de Dados")** - `(src/data)`
    *   Atualmente, esta camada simula um banco de dados usando arquivos em memória (`db.ts`).
    *   Ela armazena os dados brutos (listas de pedidos, produtos, insumos) e contém a lógica para manipulá-los diretamente.

**Fluxo de Dados Típico:** Um componente na UI (ex: a página de Pedidos) precisa exibir os pedidos -> ele chama a função `getOrders()` da Camada de Serviço -> a função `getOrders()` busca os dados na Camada de Dados e os retorna para a UI, que então os exibe na tela.

---

## 2. Detalhamento das Páginas e Interações

Aqui está o passo a passo de como cada página funciona:

### a) Página: `Dashboard` (`/admin/dashboard`)

*   **O que faz?**
    *   Apresenta uma visão geral e em tempo real do negócio.
    *   Exibe métricas rápidas (cards), gráficos de vendas, produtos populares, fluxo de caixa e movimentações financeiras recentes.

*   **Como interage e pega os dados?**
    *   Esta página é um **Componente de Servidor**. Isso significa que, quando você a acessa, o servidor executa as funções de busca de dados *antes* de enviar a página pronta para o seu navegador. Isso a torna muito rápida.
    *   Ela chama várias funções do `dashboardService.ts` (que por sua vez busca os dados mocados em `src/data/mock.ts`):
        *   `getDashboardMetrics()` para os cards.
        *   `getSalesLast7Days()` para o gráfico de vendas.
        *   `getTopProducts()` para o gráfico de produtos mais vendidos.
        *   E assim por diante para cada componente do dashboard.

### b) Página: `Ponto de Venda (PDV)` (`/admin/orders`)

*   **O que faz?**
    *   É o centro de operações de vendas.
    *   Exibe a lista de todos os pedidos existentes, permitindo alterar o status de cada um.
    *   Permite a criação rápida de um novo pedido para vendas de balcão.

*   **Como interage e pega os dados?**
    1.  **Carregamento:** A página principal (`page.tsx`) é um Componente de Servidor. Ela chama `getOrders()` e `getProducts()` do `orderService` e `productService` para buscar os dados iniciais.
    2.  **Interação:** Os dados são passados para o componente cliente `point-of-sale-client.tsx`, que gerencia toda a interatividade:
        *   **Criar Pedido:** Quando você adiciona produtos a um novo pedido e clica em "Finalizar", o componente chama a função `addOrder()` do `orderService`.
        *   **Alterar Status:** Quando você muda o status de um pedido na tabela, o componente chama `updateOrderStatus()` do `orderService`.
        *   Após cada ação, a lista de pedidos é atualizada na tela para refletir a mudança.

### c) Página: `Editar Pedido` (`/admin/orders/edit`)

*   **O que faz?**
    *   Permite modificar um pedido que já foi criado.
    *   O usuário pode alterar a quantidade de itens, adicionar novos produtos ou remover itens existentes.

*   **Como interage e pega os dados?**
    1.  **Carregamento:** A página identifica qual pedido editar através do ID na URL (ex: `.../edit?id=#PED-001`).
    2.  Ela chama a função `getOrderById(ID)` do `orderService` para buscar os detalhes daquele pedido específico e exibi-los.
    3.  **Salvando:** Quando você clica em "Salvar Alterações", a página chama a função `updateOrder()` do `orderService`, passando o ID do pedido e a nova lista de itens.

### d) Página: `Gerenciar Insumos` (`/admin/supplies`)

*   **O que faz?**
    *   É a página de controle de estoque de matéria-prima (farinha, açúcar, etc.).
    *   Lista todos os insumos e permite Adicionar, Editar ou Excluir cada um.

*   **Como interage e pega os dados?**
    1.  **Carregamento:** A página (`page.tsx`) busca a lista inicial de insumos chamando `getSupplies()` do `supplyService`.
    2.  **Interação:** Os dados são passados para o `supplies-client.tsx`:
        *   **Adicionar:** Ao preencher o formulário no `Dialog` e salvar, ele chama `addSupply()` do `supplyService`.
        *   **Editar:** Ao dar duplo clique em um item e salvar as alterações, ele chama `updateSupply()`.
        *   **Excluir:** Ao clicar no ícone de lixeira, ele chama `deleteSupply()`.

### e) Página: `Criar Receita` (`/admin/recipes`)

*   **O que faz?**
    *   É uma calculadora de custos avançada.
    *   Permite montar uma "receita" virtual adicionando insumos e suas quantidades para calcular o custo exato de produção de um item personalizado.
    *   Com base no custo e em uma margem de lucro, ela sugere um preço de venda e permite salvar essa receita como um "Pedido Personalizado".

*   **Como interage e pega os dados?**
    1.  **Carregamento:** A página busca a lista de todos os insumos disponíveis chamando `getSupplies()` do `supplyService`.
    2.  **Cálculo:** O componente `create-recipe-client.tsx` usa os dados dos insumos (custo por unidade) para calcular o custo total da receita em tempo real, conforme você adiciona ingredientes.
    3.  **Salvar como Pedido:** Ao clicar em "Salvar Pedido Personalizado", o componente reúne os detalhes da receita e chama a função `addOrder()` do `orderService`, criando um novo pedido na lista de pedidos gerais.
```

---

### 📄 apphosting.yaml

```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1
```

---

### 📄 components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

### 📄 firestore.rules

```firestore
/**
 * # Firestore Security Rules
 *
 * ## Core Philosophy
 * This ruleset enforces a security model that distinguishes between globally accessible business data and private, user-owned data. The primary goal is to ensure that while authenticated employees can manage shared resources like products and orders, a user's financial data (like cash register sessions) remains strictly accessible only to them. This provides a secure foundation for rapid application prototyping.
 *
 * ## Data Structure
 * The data is organized into several top-level collections for shared business data and a nested, user-specific structure for private data:
 * - `/products/{productId}`: A global catalog of all products.
 * - `/orders/{orderId}`: A global collection of all customer orders.
 * - `/financial_categories/{financialCategoryId}`: Global categories for financial transactions.
 * - `/supplies/{supplyId}`: A global catalog of all raw materials and supplies.
 * - `/technical_sheets/{sheetId}`: A global collection of all technical sheets (recipes, assemblies).
 * - `/users/{userId}/cash_registers/{cashRegisterId}`: A user-specific collection where each user manages their own cash register sessions. This hierarchical structure is key to the ownership model.
 *
 * ## Key Security Decisions
 * - **User Data Privacy**: All data under `/users/{userId}` is strictly controlled. A user can only access documents where their UID matches the `{userId}` in the path. This prevents users from seeing or modifying each other's financial records.
 * - **Authenticated Access for Global Data**: For shared collections like `/products`, `/orders`, and `/supplies`, any authenticated user (assumed to be an employee) is granted read and write access. This facilitates collaborative management in a trusted environment during prototyping. This can be tightened later by introducing a role-based system.
 * - **No Public Access**: Unauthenticated access is denied for all collections. All users must be signed in to interact with the application data.
 * - **Data Shape Flexibility**: In line with the prototyping philosophy, these rules do not validate the specific fields or data types of documents. Validation is focused solely on user identity, ownership, and critical relational links (e.g., ensuring a `userId` in a document matches the `userId` in the path).
 *
 * ## Denormalization for Authorization
 * The rules leverage the data structure for efficient authorization. By placing user-specific data under `/users/{userId}`, we can use fast, path-based security checks (`isOwner(userId)`) without needing to perform costly `get()` or `exists()` calls to other documents just to verify ownership.
 *
 * ## Structural Segregation
 * This ruleset uses structural segregation effectively by separating user-private data (`/users/{userId}/cash_registers`) from global business data (`/products`, `/orders`, `/supplies`). This is more secure and performant than mixing data types in a single collection.
 */
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ---------------------------------------------------------------------
    // Helper Functions
    // ---------------------------------------------------------------------

    /**
     * Checks if the user is authenticated.
     */
    function isSignedIn() {
      return request.auth != null;
    }

    /**
     * Checks if the authenticated user's ID matches the provided userId.
     * This is the core function for enforcing data ownership.
     */
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    /**
     * Ensures an existing document is being targeted.
     * CRITICAL for all update and delete operations to prevent unintended side effects.
     */
    function documentExists() {
      return resource != null;
    }

    /**
     * Combines ownership and existence checks for secure updates and deletes.
     */
    function isExistingOwner(userId) {
      return isOwner(userId) && documentExists();
    }

    // ---------------------------------------------------------------------
    // Collection Rules
    // ---------------------------------------------------------------------

    /**
     * @description Manages the bakery's product catalog. Assumes all authenticated
     *              users are employees who can manage products.
     * @path /products/{productId}
     * @allow (get) An employee views a specific product's details. auth.uid = "employee_abc"
     * @deny (create) An unauthenticated user tries to add a new product. auth = null
     * @principle Grants full read/write access to any authenticated user, treating them as trusted internal staff.
     */
    match /products/{productId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && documentExists();
      allow delete: if isSignedIn() && documentExists();
    }

    /**
     * @description Manages the bakery's raw material supplies. Assumes all authenticated
     *              users are employees who can manage the inventory.
     * @path /supplies/{supplyId}
     * @allow (list) An employee lists all available supplies for inventory check. auth.uid = "employee_abc"
     * @deny (delete) An unauthenticated user tries to delete a supply item. auth = null
     * @principle Grants full read/write access to any authenticated user for managing shared inventory.
     */
    match /supplies/{supplyId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && documentExists();
      allow delete: if isSignedIn() && documentExists();
    }

    /**
     * @description Manages financial categories. Assumes all authenticated users are
     *              employees who can manage this shared configuration data.
     * @path /financial_categories/{financialCategoryId}
     * @allow (list) An employee lists all available financial categories. auth.uid = "employee_abc"
     * @deny (update) An unauthenticated user tries to change a category. auth = null
     * @principle Grants full read/write access to any authenticated user for shared application configuration.
     */
    match /financial_categories/{financialCategoryId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && documentExists();
      allow delete: if isSignedIn() && documentExists();
    }
    
    /**
     * @description Manages the bakery's technical sheets (recipes, assemblies).
     *              Assumes all authenticated users are employees who can manage them.
     * @path /technical_sheets/{sheetId}
     * @allow (list) An employee lists all available technical sheets. auth.uid = "employee_abc"
     * @deny (delete) An unauthenticated user tries to delete a sheet. auth = null
     * @principle Grants full read/write access to any authenticated user for managing shared technical sheets.
     */
    match /technical_sheets/{sheetId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && documentExists();
      allow delete: if isSignedIn() && documentExists();
    }

    /**
     * @description Manages customer orders. Assumes all authenticated users are
     *              employees who can create, view, and manage orders.
     * @path /orders/{orderId}
     * @allow (create) An employee creates a new customer order. auth.uid = "employee_abc"
     * @deny (delete) An unauthenticated user tries to delete an order. auth = null
     * @principle Grants full read/write access to any authenticated user, enabling collaborative order management.
     */
    match /orders/{orderId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && documentExists();
      allow delete: if isSignedIn() && documentExists();
    }

    /**
     * @description Manages the items within a specific order. Access is inherited
     *              from the parent order.
     * @path /orders/{orderId}/order_items/{orderItemId}
     * @allow (create) An employee adds an item to an existing order. auth.uid = "employee_abc"
     * @deny (create) An employee tries to add an item to a non-existent order.
     * @principle Enforces relational integrity by ensuring order items can only be managed within an existing parent order.
     */
    match /orders/{orderId}/order_items/{orderItemId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn();
      allow create: if isSignedIn() && exists(/databases/$(database)/documents/orders/$(orderId));
      allow update: if isSignedIn() && documentExists() && exists(/databases/$(database)/documents/orders/$(orderId));
      allow delete: if isSignedIn() && documentExists() && exists(/databases/$(database)/documents/orders/$(orderId));
    }

    /**
     * @description A user's private data, including their cash register sessions.
     *              Access is strictly limited to the data owner.
     * @path /users/{userId}
     * @principle Establishes the root of the user-owned data tree. Rules on subcollections will inherit this ownership model.
     */
    match /users/{userId} {
      // This match block itself grants no permissions. It serves as a namespace
      // for the nested collections below, which define their own specific rules.
      allow read, write: if false;

      /**
       * @description Manages a user's cash register sessions. Only the user can
       *              create, view, update, or delete their own sessions.
       * @path /users/{userId}/cash_registers/{cashRegisterId}
       * @allow (create) A user starts a new cash register session. auth.uid = "{userId}"
       * @deny (get) Another user tries to view this user's cash register data. auth.uid != "{userId}"
       * @principle Enforces strict data ownership using the user's ID from the document path.
       */
      match /cash_registers/{cashRegisterId} {
        allow get: if isOwner(userId);
        allow list: if isOwner(userId);
        allow create: if isOwner(userId) && request.resource.data.userId == userId;
        allow update: if isExistingOwner(userId) && request.resource.data.userId == resource.data.userId;
        allow delete: if isExistingOwner(userId);
      }

      /**
       * @description Manages financial movements within a user's cash register session.
       *              Access is inherited from the parent user document.
       * @path /users/{userId}/cash_registers/{cashRegisterId}/financial_movements/{financialMovementId}
       * @allow (create) A user adds a new expense to their open cash register. auth.uid = "{userId}"
       * @deny (list) Another user tries to list financial movements from this session. auth.uid != "{userId}"
       * @principle Inherits ownership from the top-level user path and ensures relational integrity with the parent cash register.
       */
      match /cash_registers/{cashRegisterId}/financial_movements/{financialMovementId} {
        allow get: if isOwner(userId);
        allow list: if isOwner(userId);
        allow create: if isOwner(userId) && exists(/databases/$(database)/documents/users/$(userId)/cash_registers/$(cashRegisterId)) && request.resource.data.cashRegisterId == cashRegisterId;
        allow update: if isExistingOwner(userId) && request.resource.data.cashRegisterId == resource.data.cashRegisterId;
        allow delete: if isExistingOwner(userId);
      }
    }
  }
}
```

---

### 📄 .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

### 📄 next.config.ts

```typescript
// ARQUIVO DE CONFIGURAÇÃO DO NEXT.JS
//
// Propósito:
// Este arquivo configura o comportamento do framework Next.js. Ele permite personalizar
// funcionalidades como o sistema de build, roteamento, headers, e otimização de imagens.
//
// Responsabilidade:
// - Definir configurações globais para a aplicação Next.js.
// - Configurar padrões de imagens remotas para o componente <Image>.
// - Ignorar erros de build específicos (TypeScript, ESLint) se necessário.
// - Habilitar ou desabilitar funcionalidades experimentais.

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

---

### 📄 package.json

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^10.12.3",
    "framer-motion": "^11.5.0",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "papaparse": "^5.4.1",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/papaparse": "^5.3.14",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---

### 📄 tailwind.config.ts

```typescript
import type {Config} from 'tailwindcss';

const { fontFamily } = require("tailwindcss/defaultTheme")

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        headline: ["var(--font-playfair)"],
        body: ["var(--font-poppins)"],
      },
      colors: {
        'primary-pink': 'hsl(var(--primary))',
        'secondary-cream': 'hsl(var(--secondary))',
        'accent-chocolate': 'hsl(var(--accent-foreground))',
        'sweet-pink': 'hsl(var(--ring))',
        'sweet-dark': 'hsl(var(--foreground))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
       boxShadow: {
        'sweet': '0 10px 15px -3px rgba(236, 72, 153, 0.1), 0 4px 6px -2px rgba(236, 72, 153, 0.05)',
        'chocolate-shadow': '0 4px 6px -1px rgba(168, 124, 102, 0.1), 0 2px 4px -1px rgba(168, 124, 102, 0.06)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---

### 📄 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```
... e todos os outros arquivos que já listei nas respostas anteriores. Esta é a compilação completa.

    