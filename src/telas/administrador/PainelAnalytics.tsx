import { useId } from 'react'
import { useQueryParams } from '../../hooks/useQueryParams'
import Dashboard from './Dashboard'
import PainelAquisicao from './PainelAquisicao'

type AbaAnalytics = 'resumo' | 'aquisicao'

const ABAS: Array<{ id: AbaAnalytics; rotulo: string }> = [
  { id: 'resumo', rotulo: 'Resumo operacional' },
  { id: 'aquisicao', rotulo: 'Aquisição e conversão' },
]

/** Altura da barra de abas; o espacador abaixo compensa a barra fixa. */
const CLASSE_ALTURA_ABAS = 'h-12'

function lerAba(valor: string | null): AbaAnalytics {
  return valor === 'aquisicao' ? 'aquisicao' : 'resumo'
}

export default function PainelAnalytics() {
  const [params, atualizarQuery] = useQueryParams()
  const abaAtiva = lerAba(params.get('aba'))
  const idBase = useId()

  function selecionarAba(aba: AbaAnalytics) {
    if (aba === abaAtiva) return
    atualizarQuery({ aba: aba === 'resumo' ? null : aba }, 'push')
  }

  function navegarPorTeclado(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const indice = ABAS.findIndex((aba) => aba.id === abaAtiva)
    const proxima = ABAS[(indice + (event.key === 'ArrowRight' ? 1 : -1) + ABAS.length) % ABAS.length]
    selecionarAba(proxima.id)
    document.getElementById(`${idBase}-aba-${proxima.id}`)?.focus()
  }

  return (
    <>
      <nav
        className={`fixed top-16 left-0 z-40 flex w-full items-center border-b border-[#d8e1ed] bg-white px-[6vw] shadow-sm max-[900px]:px-3.5 ${CLASSE_ALTURA_ABAS}`}
        aria-label="Seções do BI"
      >
        <div role="tablist" aria-label="Seções do BI" className="flex h-full min-w-0 gap-1 overflow-x-auto">
          {ABAS.map((aba) => {
            const ativa = aba.id === abaAtiva
            return (
              <button
                key={aba.id}
                id={`${idBase}-aba-${aba.id}`}
                type="button"
                role="tab"
                aria-selected={ativa}
                aria-controls={`${idBase}-painel`}
                tabIndex={ativa ? 0 : -1}
                onClick={() => selecionarAba(aba.id)}
                onKeyDown={navegarPorTeclado}
                className={`flex h-full min-h-11 shrink-0 items-center whitespace-nowrap border-b-[3px] px-3 font-barlow-condensed text-base font-black uppercase tracking-wide transition-colors sm:px-4 sm:text-lg ${
                  ativa
                    ? 'border-[#1597ff] text-[#172033]'
                    : 'border-transparent text-[#7d8ea4] hover:text-[#172033]'
                }`}
              >
                {aba.rotulo}
              </button>
            )
          })}
        </div>
      </nav>

      <div aria-hidden className={CLASSE_ALTURA_ABAS} />

      <div
        id={`${idBase}-painel`}
        role="tabpanel"
        aria-labelledby={`${idBase}-aba-${abaAtiva}`}
      >
        {abaAtiva === 'resumo' ? <Dashboard /> : <PainelAquisicao />}
      </div>
    </>
  )
}
