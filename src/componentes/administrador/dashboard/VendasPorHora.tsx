import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import TooltipDashboard from './TooltipDashboard'
import { CORES_GRAFICO, ESTILO_EIXO } from './temaGraficos'

type VendasPorHoraProps = {
  vendas: DashboardApi['vendas_por_hora']
}

/** Hora com mais itens vendidos dentro da faixa [inicio, fim]. */
function horaDePico(vendas: DashboardApi['vendas_por_hora'], inicio: number, fim: number) {
  const pico = vendas
    .filter((venda) => {
      const hora = Number.parseInt(venda.hora, 10)
      return hora >= inicio && hora <= fim && venda.quantidade > 0
    })
    .sort((a, b) => b.quantidade - a.quantidade)[0]

  return pico?.hora ?? '—'
}

export default function VendasPorHora({ vendas }: VendasPorHoraProps) {
  const picos = [
    { rotulo: 'Pico do almoço', hora: horaDePico(vendas, 11, 15) },
    { rotulo: 'Pico da janta', hora: horaDePico(vendas, 17, 23) },
  ]

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-[#314259]">
          Volume de vendas por hora
        </h2>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#9caabd]">
          Itens vendidos
        </span>
      </div>

      <div className="mt-4 h-[230px]" aria-label="Grafico de volume de vendas por hora">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={vendas} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={CORES_GRAFICO.grade} vertical={false} />
            <XAxis {...ESTILO_EIXO} dataKey="hora" interval={0} tickMargin={8} />
            <YAxis {...ESTILO_EIXO} allowDecimals={false} width={40} />
            <Tooltip
              content={({ active, payload }) => {
                const venda = payload?.[0]?.payload as DashboardApi['vendas_por_hora'][number] | undefined
                if (!active || !venda) return null

                return (
                  <TooltipDashboard
                    linhas={[{ cor: venda.destaque ? CORES_GRAFICO.destaque : CORES_GRAFICO.neutra, rotulo: 'Itens', valor: venda.quantidade }]}
                    titulo={venda.hora}
                  />
                )
              }}
              cursor={{ fill: CORES_GRAFICO.grade }}
            />
            <Bar dataKey="quantidade" maxBarSize={24} minPointSize={2} radius={[4, 4, 0, 0]}>
              {vendas.map((venda) => (
                <Cell fill={venda.destaque ? CORES_GRAFICO.destaque : CORES_GRAFICO.neutra} key={venda.hora} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {picos.map((pico) => (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f7fbff] px-2.5 py-1 text-sm font-bold text-[#7d8ea4]"
            key={pico.rotulo}
          >
            {pico.rotulo}
            <strong className="font-black text-[#223149]">{pico.hora}</strong>
          </span>
        ))}
      </div>
    </article>
  )
}
