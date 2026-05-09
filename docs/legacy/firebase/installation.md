# 🔧 Instalação & Setup

Guia passo a passo para instalar e configurar o **JoyceCakes**.

---

## 📋 Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** 9+ (vem com Node.js)
- **Git** ([Download](https://git-scm.com))
- **Conta Firebase** (gratuita em [firebase.google.com](https://firebase.google.com))

---

## ⚙️ Instalação Local

### 1. Clonar Repositório

```bash
git clone https://github.com/MateusAssisOliveira/app_joyceCakes.git
cd app_joyceCakes
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Firebase

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com)
2. Copie as credenciais
3. Crie arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

### 4. Criar Banco de Dados

No Firebase Console:
- Firestore Database → Criar banco (modo teste ou produção)
- Storage → Criar bucket

### 5. Iniciar Dev Server

```bash
npm run dev
```

Abra [localhost:3000](http://localhost:3000) 🎉

---

## 🚀 Deploy (Production)

### Opção 1: Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

Segue as instruções do CLI.

### Opção 2: Docker

```bash
docker build -t joycecakes .
docker run -p 3000:3000 joycecakes
```

### Opção 3: Servidor Linux/VPS

```bash
npm run build
npm start
```

---

## ✅ Verificar Instalação

```bash
# Tentar build
npm run build

# Sem erros? ✅ Pode começar!
npm run dev
```

---

## 🐛 Problemas Comuns?

| Erro | Solução |
|------|---------|
| `Cannot find Firebase config` | Verifique arquivo `.env.local` |
| `Port 3000 already in use` | `npm run dev -- -p 3001` |
| `node_modules not found` | `npm install` novamente |
| `Build fails` | Delete `node_modules` + `.next`, limpe cache |

---

**Pronto?** → [First Steps](./first-steps.md) 🚀
