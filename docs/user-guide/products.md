# 🍰 Produtos & Receitas

Crie e gerencie seus produtos com receitas detalhadas.

---

## 🎯 O que é um Produto?

Um produto é:
- **Nome:** "Bolo de Chocolate"
- **Receita:** Ingredientes + modo de fazer
- **Preço:** O que você cobra
- **Imagem:** Foto do produto
- **Status:** Ativo ou inativo

---

## 📝 Criar um Novo Produto

### 1️⃣ Acessar

```
Admin → Produtos → "Novo Produto"
```

---

### 2️⃣ Preencher Informações Básicas

```
┌─────────────────────────────────┐
│ Novo Produto                    │
├─────────────────────────────────┤
│ Nome: [Bolo de Chocolate    ]   │
│ Descrição: [Feito com cacau]    │
│ Categoria: [Para aniversários]  │
└─────────────────────────────────┘
```

---

### 3️⃣ Definir Preço

```
Preço de Venda: [  50,00  ]
Custo Total:    [  14,50  ] (automático da receita)

Margem: 71% ✅ (muito bom!)
```

**O que é Custo Total?**
Soma de todos ingredientes na receita. Calculado automaticamente!

---

### 4️⃣ Criar Receita

Clique **"Adicionar Receita"**

```
┌───────────────────────────────┐
│ Ficha Técnica                 │
├───────────────────────────────┤
│ Ingrediente 1: Farinha de Trigo│
│ Quantidade: [2,5] kg          │
│ Preço Unit: [3,00]            │
│ Subtotal: [7,50]              │
│ ☐ Remover                     │
│                               │
│ [+ Adicionar Ingrediente]     │
├───────────────────────────────┤
│ Modo de Fazer:                │
│ [                           ] │
│ [Misturar, assar por 45m] │
│                               │
│ [Salvar Receita]              │
└───────────────────────────────┘
```

---

### 5️⃣ Adicionar Imagem

```
[  📸  Selecionar Foto  ]
ou
[  🔗  URL da Internet  ]
```

**Recomendação:** Foto clara, bem iluminada!

---

### 6️⃣ Salvar Produto

Clique **"Criar Produto"**

**O que acontece:**
- ✅ Produto aparece em vendas
- ✅ Receita é armazenada
- ✅ Preço fica ativo
- ✅ Imagem é salva

---

## ✏️ Editar Produto Existente

### Quando você pode editar?

```
✅ Nome
✅ Descrição
✅ Preço
✅ Categoria
✅ Imagem
✅ Receita (ingredientes)
✅ Status (ativo/inativo)

❌ Histórico de vendas (read-only)
```

### Como editar?

```
1. Admin → Produtos
2. Selecione produto
3. "Editar"
4. Altere o que quiser
5. "Salvar"
```

---

## 📊 Análise de Margens

Veja quais produtos são mais lucrativos:

```
Admin → Produtos → "Análise de Margens"
```

**Mostra:**
- 🟢 Produtos com >50% margem (ótimo!)
- 🟡 Produtos com 30-50% (normal)
- 🔴 Produtos com <30% (revisar preço)

---

## 🔄 Estados do Produto

### 🟢 Ativo
Produto aparece em vendas. Clientes podem comprar.

### 🔴 Inativo
Produto não aparece em vendas. Útil para:
- Produtos sazonais
- Produtos descontinuados
- Pausar vendas temporariamente

**Como inativar?**
```
Produtos → Selecione item → [⋯] → Desativar
```

---

## 📋 Exemplo Completo: Brigadeiro

### Informações

```
Nome: Brigadeiro
Descrição: Brigadeiro feito com chocolate belga
Categoria: Docinhos
Preço: R$ 2,50
```

### Receita

```
┌─────────────────────────────┐
│ Ingredientes (por lote 50)  │
├─────────────────────────────┤
│ Chocolate em pó    250g      │
│ Leite condensado   1 lata    │
│ Manteiga           50g       │
│ Açúcar            100g       │
│                    Total: R$ 12,00 |
└─────────────────────────────┘

Modo de Fazer:
1. Pulverizar chocolate
2. Misturar com leite e manteiga
3. Cozinhar em panela 15 minutos
4. Despejar em prato com manteiga
5. Esfriar 2 horas
6. Fazer bolinhas
7. Cobrir com granulado de chocolate
```

### Custo

```
Custo por lote: R$ 12,00
Brigadeiros por lote: 50
Custo unitário: R$ 0,24
Preço venda: R$ 2,50
Margem: 90% 🤑 (muito bom!)
```

---

## 💡 Dicas

| Dica | Motivo |
|------|--------|
| **Foto de qualidade** | Clientes compram mais |
| **Descrição clara** | Ele sabe o que esperar |
| **Preço competitivo** | Margem mínima = 30% |
| **Receita exata** | Custo sempre correto |

---

**Próximo:** [Fluxo de Caixa](cash-flow.md) | [Análise de Margens](../reference/glossary.md#a)
