import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { getDashboard, getDashboardPdf, type DashboardApi } from '../../servicos/dashboardApi'
import ControlesDashboard from './ControlesDashboard'

type KpiTone = 'positive' | 'negative'

const mixColors = ['#ffcc00', '#d71920', '#9ba9b8']

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
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatPercentage(value: string | number) {
  const numberValue = Number(value)
  const sign = numberValue > 0 ? '+' : ''

  return `${sign}${numberValue.toLocaleString('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 1,
  })}%`
}

function variationTone(value: string | number): KpiTone {
  return Number(value) < 0 ? 'negative' : 'positive'
}

function sanitizeYear(year: string) {
  const cleanedYear = year.replace(/\D/g, '').slice(0, 4)

  return cleanedYear.length === 4 ? cleanedYear : ''
}

function downloadBlob(blob: Blob, filename: string) {
  const fileUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = fileUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(fileUrl)
}

function escapePdfText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function createLocalDashboardPdf(dashboard: DashboardApi, year?: string) {
  const lines = [
    'Relatorio BI - Paraiba Hot Dog',
    `Ano: ${year || 'Todos'}`,
    `Receita bruta: ${formatCurrency(dashboard.kpis.receita_bruta)}`,
    `Lucro liquido: ${formatCurrency(dashboard.kpis.lucro_liquido)}`,
    `Ticket medio: ${formatCurrency(dashboard.kpis.ticket_medio)}`,
    `Total de pedidos: ${dashboard.kpis.total_pedidos}`,
    `Vendas totais: ${formatCurrency(dashboard.vendas_totais)}`,
    '',
    'Top produtos:',
    ...(dashboard.top_produtos.length
      ? dashboard.top_produtos.map(
          (product) =>
            `${product.rank}. ${product.nome} - ${product.quantidade} un. - ${formatCurrency(product.receita)}`,
        )
      : ['Nenhum produto vendido no periodo.']),
  ]

  const content = lines.map((line, index) => `BT /F1 12 Tf 48 ${792 - 64 - index * 18} Td (${escapePdfText(line)}) Tj ET`).join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

export default function Dashboard() {
  const currentYear = new Date().getFullYear()
  const [dashboard, setDashboard] = useState<DashboardApi>(emptyDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState(String(currentYear))
  const [monthFilter, setMonthFilter] = useState('')
  const [fechamentoMesFilter, setFechamentoMesFilter] = useState(false)
  const [appliedYear, setAppliedYear] = useState(String(currentYear))
  const [appliedMonth, setAppliedMonth] = useState('')
  const [appliedFechamento, setAppliedFechamento] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError(null)

        setDashboard(await getDashboard(appliedYear, appliedMonth, appliedFechamento, controller.signal))
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setDashboard(emptyDashboard)
        setError(requestError instanceof Error ? requestError.message : 'Erro inesperado ao carregar a dashboard.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [appliedYear, appliedMonth, appliedFechamento])

  async function exportDashboardPdf() {
    try {
      setIsExporting(true)
      setError(null)

      const response = await getDashboardPdf(appliedYear)
      const pdfBlob = response.ok ? await response.blob() : createLocalDashboardPdf(dashboard, appliedYear)
      downloadBlob(pdfBlob, `relatorio-bi-${appliedYear || 'todos'}.pdf`)
    } catch {
      downloadBlob(createLocalDashboardPdf(dashboard, appliedYear), `relatorio-bi-${appliedYear || 'todos'}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  function applyFilters() {
    setAppliedFechamento(fechamentoMesFilter)
    if (fechamentoMesFilter) {
      setAppliedYear('')
      setAppliedMonth('')
    } else {
      setAppliedYear(sanitizeYear(yearFilter))
      setAppliedMonth(monthFilter)
    }
  }

  const kpis = [
    {
      label: 'Receita Bruta',
      value: formatCurrency(dashboard.kpis.receita_bruta),
      change: formatPercentage(dashboard.kpis.variacao_receita_bruta),
      tone: variationTone(dashboard.kpis.variacao_receita_bruta),
      featured: true,
    },
    {
      label: 'Lucro líquido',
      value: formatCurrency(dashboard.kpis.lucro_liquido),
      change: formatPercentage(dashboard.kpis.variacao_lucro_liquido),
      tone: variationTone(dashboard.kpis.variacao_lucro_liquido),
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(dashboard.kpis.ticket_medio),
      change: formatPercentage(dashboard.kpis.variacao_ticket_medio),
      tone: variationTone(dashboard.kpis.variacao_ticket_medio),
    },
  ]

  const maxSalesByHour = useMemo(
    () => Math.max(...dashboard.vendas_por_hora.map((sale) => sale.quantidade), 1),
    [dashboard.vendas_por_hora],
  )
  const mixPrincipal = dashboard.mix_produtos[0]?.percentual ?? '0'

  return (
    <>
      <BarraDeNavegacaoAdmin />

      <main
        className={`${CLASSE_OFFSET_BARRA_ADMIN} min-h-screen overflow-x-hidden bg-[#edf2f8] text-[#243247]`}
      >
        <section className="min-h-[calc(100vh-4rem)] w-full bg-[#edf2f8]" aria-label="Dashboard BI Paraiba Hot Dog">
          <div className="min-h-[calc(100vh-4rem)] px-[6vw] py-7 max-[900px]:px-3.5 max-[900px]:py-4">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7d8ea4] max-[900px]:text-xs sm:text-sm">
                Tela do BI
              </span>
              <h1 className="m-0 font-barlow-condensed text-3xl font-black uppercase tracking-wide text-[#172033] sm:text-4xl xl:text-5xl">
                Resumo operacional
              </h1>
            </div>

            {(isLoading || error) && (
              <div
                className={`mb-3 rounded border px-3 py-2.5 text-xs font-extrabold ${
                  error
                    ? 'border-[#f4a5ad] bg-[#ffe4e7] text-[#8a1018]'
                    : 'border-[#ffdb38] bg-[#fff1a6] text-[#604f00]'
                }`}
              >
                {error ?? 'Carregando indicadores da API...'}
              </div>
            )}

            <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principais">
              {kpis.map((kpi) => (
                <article
                  className={`min-h-[108px] rounded-xl border bg-white p-4 shadow-sm ${
                    kpi.featured ? 'border-[3px] border-[#1597ff]' : 'border-[#d8e1ed]'
                  }`}
                  key={kpi.label}
                >
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8799af] max-[900px]:text-sm sm:text-sm">
                    {kpi.label}
                  </span>
                  <strong className="block text-2xl font-black tracking-tight text-[#223149] max-[900px]:text-[2.05rem] sm:text-[1.9rem]">
                    {kpi.value}
                  </strong>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <b
                      className={`rounded px-1.5 py-1 text-[11px] font-black max-[900px]:text-xs ${
                        kpi.tone === 'negative' ? 'bg-[#ffe0e4] text-[#d71920]' : 'bg-[#d8fff4] text-[#078669]'
                      }`}
                    >
                      {kpi.change}
                    </b>
                    <small className="text-[11px] font-bold text-[#9cadbf] max-[900px]:text-xs">
                      vs. mês passado
                    </small>
                  </div>
                </article>
              ))}

              <article className="min-h-[98px] rounded-md border border-[#ffcc00] bg-[#ffcc00] p-3.5">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#725d00] max-[900px]:text-sm">
                  Total de Pedidos
                </span>
                <strong className="block text-xl font-black text-[#223149]">{dashboard.kpis.total_pedidos}</strong>
                <div className="mt-3 flex items-center gap-2">
                  <b className="rounded bg-black px-1.5 py-1 text-[11px] font-black text-white max-[900px]:text-xs">
                    {formatPercentage(dashboard.kpis.variacao_total_pedidos)}
                  </b>
                  <small className="text-[11px] font-bold text-[#725d00] max-[900px]:text-xs">
                    vs. mês passado
                  </small>
                </div>
              </article>
            </section>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="grid gap-3">
                <article className="min-h-[204px] rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
                  <h2 className="m-0 text-base font-black text-[#314259] max-[900px]:text-lg sm:text-lg">
                    Volume de vendas por hora
                  </h2>
                  <div className="mt-5 flex h-[122px] items-end gap-3 overflow-x-auto pr-3 max-[900px]:gap-2" aria-label="Grafico de volume de vendas por hora">
                    {dashboard.vendas_por_hora.map((sale) => (
                      <div className="flex h-full w-7 shrink-0 flex-col items-center justify-end gap-2 text-[10px] font-extrabold text-[#a1afc0] max-[900px]:text-xs" key={sale.hora}>
                        <div
                          className={`min-h-[18px] w-full rounded-[5px] ${
                            sale.destaque ? 'bg-[#ffcc00]' : 'bg-[#dde4ee]'
                          }`}
                          title={`${sale.hora}: ${sale.quantidade} vendas`}
                          style={{ height: `${Math.max((sale.quantidade / maxSalesByHour) * 88, 10)}%` }}
                        />
                        <span>{sale.hora}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ml-1.5 flex gap-7 text-[11px] font-bold text-[#9caabd] max-[900px]:text-xs">
                    <span>Pico do almoço: 13h</span>
                    <span>Pico da janta: 19h</span>
                  </div>
                </article>

                <article className="min-h-[304px] rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
                  <h2 className="m-0 text-base font-black text-[#314259] max-[900px]:text-lg sm:text-lg">
                    Top 10 produtos mais vendidos
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="mt-3.5 w-full min-w-[760px] border-collapse text-xs max-[900px]:text-sm sm:text-sm">
                      <thead>
                        <tr>
                          <th className="border-b border-[#edf1f6] py-3 text-left font-black text-[#9badc1]">Rank</th>
                          <th className="border-b border-[#edf1f6] py-3 text-left font-black text-[#9badc1]">Produto</th>
                          <th className="border-b border-[#edf1f6] py-3 text-left font-black text-[#9badc1]">Qtd.</th>
                          <th className="border-b border-[#edf1f6] py-3 text-left font-black text-[#9badc1]">Receita</th>
                          <th className="border-b border-[#edf1f6] py-3 text-left font-black text-[#9badc1]">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.top_produtos.map((product) => (
                          <tr key={product.produto_id}>
                            <td className="w-16 border-b border-[#edf1f6] py-3 font-black text-[#8a6f00]">
                              #{String(product.rank).padStart(2, '0')}
                            </td>
                            <td className="border-b border-[#edf1f6] py-3 font-black text-[#243349]">{product.nome}</td>
                            <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">{product.quantidade} un.</td>
                            <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">{formatCurrency(product.receita)}</td>
                            <td
                              className={`border-b border-[#edf1f6] py-3 font-black ${
                                variationTone(product.variacao) === 'negative' ? 'text-[#d71920]' : 'text-[#008768]'
                              }`}
                            >
                              {formatPercentage(product.variacao)}
                            </td>
                          </tr>
                        ))}
                        {!dashboard.top_produtos.length && (
                          <tr>
                            <td colSpan={5} className="h-20 border-b border-[#edf1f6] text-center text-sm font-bold text-[#53657a] max-[900px]:text-base">
                              Nenhum produto vendido no período.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

              </section>

              <aside className="grid gap-3 self-start" aria-label="Resumo lateral">
                <article className="min-h-[204px] rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
                  <h2 className="m-0 text-base font-black text-[#314259] max-[900px]:text-lg sm:text-lg">
                    Mix de produtos
                  </h2>
                  <div
                    className="relative mx-auto mt-4 mb-3 grid h-[104px] w-[104px] place-items-center content-center rounded-full after:absolute after:h-[60px] after:w-[60px] after:rounded-full after:bg-[#f8fbff]"
                    aria-label={`${formatPercentage(mixPrincipal)} do produto principal`}
                    style={
                      {
                        background: `conic-gradient(#ffcc00 0 ${Number(mixPrincipal)}%, #ffffff ${Number(mixPrincipal)}% 100%)`,
                      } as CSSProperties
                    }
                  >
                    <span className="relative z-10 text-lg font-black text-[#1d2b40] max-[900px]:text-xl">
                      {formatPercentage(mixPrincipal).replace('+', '')}
                    </span>
                    <small className="relative z-10 text-[10px] font-extrabold text-[#9badc1] max-[900px]:text-xs">
                      principal
                    </small>
                  </div>

                  <div className="grid gap-1.5">
                    {dashboard.mix_produtos.map((item, index) => (
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-[#7d8ea4] max-[900px]:text-xs sm:text-[11px]" key={item.nome}>
                        <span className="flex items-center gap-2">
                          <i className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: mixColors[index] ?? '#9ba9b8' }} />
                          {item.nome}
                        </span>
                        <strong className="text-[#1e2d42]">{formatPercentage(item.percentual).replace('+', '')}</strong>
                      </div>
                    ))}
                    {!dashboard.mix_produtos.length && (
                      <span className="text-[10px] font-extrabold text-[#9badc1] max-[900px]:text-xs">
                        Sem vendas registradas
                      </span>
                    )}
                  </div>
                </article>

                <article className="min-h-[104px] rounded-xl bg-[#ffcc00] p-4 shadow-sm">
                  <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-[#796300] max-[900px]:text-xs">
                    Vendas totais
                  </span>
                  <strong className="my-2 block text-[22px] font-black text-black">{formatCurrency(dashboard.vendas_totais)}</strong>
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-[#796300] max-[900px]:text-xs">
                    <small>{dashboard.pedidos_registrados} pedidos registrados</small>
                    <b className="rounded bg-black px-2.5 py-1.5 text-[8px] uppercase text-white">Live</b>
                  </div>
                </article>

                <article className="min-h-[188px] rounded-xl bg-[#c91521] p-4 text-white shadow-sm">
                  <span className="block w-36 rounded bg-white/20 px-2.5 py-1.5 text-[11px] font-black uppercase max-[900px]:text-xs">
                    Destaque do portfólio
                  </span>
                  <h2 className="mt-3.5 mb-1 text-lg font-black text-white max-[900px]:text-xl">
                    {dashboard.destaque?.nome ?? 'Sem vendas'}
                  </h2>
                  <p className="mb-6 text-[11px] font-bold text-white/70 max-[900px]:text-xs">
                    Produto com maior receita registrada.
                  </p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <small className="mb-2 block text-[10px] font-extrabold text-white/70 max-[900px]:text-xs">
                        Margem de ganho
                      </small>
                      <strong className="text-[26px] font-black">{formatPercentage(dashboard.destaque?.margem_ganho ?? 0).replace('+', '')}</strong>
                    </div>
                    <div>
                      <small className="mb-2 block text-[10px] font-extrabold text-white/70 max-[900px]:text-xs">
                        Margem líquida
                      </small>
                      <strong className="text-[26px] font-black">{formatPercentage(dashboard.destaque?.margem_liquida ?? 0).replace('+', '')}</strong>
                    </div>
                  </div>
                </article>
              </aside>
            </div>

            <ControlesDashboard
              ano={yearFilter}
              anoAtual={currentYear}
              exportando={isExporting}
              fechamentoMes={fechamentoMesFilter}
              filtrando={isLoading}
              mes={monthFilter}
              onAnoChange={setYearFilter}
              onExportarPdf={exportDashboardPdf}
              onFechamentoMesChange={setFechamentoMesFilter}
              onFiltrar={applyFilters}
              onMesChange={setMonthFilter}
            />
          </div>
        </section>
      </main>
    </>
  )
}
