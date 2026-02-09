# 🌐 Configurar App em 2 Máquinas com Firestore Compartilhado

## O que é essa arquitetura?
**Cliente-Servidor com Backend em Nuvem (Firebase)**

```
Máquina 1 ──┐
            ├──→ Firebase Firestore (BD Centralizado)
Máquina 2 ──┘
```

Cada máquina roda o app Next.js **localmente**, mas **compartilham o mesmo Firestore**.

---

## ✅ Passo 1: Garantir Firestore ativo no Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione projeto: **studio-6381551687-55cce**
3. Menu esquerdo → **Firestore Database**
4. Se não existir, clique em **"Create Database"**
5. Modo de início: **Iniciar em modo de teste** (depois configurar segurança)

---

## ✅ Passo 2: Configurar Firestore Rules (Segurança)

No Firebase Console → **Firestore** → **Rules**:

```firestore
rules_version = '3';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir apenas usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Clique em **Publish**.

---

## ✅ Passo 3: Ativar Firebase Authentication

1. Menu esquerdo → **Authentication**
2. Clique em **"Get started"**
3. Ative **Email/Password** ou **Google Sign-In**

---

## ✅ Passo 4: Instalar dependências (em ambas as máquinas)

```bash
npm install
```

Seu `package.json` já tem `firebase: ^10.12.3` ✅

---

## ✅ Passo 5: Limpar dados antigos (opcional)

Se existirem dados no Firestore que não quer mais:

```bash
# No Firebase Console → Firestore → Deletar todas as coleções
```

---

## ✅ Passo 6: Executar o App Local (em cada máquina)

### Máquina 1:
```bash
npm run dev
# Abre em http://localhost:3000
```

### Máquina 2:
```bash
npm run dev
# Abre em http://localhost:3000 (diferente internamente)
```

---

## ✅ Passo 7: Testar Sincronização em Tempo Real

### Como funciona:
1. **Máquina 1**: Cria um pedido
2. **Firestore**: Armazena o pedido
3. **Máquina 2**: Vê o pedido aparecer **automaticamente** (em tempo real)

Seu código já tem `useCollection()` que faz isso! Exemplo:

```typescript
// No seu componente
import { useCollection } from '@/firebase/firestore/use-collection';

export function OrdersList() {
  const { data: orders, loading } = useCollection('orders');
  
  if (loading) return <p>Carregando...</p>;
  
  return (
    <div>
      {orders?.map(order => (
        <div key={order.id}>{order.name}</div>
      ))}
    </div>
  );
}
```

**Quando o pedido é criado em uma máquina, a outra vê automaticamente!**

---

## ✅ Passo 8: Deploy na Nuvem (para acessar remotamente)

### Opção A: Firebase App Hosting (RECOMENDADO)

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login no Firebase
firebase login

# 3. Inicializar (já tem apphosting.yaml)
firebase init hosting

# 4. Deploy
npm run build
firebase deploy
```

**Após deploy**: App fica em `https://SEU_PROJETO.web.app`

Ambas máquinas acessam a mesma URL na nuvem!

### Opção B: Usar Vercel (alternativa)

```bash
# 1. Conectar repositório no Vercel
# 2. Deploy automático
# 3. URL: seu-app.vercel.app
```

---

## 🔒 Segurança: Controlar quem acessa o quê

Você pode adicionar roles/permissões:

```typescript
// src/services/userService.ts (exemplo)
export async function getUserRole(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.data()?.role; // 'admin', 'gerente', 'operador'
}

// Depois usar em regras do Firestore:
allow write: if request.auth.token.role == 'admin';
```

---

## 🚀 Resumo do Fluxo

| Máquina | Ação |
|---------|------|
| **1** | Cria/edita dados no app local |
| **1 & Firestore** | Dados salvos na nuvem |
| **2** | Sincroniza dados em tempo real |
| **2** | Edita os dados |
| **Firestore** | Atualiza todas as máquinas |

---

## 📊 Vantagens dessa arquitetura

✅ Sincronização automática em tempo real  
✅ Funciona em qualquer lugar com internet  
✅ Seguro com autenticação Firebase  
✅ Escala automaticamente  
✅ Backup automático  
✅ Fácil de testar (ambas máquinas offline = dados salvos localmente)  

---

## ❓ Dúvidas?

Se tiver problema:
1. Verificar console do navegador (F12)
2. Ver logs do Firebase Console
3. Testar em modo incógnito (sem cache)

