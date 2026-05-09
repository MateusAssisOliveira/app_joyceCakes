# 📚 Perguntas Frequentes & Troubleshooting

Soluções para problemas e dúvidas comuns.

---

## ❓ Dúvidas Frequentes

### Como faço backup dos meus dados?

**Resposta:** O Firebase faz backup automático. Seus dados estão seguros em nuvem!

Se quiser exportar manualmente:
1. **Estoque** → Botão "Exportar" → Download CSV
2. **Produtos** → Similar

### Posso usar em múltiplos dispositivos?

**Resposta:** Sim! Com a sincronização PostgreSQL:
- [Setup Sync Server](../deployment/setup-sync-server.md)
- [Multi-Máquinas](../deployment/multi-machine.md)

### Como altero o preço de um produto?

**Resposta:** 
1. **Admin** → **Produtos**
2. Selecione o produto
3. Clique **"Editar"**
4. Altere "Preço de Venda"
5. **Salvar**

> **Nota:** Histórico de preço é registrado automaticamente!

### Por que não posso remover um item de estoque?

**Resposta:** Você não remove, você **reposiciona**:

1. **Estoque** → Selecione item
2. **"Repor Estoque"**
3. Insira quantidade a reduzir (negativa)
4. Isso registra a redução no histórico

**Motivo:** Auditoria e rastreabilidade!

### Posso desfazer uma venda?

**Resposta:** Atualmente não. Mas você pode:

1. Criar uma venda "negativa" (devolução)
2. Registrar como "Cancelado" se ainda não processou

**Sugestão aberta:** [GitHub Issue](https://github.com/MateusAssisOliveira/app_joyceCakes/issues)

---

## 🐛 Problemas Comuns

### Erro: "Caixa não encontrado"

**Causa:** Caixa não foi aberto today.

**Solução:**
1. **Fluxo de Caixa** → Botão **"Abrir Caixa"**
2. Insira saldo inicial
3. Tente novamente

---

### Erro: "Estoque insuficiente"

**Causa:** Produto tem menos quantidade que você tentou vender.

**Solução:**
1. **Estoque** → Selecione ingrediente
2. **"Repor Estoque"**
3. Aumente quantidade
4. Faça venda novamente

---

### Erro: "Permissão negada no Firebase"

**Causa:** Não está autenticado ou sem permissão.

**Solução:**
1. Faça **login** novamente
2. Verifique regras do Firestore:
   ```
   match /databases/{database}/documents {
     match /{document=**} {
       allow read, write: if request.auth.uid != null;
     }
   }
   ```

---

### Saldo do caixa não bate

**Causa:** Pode ser falha ao fechar caixa ou movimentação não registrada.

**Solução:**
1. Abra **Fluxo de Caixa**
2. Veja tabela **"Movimentações Recentes"**
3. Verifique se todas operações estão listas
4. Se faltar, adicione manualmente com **"Adicionar Movimentação"**

---

### App carregando infinitamente

**Causa:** Firebase não conectou ou erro de configuração.

**Solução:**
1. Verifique `.env.local` com credenciais corretas
2. Firebase Console → Importar de novo
3. Limpar cache: `Ctrl+Shift+Delete`
4. Reload: `Ctrl+F5`

---

### Produto não aparece em Vendas

**Causa:** Produto pode estar **inativo** ou sem estoque.

**Solução:**
1. **Produtos** → Verifique status
2. Se inativo, **"Reativar"**
3. Se sem estoque, **"Repor Estoque"**

---

## 🆘 Ainda com Dúvida?

- 📖 Leia [User Guide](../user-guide/dashboard.md)
- 🎓 Confira [First Steps](../getting-started/first-steps.md)
- 💬 Abra [Issue no GitHub](https://github.com/MateusAssisOliveira/app_joyceCakes/issues)

---

**Problema não listado?** → [Abra uma Issue](https://github.com/MateusAssisOliveira/app_joyceCakes/issues) 🐛
