# 🖥️ Setup Multi-Máquinas

Guia para usar JoyceCakes em múltiplos computadores sincronizados.

---

## 🎯 Cenário

Você tem:
- 1 computador no caixa
- 1 computador na produção
- 1 computador no administrativo

**Desafio:** Manter tudo sincronizado!

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│        Rede Local (WiFi/LAN)        │
├─────────────────────────────────────┤
│                                     │
│  PDV (Desktop)                      │
│  App em: localhost:3000             │
│  IP: 192.168.1.101                  │
│                                     │
│         Sync Server                 │
│         Port: 3001                  │
│         IP: 192.168.1.100           │
│         DB: PostgreSQL              │
│                                     │
│  Admin (Notebook)                   │
│  App em: localhost:3000             │
│  IP: 192.168.1.102                  │
│                                     │
│  Produção (Tablet)                  │
│  App em: localhost:3000             │
│  IP: 192.168.1.103                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 📋 Pré-Requisitos

- [x] Servidor de sincronização configurado
  - Ver: [Setup Sync Server](setup-sync-server.md)
- [x] Máquina servidor com IP fixo na rede
- [x] Todos os clientes na mesma rede
- [x] Node.js 18+ em todas máquinas
- [x] Acesso ao `.env.local` (Firebase)

---

## 🚀 Instalação em Múltiplas Máquinas

### Máquina 1: Servidor (Principal)

```bash
# 1. Clone o repositório
git clone <repo> app_joycecakes
cd app_joycecakes

# 2. Instale dependências
npm install

# 3. Configure .env.local com Firebase
echo "NEXT_PUBLIC_FIREBASE_API_KEY=..." > .env.local

# 4. Inicie servidor de sync
cd server
npm install
npm run dev
# Deixe rodando na porta 3001
```

**Nota:** Ip fixo? Configure no seu router:
```
Router Admin → DHCP → IP Reservado → 192.168.1.100
```

---

### Máquina 2: Cliente (Caixa)

```bash
# 1. Clone repo (igual)
git clone <repo>
cd app_joycecakes

# 2. Instale dependências
npm install

# 3. Crie .env.local (IGUAL ao servidor)
cp .env.local.example .env.local
# Edite com mesmo Firebase config

# 4. Configure multi-machine
# Edite src/firebase/multi-machine-sync.ts
const SYNC_SERVER = 'http://192.168.1.100:3001'
# Mude IP conforme sua rede!

# 5. Inicie app
npm run dev
# Abrirá em localhost:3000
```

---

### Máquina 3, 4... N: Clientes Adicionais

Repita Máquina 2 com IP do servidor correto.

---

## 🔐 Configuração de Rede

### Encontrar seu IP

**Windows:**
```powershell
ipconfig
# Procure por "IPv4 Address"
```

**Linux/macOS:**
```bash
ifconfig
# Ou
hostname -I
```

---

### Configurar Firewall

**Windows (Firewall):**
```powershell
# Permitir porta 3001
New-NetFirewallRule -DisplayName "SyncServer" `
  -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001

# Ou GUI: Settings → Firewall → Advanced → Inbound Rules → New Rule
```

**Linux:**
```bash
sudo ufw allow 3001
```

---

### Verificar Conectividade

De qualquer máquina:

```bash
# Teste conexão ao servidor
ping 192.168.1.100

# Teste porta 3001
curl http://192.168.1.100:3001

# Esperado: conexão bem-sucedida
```

---

## 📱 Usando App em Múltiplos Dispositivos

### Abrir Caixa

```
Máquina 1 (PDV):
├─ Abre caixa: Saldo Inicial R$ 100
│
Máquina 2 (Admin):
├─ Dashboard mostra caixa aberto ✓
│
Máquina 3 (Produção):
├─ Pode ver status do caixa
└─ Pode repor estoque
```

---

### Sincronização em Tempo Real

**Cenário:**

1. **Caixa** vende Bolo de Chocolate (R$ 50)
   - ✓ Saldo atualiza: +R$ 50

2. **Produção** vê estoque reduzir
   - ✓ Farinha reduz: -0,5 kg

3. **Admin** vê gráfico atualizar
   - ✓ "Mais Vendidos" muda

**Tempo:** Normalmente < 1 segundo

---

## 🔄 Sincronização Manual

Se houver dessincronia:

```typescript
// Em qualquer máquina
import { syncWithServer } from '@/firebase/multi-machine-sync'

// Forçar sincronização
await syncWithServer({
  type: 'full_sync',
  timestamp: Date.now(),
  collections: ['products', 'orders', 'supplies']
})
```

---

## 🐛 Problemas Comuns

### "Não consigo acessar localhost de outro PC"

**Problema:** Você digitou `localhost` na URL de outro PC.

**Solução:**
Use IP da máquina:
```
http://192.168.1.101:3000  ✓ (Correto)
http://localhost:3000       ✗ (Só funciona na mesma máquina)
```

---

### "Dados não sincronizam"

**Causas possíveis:**
1. Servidor sync não está rodando
2. IP no `.env` está errado
3. Firewall bloqueando porta 3001
4. Firebase credentials diferentes

**Solução:**
1. Verifique servidor: `curl http://192.168.1.100:3001`
2. Confira IP em `multi-machine-sync.ts`
3. Permita firewall porta 3001
4. Copie `.env.local` igual em todas máquinas

---

### "Erro: Connection refused"

```
Error: connect ECONNREFUSED 192.168.1.100:3001
```

**Causa:** Servidor não está acessível.

**Solução:**
```bash
# Máquina servidor: inicie sync
cd server && npm run dev

# Verifique porta está aberta
netstat -tulpn | grep 3001
```

---

## 🔒 Segurança Multi-Máquinas

### IMPORTANTE!

```
Cenário PERIGOSO:
┌─────────────┐
│  WiFi Público (Starbucks)
│  Falta autenticação
│  Dados expostos
└─────────────┘
```

**Proteção:**

1. **Use VPN** se conectar remotamente
   ```bash
   # Instale Tailscale
   https://tailscale.com/
   
   # Conecte todas máquinas
   tailscale up
   ```

2. **Autenticação no servidor**
   ```typescript
   // server/api/sync.ts
   if (!request.headers.authorization) {
     return error(401, 'Unauthorized')
   }
   ```

3. **HTTPS em produção**
   ```bash
   # Use Let's Encrypt
   certbot certonly --standalone -d seu-dominio.com
   ```

---

## 📊 Monitoramento

### Ver Status do Sync

```
Admin → Dashboard → Status da Rede
Mostra:
  ✓ Servidor conectado: Sim
  ✓ Última sincronização: 2 segundos atrás
  ✓ Máquinas ativas: 3
```

### Logs de Sincronização

```bash
# No servidor
tail -f logs/sync.log

# Esperado:
# [PDV] synced products (5 items)
# [Admin] synced orders (2 items)
# [Produção] synced supplies (1 item)
```

---

## 🎯 Boas Práticas

| Prática | Benefício |
|---------|-----------|
| **IP Fixo do Servidor** | Evita perder conexão |
| **Firewall Configurado** | Protege dados |
| **Backups PostgreSQL** | Recupera dados perdidos |
| **VPN para Remote** | Segurança em home office |
| **Sincronização automática** | Nada fica para trás |

---

## ✅ Checklist Setup

- [ ] Servidor PostgreSQL rodando
- [ ] Servidor Sync (Node) iniciado em 3001
- [ ] 2+ máquinas clientes com app clonado
- [ ] `.env.local` copiado para todas máquinas
- [ ] `multi-machine-sync.ts` com IP correto
- [ ] Firewall permite porta 3001
- [ ] Uma máquina consegue acessar outra (ping)
- [ ] App funciona em múltiplos PCs
- [ ] Dados sincronizam em tempo real

---

**Próximo:** [Setup Sync Server](setup-sync-server.md) | [Getting Started](../getting-started/installation.md)
