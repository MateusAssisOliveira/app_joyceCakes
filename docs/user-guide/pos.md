# 🛍️ PDV - Ponto de Venda

Registre vendas de forma rápida e segura.

---

## 🎯 O que é PDV?

Sistema para registrar quando um cliente compra algo.

**Fluxo simples:**
```
Cliente chega
    ↓
Você abre PDV
    ↓
Seleciona produto
    ↓
Quantidade + Preço calculado
    ↓
Cliente paga
    ↓
Venda concluída!
```

---

## 📝 Como Fazer uma Venda

### 1️⃣ Abrir PDV

```
Admin → Ponto de Venda
   ou
Menu Lateral → 🛒 Vendas
```

---

### 2️⃣ Selecionar Produto

```
┌──────────────────────────┐
│ Buscar: [bolo____]       │
├──────────────────────────┤
│ ☐ Bolo de Chocolate      │
│ ☐ Brigadeiro (por un.)   │
│ ☐ Torta de Sorvete       │
│ ☐ Doces Diversos         │
└──────────────────────────┘
```

**Dicas de busca:**
- Digite primeira letra
- Busca automática filtra
- Clique para selecionar

---

### 3️⃣ Adicionar à Lista

```
Produto: Bolo de Chocolate
Preço Unitário: R$ 50,00
Quantidade: [2]
Subtotal: R$ 100,00
```

**Pode adicionar vários produtos:**

```
┌─────────────────────────┐
│ Itens do Pedido         │
├─────────────────────────┤
│ 2x Bolo de Chocolate    │
│  Subtotal: R$ 100,00    │
│ 1x Brigadeiro           │
│  Subtotal: R$ 12,00     │
├─────────────────────────┤
│ TOTAL: R$ 112,00        │
└─────────────────────────┘
```

---

### 4️⃣ Pagamento

```
Valor: R$ 112,00

Método: [v] Dinheiro
          - Cartão
          - PIX

Recebido: [ 120  ]

Troco: R$ 8,00 ✅
```

---

### 5️⃣ Confirmar

Clique **"Finalizar Venda"**

**O que acontece:**
- ✅ Caixa registra entrada
- ✅ Estoque é reduzido
- ✅ Lucro é contabilizado
- ✅ Recibo é gerado

---

## 🖨️ Recibo

Imprime automaticamente:

```
━━━━━━━━━━━━━━━━━━━
    JOYCECAKES
━━━━━━━━━━━━━━━━━━━
Data: 15/02/2026 14:30
Atendente: Maria

2x Bolo Chocolate    R$ 100,00
1x Brigadeiro        R$  12,00
─────────────────────────────
TOTAL               R$ 112,00

Dinheiro            R$ 120,00
Troco               R$   8,00

━━━━━━━━━━━━━━━━━━━
Obrigado! Volte sempre! ❤️
```

---

## ✅ Checklist de Venda

- [ ] Caixa aberto
- [ ] Cliente selecionou produto
- [ ] Quantidade correta
- [ ] Preço bate
- [ ] Método de pagamento escolhido
- [ ] Recebimento registrado
- [ ] Troco calculado
- [ ] Venda finalizada

---

## 🐛 Problemas Comuns

### "Estoque insuficiente"

**Causa:** Produto não tem quantidade suficiente.

**Solução:**
1. Reduzir quantidade
2. Repor estoque depois
3. Oferecer alternativo

---

### "Produto não aparece"

**Causa:** Produto pode estar:
- Inativo
- Sem estoque

**Solução:**
1. Admin → Produtos
2. Verifique status
3. Reative se necessário

---

## 💡 Dicas Profissionais

| Dica | Benefício |
|------|-----------|
| **Usar PDV** | Rastrear todas vendas |
| **Imprimir recibo** | Cliente fica feliz |
| **Confirmar troco** | Evita erros |
| **Revisar caixa** | Descobrir discrepâncias |

---

**Próximo:** [Fluxo de Caixa](cash-flow.md) | [Dashboard](dashboard.md)
