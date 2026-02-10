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

# Firebase (para validação)
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_PRIVATE_KEY=sua_chave_privada
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
  "data": { ... }
}

Response: { success: true, synced_at: ... }
```

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
