import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

type SeletorUnidadeProps = {
  opcoes: readonly string[]
  valor: string
  onChange: (valor: string) => void
  disabled?: boolean
}

export default function SeletorUnidade({
  opcoes,
  valor,
  onChange,
  disabled = false,
}: SeletorUnidadeProps) {
  const [aberto, setAberto] = useState(false)
  const [indiceDestacado, setIndiceDestacado] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const listaId = useId()

  const indiceSelecionado = opcoes.indexOf(valor)

  useEffect(() => {
    if (!aberto) return

    function fecharAoClicarFora(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
    }
  }, [aberto])

  function abrirLista() {
    if (disabled) return
    setIndiceDestacado(indiceSelecionado >= 0 ? indiceSelecionado : 0)
    setAberto(true)
  }

  function selecionar(opcao: string) {
    onChange(opcao)
    setAberto(false)
  }

  function lidarComTecladoNoBotao(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (disabled) return

    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      abrirLista()
    }
  }

  function lidarComTecladoNaLista(
    event: React.KeyboardEvent<HTMLUListElement>,
  ) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setAberto(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndiceDestacado((atual) =>
        Math.min(atual + 1, opcoes.length - 1),
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndiceDestacado((atual) => Math.max(atual - 1, 0))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selecionar(opcoes[indiceDestacado])
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        id="unidade"
        aria-haspopup="listbox"
        aria-expanded={!disabled && aberto}
        aria-controls={listaId}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => (aberto ? setAberto(false) : abrirLista())}
        onKeyDown={lidarComTecladoNoBotao}
        className={[
          'flex w-full items-center justify-between rounded-lg border bg-white px-5 py-4 font-barlow text-xl text-preto-v1 shadow-sm transition-all duration-200',
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500'
            : aberto
            ? 'border-gray-400 shadow-md'
            : 'border-gray-300 hover:border-gray-400',
        ].join(' ')}
      >
        <span className="truncate text-left">{valor}</span>

        <ChevronDown
          size={24}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${
            aberto ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {!disabled && aberto && (
        <ul
          id={listaId}
          role="listbox"
          aria-labelledby="unidade"
          tabIndex={-1}
          onKeyDown={lidarComTecladoNaLista}
          className="absolute top-full z-20 w-full overflow-hidden rounded-b-lg border border-t-0 border-gray-200 bg-white shadow-lg"
        >
          {opcoes.map((opcao, indice) => {
            const selecionada = opcao === valor
            const destacada = indice === indiceDestacado

            return (
              <li
                key={opcao}
                role="option"
                aria-selected={selecionada}
              >
                <button
                  type="button"
                  onMouseEnter={() => setIndiceDestacado(indice)}
                  onClick={() => selecionar(opcao)}
                  className={[
                    'w-full px-5 py-4 text-left font-barlow text-xl text-preto-v1 transition-colors',
                    selecionada
                      ? 'bg-gray-200 font-medium'
                      : destacada
                        ? 'bg-yellow-50'
                        : 'bg-white hover:bg-yellow-50'
                  ].join(' ')}
                >
                  {opcao}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
