# Pasta `src/` – Código fonte do Doce Caixa

Cada pasta tem um propósito único. Para o mapa completo, veja **[docs/ESTRUTURA_DO_PROJETO.md](../docs/ESTRUTURA_DO_PROJETO.md)**.

| Pasta | Conteúdo |
|-------|----------|
| **app/** | Rotas (URLs) e páginas. Cada `page.tsx` + seu `*-client.tsx` = uma tela. |
| **components/** | Componentes reutilizáveis (formulários, dialogs, tabelas, gráficos). Não define rotas. |
| **services/** | Lógica de negócio e acesso a dados (pedidos, produtos, caixa, etc.). |
| **types/** | Tipos TypeScript do projeto. |
| **firebase/** | Config e hooks do Firebase (auth, Firestore). |
| **lib/** | Utilitários gerais. |
| **data/** | Dados mock / em memória. |
| **hooks/** | Hooks React reutilizáveis. |

Regra: **rotas e “donos” da página** → `app/`. **Peças de UI reutilizáveis** → `components/`. **Regras e dados** → `services/`.
