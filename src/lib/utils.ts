// ARQUIVO UTILITÁRIO
//
// Propósito:
// Este arquivo contém funções utilitárias que podem ser usadas em toda a aplicação.
//
// Responsabilidade:
// - `cn`: Uma função auxiliar para mesclar classes do Tailwind CSS de forma condicional
//   e inteligente, evitando conflitos de estilo. É uma ferramenta padrão em projetos
//   que usam Tailwind CSS e ShadCN UI.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
