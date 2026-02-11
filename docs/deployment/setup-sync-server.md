# 🚀 Setup do Servidor de Sincronização

Guia para configurar o servidor que sincroniza múltiplas máquinas.

---

## 🎯 Por que sincronizar?

Você quer:
- ✅ Usar app em múltiplos computadores/PDVs
- ✅ Dados sempre sincronizados
- ✅ Sem perder informações
- ✅ Offline quando necessário

**Solução:** Servidor de sincronização com PostgreSQL

---

## 📋 Pré-Requisitos

- Node.js 18+
- PostgreSQL instalado
- Conhecimento básico de terminal
- Máquina com IP fixo na rede

---

## 🔧 Instalação

### 1️⃣ Preparar PostgreSQL

```bash
# Windows
# Abra pgAdmin 4 ou SQL Shell

# Criar banco de dados
CREATE DATABASE joycecakes_sync;
CREATE USER joycecakes WITH PASSWORD 'sua_senha_super_segura';
GRANT ALL PRIVILEGES ON DATABASE joycecakes_sync TO joycecakes;
```

### 2️⃣ Clonar/Acessar Servidor

```bash
# O servidor está em server/
cd server

# Instalar dependências
npm install
```

### 3️⃣ Configurar Variáveis

Crie `.env` na pasta `server/`:

```env
# Database
DATABASE_URL=postgresql://joycecakes:senha@localhost:5432/joycecakes_sync

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://seu-frontend.com

# Firebase (para validação)
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_PRIVATE_KEY=sua_chave_privada

# Segurança das rotas /api/sync/*
API_SECRET_KEY=sua_chave_secreta_aqui
```

### 4️⃣ Iniciar Servidor

```bash
# Modo desenvolvimento com live reload
npm run dev

# Ou modo produção
npm run build
npm start
```

**Espere:**
```
✓ Server listening on port 3001
✓ Database connected
✓ Sync ready
```

---

## 🔗 Conectar Clientes

### No seu app (Frontend)

Edite `src/firebase/multi-machine-sync.ts`:

```typescript
const SYNC_SERVER = 'http://192.168.1.100:3001'
// Ou seu IP da máquina

export async function syncWithServer(data: SyncPayload) {
  const response = await fetch(`${SYNC_SERVER}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### Para cada cliente

```typescript
// Em src/firebase/client-provider.tsx
import { syncWithServer } from './multi-machine-sync'

// Sempre que houver alteração:
await syncWithServer({
  type: 'product_updated',
  productId: '123',
  data: novosProdutos
})
```

Variáveis recomendadas no cliente (`.env.local`):
```env
NEXT_PUBLIC_SYNC_SERVER=http://localhost:4000
NEXT_PUBLIC_SYNC_AUTO=true
NEXT_PUBLIC_SYNC_INTERVAL_MS=5000
NEXT_PUBLIC_SYNC_RETRY_ATTEMPTS=3
NEXT_PUBLIC_SYNC_RETRY_BASE_DELAY_MS=500
NEXT_PUBLIC_SYNC_RETRY_MAX_DELAY_MS=5000
NEXT_PUBLIC_SYNC_AUTO_RECONCILE=true
NEXT_PUBLIC_SYNC_RECONCILE_INTERVAL_MS=60000
NEXT_PUBLIC_SYNC_DIVERGENCE_STRATEGY=refresh_mismatched
NEXT_PUBLIC_SYNC_API_KEY=
```

---

## 📊 Estrutura do Servidor

```
server/
├── src/
│   ├── index.ts              # Entry point
│   ├── api/
│   │   ├── sync.ts          # Rota de sincronização
│   │   ├── products.ts      # CRUD produtos
│   │   ├── orders.ts        # CRUD pedidos
│   │   └── supplies.ts      # CRUD estoque
│   └── db/
│       ├── postgres.ts      # Conexão PostgreSQL
│       └── sqlite.ts        # Cache SQLite (opcional)
├── package.json
└── tsconfig.json
```

---

## 🔄 Fluxo de Sincronização

```
App 1 (Firebase)
    ↓ cria produto
    ↓ (salva localmente)
    ↓ POST /api/products
    ↓
Sync Server
    ↓ (persiste em PostgreSQL)
    ↓ broadcast para App 2
    ↓
App 2 (Firebase)
    ↓ recebe update via WebSocket
    ↓ (sincroniza Firestore)
    ✓ Dados agora no App 2
```

---

## 📝 Endpoints da API

### Sincronizar Dados
```
POST /api/sync
Content-Type: application/json

{
  "type": "product_updated",
  "timestamp": 1707554400000,
  "data": { ... },
  "event_id": "b9c4a2e1-9f2d-4f6a-9a17-3a6f9f1f4c2b"
}

Response: { success: true, synced_at: ... }
```

**Idempotência:** envie sempre um `event_id` único por evento para evitar duplicações em retries.

**Conflitos:** o servidor considera `updatedAt` (timestamp do servidor) como fonte de verdade. Atualizações com timestamp mais antigo podem ser ignoradas.

---

### Get Products
```
GET /api/products

Response: { products: [...] }
```

---

### Get Orders
```
GET /api/orders?start_date=2024-01-01&end_date=2024-01-31

Response: { orders: [...], total: 45 }
```

---

### Get Supplies
```
GET /api/supplies

Response: { supplies: [...] }
```

---

### Reconcile (resumo do servidor)
```
GET /api/sync/reconcile

Response:
{
  "success": true,
  "serverSummary": [
    { "table": "products", "count": 10, "latestUpdatedAt": "2026-02-11T18:00:00.000Z" }
  ]
}
```

### Reconciliação automática no cliente

Configure um job no cliente para enviar um resumo local periodicamente:

```typescript
const syncClient = initSyncClient({
  serverUrl: "http://192.168.1.100:3001",
  autoSync: true,
  syncInterval: 5000,
  autoReconcile: true,
  reconcileInterval: 60000,
  divergenceStrategy: "refresh_mismatched",
  getClientSummary: async () => ({
    products: { count: 120, latestUpdatedAt: "2026-02-11T18:00:00.000Z" },
    orders: { count: 45, latestUpdatedAt: "2026-02-11T17:55:00.000Z" },
    supplies: { count: 80, latestUpdatedAt: "2026-02-11T17:58:00.000Z" },
    order_items: { count: 300, latestUpdatedAt: "2026-02-11T17:54:00.000Z" }
  })
});
```

Se houver divergência, o cliente gera alerta em log com os `mismatches`.
Com `divergenceStrategy: "refresh_mismatched"`, ele também tenta auto-reparar apenas as tabelas divergentes.

Se `API_SECRET_KEY` estiver ativo no servidor, envie `x-api-key` nas requisições de sync.

---

### Reconcile (comparação cliente x servidor)
```
POST /api/sync/reconcile
Content-Type: application/json

{
  "machineId": "machine-1",
  "clientSummary": {
    "products": { "count": 10, "latestUpdatedAt": "2026-02-11T18:00:00.000Z" }
  }
}

Response: { success: true, isConsistent: true, mismatches: [] }
```

---

### Reconcile History (auditoria)
```

---

### Delete via Sync (tombstone)
```
POST /api/sync/products
Content-Type: application/json

{
  "machineId": "machine-1",
  "localUpdates": [
    {
      "eventId": "58f6b58c-0d4c-4a02-9300-9ac7d3371b2a",
      "record": { "id": "product-id", "_op": "delete" }
    }
  ]
}
```

Clientes recebem o delete em `synced` com:
`{ "id": "product-id", "_deleted": true, "updatedAt": "..." }`

No cliente, o `SyncClient.fetch()` já aplica tombstones e retorna lista materializada sem os itens deletados.

---

### Smoke Test Operacional
```
npm run sync:smoke
```

Executa checagem de `health`, `reconcile` e `reconcile/history`.

---

### Reliability Test
```
npm run sync:reliability
```

Valida idempotência, conflito stale e delete com tombstone.

---

### Backup/Restore PostgreSQL
```
npm run db:backup
npm run db:restore -- -File .\backups\joycecakes-YYYYMMDD-HHMMSS.sql
```

---

### Status de Sync no Admin
O header do painel admin exibe badge de saúde do sync:
- `Aguardando`
- `Sincronizando`
- `Sincronizado`
- `Com Divergência`
- `Offline/Erro`
GET /api/sync/reconcile/history?limit=50&machineId=machine-1&onlyInconsistent=true

Response:
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 12,
      "machine_id": "machine-1",
      "is_consistent": false,
      "mismatches_count": 2,
      "created_at": "2026-02-11T18:12:00.000Z"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Erro: "Connection refused"

**Problema:** PostgreSQL não está rodando.

**Solução:**
```bash
# Windows
net start postgresql-x64-15

# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql
```

---

### Erro: "EADDRINUSE: address already in use"

**Problema:** Porta 3001 já em uso.

**Solução:**
```bash
# Mudar porta
PORT=3002 npm run dev

# Ou matar processo
lsof -i :3001
kill -9 <PID>
```

---

### Sincronização não funciona

**Problema:** Firestore e PostgreSQL com dados diferentes.

**Solução:**
1. Verifique IP do servidor está correto
2. Firewall permite porta 3001
3. PostgreSQL está conectando
4. Logs do servidor mostram erros

```bash
# Ver logs detalhados
NODE_ENV=development npm run dev
```

---

## 🔒 Segurança

### Importante!

- ✅ Use HTTPS em produção (SSL certificate)
- ✅ Proteja endpoint com autenticação
- ✅ Não exponha DATABASE_URL
- ✅ Regras de firewall para porta 3001
- ✅ Backups automáticos do PostgreSQL

---

## 📈 Monitoramento

Verificar status:

```bash
# Conexão com DB
psql -U joycecakes -d joycecakes_sync -c "SELECT 1"

# Logs do servidor
tail -f logs/sync.log

# Estatísticas de sincronização
curl http://localhost:3001/api/stats
```

---

**Próximo:** [Multi-Máquinas](multi-machine.md) | [Getting Started](../getting-started/installation.md)
