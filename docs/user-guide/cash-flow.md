# 💰 Fluxo de Caixa

Controle financeiro do seu negócio.

---

## 🎯 O que é Fluxo de Caixa?

Sistema que registra:
- ✅ **Entrada:** Vendas, clientes pagando
- ✅ **Saída:** Compras, repor estoque
- ✅ **Saldo:** Quanto você tem agora

---

## 📋 O Dia de Caixa

### 🌅 Manhã: Abrir Caixa

```
1. Admin → Fluxo de Caixa
2. Botão "Abrir Caixa"
3. Defina saldo inicial (ex: R$ 100 de troco)
4. Clique "Confirmar"
```

**O que acontece:**
- Sistema começa a registrar movimentações
- Saldo inicial fica fixo
- Todas vendas são somadas

---

### 💼 Durante o Dia: Vendas

Cada venda automaticamente:
- ✅ Adiciona dinheiro no caixa
- ✅ Reduz estoque
- ✅ Registra lucro

**Você não precisa fazer nada!**

---

### 🌙 Noite: Fechar Caixa

```
1. Admin → Fluxo de Caixa
2. Botão "Fechar Caixa"
3. Confirme saldo final
4. Clique "Fechar"
```

**O que é salvo:**
- Saldo inicial
- Total de vendas
- Total de compras
- Saldo final (calculado)
- Diferença (se dinheiro não bateu)

---

## 📊 Entendendo os Números

### Exemplo do Dia

```
Saldo Inicial: R$ 100,00
+ Vendas:      R$ 450,00  (5 vendas)
- Compras:     R$ 80,00   (repor estoque)
= Saldo Final: R$ 470,00
```

---

## 📈 Gráficos

### Movimentações por Hora
```
10:00 - 🔴 R$ 120 (pico de vendas)
11:00 - 🟡 R$ 80
12:00 - 🟢 R$ 200
13:00 - 🟢 R$ 150
```

**Dica:** Veja qual hora mais vendemos!

---

### Tipos de Movimentação

| Tipo | Cor | Exemplo |
|------|-----|---------|
| **Venda** | 🟢 Verde | Bolo vendido |
| **Compra** | 🔴 Vermelho | Açúcar comprado |
| **Ajuste** | 🟡 Amarelo | Correção manual |

---

## 🔧 Ações Manuais

Se precisar adicionar movimentação manual:

```
1. Admin → Fluxo de Caixa
2. "Adicionar Movimentação"
3. Tipo: Venda ou Compra
4. Valor
5. Descrição
6. Salvar
```

**Quando usar:**
- Dinheiro que recebeu offline
- Despesa não registrada
- Correção de erro

---

## ✅ Checklist Diário

- [ ] **Abrir caixa** logo cedo com saldo inicial
- [ ] **Vender normalmente** - app registra automaticamente
- [ ] **Repor estoque** se necessário
- [ ] **Fechar caixa** no final do dia
- [ ] **Comparar saldo** final com dinheiro que tem

---

## 🐛 Saldo não bate?

**Possíveis causas:**
1. Não abriu/fechou caixa
2. Vendas não registradas
3. Dinheiro perdido/roubado
4. Troco errado dado

**Solução:**
1. Confira últimas movimentações
2. Adicione movimentação manual se necessário
3. Reinicie caixa amanhã

---

**Próximo:** [Dashboard](dashboard.md) | [Análise de Margens](../reference/glossary.md#m)
