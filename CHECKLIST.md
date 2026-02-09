# ✅ Checklist: Multi-Máquina Firestore

## 🎯 Fase 1: Preparação (5 minutos)

- [ ] Verificar que ambas máquinas têm internet
- [ ] Confirmar que projeto Firebase está ativo
- [ ] Ter credenciais do Firebase (já no seu `config.ts`)

## 🔧 Fase 2: Configuração Firebase (10 minutos)

### No Firebase Console:

- [ ] 1. Acesse: https://console.firebase.google.com/
- [ ] 2. Projeto: **studio-6381551687-55cce**
- [ ] 3. Menu → **Firestore Database** → Create Database
- [ ] 4. Modo: **Start in test mode**
- [ ] 5. Menu → **Authentication** → Enable Email/Password

### Copiar Firestore Rules:

```firestore
rules_version = '3';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

- [ ] Ir a **Firestore** → **Rules** → Colar regras acima
- [ ] Clique em **Publish**

## 💻 Fase 3: Código (opcional, já feito)

- [ ] ✅ Arquivo `multi-machine-sync.ts` criado
- [ ] ✅ Exemplo `SyncedOrdersList.tsx` criado
- [ ] ✅ Documentação `MULTI_MACHINE_SETUP.md` criado
- [ ] ✅ Testes `TESTING_SYNC.md` criado

## 🚀 Fase 4: Teste Local (2 máquinas, mesma rede)

**Máquina 1:**
```bash
npm install
npm run dev
# Abre http://localhost:3000
```

**Máquina 2:**
```bash
npm install
npm run dev
```

- [ ] Ambas máquinas conseguem acessar Firebase
- [ ] Login funciona em ambas
- [ ] Teste sincronização (criar dado em uma, ver na outra)

## 📊 Fase 5: Deploy Opcional (para múltiplos usuários/locais)

```bash
npm run build
firebase deploy
```

- [ ] App disponível em: `https://seu-projeto.web.app`
- [ ] Ambas máquinas acessam mesma URL

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| ❌ "Não consegue acessar Firebase" | Verificar internet, Firebase ativo, credenciais OK |
| ❌ "Dados não sincronizam" | F12 → Console → procurar por erros de auth |
| ❌ "Firewall bloqueia porta 3000" | Windows: `netsh advfirewall firewall add rule name="Next.js" dir=in action=allow protocol=tcp localport=3000` |
| ❌ "Mesmos dados em 2 máquinas" | Use contas diferentes no Firebase (test-1@gmail.com, test-2@gmail.com) |

## 📚 Arquivos Criados para Você

| Arquivo | Propósito |
|---------|-----------|
| `MULTI_MACHINE_SETUP.md` | Guia passo-a-passo |
| `TESTING_SYNC.md` | Como testar sincronização |
| `src/firebase/multi-machine-sync.ts` | Código reutilizável |
| `src/components/admin/SyncedOrdersList.tsx` | Exemplo de componente sincronizado |

## 🎓 Resumo da Arquitetura

```
ANTES (Uma máquina):
┌─────────────────┐
│  Next.js App    │
│  + BD Local     │
└─────────────────┘

DEPOIS (Multi-máquina):
┌──────────────┐     ┌──────────────┐
│ Next.js App  │     │ Next.js App  │
│  (Máquina 1) │─┬─→ │ (Máquina 2)  │
└──────────────┘ │   └──────────────┘
                 │
            ☁️ FIRESTORE
         (BD Centralizado)
```

## 🚀 Próximos Passos

1. **Hoje**: Testar em 2 máquinas na rede local
2. **Amanhã**: Deploy em produção (opcional)
3. **Depois**: Adicionar permissões por usuário

---

**Dúvidas?** Veja `MULTI_MACHINE_SETUP.md` ou `TESTING_SYNC.md`

