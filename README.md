# 🧁 Guia Completo do Usuário: Doce Caixa

Bem-vindo(a) ao **Doce Caixa**, o seu sistema de gestão completo para confeitaria. Este guia foi criado para te ajudar a dominar cada funcionalidade do aplicativo, desde o controle de caixa até a precificação inteligente dos seus produtos.

## 1. Visão Geral: O que é o Doce Caixa?

O Doce Caixa é uma ferramenta poderosa para organizar, automatizar e otimizar a gestão do seu negócio. Com ele, você pode:

*   **Gerenciar seu estoque** de ingredientes e embalagens.
*   **Criar receitas (Fichas Técnicas)** para padronizar sua produção.
*   **Montar produtos para venda**, calculando custos precisos e preços justos.
*   **Controlar seu Ponto de Venda (PDV)**, registrando pedidos de forma rápida.
*   **Administrar seu Fluxo de Caixa** em tempo real, com entradas e saídas automáticas.
*   **Analisar o desempenho** do seu negócio através de um dashboard inteligente.

Vamos explorar cada página em detalhes.

---

## 2. Fluxo de Trabalho Recomendado

Para aproveitar ao máximo o sistema, siga esta sequência lógica:

1.  **Abra o Caixa:** A primeira ação do dia é ir em **Fluxo de Caixa** e abrir o caixa com o saldo inicial de troco.
2.  **Cadastre o Estoque:** Vá para **Itens de Estoque** para registrar toda a sua matéria-prima (ingredientes e embalagens).
3.  **Crie as Receitas:** Acesse **Fichas Técnicas** para criar as receitas base (massas, recheios, etc.).
4.  **Monte os Produtos:** Na página **Produtos**, crie os itens que você vende, vinculando as receitas e embalagens.
5.  **Venda no PDV:** Use o **Ponto de Venda** para registrar as vendas do dia.
6.  **Analise o Dashboard:** Acompanhe os resultados em tempo real no **Dashboard**.
7.  **Feche o Caixa:** Ao final do dia, volte ao **Fluxo de Caixa** para fechar o caixa.

---

## 3. Explicação das Páginas

### a) Dashboard de Performance

Esta é a sua central de comando. Aqui você tem uma visão geral e em tempo real do desempenho do seu negócio.

*   **Cards de Métricas:** Mostram os números mais importantes do dia: Vendas Totais, Ticket Médio, Pedidos e o Saldo Atual do Caixa.
*   **Gráficos de Desempenho:**
    *   **Vendas dos Últimos 7 Dias:** Acompanhe a evolução do seu faturamento.
    *   **Produtos Mais Vendidos:** Identifique quais produtos são os campeões de venda.
    *   **Fluxo de Caixa Diário:** Compare o total de entradas versus saídas.
    *   **Formas de Pagamento:** Veja como seus clientes preferem pagar (PIX, crédito, etc.).
*   **Alerta de Estoque Baixo:** Um aviso importante que mostra quais ingredientes ou embalagens estão abaixo do seu estoque mínimo definido.
*   **Movimentações Recentes:** Veja as últimas transações registradas no seu caixa.

> **Dica Prática:** Fique de olho no card de **Estoque Baixo**. Ele é seu melhor amigo para evitar a falta de um ingrediente crucial no meio da produção!

### b) Fluxo de Caixa

Esta é a página para gerenciar a "saúde financeira" do seu dia de trabalho.

*   **Abrir Caixa:** A primeira coisa a fazer no dia. Clique em **Abrir Caixa**, informe o valor inicial que você tem para troco e confirme. Sem um caixa aberto, nenhuma venda pode ser registrada.
*   **Fechar Caixa:** Ao final do expediente, clique em **Fechar Caixa** para finalizar as operações do dia.
*   **Nova Movimentação:** Use este botão para registrar qualquer dinheiro que entra ou sai do seu caixa e que **não seja uma venda de produto**.
    *   **Exemplos de Entrada:** Um aporte de dinheiro que você fez, uma venda de um item não cadastrado.
    *   **Exemplos de Saída:** Pagamento de um motoboy, compra de um material de limpeza, uma retirada (pró-labore).
*   **Tabela de Movimentações:** Mostra o histórico de todas as entradas e saídas registradas no caixa atual.

> **Dica Prática:** A venda de produtos cadastrados no PDV já lança a entrada e o custo automaticamente aqui. Use a "Nova Movimentação" apenas para operações manuais.

### c) Ponto de Venda (PDV)

É aqui que a mágica das vendas acontece.

*   **Lista de Pedidos Recebidos:** A tela principal mostra todos os pedidos do dia, do mais recente ao mais antigo.
*   **Mudar Status:** Você pode alterar o status de um pedido (`Pendente`, `Em Preparo`, `Pronto para Retirada`, etc.) diretamente na lista, mantendo o cliente e a equipe informados.
*   **Botão "Novo Pedido":** Este é o botão principal para iniciar uma nova venda. Ao clicar, uma janela se abre para você montar o pedido.
    *   **Adicionar Produtos:** Busque e adicione os produtos que o cliente deseja.
    *   **Ajustar Quantidade:** Altere a quantidade de cada item ou remova-o.
    *   **Dados do Cliente:** Informe o nome do cliente.
    *   **Pagamento:** Selecione a forma de pagamento.
    *   **Finalizar Pedido:** Ao clicar, o pedido é criado, o estoque é baixado, e as movimentações financeiras (receita e custo) são lançadas no caixa.

### d) Itens de Estoque

Esta página unifica o gerenciamento de **ingredientes** e **embalagens**.

*   **Abas de Navegação:** Use as abas no topo da tela para filtrar a visualização entre "Todos", "Ingredientes" ou "Embalagens".
*   **Adicionar Item:** Cadastre um novo insumo com todos os detalhes.
    *   **Cálculo de Custo:** Você pode informar o custo de duas maneiras:
        1.  **Custo por Pacote:** Ex: Paguei `R$ 50,00` em um pacote com `10` unidades. O sistema calculará que o custo unitário é `R$ 5,00`.
        2.  **Custo Unitário Direto:** Ex: O quilo (1000g) da farinha custa `R$ 5,00`. O sistema usará esse valor para calcular o custo por grama nas receitas.
    *   **Estoque Mínimo:** Defina a quantidade mínima que você quer ter. Quando o estoque atual ficar abaixo disso, um alerta aparecerá no Dashboard.
    *   **Histórico de Preços:** Ao editar um item, você pode visualizar as variações de preço que ele sofreu ao longo do tempo, uma ferramenta poderosa para analisar a inflação dos seus custos.
*   **Importar via CSV:** Adicione dezenas de itens de uma vez só usando uma planilha. Baixe o modelo, preencha e importe.
*   **Arquivar:** Em vez de deletar um item (o que poderia quebrar o histórico), você pode "Arquivá-lo". Ele some das listas de seleção, mas seus dados são mantidos.

> **Dica Prática:** Ao cadastrar um ingrediente comprado por quilo (kg) ou litro (L), o sistema já o converte para gramas (g) ou mililitros (ml) no cálculo de custo das receitas. Não precisa se preocupar com a conversão!

### e) Fichas Técnicas

Esta página é o seu **Livro de Receitas digital**. O objetivo aqui é padronizar o custo e o preparo das suas receitas base.

*   **O que é uma Ficha Técnica (ou Ficha de Base)?** É uma receita que serve como componente para um produto final. Exemplos: "Massa de Chocolate", "Recheio de Brigadeiro", "Calda de Caramelo".
*   **Como Criar:**
    1.  Dê um nome e uma descrição para sua receita.
    2.  Adicione os **ingredientes** que você já cadastrou na página de Estoque.
    3.  Informe a **quantidade** de cada ingrediente. O sistema calculará o custo automaticamente.
    4.  **Fator de Perda da Receita (%):** Este é um campo crucial. Informe a porcentagem de perda que ocorre durante o preparo da receita como um todo (ex: evaporação, o que fica na panela, sobras não utilizadas). O sistema adiciona esse custo ao total, garantindo que sua precificação seja justa e seu lucro seja real.
    5.  Descreva o **Modo de Preparo**.
    6.  Informe o **Rendimento Final** da receita (ex: "1200g" ou "1000ml"). Isso é **crucial** para que o sistema saiba o custo por grama ou ml da sua receita.
    7.  Salve a ficha.

> #### **Dica Avançada: Como Calcular o "Fator de Perda (%)"**
>
> 1.  **Pese os ingredientes (Peso Teórico):** Antes de começar, some o peso de todos os ingredientes da receita. Ex: 395g de leite condensado + 50g de chocolate = **445g**.
> 2.  **Pese a receita pronta (Peso Real):** Após o preparo, pese o resultado final utilizável (o que saiu da panela). Ex: **420g**.
> 3.  **Calcule a Perda:** `Peso Teórico (445g) - Peso Real (420g) = 25g de perda`.
> 4.  **Calcule a Porcentagem:** `(Perda em gramas / Peso Teórico) * 100`. Ex: `(25g / 445g) * 100 = 5.6%`.
>
> Neste caso, você pode arredondar e inserir `6` no campo "Fator de Perda da Receita (%)". Faça isso para suas principais receitas para ter um custo ultra preciso!

### f) Produtos

Aqui você cria o que seu cliente realmente compra. Esta página une o estoque e as receitas para criar um item vendável com preço e custo definidos.

*   **Adicionar Produto:** Ao criar um novo produto:
    1.  Dê um nome, categoria e descrição.
    2.  Na área **"Componentes do Produto"**, você pode adicionar:
        *   **Receitas:** Adicione as "Fichas Técnicas" que você criou (ex: 150g de Massa de Chocolate).
        *   **Ingredientes/Embalagens:** Adicione itens diretos do estoque (ex: 1 Pote de Plástico, 1 Tampa).
    3.  **Custos Adicionais:** Informe o **tempo de preparo** (em minutos), o **custo da sua mão de obra** (R$/hora) e um valor para **custos fixos/administrativos** (ex: R$ 0,50 por produto).
    4.  **Precificação:** Com base em todos os custos, informe a **Margem de Lucro Desejada (%)**. O sistema calculará automaticamente o **Preço de Venda Final** e o **Lucro Previsto** por unidade.
    5.  Salve o produto. Agora ele está pronto para ser vendido no PDV!

### g) Calculadora Rápida

Precisa calcular o preço de um bolo personalizado que não está no cardápio? Use esta página.

1.  **Adicione os Insumos:** Assim como na criação de um produto, adicione os ingredientes e suas quantidades.
2.  **Defina a Margem:** Informe a margem de lucro que você deseja.
3.  **Veja o Preço:** O sistema mostra o custo total e o preço de venda sugerido na hora.
4.  **Salvar como Pedido:** Se o cliente aprovar, clique em **"Salvar como Pedido Personalizado"**. Isso criará um novo pedido diretamente no seu PDV e registrará a venda no seu fluxo de caixa, sem a necessidade de cadastrar este item como um produto fixo.

---

Com este guia, você tem tudo o que precisa para explorar e gerenciar seu negócio de forma eficiente com o Doce Caixa. Bom trabalho e boas vendas!
