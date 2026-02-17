# 🧪 Guia de Testes: Sincronização Multi-Máquina

## 📝 Teste 1: Sincronização Local (Mesma Máquina, 2 Abas)

### Objetivo
Verificar se sincronização funciona **antes** de testar em 2 máquinas.

### Passos

1. **Abra 2 abas do navegador:**
   ```
   Aba 1: http://localhost:3000
   Aba 2: http://localhost:3000
   ```

2. **Faça login em ambas com a mesma conta**

3. **Crie um pedido na Aba 1:**
   - Vá para "Pedidos" → Clique "Novo Pedido"
   - Preencha dados
   - Clique "Salvar"

4. **Olhe para Aba 2:**
   - O pedido aparece **automaticamente**? ✅ Sincronização funciona!
   - Não aparece? ❌ Verifique console (F12)

---

## 📝 Teste 2: Sincronização em 2 Máquinas (Rede Local)

### Pré-requisitos

- Ambas máquinas na mesma rede WiFi ou cabeada
- Firewall permitindo conexão (ou desabilitado para teste)
- Ambas com o app rodando: `npm run dev`

### Passos

1. **Máquina 1:**
   ```bash
   npm run dev
   # Nota: http://localhost:3000 é só NELA
   ```

2. **Máquina 2:**
   ```bash
   npm run dev
   ```

3. **Descubra o IP da Máquina 1:**

   **Windows (Máquina 1):**
   ```powershell
   ipconfig
   # Procure por "IPv4 Address" de sua rede (ex: 192.168.1.100)
   ```

   **Linux/Mac (Máquina 1):**
   ```bash
   ifconfig
   # Procure por inet (ex: 192.168.1.100)
   ```

4. **Na Máquina 2, acesse:**
   ```
   http://192.168.1.100:3000
   ```
   (substitua pelo IP encontrado)

5. **Teste a sincronização:**
   - Máquina 1: Cria pedido
   - Máquina 2: Vê aparecer em tempo real ✅

---

## ⚠️ Possíveis Problemas & Soluções

### ❌ "Página não encontrada" ao acessar pela rede

**Problema**: Firewall bloqueando porta 3000

**Solução Windows**:
```powershell
# Como Admin, execute:
netsh advfirewall firewall add rule name="Next.js Dev" dir=in action=allow protocol=tcp localport=3000
```

**Solução macOS**:
```bash
# Firewall pode estar bloqueando
# System Settings → Security & Privacy → Firewall
```

---

### ❌ "Firebase error: Missing credentials"

**Problema**: Não está autenticado

**Solução**:
1. Clique em "Login" no app
2. Use email/senha (se Google Sign-In falhar)
3. Veja console do Firebase se há problemas

---

### ❌ "Dados não sincronizam entre máquinas"

**Problema**: Listeners não ativados ou erro de conexão

**Solução**: No console (F12), procure por:

```javascript
// Verifique no console:
console.log('🔍 Verificando Firebase:');
console.log(firebase.app());
```

Deve mostrar app do Firebase. Se erro, vai ta lá.

---

### ❌ "Somente uma máquina vê dados"

**Problema**: Autenticação diferente em cada máquina

**Solução**:
1. Logout em ambas
2. Use **mesma conta de email** em ambas
3. Após login, dados aparecem

---

## 🎯 Teste 3: Edição Simultânea

### Objetivo
Verificar comportamento quando 2 máquinas editam mesmo dado

### Passos

1. **Máquina 1**: Cria um produto "Bolo Chocolate - R$ 50"
2. **Máquina 2**: Vê aparecer automaticamente
3. **Máquina 2**: Edita para "Bolo Chocolate - R$ 45"
4. **Máquina 1**: Vê a mudança em tempo real ✅

**Esperado**: A última edição ganha (sem conflitos porque Firestore gerencia timestamps)

---

## 🎯 Teste 5: Idempotência (sem duplicação)

### Objetivo
Garantir que retry/reenvio do mesmo evento não crie registros duplicados no servidor.

### Passos

1. Gere um payload com `eventId` fixo.
2. Envie duas vezes para o endpoint `POST /api/sync/products`.
3. Verifique no banco que o registro foi aplicado uma vez.

**Esperado**:
- Mesmo `eventId` processado uma única vez.
- Sem duplicidade na tabela de destino.

---

## 🎯 Teste 6: Reconcile + Auto-Reparo

### Objetivo
Verificar detecção de divergência e recuperação automática no cliente.

### Passos

1. Configure `NEXT_PUBLIC_SYNC_AUTO_RECONCILE=true`.
2. Configure `NEXT_PUBLIC_SYNC_DIVERGENCE_STRATEGY=refresh_mismatched`.
3. Force uma divergência entre cliente e servidor (ex.: apague um item localmente).
4. Aguarde um ciclo de reconciliação.

**Esperado**:
- Cliente registra `console.warn` com `mismatches`.
- Cliente roda reset/fetch da tabela divergente.
- No próximo ciclo, `isConsistent` tende a `true`.

---

## 🎯 Teste 7: Auditoria de Reconciliação

### Objetivo
Confirmar que histórico fica persistido para investigação.

### Passos

1. Execute reconciliações por `POST /api/sync/reconcile`.
2. Consulte `GET /api/sync/reconcile/history?limit=20`.
3. Consulte `GET /api/sync/reconcile/history?onlyInconsistent=true`.

**Esperado**:
- Histórico contém `machine_id`, `is_consistent`, `mismatches_count`, `created_at`.
- Filtragem por inconsistência retorna apenas falhas.

---

## 📊 Teste 4: Performance & Latência

### Verifiquer velocidade de sincronização

1. **Máquina 1**: Abre DevTools (F12) → Console
2. **Máquina 1**: Digite:
   ```javascript
   console.time('sync');
   // [crie um pedido aqui]
   console.timeEnd('sync');
   ```

3. **Tempo esperado**: < 2 segundos latência média

---

## ✅ Checklist Final

Antes de usar em produção:

- [ ] Ambas máquinas acessam Firebase com sucesso
- [ ] Login funciona em ambas
- [ ] Dados sincronizam em < 2 segundos
- [ ] Edições de ambas máquinas não causam perda de dados
- [ ] Offline em uma máquina não afeta a outra
- [ ] Cache local funciona (modo offline)
- [ ] Retry/backoff evita falhas transitórias sem duplicar dados
- [ ] Reconcile identifica divergências e auto-reparo funciona
- [ ] Histórico de reconciliação disponível para auditoria

---

## 🚀 Próximas Otimizações

Uma vez tudo funcionando:

1. **Deploy na nuvem** (Firebase App Hosting)
   - Acesso público via HTTPS
   - Sem precisar saber IP das máquinas

2. **Autenticação de usuários**
   - Cada máquina com usuário diferente
   - Controle de permissões por usuário

3. **Backup automático**
   - Firestore faz backup todo dia
   - Recuperação de dados simples

