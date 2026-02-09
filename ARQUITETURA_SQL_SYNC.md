# 🏗️ Arquitetura: BD SQL Local com Sincronização

## 📋 Visão Geral

Cada máquina tem seu **BD SQLite local** (rápido, sem dependências). Um **servidor central** sincroniza os dados entre elas.

```
MÁQUINA 1                SERVIDOR CENTRAL           MÁQUINA 2
┌──────────┐             ┌──────────┐             ┌──────────┐
│ Next.js  │ ◄────────► │ API REST │ ◄────────► │ Next.js  │
│ SQLite   │             │PostgreSQL│             │ SQLite   │
└──────────┘             └──────────┘             └──────────┘
```

## 🔄 Como Funciona a Sincronização

### Fluxo 1: Criar/Atualizar Dados

```
Máquina 1 (usuário clica em "Salvar")
    ↓
Salva localmente no SQLite
    ↓
Envia para Servidor API (/sync)
    ↓
Servidor valida e salva no PostgreSQL
    ↓
Servidor notifica Máquina 2
    ↓
Máquina 2 atualiza seu SQLite local
```

### Fluxo 2: Iniciar/Verificar Dados

```
Máquina 1 abre o app
    ↓
App faz request: GET /api/sync?lastSync=2026-02-06T10:00:00
    ↓
Servidor retorna: [dados novos desde aquele momento]
    ↓
App atualiza SQLite local
```

## 📚 Tecnologias

| Componente | Tecnologia | Por quê |
|-----------|-----------|--------|
| **Front (2 máquinas)** | Next.js + React | Já tem |
| **BD Local** | SQLite | Rápido, sem servidor |
| **Servidor Sync** | Node.js + Express | Simples de setup |
| **BD Central** | PostgreSQL | Robusto, fácil backup |

## 🚀 Timestamp-Based Sync Strategy

Cada tabela tem um campo `updatedAt`:

```sql
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sincronização:**
1. Máquina 1: "quero dados modificados após 14:30"
2. Servidor: procura registros onde `updatedAt > 14:30`
3. Retorna apenas o necessário (não todos!)

## 🔐 Segurança

- ✅ API requer token/autenticação
- ✅ Validação de dados no servidor
- ✅ Backup automático do PostgreSQL
- ✅ Conflitos resolvidos por timestamp (última edição ganha)

## 📦 Estrutura de Pastas

```
server/                    # Novo servidor
├── src/
│   ├── api/              # Rotas API
│   │   ├── sync.ts       # Endpoint de sincronização
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   └── supplies.ts
│   ├── db/
│   │   ├── postgres.ts   # Conexão PostgreSQL
│   │   └── migrations/   # Schema do BD
│   └── middleware/
│       └── auth.ts       # Autenticação
├── package.json
├── tsconfig.json
└── .env.example

src/                       # Frontend (app existente)
├── lib/
│   └── sync-client.ts    # Cliente para sincronizar
└── services/
    └── syncService.ts    # Lógica de sync
```

## 🔄 Exemplo de Request/Response

### Request: Sincronizar Produtos
```javascript
// Do cliente Next.js
POST /api/sync
{
  "table": "products",
  "lastSync": "2026-02-06T10:00:00Z",
  "machineId": "machine-1",
  "localUpdates": [
    {
      "id": "prod-123",
      "name": "Bolo Chocolate",
      "price": 45.50,
      "updatedAt": "2026-02-06T11:30:00Z"
    }
  ]
}
```

### Response: Dados Sincronizados
```javascript
{
  "success": true,
  "synced": [
    {
      "id": "prod-456",
      "name": "Bolo de Cenoura",
      "price": 38.00,
      "updatedAt": "2026-02-06T11:25:00Z",
      "modifiedBy": "machine-2"
    }
  ],
  "conflicts": [
    {
      "id": "prod-789",
      "localVersion": { "price": 50 },
      "serverVersion": { "price": 55 },
      "resolution": "server wins (mais recente)"
    }
  ]
}
```

## ⚙️ Configuração

### Máquina 1 & 2
```
npm install
npm run dev
```
→ App conecta ao servidor por IP (configurável)

### Servidor Central
```
cd server
npm install
npm run dev
```
→ API roda em `http://localhost:4000`

## 🧪 Teste de Sincronização

```bash
# Terminal 1: Servidor
cd server && npm run dev

# Terminal 2: Máquina 1
PORT=3000 npm run dev

# Terminal 3: Máquina 2
PORT=3001 npm run dev
```

Ou em computadores diferentes da rede local.

## 📊 Vantagens dessa Arquitetura

✅ Cada máquina funciona **offline**  
✅ Sincronização apenas do **necessário**  
✅ Sem dependência de nuvem (Firebase)  
✅ Controle total dos dados  
✅ Escalável (funciona com N máquinas)  
✅ Seguro (autenticação, validação)  

## ⚠️ Considerações

- ❌ Requer servidor rodando 24/7 para sync
- ❌ Se servidor cair, máquinas funcionam offline mas não sincronizam
- ❌ Mais complexo que Firebase

## 🚀 Próximos Passos

1. Criar servidor Node.js/Express básico
2. Configurar PostgreSQL
3. Implementar API de sync
4. Integrar com front-end Next.js
5. Testar em 2 máquinas

