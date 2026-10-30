import { ArrowDownRight, ArrowUpRight, DollarSign, Receipt, ShoppingBag, Wallet, type LucideIcon } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import { formatCurrency, formatPercentage, variationTone } from './formatacaoDashboard'
import { CORES_GRAFICO } from './temaGraficos'

type CartoesKpiProps = {
  dashboard: DashboardApi
}

type Cartao = {
  rotulo: string
  valor: string
  variacao: string
  icone: LucideIcon
  tendencia?: number[]
  escuro?: boolean
}

function Sparkline({ cor, id, valores }: { cor: string; id: string; valores: number[] }) {
  if (valores.length < 2 || valores.every((valor) => valor === 0)) return <div className="h-12" />

  return (
    <div aria-hidden className="h-12">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={valores.map((valor) => ({ valor }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={cor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey="valor"
            fill={`url(#${id})`}
            isAnimationActive={false}
            stroke={cor}
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function CartoesKpi({ dashboard }: CartoesKpiProps) {
  const serie = dashboard.vendas_por_periodo
  const { kpis } = dashboard

  const cartoes: Cartao[] = [
    {
      rotulo: 'Receita bruta',
      valor: formatCurrency(kpis.receita_bruta),
      variacao: kpis.variacao_receita_bruta,
      icone: DollarSign,
      tendencia: serie.map((ponto) => Number(ponto.receita_bruta)),
      escuro: true,
    },
    {
      rotulo: 'Lucro líquido',
      valor: formatCurrency(kpis.lucro_liquido),
      variacao: kpis.variacao_lucro_liquido,
      icone: Wallet,
    },
    {
      rotulo: 'Ticket médio',
      valor: formatCurrency(kpis.ticket_medio),
      variacao: kpis.variacao_ticket_medio,
      icone: Receipt,
      tendencia: serie.map((ponto) => (ponto.total_pedidos ? Number(ponto.receita_bruta) / ponto.total_pedidos : 0)),
    },
    {
      rotulo: 'Total de pedidos',
      valor: kpis.total_pedidos.toLocaleString('pt-BR'),
      variacao: kpis.variacao_total_pedidos,
      icone: ShoppingBag,
      tendencia: serie.map((ponto) => ponto.total_pedidos),
    },
  ]

  return (
    <>
      {cartoes.map((cartao, index) => {
        const negativo = variationTone(cartao.variacao) === 'negative'
        const Seta = negativo ? ArrowDownRight : ArrowUpRight
        const Icone = cartao.icone

        return (
          <article
            className={`@container flex min-h-[176px] flex-col rounded-xl p-5 shadow-sm ${
 cartao.escuro ? 'bg-[#111111] text-white' : 'border border-[#d8e1ed] bg-white'
 }`}
            key={cartao.rotulo}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-extrabold uppercase tracking-[0.12em] ${
 cartao.escuro ? 'text-white/70' : 'text-[#7d8ea4]'
 }`}
              >
                {cartao.rotulo}
              </span>
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
 cartao.escuro ? 'bg-[#ffcc00] text-black' : 'bg-[#fff6cc] text-[#8a6f00]'
 }`}
              >
                <Icone size={20} strokeWidth={2.5} />
              </span>
            </div>

            {/* cqw = % da largura do card: o valor cresce com o card sem nunca sair dele. */}
            <strong
              className={`mt-2 block truncate text-[clamp(1.75rem,11cqw,2.75rem)] leading-tight font-black tracking-tight ${
 cartao.escuro ? 'text-[#ffcc00]' : 'text-[#223149]'
 }`}
              title={cartao.valor}
            >
              {cartao.valor}
            </strong>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <b
                className={`inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-sm font-black ${
 negativo ? 'bg-[#ffe0e4] text-[#b3141c]' : 'bg-[#d8fff4] text-[#06705a]'
 }`}
              >
                <Seta size={15} strokeWidth={3} />
                {formatPercentage(cartao.variacao)}
              </b>
              <small className={`text-sm font-bold ${cartao.escuro ? 'text-white/60' : 'text-[#8799af]'}`}>
                vs. período anterior
              </small>
            </div>

            <div className="mt-auto pt-3">
              {cartao.tendencia ? (
                <Sparkline
                  cor={cartao.escuro ? '#ffcc00' : CORES_GRAFICO.destaque}
                  id={`sparkline-kpi-${index}`}
                  valores={cartao.tendencia}
                />
              ) : (
                <div className="h-12" />
              )}
            </div>
          </article>
        )
      })}
    </>
  )
}
