# Requisitos e Bibliotecas - JoyceCakes App

## Versão do Projeto
- **Nome**: JoyceCakes + Sync Server
- **Versão Frontend**: 0.1.0
- **Versão Backend (Sync Server)**: 1.0.0

---

## 📋 Requisitos do Sistema

- **Node.js**: Versão 18+ (recomendado 20+)
- **npm**: Versão 9+
- **PostgreSQL**: Para sincronização de dados (backend)
- **SQLite**: Opcional (para testes locais)

---

## 🎨 Dependências do Frontend (Next.js)

### Dependências de Produção

#### Framework & Renderização
- `next@15.3.3` - Framework React com SSR
- `react@18.3.1` - Biblioteca principal de UI
- `react-dom@18.3.1` - Renderização DOM

#### UI Components (Radix UI)
- `@radix-ui/react-accordion@1.2.3`
- `@radix-ui/react-alert-dialog@1.1.6`
- `@radix-ui/react-avatar@1.1.3`
- `@radix-ui/react-checkbox@1.1.4`
- `@radix-ui/react-collapsible@1.1.11`
- `@radix-ui/react-dialog@1.1.6`
- `@radix-ui/react-dropdown-menu@2.1.6`
- `@radix-ui/react-label@2.1.2`
- `@radix-ui/react-menubar@1.1.6`
- `@radix-ui/react-popover@1.1.6`
- `@radix-ui/react-progress@1.1.2`
- `@radix-ui/react-radio-group@1.2.3`
- `@radix-ui/react-scroll-area@1.2.3`
- `@radix-ui/react-select@2.1.6`
- `@radix-ui/react-separator@1.1.2`
- `@radix-ui/react-slider@1.2.3`
- `@radix-ui/react-slot@1.2.3`
- `@radix-ui/react-switch@1.1.3`
- `@radix-ui/react-tabs@1.1.3`
- `@radix-ui/react-toast@1.2.6`
- `@radix-ui/react-tooltip@1.1.8`

#### Estilos & CSS
- `tailwindcss-animate@1.0.7` - Animações Tailwind
- `tailwind-merge@3.0.1` - Merge de classes Tailwind
- `class-variance-authority@0.7.1` - Variantes de classe

#### Utilitários
- `clsx@2.1.1` - Concatenação condicional de classes
- `cmdk@1.0.0` - Componente de comando
- `lucide-react@0.475.0` - Ícones

#### Formulários & Validação
- `react-hook-form@7.54.2` - Gerenciamento de formulários
- `@hookform/resolvers@4.1.3` - Resolvedores de formulário
- `zod@3.24.2` - Validação de schema

#### Data & Gráficos
- `date-fns@3.6.0` - Manipulação de datas
- `recharts@2.15.1` - Gráficos
- `react-day-picker@8.10.1` - Seletor de data

#### Carrossel
- `embla-carousel-react@8.6.0` - Carrossel/slider

#### Parse & Importação
- `papaparse@5.4.1` - Parser de CSV

#### Firebase
- `firebase@10.12.3` - Backend Firebase (autenticação, banco dados, etc)

#### Patch & Manutenção
- `patch-package@8.0.0` - Patch automático de pacotes

### Dependências de Desenvolvimento

- `typescript@5` - Suporte TypeScript
- `@types/react@18` - Tipos React
- `@types/react-dom@18` - Tipos React DOM
- `@types/node@20` - Tipos Node.js
- `@types/papaparse@5.3.14` - Tipos PapaParse
- `tailwindcss@3.4.1` - Framework CSS
- `postcss@8` - Processador CSS

---

## ⚙️ Dependências do Backend (Express + Node.js)

### Dependências de Produção

#### Framework Web
- `express@4.18.2` - Framework web
- `cors@2.8.5` - CORS middleware

#### Banco de Dados
- `pg@8.11.3` - Cliente PostgreSQL
- `sqlite3@5.1.6` - Cliente SQLite (opcional)

#### Utilitários
- `dotenv@16.3.1` - Variáveis de ambiente
- `uuid@9.0.1` - Geração de UUIDs

### Dependências de Desenvolvimento

- `typescript@5.3.3` - Suporte TypeScript
- `ts-node@10.9.2` - Executar TypeScript direto
- `@types/express@4.17.21` - Tipos Express
- `@types/node@20.10.6` - Tipos Node.js
- `@types/cors@2.8.17` - Tipos CORS
- `@types/pg@8.16.0` - Tipos PostgreSQL
- `@types/uuid@9.0.7` - Tipos UUID

---

## 🐍 Requisitos Python (se aplicável)

Se você utilizar componentes Python:

```
flask==2.3.0
flask-cors==4.0.0
python-dotenv==1.0.0
```

---

## 🚀 Instalação

### Frontend
```bash
cd c:\PYTHON\app_joyceCakes
npm install
```

### Backend (Sync Server)
```bash
cd c:\PYTHON\app_joyceCakes\server
npm install
```

---

## 📦 Scripts Disponíveis

### Frontend
- `npm run dev` - Inicia servidor de desenvolvimento (Turbopack)
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter
- `npm run typecheck` - Verifica tipos TypeScript

### Backend
- `npm run dev` - Inicia servidor em desenvolvimento (ts-node)
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor compilado
- `npm test` - Executa testes

---

## 📄 Resumo de Bibliotecas por Categoria

| Categoria | Quantidade | Principais |
|-----------|-----------|-----------|
| UI Components (Radix) | 23 | Dialog, Select, Dropdown, etc |
| Estilos & CSS | 3 | Tailwind, Tailwind-merge, CVA |
| Formulários | 3 | React Hook Form, Zod, Resolvers |
| Firebase | 1 | Firebase SDK |
| Utilitários | 4 | Clsx, cmdk, lucide-react, uuid |
| Bank de Dados | 2 | PostgreSQL, SQLite |
| Framework Web | 1 | Express.js |
| **TOTAL** | **~60 pacotes** | - |

---

## 📌 Notas Importantes

1. **Firebase**: O projeto usa Firebase para autenticação e banco de dados em tempo real
2. **Radix UI**: Componentes acessíveis e sem estilo, customizáveis com Tailwind
3. **TypeScript**: Usado em todo o projeto (frontend e backend)
4. **Multi-máquina**: O sync server permite sincronização entre máquinas via PostgreSQL
5. **Tailwind CSS**: Utility-first CSS framework para estilização

---

**Data de criação**: 10/02/2026
**Compatível com**: Node.js 18+, npm 9+
