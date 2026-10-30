import { useState } from 'react'
import { ChevronDown, Download, Filter, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import SeletorDashboard from '../../componentes/administrador/dashboard/SeletorDashboard'
import SeletorPeriodo from '../../componentes/administrador/dashboard/SeletorPeriodo'
import {
  ATALHOS_PERIODO,
  atalhoDoIntervalo,
  type AtalhoPeriodo,
} from '../../componentes/administrador/dashboard/periodoDashboard'
import { paraDataIso } from '../../componentes/administrador/dashboard/formatacaoDashboard'
import type { FiltrosDashboardApi } from '../../servicos/dashboardApi'

type ControlesDashboardProps = {
  busca: string
  erro: string | null
  exportando: boolean
  filtrando: boolean
  filtros: FiltrosDashboardApi
  /** Há mudanças nos campos que ainda não foram aplicadas com "Filtrar". */
  pendente: boolean
  resumo: string
  unidades: Array<{ id: number; nome: string }>
  onAtalho: (atalho: AtalhoPeriodo) => void
  onBuscaChange: (busca: string) => void
  onExportarPdf: () => void
  onFiltrar: () => void
  onFiltrosChange: (filtros: Partial<FiltrosDashboardApi>) => void
}

// O index.css aplica `font: inherit` nos botões fora das camadas do Tailwind, o que anula as
// classes de fonte no <button>; por isso o texto dos botões fica num <span> com as classes.
const CLASSE_ROTULO = 'mb-1.5 block text-sm font-bold text-[#7d8ea4]'
const CLASSE_CAIXA =
  'flex h-12 items-center gap-2 rounded-xl border border-[#d8e1ed] bg-white px-3 transition-colors focus-within:border-[#1597ff] focus-within:ring-3 focus-within:ring-[#1597ff]/15'
const CLASSE_INPUT = 'h-full min-w-0 flex-1 bg-transparent text-[15px] font-bold text-[#172033] outline-none'

export default function ControlesDashboard({
  busca,
  erro,
  exportando,
  filtrando,
  filtros,
  pendente,
  resumo,
  unidades,
  onAtalho,
  onBuscaChange,
  onExportarPdf,
  onFiltrar,
  onFiltrosChange,
}: ControlesDashboardProps) {
  const [menuAberto, setMenuAberto] = useState(true)
  const atalhoAtivo = atalhoDoIntervalo(filtros)
  const hoje = paraDataIso(new Date())

  return (
    <section className="mb-5 rounded-2xl border border-[#d8e1ed] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1f6] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#111111] text-[#ffcc00]">
            <SlidersHorizontal size={18} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="m-0 text-xl leading-tight font-black text-[#172033]">Filtros do relatório</h2>
            <p className="m-0 text-base font-semibold text-[#7d8ea4]">{resumo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-controls="painel-controles-dashboard"
            aria-expanded={menuAberto}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#d8e1ed] px-3 text-[#243247] xl:hidden"
            onClick={() => setMenuAberto((valor) => !valor)}
            type="button"
          >
            <span className="text-sm font-bold">{menuAberto ? 'Ocultar' : 'Mostrar'}</span>
            <ChevronDown size={16} className={`transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ffcc00] px-4 text-black shadow-sm transition-colors hover:bg-[#f2c200] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={exportando || filtrando}
            onClick={onExportarPdf}
            type="button"
          >
            <Download size={16} strokeWidth={2.75} />
            <span className="text-base font-black">{exportando ? 'Gerando PDF...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      <div
        className={`${menuAberto ? 'block' : 'hidden'} space-y-4 px-5 py-4 xl:block`}
        id="painel-controles-dashboard"
      >
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div
            aria-label="Atalhos de período"
            className="inline-flex gap-1 rounded-xl bg-[#f1f5fa] p-1"
            role="group"
          >
            {ATALHOS_PERIODO.map((atalho) => {
              const ativo = atalhoAtivo === atalho.id

              return (
                <button
                  aria-pressed={ativo}
                  className={`h-10 shrink-0 rounded-lg px-4 whitespace-nowrap transition-all disabled:cursor-not-allowed ${
                    ativo ? 'bg-white text-[#172033] shadow-sm' : 'text-[#5b6b80] hover:bg-white/60 hover:text-[#172033]'
                  }`}
                  disabled={filtrando}
                  key={atalho.id}
                  onClick={() => onAtalho(atalho.id)}
                  type="button"
                >
                  <span className={`text-base ${ativo ? 'font-black' : 'font-bold'}`}>{atalho.rotulo}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(270px,300px)_minmax(200px,260px)_minmax(220px,1fr)_auto] xl:items-end [&>*]:min-w-0">
          <div>
            <span className={CLASSE_ROTULO}>Período</span>
            <SeletorPeriodo
              dataFim={filtros.dataFim}
              dataInicio={filtros.dataInicio}
              max={hoje}
              onChange={onFiltrosChange}
            />
          </div>

          <div>
            <span className={CLASSE_ROTULO}>Unidade</span>
            <SeletorDashboard
              icone={<MapPin aria-hidden className="shrink-0 text-[#9badc1]" size={18} />}
              onChange={(unidadeId) => onFiltrosChange({ unidadeId })}
              opcoes={[
                { valor: '', rotulo: 'Todas as unidades' },
                ...unidades.map((unidade) => ({ valor: String(unidade.id), rotulo: unidade.nome })),
              ]}
              rotuloAcessivel="Unidade"
              valor={filtros.unidadeId}
            />
          </div>

          <label className="block md:col-span-2 xl:col-span-1">
            <span className={CLASSE_ROTULO}>Pesquisar</span>
            <span className={CLASSE_CAIXA}>
              <Search aria-hidden className="shrink-0 text-[#9badc1]" size={18} />
              <input
                className={`${CLASSE_INPUT} font-semibold placeholder:font-semibold placeholder:text-[#9badc1]`}
                onChange={(e) => onBuscaChange(e.target.value)}
                placeholder="Produto, unidade ou cliente"
                type="search"
                value={busca}
              />
            </span>
          </label>

          <button
            className={`relative inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 transition-colors disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2 xl:col-span-1 ${
              pendente ? 'bg-[#111111] text-white hover:bg-black' : 'bg-[#f1f5fa] text-[#5b6b80] hover:bg-[#e6ecf3]'
            }`}
            disabled={filtrando}
            onClick={onFiltrar}
            type="button"
          >
            <Filter size={16} strokeWidth={2.75} />
            <span className="text-base font-black">{filtrando ? 'Filtrando...' : 'Aplicar filtros'}</span>
            {pendente && !filtrando && (
              <i aria-hidden className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#ffcc00]" />
            )}
          </button>
        </div>

        {erro && (
          <p className="m-0 text-sm font-bold text-[#b3141c]" role="alert">
            {erro}
          </p>
        )}
      </div>
    </section>
  )
}
