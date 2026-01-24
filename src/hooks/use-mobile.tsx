// HOOK PERSONALIZADO `useIsMobile`
//
// Propósito:
// Este hook verifica se a largura da janela do navegador corresponde a um
// dispositivo móvel, com base em um ponto de quebra (breakpoint) definido.
//
// Responsabilidade:
// - Abstrair a lógica de detecção de dispositivo móvel.
// - Adicionar um listener de evento para detectar mudanças no tamanho da janela
//   e atualizar o estado.
// - Retornar um booleano (`true` se for móvel, `false` se não for), que pode ser
//   usado em componentes para renderizar UIs diferentes para desktop e mobile.

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
