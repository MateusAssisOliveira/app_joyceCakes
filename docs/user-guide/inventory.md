# 📦 Inventário

Controle seus ingredientes e matérias-primas.

---

## 🎯 O que é o Inventário?

Lugar onde você:
- **Adiciona** ingredientes (açúcar, farinha, ovos)
- **Acompanha** quantidade disponível
- **Atualiza** preço de compra
- **Vê** histórico de mudanças

---

## 🔄 Workflow: Repor Estoque

### 1️⃣ Acessar
```
Admin → Estoque → Selecione item
```

### 2️⃣ Clicar "Repor Estoque"
Um diálogo simples e seguro abre:

```
┌─────────────────────────────┐
│ Repor Açúcar Branco         │
├─────────────────────────────┤
│ Estoque Atual: 50 kg        │
│                             │
│ Quantidade: [     25]       │
│ (positivo = adiciona)       │
│                             │
│ Preço (R$): [    8,50]      │
│                             │
│ ☑ Registrar no Caixa        │
│                             │
│ [ Cancelar ]  [ Repor ]     │
└─────────────────────────────┘
```

### 3️⃣ Preencher
- **Quantidade:** Quanto adicionar/remover
  - Positivo: +50 kg
  - Negativo: -10 kg
- **Preço:** Novo preço de compra
- **Registrar Caixa:** Se marcado, afeta saldo

### 4️⃣ Salvar
Histórico é registrado automaticamente!

---

## ✅ Exemplo Completo

**Cenário:** Você comprou 25kg de açúcar por R$ 8,50/kg

```
1. Abrir app
2. Admin → Estoque
3. Procurar "Açúcar Branco"
4. "Repor Estoque"
5. Quantidade: 25
6. Preço: 8.50
7. ☑ Registrar no Caixa
8. Clique "Repor"
```

**Resultado:**
- Estoque aumenta: 50 → 75 kg
- Caixa reduz: -R$ 212,50
- Histórico salvo

---

## 🔍 Entendendo a Lista

| Campo | O que significa |
|-------|----------------|
| **Nome** | Ingrediente ou embalagem |
| **Atual** | Quantidade que você tem agora |
| **Mínimo** | Alerta se cair abaixo |
| **Preço** | Custo por unidade |
| **Última Atualização** | Data/hora da mudança |

---

## 🛡️ Por que não lembrar a quantidade?

**Resposta:** Segurança!

Se usássemos modo edição completo, você:
- Poderia apagar quantidade
- Perder dados por engano
- Difícil auditar

**Novo sistema:**
- ✅ Só adiciona/remove (nunca apaga)
- ✅ Preço histórico registrado
- ✅ Fácil rastrear mudanças
- ✅ Mais seguro

---

## 📊 Análise de Estoque

Visites **Análise de Margens** para:
- Produtos com estoque baixo
- Ingredientes caros vs baratos
- Rentabilidade por item

```
Admin → Produtos → Análise de Margens
```

---

**Próximo:** [Produtos](products.md) | [Dashboard](dashboard.md)
