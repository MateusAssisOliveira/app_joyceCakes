# Como mudar as cores do app (temas)

O Doce Caixa usa um **sistema de temas em um único lugar**. Assim você altera cores de forma fluida, sem procurar em vários arquivos.

---

## Onde mudar

| O que você quer | Onde fazer |
|-----------------|------------|
| **Mudar as cores** (primária, cards, sidebar, etc.) | Edite **`src/styles/themes.css`** no bloco do tema que está ativo. |
| **Trocar qual tema está ativo** (ex.: usar “Creme suave” em vez de “Rosa vibrante”) | Edite **`src/lib/theme.ts`** → mude o valor de **`activeThemeClass`**. |

Não é ruim ter isso num app: é a forma recomendada (design tokens / tema centralizado). Tudo que usa `bg-primary`, `bg-card`, `text-muted-foreground`, etc. passa a refletir o tema automaticamente.

---

## Tokens de cor (themes.css)

Cada tema é um bloco `.theme-nome` com variáveis em **HSL** (matiz, saturação%, luminosidade%). Exemplo: `338 90% 65%` = rosa vibrante.

| Token | Uso no app |
|-------|------------|
| `--background` | Fundo da página |
| `--foreground` | Texto principal |
| `--card` / `--card-foreground` | Fundo e texto dos **cards** |
| `--primary` / `--primary-foreground` | Botões principais, links ativos |
| `--secondary` | Fundos sutis, badges |
| `--muted` / `--muted-foreground` | Áreas desativadas, texto secundário |
| `--accent` | Detalhes, gráficos |
| `--border`, `--input`, `--ring` | Bordas, inputs, foco |
| `--sidebar-*` | Barra lateral (fundo, texto, hover) |
| `--chart-1` a `--chart-5` | Cores dos **gráficos** |

Ao editar um valor em `themes.css`, todas as telas que usam esse token (cards, botões, sidebar, gráficos) atualizam juntas.

---

## Temas disponíveis

Definidos em **`src/styles/themes.css`**:

- **`theme-vibrant-pink`** — Rosa vibrante (padrão atual).
- **`theme-cream-soft`** — Creme suave, estilo confeitaria clássica.
- **`theme-admin-original`** — Tema antigo (referência).

Para ativar outro tema: em **`src/lib/theme.ts`**, altere:

```ts
export const activeThemeClass: ThemeClass = "theme-cream-soft";
```

---

## Criar um novo tema

1. Abra **`src/styles/themes.css`**.
2. Copie um bloco `.theme-xxx { ... }` inteiro.
3. Renomeie a classe (ex.: `.theme-meu-tema`).
4. Ajuste os valores HSL das variáveis.
5. Em **`src/lib/theme.ts`**, adicione a nova classe em `themeClasses` e em `themeDisplayNames`.
6. Para usar: defina `activeThemeClass = "theme-meu-tema"`.

Assim você mantém um único lugar para cores e consegue mudar o layout de cores do app de forma simples e previsível.
