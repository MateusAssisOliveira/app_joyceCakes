# âš¡ Guia RÃ¡pido: BD SQL com SincronizaÃ§Ã£o

## ðŸŽ¯ Em 5 Minutos

### 1. Instalar PostgreSQL
```bash
# Windows: https://www.postgresql.org/download/
# Linux: sudo apt-get install postgresql
# Mac: brew install postgresql
```

### 2. Criar BD
```bash
psql -U postgres
CREATE USER joycecakes WITH PASSWORD 'senha123';
CREATE DATABASE joycecakes_db OWNER joycecakes;
\q
```

### 3. Iniciar Servidor de Sync
```bash
cd server
cp .env.example .env
# Editar .env com credenciais do BD acima
npm install
npm run dev
# Deve abrir em http://localhost:4000
```

### 4. Configurar Front-end
```bash
echo 'NEXT_PUBLIC_SYNC_SERVER=http://localhost:4000' > .env.local
npm install
npm run dev
# Abre em http://localhost:3000
```

### 5. Testar
- MÃ¡quina 1: http://localhost:3000
- MÃ¡quina 2: http://localhost:3001 (outra janela/mÃ¡quina)
- Criar dado em uma â†’ ver na outra âœ…

---

## ðŸ“ Arquivos Criados

| Arquivo | PropÃ³sito |
|---------|-----------|
| `ARQUITETURA_SQL_SYNC.md` | ExplicaÃ§Ã£o da arquitetura |
| `docs/deployment/setup-sync-server.md` | Guia passo-a-passo completo |
| `server/` | Servidor de sincronizaÃ§Ã£o Node.js |
| `src/lib/sync-client.ts` | Cliente de sync para front-end |

---

## ðŸš€ Como Usar

### Em Componentes React

#### 1. Buscar dados
```typescript
import { getSyncClient } from '@/lib/sync-client';

const sync = getSyncClient();
const products = await sync.fetch('products');
```

#### 2. Criar/Atualizar dados
```typescript
const sync = getSyncClient();
await sync.sync('products', [{
  id: 'prod-123',
  name: 'Bolo',
  price: 45.50,
  updatedAt: new Date().toISOString()
}]);
```

#### 3. Auto-sync (a cada 5s)
AutomÃ¡tico! Inicializa em `src/app/layout.tsx`

---

## ðŸ”§ PrÃ³ximos Passos

1. **Hoje**: Testar server + front em 2 mÃ¡quinas
2. **Depois**: Integrar com seu BD atual
3. **SeguranÃ§a**: Adicionar autenticaÃ§Ã£o/JWT
4. **Deploy**: Hospedar servidor em produÃ§Ã£o

---

## â“ FAQ

**P: Preciso instalar PostgreSQL?**  
R: Sim. Ou use SQLite no servidor (mais simples)

**P: E se servidor cair?**  
R: App continua funcionando offline, sincroniza quando servidor volta

**P: Quantas mÃ¡quinas posso sincronizar?**  
R: Ilimitadas! SÃ³ precisa de uma conta no servidor

**P: Ã‰ seguro?**  
R: BÃ¡sico agora. Em produÃ§Ã£o, adicione JWT/OAuth

---

Veja `docs/deployment/setup-sync-server.md` para detalhes! ðŸš€


