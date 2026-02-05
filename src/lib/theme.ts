/**
 * Tema ativo do app — único lugar para trocar o layout de cores.
 *
 * Para mudar as cores do app:
 * 1. Edite os valores em src/styles/themes.css no bloco do tema que você usa.
 * 2. Para usar outro tema, altere activeThemeClass abaixo para a classe desejada.
 *
 * Classes disponíveis (definidas em themes.css):
 * - theme-vibrant-pink  → rosa vibrante (padrão atual)
 * - theme-cream-soft    → creme suave, confeitaria clássica
 * - theme-admin-original → tema antigo (referência)
 */

export const themeClasses = [
  "theme-vibrant-pink",
  "theme-cream-soft",
  "theme-admin-original",
] as const;

export type ThemeClass = (typeof themeClasses)[number];

/** Tema aplicado no <body>. Mude aqui para trocar as cores do app inteiro. */
export const activeThemeClass: ThemeClass = "theme-vibrant-pink";

/** Nomes amigáveis para uso em seletor de tema (futuro). */
export const themeDisplayNames: Record<ThemeClass, string> = {
  "theme-vibrant-pink": "Rosa vibrante",
  "theme-cream-soft": "Creme suave",
  "theme-admin-original": "Admin original",
};
