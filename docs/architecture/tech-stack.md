# 🛠️ Tech Stack

Tecnologias usadas no JoyceCakes.

---

## 🎨 Frontend

### Framework
- **Next.js** 15.3.3
  - App Router para roteamento
  - Server Components para performance
  - Built-in API routes
  - Turbopack para desenvolvimento rápido

---

### Bibliotecas de UI

#### Radix UI
23 componentes base e acessíveis:
- Button, Card, Dialog
- Badge, Alert
- DatePicker, Select
- Accordion, Tabs
- PopoverMenu, Separator
- etc.

```
npm install @radix-ui/{primitive}
```

#### Tailwind CSS 3.4.1
Estilização utilitária:
```tsx
<div className="flex justify-center items-center gap-4 bg-slate-100 p-4">
  <Button />
</div>
```

---

### Validação de Formulários
- **react-hook-form** 7.54.2 - Gerenciamento de estado
- **@hookform/resolvers** - Integração com Zod
- **Zod** 3.24.2 - Validação de schema

```typescript
const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  price: z.number().min(0.1, "Preço inválido")
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

---

### Utilitários da Interface

| Biblioteca | Versão | Uso |
|-----------|--------|-----|
| **recharts** | 2.15.1 | Gráficos de vendas/lucro |
| **date-fns** | 3.6.0 | Manipulação de datas com pt-BR |
| **papaparse** | 5.4.1 | CSV import/export |
| **clsx** | 2.0.0 | Condicionais CSS |
| **class-variance-authority** | 0.7.0 | Variações de componentes |

---

### Gerenciamento de Estado

- **React Hooks** (useState, useContext)
- **Firebase Realtime** para sincronização
- **Custom Hooks** (useCollection, useDoc)

---

## 🔥 Backend & Database

### Firebase
- **Firebase Firestore** (real-time database)
  - Colecções: products, orders, supplies, financialMovements
  - Tempo real para múltiplos usuários
  - Regras de segurança para autenticação

---

### Sincronização Multi-Máquinas
- **Express.js** 4.18.2 (sync server)
- **PostgreSQL** 8.11.3 (banco sincronizado)
- **SQLite** 5.1.6 (cache local)

```
App 1 (Firebase) ←→ Sync Server ← → PostgreSQL
App 2 (Firebase) ←→ Sync Server ← → PostgreSQL
```

---

### Cliente de Banco de Dados
- **@firebase/firestore** - Para Firestore
- **pg** 8.11.3 - Para PostgreSQL
- **better-sqlite3** 5.1.6 - Para cache local

---

## 📝 Linguagens & Tipos

### TypeScript
- Tipagem completa em todo código
- `strict: true` no tsconfig
- Máxima segurança de tipos

### Linguagens Suportadas
- JavaScript/TypeScript (frontend)
- Node.js/Express (backend)
- SQL (PostgreSQL queries)
- Python (scripts auxiliares)

---

## 📦 Build & Deploy

### Package Managers
- **npm** - Gerenciador de pacotes
- **pnpm** - Alternativa (mais rápido)

### Build Tools
- **Webpack** - Bundler (Next.js)
- **Turbopack** - Desenvolvimento rápido
- **TypeScript Compiler** - tsc

---

### Deployment
- **Vercel** (recomendado para Next.js)
- **Docker** (containerização)
- **Tailscale** (quando multi-máquinas)

---

## 🧪 Testing & Quality

### Linting
- **ESLint** - Análise de código
- **TypeScript Strict** - Type safety

---

## 🔐 Segurança

### Autenticação
- **Firebase Auth**
  - Email/Password
  - Suporte para provedores (Google, GitHub)

### Variáveis de Ambiente
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
```

---

## 📊 Resumo de Dependências

### Produção (77 pacotes)

| Categoria | Pacotes | Principais |
|-----------|---------|-----------|
| **Frontend Core** | 5 | react, next, typescript |
| **UI/Styling** | 10 | @radix-ui/*, tailwind, clsx |
| **Formulários** | 4 | react-hook-form, zod |
| **Data & Viz** | 3 | recharts, date-fns, papaparse |
| **Firebase** | 5 | firebase, @firebase/* |
| **Database** | 3 | pg, better-sqlite3 |
| **Backend/API** | 8 | express, axios |
| **Utilitários** | 15+ | lodash, uuid, etc |

### Desenvolvimento (23 pacotes)

| Categoria | Pacotes |
|-----------|---------|
| **Build Tools** | next, typescript, tailwind |
| **Linting** | eslint, prettier |
| **Development** | nodemon, tsx |

---

## 🎯 Próximas Melhorias

Tecnologias consideradas:
- **Testing:** Jest, React Testing Library
- **Monitoring:** Sentry para error tracking
- **Analytics:** Plausible ou Mixpanel
- **Caching:** Redis para session
- **API:** GraphQL como alternativa a REST

---

**Próximo:** [Project Structure](project-structure.md) | [Design System](../../docs/DESIGN_SYSTEM.md)
