# 🔧 Setup de Ambiente - Multi-Máquinas

## 📋 Configuração para 2 Máquinas

### Máquina 1: Servidor Central (Express + PostgreSQL)

```bash
cd server
cp .env.example .env

# Editar .env com dados do PostgreSQL
# DB_HOST=localhost (ou IP da máquina com PostgreSQL)
# DB_PORT=5432
# DB_USER=seu_usuario
# DB_PASSWORD=sua_senha
# DB_NAME=joycecakes_db

npm run dev
# 🚀 Servidor rodando em http://localhost:4000
```

### Máquina 2: App Cliente

```bash
# Editar .env (na raiz do projeto)
# NEXT_PUBLIC_SYNC_SERVER_URL=http://[IP_MAQUINA_1]:4000

npm run dev
# 🚀 App rodando em http://localhost:3000
```

---

## 🌍 Cenários de Múltiplas Máquinas

### Cenário 1: Servidor Centralizado (Recomendado)

```
Máquina A (IP: 192.168.1.10)
├── Express Server (porta 4000)
└── PostgreSQL (porta 5432)

Máquina B (IP: 192.168.1.20)
└── App Next.js (porta 3000)
   └── NEXT_PUBLIC_SYNC_SERVER_URL=http://192.168.1.10:4000

Máquina C (IP: 192.168.1.30)
└── App Next.js (porta 3000)
   └── NEXT_PUBLIC_SYNC_SERVER_URL=http://192.168.1.10:4000
```

### Cenário 2: Server + App na Mesma Máquina

```
Máquina A (IP: 192.168.1.10)
├── Express Server (porta 4000)
├── PostgreSQL (porta 5432)
└── App Next.js (porta 3000)
   └── NEXT_PUBLIC_SYNC_SERVER_URL=http://localhost:4000

Máquina B (IP: 192.168.1.20)
└── App Next.js (porta 3000)
   └── NEXT_PUBLIC_SYNC_SERVER_URL=http://192.168.1.10:4000
```

---

## 🔐 Variáveis Obrigatórias

### Raiz do Projeto (`.env`)
```dotenv
# Next.js App - Acessar servidor de sincronização
NEXT_PUBLIC_SYNC_SERVER_URL=http://localhost:4000
NEXT_PUBLIC_SYNC_ENABLED=true

# Firebase (Real-time sync entre máquinas)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=joycecakes-db
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Server (`.env`)
```dotenv
# Express
PORT=4000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=joycecakes
DB_PASSWORD=sua_senha_super_secreta
DB_NAME=joycecakes_db

NODE_ENV=development
```

---

## ⚠️ Importante para Produção

1. **Nunca commitar `.env` com senhas reais!**
   ```bash
   git add .env.example
   git ignore .env
   ```

2. **Usar variáveis de ambiente no servidor (Docker, AWS, etc)**
   ```bash
   export DB_PASSWORD="senha_super_segura"
   npm start
   ```

3. **CORS**: No servidor, se quiser restringir:
   ```typescript
   // Em server/src/index.ts
   app.use(cors({
     origin: ['http://192.168.1.20:3000', 'http://192.168.1.30:3000'],
     credentials: true
   }));
   ```

---

## 🧪 Teste Rápido

### 1. Verificar se Express está rodando:
```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}
```

### 2. Verificar sincronização:
```bash
curl http://localhost:4000/api/products
# {"success":true,"data":[...]}
```

### 3. Acessar app em outra máquina:
```bash
http://192.168.1.10:3000
# Deve conectar ao servidor de outra máquina
```

---

## 🐳 Com Docker (Opcional)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: joycecakes
      POSTGRES_PASSWORD: senha123
      POSTGRES_DB: joycecakes_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  server:
    build: ./server
    ports:
      - "4000:4000"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_USER: joycecakes
      DB_PASSWORD: senha123
      DB_NAME: joycecakes_db

volumes:
  postgres_data:
```

```bash
docker-compose up
# Todos os serviços rodando!
```

---

## ✅ Checklist de Setup

- [ ] `.env` na raiz com `NEXT_PUBLIC_SYNC_SERVER_URL`
- [ ] `server/.env` com credenciais PostgreSQL
- [ ] PostgreSQL rodando e acessível
- [ ] Express server rodando (`npm run dev` na pasta `server`)
- [ ] App Next.js rodando (`npm run dev` na raiz)
- [ ] Teste `/health` endpoint
- [ ] Teste sincronização em 2 máquinas
- [ ] Firestore configurado (para real-time sync)

