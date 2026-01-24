# 🎨 Sistema de Design e Layout: Doce Caixa

Este documento descreve em detalhes a estrutura visual, os componentes e a filosofia de design do aplicativo "Doce Caixa". O objetivo é fornecer um guia claro para a evolução do layout por uma IA de design ou por desenvolvedores.

---

### **1. Filosofia Geral e Estrutura**

O layout foi projetado para ser limpo, funcional e profissional, com uma clara separação entre a navegação principal (à esquerda) e a área de conteúdo (à direita). A interface utiliza um sistema de painel de administração (`Admin Panel`) com um `Sidebar` fixo e um cabeçalho superior que exibe informações contextuais.

*   **Estrutura Principal:** Um layout de duas colunas.
    *   **Coluna Esquerda (Sidebar):** Navegação principal, persistente em todas as telas.
    *   **Coluna Direita (Conteúdo Principal):** Contém um cabeçalho (`Header`) e a área de conteúdo da página atual (`Main Content`).

### **2. Paleta de Cores e Tema**

A paleta de cores busca um equilíbrio entre profissionalismo e a temática de confeitaria, usando tons quentes e sofisticados.

*   **Fundo (`--background`):** `hsl(34, 33%, 96%)` - Um **creme suave**, que serve como base limpa e quente para toda a aplicação.
*   **Texto Principal (`--foreground`):** `hsl(20, 14%, 4%)` - Um **preto-acinzentado**, garantindo alta legibilidade e contraste.
*   **Cor Primária (`--primary`):** `hsl(340, 82%, 60%)` - Um **rosa antigo/vintage**, usado para botões principais, links ativos e elementos de destaque. É o ponto de cor principal, remetendo à confeitaria de forma elegante.
*   **Cor Secundária (`--secondary`):** `hsl(340, 60%, 95%)` - Um **rosa bem claro**, usado para fundos sutis em badges ou em estados de "hover" (passar o mouse).
*   **Cor de Acento (`--accent`):** `hsl(25, 68%, 50%)` - Um **tom de chocolate**, usado para contraste em elementos como gráficos e, ocasionalmente, em fundos de botões ou alertas.
*   **Bordas (`--border`):** `hsl(34, 20%, 85%)` - Um tom de creme um pouco mais escuro que o fundo, para divisórias e bordas sutis.
*   **Cards (`--card`):** `hsl(34, 33%, 99%)` - Um creme quase branco, mais claro que o fundo principal, para fazer os painéis de conteúdo se destacarem suavemente.

### **3. Tipografia**

A combinação de fontes cria uma hierarquia visual clara e elegante.

*   **Títulos de Página e Destaques (`--font-headline`):** `Playfair Display` - Uma fonte serifada, clássica e elegante, usada em `<h2>` e `<h1>` para dar um toque de sofisticação.
*   **Texto Geral e Controles (`--font-body`):** `Poppins` - Uma fonte sans-serif moderna, limpa e altamente legível, usada para parágrafos, labels, botões e todo o corpo de texto.

### **4. Componentes e Estilos**

A interface é construída com componentes reutilizáveis, seguindo o padrão da biblioteca `ShadCN`.

*   **Sidebar (Barra Lateral):**
    *   **Fundo:** `hsl(24, 20%, 12%)` - Um cinza-escuro (quase preto), criando um contraste forte com a área de conteúdo.
    *   **Texto:** `hsl(34, 20%, 85%)` - Um cinza-claro para os ícones e texto dos menus.
    *   **Item Ativo:** O item de menu da página atual é destacado com a cor primária (rosa antigo).
    *   **Layout:** Vertical, com ícones à esquerda e texto ao lado. Em modo "colapsado", exibe apenas os ícones.

*   **Cards:**
    *   São o principal contêiner de conteúdo.
    *   **Estilo:** Bordas arredondadas (`rounded-lg`), fundo de cor creme-claro (`--card`), sem bordas visíveis, mas com uma sombra muito sutil (`shadow-subtle: 0 4px 12px 0 rgba(0, 0, 0, 0.05)`) para dar uma leve sensação de profundidade e "flutuação".

*   **Botões:**
    *   **Primário:** Fundo rosa antigo (`--primary`) com texto branco.
    *   **Secundário:** Fundo rosa bem claro (`--secondary`) com texto rosa escuro.
    *   **Outline (Contorno):** Fundo transparente com borda na cor de borda padrão.
    *   **Estilo:** Cantos arredondados (`rounded-md`), sem sombras, com uma transição suave de cor ao passar o mouse.

*   **Tabelas:**
    *   Design minimalista. Linhas separadas por uma borda sutil.
    *   O cabeçalho tem texto em cinza-médio (`muted-foreground`).
    *   Linhas alternam uma cor de fundo muito sutil ao passar o mouse (`hover:bg-muted/50`).

*   **Gráficos:**
    *   Utilizam uma paleta de cores harmoniosa, com tons que complementam a cor primária e de acento (rosa, chocolate, azul suave, laranja queimado).
    *   Apresentados dentro de `Cards` para manter a consistência visual.

*   **Inputs e Formulários:**
    *   Campos com fundo claro, bordas sutis e cantos arredondados.
    *   Ao focar, uma borda mais destacada (anel) na cor primária aparece, indicando o campo ativo.
