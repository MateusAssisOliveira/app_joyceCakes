// UI DE CARREGAMENTO (LOADING UI)
//
// Propósito:
// Este arquivo define um componente de carregamento que é exibido automaticamente pelo Next.js
// enquanto os dados de uma página de servidor (Server Component) estão sendo carregados.
//
// Responsabilidade:
// - Fornecer feedback visual imediato ao usuário durante a navegação entre páginas.
// - Melhorar a experiência do usuário, tornando a transição entre páginas mais suave
//   e evitando a sensação de "aplicação congelada".

import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-50">
      <Loader className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-lg font-semibold">Carregando...</p>
        <p className="text-sm text-muted-foreground">
          Buscando os dados da página. Por favor, aguarde.
        </p>
      </div>
    </div>
  );
}
