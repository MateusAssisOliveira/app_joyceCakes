# 🚀 Setup: BD SQL Local com Sincronização Server

## 📋 Resumo

Você vai ter:
1. **Servidor Central** (BD PostgreSQL)
2. **Máquina 1 & 2** (App Next.js + SQLite Local)

Cada máquina funciona offline, mas sincroniza com o servidor quando conectada.

## Step 1️⃣: Instalar PostgreSQL

### Windows
```bash
# Baixar em: https://www.postgresql.org/download/
# Instalar com defaults

# Ou via chocolatey
choco install postgresql
```

### Linux (Ubuntu)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

## Step 2️⃣: Criar BD PostgreSQL

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql:
CREATE USER joycecakes WITH PASSWORD 'sua_senha_aqui';
CREATE DATABASE joycecakes_db OWNER joycecakes;
GRANT ALL PRIVILEGES ON DATABASE joycecakes_db TO joycecakes;
\q
```

## Step 3️⃣: Configurar Servidor de Sincronização

### 3.1 - Copiar arquivo .env

```bash
cd server
cp .env.example .env
```

### 3.2 - Editar `.env`

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=joycecakes
DB_PASSWORD=sua_senha_aqui
DB_NAME=joycecakes_db
NODE_ENV=development
```

### 3.3 - Instalar dependências

```bash
cd server
npm install
```

### 3.4 - Iniciar servidor

```bash
npm run dev
```

**Esperado:**
```
🚀 Servidor rodando em http://localhost:4000
✅ BD PostgreSQL pronto!
```

## Step 4️⃣: Configurar Front-end (Next.js)

### 4.1 - Criar arquivo de configuração

Abra `src/lib/config.ts`:

```
typescript
// src/lib/config.ts
export const SYNC_CONFIG = {
  serverUrl: process.env.NEXT_PUBLIC_SYNC_SERVER || 'http://localhost:4000',
  autoSync: true,
  syncInterval: 5000, // 5 segundos
};
```

### 4.2 - Adicionar ao `.env.local`

```
NEXT_PUBLIC_SYNC_SERVER=http://localhost:4000
```

### 4.3 - Inicializar SyncClient no seu layout

Edite `src/app/layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { initSyncClient } from '@/lib/sync-client';
import { SYNC_CONFIG } from '@/lib/config';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Inicializar sincronização
    const syncClient = initSyncClient(SYNC_CONFIG);
    console.log('🔄 SyncClient inicializado');
    
    return () => {
      syncClient.stopAutoSync();
    };
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

## Step 5️⃣: Usar dados sincronizados nos componentes

### Exemplo 1: Buscar dados

```typescript
// src/components/admin/SyncedProducts.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSyncClient } from '@/lib/sync-client';

export function SyncedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = getSyncClient();
    
    sync.fetch('products')
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>R$ {product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Exemplo 2: Enviar dados + sincronizar

```typescript
// src/services/productService.ts
import { getSyncClient } from '@/lib/sync-client';

export async function createProduct(data: any) {
  // 1. Salvar localmente (SQLite)
  const localProduct = {
    id: `local-${Date.now()}`,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 2. Sincronizar com servidor
  const sync = getSyncClient();
  const result = await sync.sync('products', [localProduct]);

  // 3. Atualizar ID se servidor retornou novo ID
  if (result.synced?.[0]?.id) {
    localProduct.id = result.synced[0].id;
  }

  return localProduct;
}
```

## Step 6️⃣: Testar Sincronização

### Terminal 1 - Servidor
```bash
cd server
npm run dev
```

### Terminal 2 - Máquina 1
```bash
npm run dev
# Abre http://localhost:3000
```

### Terminal 3 - Máquina 2 (outra porta)
```bash
PORT=3001 npm run dev
# Abre http://localhost:3001
```

### Testes

1. **Máquina 1**: Criar um produto
2. **Máquina 2**: Recarregar página
3. **Esperado**: Produto aparece em ambas ✅

---

## 🐞 Troubleshooting

### ❌ "Erro ao conectar no PostgreSQL"

```bash
# Verificar se PostgreSQL está rodando
# Windows:
services.msc # procure por PostgreSQL

# Linux:
sudo service postgresql status

# Mac:
brew services list
```

### ❌ "Servidor não conecta ao BD"

Verifique `.env`:
```
DB_HOST=localhost ✅
DB_PORT=5432 ✅
DB_USER=joycecakes ✅
DB_PASSWORD=sua_senha_aqui ✅
DB_NAME=joycecakes_db ✅
```

### ❌ "Front-end não consegue acessar servidor"

```bash
# Teste se servidor está rodando:
curl http://localhost:4000/health

# Ou abra no navegador:
http://localhost:4000/health

# Deve retornar:
{"status":"ok","timestamp":"2026-02-06T..."}
```

### ❌ "Dados não sincronizam entre máquinas"

1. Verifique se servidor está rodando
2. Verifique `NEXT_PUBLIC_SYNC_SERVER` em `.env.local`
3. Abra DevTools (F12) → Console → procure por erros
4. Tente resetar sync:
   ```javascript
   // Console do navegador
   const sync = window.syncClient;
   sync.resetLastSync();
   sync.fetch('products');
   ```

---

## 📊 Arquitetura Resumida

```
MÁQUINA 1
├─ Next.js (port 3000)
├─ SQLite local (dados rápidos)
└─ SyncClient (comunica com servidor)
         │
         │ HTTP
         │
    SERVIDOR (port 4000)
    ├─ Express API
    └─ PostgreSQL (dados centralizados)
         │
         │ HTTP
         │
MÁQUINA 2
├─ Next.js (port 3001)
├─ SQLite local
└─ SyncClient
```

---

## ✅ Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] BD `joycecakes_db` criado
- [ ] Servidor sincronização rodando (http://localhost:4000/health)
- [ ] `.env` do servidor configurado
- [ ] `.env.local` do front-end configurado
- [ ] `src/app/layout.tsx` inicializa SyncClient
- [ ] App Next.js rodando
- [ ] Teste de sincronização funcionando

---

Qualquer dúvida, veja `ARQUITETURA_SQL_SYNC.md`!

