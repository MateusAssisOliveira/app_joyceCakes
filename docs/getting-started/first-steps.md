# 📖 Primeiros Passos

Seu guia completo para começar a usar **JoyceCakes** do zero.

---

## ✅ Setup Inicial Checklist

Antes de tudo, complete isto:

- [ ] Instalou e rodou o app (`npm run dev`)
- [ ] Criou conta (Firebase Auth)
- [ ] Acessou [localhost:3000](http://localhost:3000)
- [ ] Viu o Dashboard

---

## 🎯 Fluxo Recomendado (30 min)

### Passo 1: Abrir Caixa (2 min) 💰

1. Clique em **Dashboard**
2. Vá até **Fluxo de Caixa**
3. Botão **"Abrir Caixa"**
4. Insira saldo inicial (ex: R$ 100)
5. ✅ Pronto! Caixa aberto

**Por que?** Todas as operações precisam de um caixa ativo.

---

### Passo 2: Criar Estoque (5 min) 📦

1. Clique em **Admin** → **Estoque**
2. Botão **"Adicionar Item"**

Adicione 3 itens básicos:

```
1. Farinha de Trigo
   - Unidade: kg
   - Custo: R$ 20
   - Estoque: 5

2. Açúcar
   - Unidade: kg
   - Custo: R$ 8
   - Estoque: 3

3. Ovo
   - Unidade: un
   - Custo: R$ 0,80
   - Estoque: 12
```

**💡 Dica:** Use "Repor Estoque" depois se precisar adicionar mais.

---

### Passo 3: Criar Receita (5 min) 📝

1. **Admin** → **Fichas Técnicas**
2. **"Adicionar Ficha Técnica"**

Crie a receita "Bolo Base":

```
Nome: Bolo Base
Tipo: Base (padrão)

Componentes:
✓ 500g Farinha (R$ 10)
✓ 200g Açúcar (R$ 1,60)
✓ 3 Ovos (R$ 2,40)

Total Estimado: R$ 14
```

**Resultado:** O sistema calcula custo automaticamente!

---

### Passo 4: Criar Produto (5 min) 🛍️

1. **Admin** → **Produtos**
2. **"Adicionar Produto"**

Crie o produto "Bolo de Chocolate":

```
Nome: Bolo de Chocolate
Descrição: Bolo clássico com cobertura

Ficha Técnica: Bolo Base (selecionado)
Custo Calculado: R$ 14
Preço de Venda: R$ 50
Margem: 72% ✨

Stock Inicial: 2
```

**O que o app faz:**
- Calcula margem automaticamente
- Vincula receita ao produto
- Valida custo vs. preço

---

### Passo 5: Fazer Primeira Venda (5 min) 💵

1. **Admin** → **Vendas (PDV)**
2. **"Novo Pedido"**

```
Cliente: João
Item: Bolo de Chocolate × 2
Total: R$ 100
Pagamento: PIX
```

**Ao Confirmar:**
- ✅ Pedido criado
- ✅ Entrada +R$ 100 no caixa
- ✅ Custo -R$ 28 (2 × R$ 14) registrado
- ✅ Lucro +R$ 72 gerado

---

### Passo 6: Analisar Dashboard (3 min) 📊

1. **Dashboard**

Veja em tempo real:
- 💰 Saldo: R$ 172 (100 + 100 - 28)
- 📈 Vendas: R$ 100
- 🏆 Ticket Médio: R$ 100
- 📊 Margem: 72%

---

## 🎓 Conceitos Chave

### Estoque vs Produto

| Aspecto | Estoque | Produto |
|--------|---------|---------|
| O quê? | Matéria-prima | Item vendável |
| Ex. | Farinha, Açúcar | Bolo, Torta |
| Custo? | Pago ao comprar | Calculado da receita |
| Venda? | Não | Sim |

### Ficha Técnica

É uma **receita** que define:
- Quais ingredientes usar
- Quantidades corretas
- Custo total

**Reutilizável** em vários produtos!

### Fluxo de Caixa

Registra **entradas** (vendas) e **saídas** (compras):

```
Saldo Inicial: R$ 100
+ Venda: R$ 100
- Custo: R$ 28
= Saldo Final: R$ 172
```

---

## 🚀 Próximos Passos

Parabéns! Você completou o setup básico! 🎉

Agora você pode:

- 📚 Ler [User Guide](../user-guide/dashboard.md) para explorar mais
- 💼 Criar mais produtos e receitas
- 📊 Usar [Análise de Margens](../user-guide/products.md)
- 💾 Consultar [Troubleshooting](../reference/troubleshooting.md) se precisar

---

## ❓ Precisa de Ajuda?

| Dúvida | Consulte |
|--------|----------|
| Como usar X página? | [User Guide](../user-guide/dashboard.md) |
| Erro ao... | [Troubleshooting](../reference/troubleshooting.md) |
| O que significa Y? | [Glossário](../reference/glossary.md) |

---

**Sucesso!** 🚀 Agora explore o resto em [User Guide](../user-guide/dashboard.md)
