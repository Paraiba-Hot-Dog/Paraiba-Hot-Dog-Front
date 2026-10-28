import { useCallback, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useFecharAoClicarFora } from './useFecharAoClicarFora'

type OpcaoSeletor = {
  valor: string
  rotulo: string
}

type SeletorDashboardProps = {
  icone?: ReactNode
  opcoes: OpcaoSeletor[]
  rotuloAcessivel: string
  valor: string
  onChange: (valor: string) => void
}

/** Dropdown no padrão do SeletorUnidade do painel, no tamanho dos campos da dashboard. */
export default function SeletorDashboard({ icone, opcoes, rotuloAcessivel, valor, onChange }: SeletorDashboardProps) {
  const [aberto, setAberto] = useState(false)
  const [indiceDestacado, setIndiceDestacado] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  const listaId = useId()
  const indiceSelecionado = Math.max(
    opcoes.findIndex((opcao) => opcao.valor === valor),
    0,
  )
  const fechar = useCallback(() => setAberto(false), [])

  useFecharAoClicarFora(aberto, containerRef, fechar)

  function abrir() {
    setIndiceDestacado(indiceSelecionado)
    setAberto(true)
    requestAnimationFrame(() => listaRef.current?.focus())
  }

  function selecionar(opcao: OpcaoSeletor) {
    onChange(opcao.valor)
    setAberto(false)
  }

  function teclarNoBotao(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      abrir()
    }
  }

  function teclarNaLista(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndiceDestacado((atual) => Math.min(atual + 1, opcoes.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndiceDestacado((atual) => Math.max(atual - 1, 0))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selecionar(opcoes[indiceDestacado])
    } else if (event.key === 'Tab') {
      setAberto(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls={listaId}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        aria-label={rotuloAcessivel}
        className={`flex h-12 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left transition-colors ${
 aberto ? 'border-[#1597ff] ring-3 ring-[#1597ff]/15' : 'border-[#d8e1ed] hover:border-[#b9c6d6]'
 }`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclarNoBotao}
        type="button"
      >
        {icone}
        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#172033]">
          {opcoes[indiceSelecionado]?.rotulo}
        </span>
        <ChevronDown
          aria-hidden
          className={`shrink-0 text-[#9badc1] transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {aberto && (
        <ul
          aria-activedescendant={`${listaId}-${indiceDestacado}`}
          className="absolute top-[calc(100%+6px)] z-30 m-0 max-h-72 w-full list-none overflow-auto rounded-xl border border-[#d8e1ed] bg-white p-1.5 shadow-lg outline-none"
          id={listaId}
          onKeyDown={teclarNaLista}
          ref={listaRef}
          role="listbox"
          tabIndex={-1}
        >
          {opcoes.map((opcao, indice) => {
            const selecionada = indice === indiceSelecionado
            const destacada = indice === indiceDestacado

            return (
              <li
                aria-selected={selecionada}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
 destacada ? 'bg-yellow-50' : ''
 } ${selecionada ? 'font-black text-[#172033]' : 'font-semibold text-[#3a4a60]'}`}
                id={`${listaId}-${indice}`}
                key={opcao.valor}
                onClick={() => selecionar(opcao)}
                onMouseEnter={() => setIndiceDestacado(indice)}
                role="option"
              >
                <span className="truncate">{opcao.rotulo}</span>
                {selecionada && <Check aria-hidden className="shrink-0 text-[#e0a800]" size={16} strokeWidth={3} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
