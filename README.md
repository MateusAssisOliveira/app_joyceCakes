# JoyceCakes - Guia Completo do Usuário

Este README agora funciona como manual de uso do sistema.

## 1. O que é o JoyceCakes

O JoyceCakes é um sistema de gestão para confeitaria com foco em operação diária:

- vendas (PDV)
- controle de estoque (ingredientes e embalagens)
- receitas/fichas técnicas
- produtos finais e margem de lucro
- fluxo de caixa
- sincronização entre máquinas

## 2. Acesso ao sistema

## 2.1 Tela inicial (`/`)

A tela inicial mostra o card de login com:

- campo `Email` (preenchido automaticamente)
- campo `Senha` (preenchido automaticamente)
- botão `Entrar`

Ação do botão `Entrar`:

- autentica no Firebase com usuário de teste
- se o usuário não existir, cria automaticamente
- redireciona para `/admin/dashboard`

## 2.2 Barra lateral do painel (`/admin/*`)

Menu principal:

- `Dashboard`
- `Receitas`
- `Estoque`
- `Vendas`
- `Financeiro`

Mais ferramentas:

- `Produtos`
- `Calculadora`
- `Operações`

Outros controles:

- botão casa (ícone): volta para dashboard
- botão `Sair do Painel`: encerra a sessão
- badge de sincronização (quando aplicável): mostra estados de sync

## 3. Fluxo recomendado de uso diário

1. Abrir caixa em `Financeiro`.
2. Conferir alertas em `Dashboard` e `Operações`.
3. Repor estoque em `Estoque`.
4. Registrar vendas em `Vendas`.
5. Acompanhar margem em `Produtos` e `Análise de Margens`.
6. Fechar caixa no final do dia.

## 4. Página por página (com botões e ações)

## 4.1 Dashboard (`/admin/dashboard`)

Objetivo:

- visão rápida de vendas do dia, lucro, pedidos pendentes e itens com estoque baixo

Botões:

- `Ir para Vendas`: abre `/admin/orders`
- `Ver Estoque`: abre `/admin/inventory`
- `Abrir Vendas`: atalho para lista de pedidos
- `Abrir Estoque`: atalho para itens a repor

Ações na tela:

- cards mostram métricas do dia
- lista `Pedidos para resolver agora` destaca pendências
- lista `Estoque para repor` destaca itens no mínimo/abaixo

## 4.2 Receitas (`/admin/recipes`)

Abas:

- `Nova Receita`
- `Gerenciar Receitas`

### 4.2.1 Aba Nova Receita

Objetivo:

- criar ficha técnica base para usar em produtos

Campos principais:

- `Nome da Receita`
- `Breve Descrição`
- `Modo de Preparo`
- `Rendimento Final da Receita`
- `Fator de Perda da Receita (%)`

Seção `Ingredientes Disponíveis`:

- busca `Buscar ingrediente...`
- botão/ícone `Adicionar` em cada insumo
- paginação `Anterior` e `Próximo`

Seção `Ingredientes da Receita`:

- ajuste de quantidade por item
- botão de remover (ícone lixeira)

Rodapé:

- botão `Limpar Formulário`: limpa todos os campos
- botão `Salvar Receita`: grava a ficha técnica

### 4.2.2 Aba Gerenciar Receitas

Objetivo:

- consultar, editar, arquivar e reativar receitas

Botões:

- `Editar`: abre edição da receita selecionada
- `Arquivar` ou `Reativar`: altera disponibilidade da receita

Filtros:

- seletor `Ver Ativas` / `Ver Arquivadas`

Ações:

- clique em um card para selecionar a receita
- confirmação obrigatória para arquivar/reativar

## 4.3 Estoque (`/admin/inventory`)

Objetivo:

- gerenciar todos os insumos (ingredientes e embalagens)

Barra de ações:

- botão `Novo Item`: abre cadastro completo
- botão `Ações`:
  - `Repor Estoque`
  - `Arquivar` ou `Reativar`
- botão `Consultas`:
  - `Importar via CSV`
  - `Exportar para Excel (CSV)`

Filtros:

- abas `Todos`, `Ingredientes`, `Embalagens`
- busca `Buscar item...`
- seletor de status `Ver Ativos` / `Ver Arquivados`

Tabela:

- clique simples: seleciona item
- duplo clique: abre reposição rápida (edição operacional)
- ordenação por cabeçalho (quando disponível)

Rodapé:

- botão `Ver Relatório Completo`: abre `/admin/supplies/report`

### 4.3.1 Cadastro completo de item (modal `Adicionar Novo Item`/`Editar Item`)

Campos:

- nome, categoria, tipo, estoque atual, estoque mínimo, unidade
- custo da compra por pacote (custo total + unidades)
- custo por unidade (automático quando pacote é informado)
- fornecedor, SKU, data da compra, validade

Financeiro:

- checkbox `Registrar esta compra no Fluxo de Caixa`
- se marcado, habilita:
  - `Método de Pagamento`
  - valor da despesa (preenchido automaticamente)

Botões:

- `Cancelar`
- `Salvar`

### 4.3.2 Reposição rápida (modal `Repor Estoque`)

Campos:

- `Quantidade a adicionar`
- `Novo custo`
- exibição de último custo e variação de preço

Financeiro:

- checkbox `Registrar custo no Fluxo de Caixa`
- método de pagamento
- custo total calculado

Botões:

- `Cancelar`
- `Confirmar`

### 4.3.3 Importação CSV

Passo 1:

- botão `Baixar Modelo (.csv)`

Passo 2:

- campo de arquivo para CSV
- botão `Importar Arquivo`
- botão `Cancelar`

## 4.4 Relatório de Estoque (`/admin/supplies/report`)

Objetivo:

- visão analítica com filtros detalhados

Filtros:

- busca por nome, SKU ou fornecedor
- tipo: `Todos os Tipos`, `Ingredientes`, `Embalagens`
- status: `Todos os Status`, `Ver Ativos`, `Ver Arquivados`

Ações:

- atualização automática conforme filtros
- exibe estoque, custo, fornecedor, última compra e status

## 4.5 Vendas / PDV (`/admin/orders`)

Objetivo:

- criar pedidos e acompanhar status da produção/entrega

Botão principal:

- `Novo Pedido`

### 4.5.1 Fluxo do Novo Pedido (wizard)

Etapas:

1. `Itens`
2. `Cliente`
3. `Confirmar`

Botões e ações:

- `+` no produto: adiciona item
- `-` e `+` no item: ajusta quantidade
- lixeira: remove item
- `Proximo`: avança etapa
- `Voltar`: retorna etapa
- `Cancelar`: fecha sem salvar
- `Finalizar Pedido`: cria pedido

Campos importantes:

- busca `Buscar produto...`
- `Nome do Cliente`
- `Método de Pagamento`

### 4.5.2 Lista de pedidos

Ações por pedido:

- seletor de `Status`: altera entre
  - `Pendente`
  - `Em Preparo`
  - `Pronto para Retirada`
  - `Entregue`
  - `Cancelado`
- botão `Editar`
- botão `Detalhes`

No modal de detalhes:

- botão `Fechar`
- botão `Imprimir`

## 4.6 Edição de pedido (`/admin/orders/edit?id=...`)

Objetivo:

- alterar itens e quantidades do pedido

Ações:

- trocar produto via seletor
- alterar quantidade
- remover item
- botão `Adicionar item`
- botão `Salvar alterações`

Importante:

- esta tela altera conteúdo e total do pedido
- não altera status nem fechamento de caixa

## 4.7 Financeiro (`/admin/cash-flow`)

## 4.7.1 Abertura de caixa

Se não houver caixa aberto, aparece modal obrigatório:

- campo `Valor Inicial (Troco)`
- botão `Abrir Caixa`

## 4.7.2 Caixa aberto

Botões:

- `Nova Movimentação`
- `Fechar Caixa`

### Nova Movimentação

Abas:

- `Entrada`
- `Saída`

Campos:

- (entrada) `Buscar Produto (Opcional)`
- `Valor`
- `Método`
- `Descrição`
- `Categoria`

Botões:

- `Cancelar`
- `Registrar`

### Fechamento de caixa

- botão `Fechar Caixa`
- confirmação `Confirmar Fechamento`
- ao confirmar, registra saldo final calculado

Tabela de movimentações:

- mostra descrição, categoria, método, data e valor
- valores positivos/negativos por tipo

## 4.8 Produtos (`/admin/products`)

Objetivo:

- montar e manter catálogo de produtos finais

Barra de ações:

- `Adicionar`
- `Análise de Margens`
- `Editar`
- `Arquivar` ou `Reativar`

Filtros:

- busca `Buscar produto...`
- status `Ver Ativos` / `Ver Arquivados`

Tabela/cards:

- clique para selecionar
- duplo clique para editar

### 4.8.1 Formulário de produto (montagem)

Seções:

- dados do produto (nome, categoria, descrição)
- componentes disponíveis (insumos e receitas base)
- componentes do produto (quantidades e custos)
- custos operacionais (tempo, mão de obra, custo fixo)
- cálculo de markup, lucro, margem e preço de venda

Botões principais:

- `Adicionar` componente
- paginação `Anterior` / `Próximo`
- remover componente (lixeira)
- `Salvar Produto` ou `Salvar Alterações`

## 4.9 Análise de Margens (`/admin/products/margin-analysis`)

Objetivo:

- analisar rentabilidade por produto

O que a tela mostra:

- margem média geral
- quantidade de produtos com margem alta e baixa
- alerta quando há margem baixa
- gráfico top 10 de margem
- tabela detalhada com preço, custo, lucro/unidade e status

Filtros:

- seletor de categoria (`Todas Categorias` e categorias específicas)

## 4.10 Calculadora (`/admin/calculator`)

Objetivo:

- montar item personalizado com base em insumos e gerar pedido

Ações:

- buscar insumos
- adicionar/remover insumos
- definir quantidade de cada item
- definir `Método de Pagamento`
- definir `Markup (%)`

Resultado:

- custo total
- lucro previsto
- margem final
- preço final de venda

Botão final:

- `Salvar como Pedido Personalizado`

## 4.11 Operações (`/admin/operations`)

Objetivo:

- painel de decisão rápida para operação e saúde técnica

Cards principais:

- `O que comprar hoje`
- `Prioridades agora`
- `Simular preço e margem`
- `Sincronização entre dispositivos`
- `Saúde técnica`
- `Fechamento do dia`

Botões úteis:

- `Gerar ação no estoque`
- `Abrir estoque` / `Ver auditoria` / `Ir para pedidos`
- `Abrir análise completa`
- `Atualizar diagnóstico`

## 5. Estados e indicadores importantes

## 5.1 Status de pedido

- `Pendente`: pedido recebido
- `Em Preparo`: em produção
- `Pronto para Retirada`: pronto para entrega/retirada
- `Entregue`: concluído
- `Cancelado`: encerrado sem conclusão

## 5.2 Sync badge (cabeçalho)

Pode exibir:

- `Sincronizando`
- `Com Divergência`
- `Offline/Erro`

Se nada crítico estiver acontecendo, o badge fica oculto.

## 6. Boas práticas de operação

- abra o caixa antes de registrar movimentações
- mantenha estoque mínimo configurado em todos os itens críticos
- use reposição rápida para compras recorrentes
- registre despesas no caixa ao repor estoque
- revise margem de produtos com frequência
- faça reconciliação/sync e backup periódico

## 7. Problemas comuns

- Não consigo salvar pedido: verifique se há itens e cliente informado.
- Não aparece item no PDV: confirme se o produto está ativo.
- Estoque não atualiza: confira sincronização e permissões.
- Divergência no sync: abra `Operações` e revise auditoria recente.

## 8. Links rápidos

- Dashboard: `/admin/dashboard`
- Receitas: `/admin/recipes`
- Estoque: `/admin/inventory`
- Relatório de estoque: `/admin/supplies/report`
- Vendas: `/admin/orders`
- Financeiro: `/admin/cash-flow`
- Produtos: `/admin/products`
- Análise de margens: `/admin/products/margin-analysis`
- Calculadora: `/admin/calculator`
- Operações: `/admin/operations`

## 9. Documentação complementar

- Índice de docs: [`docs/README.md`](docs/README.md)
- Manual de transporte de dados: [`docs/TRANSPORTE_DE_DADOS.md`](docs/TRANSPORTE_DE_DADOS.md)
- Setup do sync server: [`docs/deployment/setup-sync-server.md`](docs/deployment/setup-sync-server.md)
- Guia multi-máquinas: [`docs/deployment/multi-machine.md`](docs/deployment/multi-machine.md)
- Changelog: [`docs/reference/changelog.md`](docs/reference/changelog.md)

---

Última atualização: 18/02/2026
