import { useEffect, type RefObject } from 'react'

/** Fecha um popover ao clicar fora do container ou apertar Esc (mesmo padrão do SeletorUnidade). */
export function useFecharAoClicarFora(aberto: boolean, containerRef: RefObject<HTMLElement | null>, fechar: () => void) {
  useEffect(() => {
    if (!aberto) return

    function aoClicar(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) fechar()
    }

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') fechar()
    }

    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto, containerRef, fechar])
}
