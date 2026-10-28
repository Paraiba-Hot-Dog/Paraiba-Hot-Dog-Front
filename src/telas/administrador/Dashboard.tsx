import { useEffect, useRef, useState } from 'react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import CartoesKpi from '../../componentes/administrador/dashboard/CartoesKpi'
import DesempenhoUnidades from '../../componentes/administrador/dashboard/DesempenhoUnidades'
import DestaquePortfolio from '../../componentes/administrador/dashboard/DestaquePortfolio'
import FidelidadeDashboard from '../../componentes/administrador/dashboard/FidelidadeDashboard'
import MixProdutos from '../../componentes/administrador/dashboard/MixProdutos'
import TopProdutos from '../../componentes/administrador/dashboard/TopProdutos'
import VendasPeriodo from '../../componentes/administrador/dashboard/VendasPeriodo'
import VendasPorHora from '../../componentes/administrador/dashboard/VendasPorHora'
import {
  descreverIntervalo,
  detalharPeriodo,
  nomearPeriodo,
  intervaloDoAtalho,
  validarIntervalo,
  type AtalhoPeriodo,
} from '../../componentes/administrador/dashboard/periodoDashboard'
import { getDashboard, type DashboardApi, type FiltrosDashboardApi } from '../../servicos/dashboardApi'
import { listarUnidadesApi } from '../../servicos/unidadesApi'
import ControlesDashboard from './ControlesDashboard'

// Cada elemento marcado vira um bloco inteiro do PDF exportado, na ordem da tela.
const ATRIBUTO_BLOCO_PDF = 'data-pdf-bloco'
const blocoPdf = { [ATRIBUTO_BLOCO_PDF]: '' }

const emptyDashboard: DashboardApi = {
  kpis: {
    receita_bruta: '0.00',
    lucro_liquido: '0.00',
    ticket_medio: '0.00',
    total_pedidos: 0,
    variacao_receita_bruta: '0.00',
    variacao_lucro_liquido: '0.00',
    variacao_ticket_medio: '0.00',
    variacao_total_pedidos: '0.00',
  },
  vendas_por_hora: Array.from({ length: 12 }, (_, index) => ({
    hora: `${String(index + 10).padStart(2, '0')}h`,
    quantidade: 0,
    destaque: false,
  })),
  top_produtos: [],
  mix_produtos: [],
  vendas_totais: '0.00',
  pedidos_registrados: 0,
  destaque: null,
  agrupamento_periodo: 'dia',
  vendas_por_periodo: [],
  desempenho_unidades: [],
  fidelidade: null,
}

const emptyFidelidade: NonNullable<DashboardApi['fidelidade']> = {
  pedidos_com_cliente: 0,
  percentual_pedidos_com_cliente: '0.00',
  clientes_unicos: 0,
  pontos_resgatados: 0,
  descontos_concedidos: '0.00',
  ticket_medio_com_cliente: '0.00',
  ticket_medio_sem_cliente: '0.00',
  top_clientes: [],
}

function slug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardApi>(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [erroFiltro, setErroFiltro] = useState<string | null>(null)
  const [unidades, setUnidades] = useState<Array<{ id: number; nome: string }>>([])
  const [rascunhoFiltros, setRascunhoFiltros] = useState<FiltrosDashboardApi>(() => ({
    ...intervaloDoAtalho('mes-atual'),
    unidadeId: '',
  }))
  const [filtros, setFiltros] = useState<FiltrosDashboardApi>(rascunhoFiltros)
  const [busca, setBusca] = useState('')
  const conteudoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listarUnidadesApi()
      .then(setUnidades)
      .catch(() => setUnidades([]))
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError(null)

        setDashboard(await getDashboard(filtros, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setDashboard(emptyDashboard)
        setError(requestError instanceof Error ? requestError.message : 'Erro inesperado ao carregar a dashboard.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [filtros])

  const nomeUnidade =
    unidades.find((unidade) => String(unidade.id) === filtros.unidadeId)?.nome ??
    (filtros.unidadeId ? `Unidade ${filtros.unidadeId}` : 'Todas as unidades')

  function aplicarFiltros(novosFiltros: FiltrosDashboardApi) {
    const erroValidacao = validarIntervalo(novosFiltros)
    setErroFiltro(erroValidacao)
    if (!erroValidacao) setFiltros(novosFiltros)
  }

  function aplicarAtalho(atalho: AtalhoPeriodo) {
    const novosFiltros = { ...rascunhoFiltros, ...intervaloDoAtalho(atalho) }
    setRascunhoFiltros(novosFiltros)
    aplicarFiltros(novosFiltros)
  }

  async function exportDashboardPdf() {
    if (!conteudoRef.current) return

    try {
      setIsExporting(true)
      setError(null)

      // Carregado sob demanda: jsPDF e html2canvas só são baixados ao exportar.
      const { exportarDashboardPdf } = await import('../../componentes/administrador/dashboard/exportarDashboardPdf')
      const nomePeriodo = nomearPeriodo(filtros)
      await exportarDashboardPdf({
        blocos: Array.from(conteudoRef.current.querySelectorAll<HTMLElement>(`[${ATRIBUTO_BLOCO_PDF}]`)),
        busca,
        nomeArquivo: `relatorio-${slug(nomePeriodo.replace(/\//g, '-'))}-${slug(nomeUnidade)}.pdf`,
        periodo: detalharPeriodo(filtros),
        titulo: `Relatório de ${nomePeriodo}`,
        unidade: nomeUnidade,
      })
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Nao foi possivel gerar o PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <BarraDeNavegacaoAdmin />

      <main
        className={`${CLASSE_OFFSET_BARRA_ADMIN} min-h-screen overflow-x-hidden bg-[#edf2f8] text-[#243247]`}
      >
        <section className="min-h-[calc(100vh-4rem)] w-full bg-[#edf2f8]" aria-label="Dashboard BI Paraiba Hot Dog">
          <div className="min-h-[calc(100vh-4rem)] px-[6vw] py-7 max-[900px]:px-3.5 max-[900px]:py-4">
            <div className="mb-5">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7d8ea4] max-[900px]:text-xs sm:text-sm">
                Tela do BI
              </span>
              <h1 className="m-0 font-barlow-condensed text-3xl font-black uppercase tracking-wide text-[#172033] sm:text-4xl xl:text-5xl">
                Resumo operacional
              </h1>
            </div>

            <ControlesDashboard
              busca={busca}
              erro={erroFiltro}
              exportando={isExporting}
              filtrando={isLoading}
              filtros={rascunhoFiltros}
              pendente={
                rascunhoFiltros.dataInicio !== filtros.dataInicio ||
                rascunhoFiltros.dataFim !== filtros.dataFim ||
                rascunhoFiltros.unidadeId !== filtros.unidadeId
              }
              resumo={`${isLoading ? 'Carregando' : 'Exibindo'} ${descreverIntervalo(filtros)} • ${nomeUnidade}`}
              unidades={unidades}
              onAtalho={aplicarAtalho}
              onBuscaChange={setBusca}
              onExportarPdf={exportDashboardPdf}
              onFiltrar={() => aplicarFiltros(rascunhoFiltros)}
              onFiltrosChange={(parcial) => setRascunhoFiltros((atual) => ({ ...atual, ...parcial }))}
            />

            {error && (
              <div className="mb-3 rounded border border-[#f4a5ad] bg-[#ffe4e7] px-3 py-2.5 text-xs font-extrabold text-[#8a1018]">
                {error}
              </div>
            )}

            <div
              className={`grid gap-3 transition-opacity [&>*]:min-w-0 ${isLoading ? 'opacity-60' : 'opacity-100'}`}
              aria-busy={isLoading}
              ref={conteudoRef}
            >
              <section
                {...blocoPdf}
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0"
                aria-label="Indicadores principais"
              >
                <CartoesKpi dashboard={dashboard} />
              </section>

              <div {...blocoPdf} className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
                <VendasPeriodo agrupamento={dashboard.agrupamento_periodo} vendas={dashboard.vendas_por_periodo} />
                <MixProdutos mix={dashboard.mix_produtos} />
              </div>

              <div {...blocoPdf} className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
                <VendasPorHora vendas={dashboard.vendas_por_hora} />
                <DestaquePortfolio destaque={dashboard.destaque} />
              </div>

              <div {...blocoPdf}>
                <TopProdutos busca={busca} produtos={dashboard.top_produtos} />
              </div>

              <div {...blocoPdf}>
                <DesempenhoUnidades busca={busca} unidades={dashboard.desempenho_unidades} />
              </div>

              <div {...blocoPdf}>
                <FidelidadeDashboard busca={busca} fidelidade={dashboard.fidelidade ?? emptyFidelidade} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
