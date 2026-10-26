import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

type DicaInfoProps = {
  /** Nome do item explicado, usado no rótulo acessível do botão. */
  rotulo: string
  texto: string
  tom?: 'claro' | 'escuro'
}

/**
 * Tooltip com hover e foco no desktop e toque no mobile.
 * O toque abre (não alterna, porque o foco já abre antes do clique); fecha
 * com Esc, ao tocar fora ou ao perder o foco. O alvo de toque tem 44 px no mobile.
 */
export default function DicaInfo({ rotulo, texto, tom = 'claro' }: DicaInfoProps) {
  const [aberta, setAberta] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)
  const idDica = useId()

  useEffect(() => {
    if (!aberta) return

    function fecharAoTocarFora(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setAberta(false)
    }
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setAberta(false)
    }

    document.addEventListener('pointerdown', fecharAoTocarFora)
    document.addEventListener('keydown', fecharComEsc)
    return () => {
      document.removeEventListener('pointerdown', fecharAoTocarFora)
      document.removeEventListener('keydown', fecharComEsc)
    }
  }, [aberta])

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setAberta(true)}
      onMouseLeave={() => setAberta(false)}
    >
      <button
        type="button"
        aria-label={`Sobre ${rotulo}`}
        aria-describedby={aberta ? idDica : undefined}
        aria-expanded={aberta}
        onClick={() => setAberta(true)}
        onFocus={() => setAberta(true)}
        onBlur={() => setAberta(false)}
        className={`-m-3 inline-flex h-11 w-11 items-center justify-center rounded-full sm:-m-1 sm:h-7 sm:w-7 ${
          tom === 'escuro'
            ? 'text-[#725d00] hover:text-black'
            : 'text-[#9badc1] hover:text-[#1597ff]'
        } focus-visible:outline-2 focus-visible:outline-[#1597ff]`}
      >
        <Info aria-hidden size={15} strokeWidth={2.5} />
      </button>

      {aberta && (
        <span
          id={idDica}
          role="tooltip"
          className="absolute top-full right-0 z-30 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-lg bg-[#172033] px-3 py-2 text-left text-xs font-semibold normal-case leading-snug tracking-normal text-white shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        >
          {texto}
        </span>
      )}
    </span>
  )
}
