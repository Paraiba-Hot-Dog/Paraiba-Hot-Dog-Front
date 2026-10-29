import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useFiltroAquisicao } from '../../../hooks/useFiltroAquisicao'
import {
  CANAIS_AQUISICAO,
  PERIODO_AQUISICAO_PADRAO,
  PERIODOS_AQUISICAO,
  type CanalAquisicao,
  type FiltroAquisicao,
  type PeriodoAquisicao,
} from '../../../servicos/aquisicaoApi'
import { listarUnidades, type Unidade } from '../../../servicos/api'
import { ROTULOS_CANAL, ROTULOS_PERIODO, contarFiltrosAtivos } from './formatacaoAquisicao'
import { descreverRecorte, nomeDaUnidade, resumirFiltrosAtivos } from './resumosAnaliseAquisicao'

const FILTRO_PADRAO: FiltroAquisicao = { periodo: PERIODO_AQUISICAO_PADRAO, unidadeId: null, canal: null }

const CLASSE_SELECT =
  'min-h-11 rounded-lg border border-[#d8e1ed] bg-white px-3 text-sm font-semibold text-[#243247] focus-visible:outline-2 focus-visible:outline-[#1597ff]'

const CLASSE_BOTAO_CLARO =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#d8e1ed] bg-white px-5 text-[#243247] hover:border-[#1597ff] focus-visible:outline-2 focus-visible:outline-[#1597ff]'

function useUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    listarUnidades()
      .then((lista) => {
        if (ativo) setUnidades([...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
      })
      .catch(() => {
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [])

  return { unidades, erro }
}

function Campo({ rotulo, children }: { rotulo: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-black text-[#172033] max-[900px]:text-base">
        {rotulo}
      </label>
      {children(id)}
    </div>
  )
}

function OpcoesUnidade({ unidades, unidadeId }: { unidades: Unidade[]; unidadeId: number | null }) {
  const foraDaLista = unidadeId !== null && !unidades.some((unidade) => unidade.id === unidadeId)
  return (
    <>
      <option value="">Todas as unidades</option>
      {unidades.map((unidade) => (
        <option key={unidade.id} value={unidade.id}>
          {unidade.nome}
        </option>
      ))}
      {foraDaLista && <option value={unidadeId}>Unidade #{unidadeId}</option>}
    </>
  )
}

function PainelRecorte({
  filtro,
  unidades,
  erroUnidades,
  aoAplicar,
  aoFechar,
}: {
  filtro: FiltroAquisicao
  unidades: Unidade[]
  erroUnidades: boolean
  aoAplicar: (filtro: FiltroAquisicao) => void
  aoFechar: () => void
}) {
  const [rascunho, setRascunho] = useState(filtro)
  const idTitulo = useId()
  const idDescricao = useId()
  const primeiroCampoRef = useRef<HTMLSelectElement>(null)
  const aoFecharRef = useRef(aoFechar)
  const recorte = descreverRecorte(rascunho, nomeDaUnidade(unidades, rascunho.unidadeId))

  useEffect(() => {
    aoFecharRef.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    primeiroCampoRef.current?.focus()

    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') aoFecharRef.current()
    }
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', fecharComEsc)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', fecharComEsc)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-stretch sm:justify-end"
      onClick={aoFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescricao}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_-8px_24px_rgba(23,32,51,0.18)] sm:my-3 sm:mr-3 sm:max-h-none sm:max-w-[28rem] sm:rounded-2xl"
      >
        <div aria-hidden className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-[#d8e1ed] sm:hidden" />
        <div className="flex items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-6">
          <h2
            id={idTitulo}
            className="m-0 font-barlow-condensed text-3xl font-black text-[#172033]"
          >
            Refinar o recorte
          </h2>
          <button type="button" onClick={aoFechar} className={`${CLASSE_BOTAO_CLARO} shrink-0`}>
            <span className="text-sm font-semibold">Fechar</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-4 sm:px-6">
          <p id={idDescricao} className="m-0 text-sm font-medium text-[#7d8ea4]">
            Selecione um período e explore os recortes disponíveis.
          </p>

          <div className="mt-5 grid gap-5">
            <Campo rotulo="Período">
              {(id) => (
                <select
                  id={id}
                  ref={primeiroCampoRef}
                  value={rascunho.periodo}
                  onChange={(event) =>
                    setRascunho({ ...rascunho, periodo: event.target.value as PeriodoAquisicao })
                  }
                  className={`${CLASSE_SELECT} w-full`}
                >
                  {PERIODOS_AQUISICAO.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {ROTULOS_PERIODO[periodo]}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo rotulo="Unidade">
              {(id) => (
                <>
                  <select
                    id={id}
                    value={rascunho.unidadeId ?? ''}
                    onChange={(event) =>
                      setRascunho({
                        ...rascunho,
                        unidadeId: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                    className={`${CLASSE_SELECT} w-full`}
                  >
                    <OpcoesUnidade unidades={unidades} unidadeId={rascunho.unidadeId} />
                  </select>
                  {erroUnidades && (
                    <small className="text-xs font-bold text-[#8a1018]">
                      Não foi possível carregar a lista de unidades.
                    </small>
                  )}
                </>
              )}
            </Campo>

            <Campo rotulo="Canal">
              {(id) => (
                <select
                  id={id}
                  value={rascunho.canal ?? ''}
                  onChange={(event) =>
                    setRascunho({
                      ...rascunho,
                      canal: (event.target.value || null) as CanalAquisicao | null,
                    })
                  }
                  className={`${CLASSE_SELECT} w-full`}
                >
                  <option value="">Todos os canais</option>
                  {CANAIS_AQUISICAO.map((canal) => (
                    <option key={canal} value={canal}>
                      {ROTULOS_CANAL[canal]}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <div className="rounded-xl border border-[#cfe5fb] bg-[#e6f3ff] p-4" aria-live="polite">
              <strong className="block text-sm font-black text-[#172033]">Seu recorte</strong>
              <ul className="m-0 mt-2 grid list-none gap-2 p-0 text-sm font-medium text-[#243247]">
                {recorte.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 gap-3 border-t border-[#edf1f6] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:border-t-0 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={() => aoAplicar(rascunho)}
            className="min-h-11 w-full rounded-lg bg-[#d71920] px-4 text-white hover:bg-[#b8141a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d71920]"
          >
            <span className="text-sm font-semibold">Aplicar filtros</span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={aoFechar} className={CLASSE_BOTAO_CLARO}>
              <span className="text-sm font-semibold">Cancelar</span>
            </button>
            <button type="button" onClick={() => setRascunho(FILTRO_PADRAO)} className={CLASSE_BOTAO_CLARO}>
              <span className="text-sm font-semibold">Limpar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BotaoLimparFiltros() {
  const { atualizarFiltro } = useFiltroAquisicao()
  return (
    <button type="button" onClick={() => atualizarFiltro(FILTRO_PADRAO)} className={CLASSE_BOTAO_CLARO}>
      <span className="whitespace-nowrap text-sm font-semibold">Limpar filtros</span>
    </button>
  )
}

export default function BarraFiltrosAquisicao() {
  const { filtro, atualizarFiltro } = useFiltroAquisicao()
  const { unidades, erro: erroUnidades } = useUnidades()
  const [painelAberto, setPainelAberto] = useState(false)
  const botaoFiltrosRef = useRef<HTMLButtonElement>(null)
  const idPeriodo = useId()
  const filtrosAtivos = contarFiltrosAtivos(filtro)
  const resumoAtivos = resumirFiltrosAtivos(filtro, nomeDaUnidade(unidades, filtro.unidadeId))

  const fecharPainel = () => {
    setPainelAberto(false)
    botaoFiltrosRef.current?.focus()
  }

  return (
    <section aria-label="Filtros de aquisição" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={idPeriodo} className="sr-only">
          Período
        </label>
        <select
          id={idPeriodo}
          value={filtro.periodo}
          onChange={(event) => atualizarFiltro({ periodo: event.target.value as PeriodoAquisicao })}
          className={`${CLASSE_SELECT} min-w-[13rem] max-sm:flex-1`}
        >
          {PERIODOS_AQUISICAO.map((periodo) => (
            <option key={periodo} value={periodo}>
              {ROTULOS_PERIODO[periodo]}
            </option>
          ))}
        </select>

        <button
          ref={botaoFiltrosRef}
          type="button"
          onClick={() => setPainelAberto(true)}
          aria-haspopup="dialog"
          aria-expanded={painelAberto}
          className={`${CLASSE_BOTAO_CLARO} min-w-[7rem]`}
        >
          <SlidersHorizontal aria-hidden size={16} className="text-[#53657a] sm:hidden" />
          <span className="text-sm font-semibold">Filtros</span>
          {filtrosAtivos > 0 && (
            <span className="rounded-full bg-[#1597ff] px-2 py-0.5 text-xs font-black text-white">
              {filtrosAtivos}
            </span>
          )}
        </button>
      </div>

      {filtrosAtivos > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex min-h-11 w-full min-w-0 items-center rounded-lg bg-[#e6f3ff] pl-3 text-sm font-medium text-[#243247] sm:w-auto sm:max-w-[40rem] sm:min-w-[21rem]">
            <span className="min-w-0 flex-1 truncate">{resumoAtivos}</span>
            <button
              type="button"
              onClick={() => atualizarFiltro({ unidadeId: null, canal: null })}
              aria-label={`Remover filtro ${resumoAtivos}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#243247] hover:text-[#d71920] focus-visible:outline-2 focus-visible:outline-[#1597ff]"
            >
              <X aria-hidden size={14} strokeWidth={3} />
            </button>
          </span>
          <BotaoLimparFiltros />
        </div>
      )}

      {painelAberto && (
        <PainelRecorte
          filtro={filtro}
          unidades={unidades}
          erroUnidades={erroUnidades}
          aoFechar={fecharPainel}
          aoAplicar={(novo) => {
            atualizarFiltro(novo)
            fecharPainel()
          }}
        />
      )}
    </section>
  )
}
