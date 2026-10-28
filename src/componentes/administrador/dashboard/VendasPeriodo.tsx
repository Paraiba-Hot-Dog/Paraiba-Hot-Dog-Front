import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import TooltipDashboard from './TooltipDashboard'
import { formatCurrency } from './formatacaoDashboard'
import { rotuloPeriodo } from './periodoDashboard'
import { CORES_GRAFICO, ESTILO_EIXO, formatarMoedaCompacta } from './temaGraficos'

type VendasPeriodoProps = {
  agrupamento: DashboardApi['agrupamento_periodo']
  vendas: DashboardApi['vendas_por_periodo']
}

export default function VendasPeriodo({ agrupamento, vendas }: VendasPeriodoProps) {
  const dados = vendas.map((venda) => ({
    rotulo: rotuloPeriodo(venda.periodo, agrupamento),
    receita: Number(venda.receita_bruta),
    pedidos: venda.total_pedidos,
  }))
  const melhor = dados.reduce<(typeof dados)[number] | null>(
    (atual, ponto) => (ponto.receita > (atual?.receita ?? 0) ? ponto : atual),
    null,
  )
  const unidadeTempo = agrupamento === 'dia' ? 'dia' : 'mês'

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-[#314259]">
          Vendas no período
        </h2>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#9caabd]">
          Receita bruta por {unidadeTempo}
        </span>
      </div>

      {dados.length ? (
        <div className="mt-4 h-[280px]" aria-label={`Grafico de receita bruta por ${unidadeTempo}`}>
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={dados} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradienteVendasPeriodo" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CORES_GRAFICO.destaque} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CORES_GRAFICO.destaque} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CORES_GRAFICO.grade} vertical={false} />
              <XAxis {...ESTILO_EIXO} dataKey="rotulo" interval="preserveStartEnd" minTickGap={18} tickMargin={8} />
              <YAxis {...ESTILO_EIXO} tickFormatter={formatarMoedaCompacta} width={76} />
              <Tooltip
                content={({ active, payload }) => {
                  const ponto = payload?.[0]?.payload as (typeof dados)[number] | undefined
                  if (!active || !ponto) return null

                  return (
                    <TooltipDashboard
                      linhas={[
                        { cor: CORES_GRAFICO.destaque, rotulo: 'Receita', valor: formatCurrency(ponto.receita) },
                        { rotulo: 'Pedidos', valor: ponto.pedidos },
                      ]}
                      titulo={ponto.rotulo}
                    />
                  )
                }}
                cursor={{ stroke: CORES_GRAFICO.eixo, strokeWidth: 1 }}
              />
              <Area
                activeDot={{ r: 5, stroke: CORES_GRAFICO.superficie, strokeWidth: 2 }}
                dataKey="receita"
                fill="url(#gradienteVendasPeriodo)"
                stroke={CORES_GRAFICO.destaque}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                type="monotone"
              />
              {melhor && (
                <ReferenceDot
                  fill={CORES_GRAFICO.destaque}
                  r={5}
                  stroke={CORES_GRAFICO.superficie}
                  strokeWidth={2}
                  x={melhor.rotulo}
                  y={melhor.receita}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 grid h-[280px] place-items-center text-base font-bold text-[#53657a]">
          Nenhuma venda no período.
        </p>
      )}

      <p className="m-0 mt-2 text-sm font-bold text-[#9caabd]">
        {melhor
          ? `Melhor ${unidadeTempo}: ${melhor.rotulo} com ${formatCurrency(melhor.receita)} (${melhor.pedidos} pedidos)`
          : 'Sem vendas para destacar.'}
      </p>
    </article>
  )
}
