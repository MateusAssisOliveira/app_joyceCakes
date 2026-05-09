# âœ… Checklist: Multi-MÃ¡quina Firestore

## ðŸŽ¯ Fase 1: PreparaÃ§Ã£o (5 minutos)

- [ ] Verificar que ambas mÃ¡quinas tÃªm internet
- [ ] Confirmar que projeto Firebase estÃ¡ ativo
- [ ] Ter credenciais do Firebase (jÃ¡ no seu `config.ts`)

## ðŸ”§ Fase 2: ConfiguraÃ§Ã£o Firebase (10 minutos)

### No Firebase Console:

- [ ] 1. Acesse: https://console.firebase.google.com/
- [ ] 2. Projeto: **studio-6381551687-55cce**
- [ ] 3. Menu â†’ **Firestore Database** â†’ Create Database
- [ ] 4. Modo: **Start in test mode**
- [ ] 5. Menu â†’ **Authentication** â†’ Enable Email/Password

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

- [ ] Ir a **Firestore** â†’ **Rules** â†’ Colar regras acima
- [ ] Clique em **Publish**

## ðŸ’» Fase 3: CÃ³digo (opcional, jÃ¡ feito)

- [ ] âœ… Arquivo `multi-machine-sync.ts` criado
- [ ] âœ… Exemplo `SyncedOrdersList.tsx` criado
- [ ] âœ… DocumentaÃ§Ã£o `docs/deployment/multi-machine.md` criado
- [ ] âœ… Testes `TESTING_SYNC.md` criado

## ðŸš€ Fase 4: Teste Local (2 mÃ¡quinas, mesma rede)

**MÃ¡quina 1:**
```bash
npm install
npm run dev
# Abre http://localhost:3000
```

**MÃ¡quina 2:**
```bash
npm install
npm run dev
```

- [ ] Ambas mÃ¡quinas conseguem acessar Firebase
- [ ] Login funciona em ambas
- [ ] Teste sincronizaÃ§Ã£o (criar dado em uma, ver na outra)

## ðŸ“Š Fase 5: Deploy Opcional (para mÃºltiplos usuÃ¡rios/locais)

```bash
npm run build
firebase deploy
```

- [ ] App disponÃ­vel em: `https://seu-projeto.web.app`
- [ ] Ambas mÃ¡quinas acessam mesma URL

## ðŸ› Troubleshooting RÃ¡pido

| Problema | SoluÃ§Ã£o |
|----------|---------|
| âŒ "NÃ£o consegue acessar Firebase" | Verificar internet, Firebase ativo, credenciais OK |
| âŒ "Dados nÃ£o sincronizam" | F12 â†’ Console â†’ procurar por erros de auth |
| âŒ "Firewall bloqueia porta 3000" | Windows: `netsh advfirewall firewall add rule name="Next.js" dir=in action=allow protocol=tcp localport=3000` |
| âŒ "Mesmos dados em 2 mÃ¡quinas" | Use contas diferentes no Firebase (test-1@gmail.com, test-2@gmail.com) |

## ðŸ“š Arquivos Criados para VocÃª

| Arquivo | PropÃ³sito |
|---------|-----------|
| `docs/deployment/multi-machine.md` | Guia passo-a-passo |
| `TESTING_SYNC.md` | Como testar sincronizaÃ§Ã£o |
| `src/firebase/multi-machine-sync.ts` | CÃ³digo reutilizÃ¡vel |
| `src/components/admin/SyncedOrdersList.tsx` | Exemplo de componente sincronizado |

## ðŸŽ“ Resumo da Arquitetura

```
ANTES (Uma mÃ¡quina):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Next.js App    â”‚
â”‚  + BD Local     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

DEPOIS (Multi-mÃ¡quina):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Next.js App  â”‚     â”‚ Next.js App  â”‚
â”‚  (MÃ¡quina 1) â”‚â”€â”¬â”€â†’ â”‚ (MÃ¡quina 2)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                 â”‚
            â˜ï¸ FIRESTORE
         (BD Centralizado)
```

## ðŸš€ PrÃ³ximos Passos

1. **Hoje**: Testar em 2 mÃ¡quinas na rede local
2. **AmanhÃ£**: Deploy em produÃ§Ã£o (opcional)
3. **Depois**: Adicionar permissÃµes por usuÃ¡rio

---

**DÃºvidas?** Veja `docs/deployment/multi-machine.md` ou `TESTING_SYNC.md`


