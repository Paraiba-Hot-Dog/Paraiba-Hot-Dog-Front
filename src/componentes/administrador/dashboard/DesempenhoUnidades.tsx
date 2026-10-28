import { useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardApi } from '../../../servicos/dashboardApi'
import TooltipDashboard from './TooltipDashboard'
import { correspondeBusca, formatCurrency, formatPercentage } from './formatacaoDashboard'
import { CORES_GRAFICO, ESTILO_EIXO, formatarMoedaCompacta } from './temaGraficos'

type UnidadeDashboard = DashboardApi['desempenho_unidades'][number]
type ColunaOrdenavel = 'nome' | 'total_pedidos' | 'receita_bruta' | 'lucro_liquido' | 'ticket_medio' | 'participacao'

type DesempenhoUnidadesProps = {
  busca: string
  unidades: DashboardApi['desempenho_unidades']
}

const COLUNAS: Array<{ id: ColunaOrdenavel; rotulo: string }> = [
  { id: 'nome', rotulo: 'Unidade' },
  { id: 'total_pedidos', rotulo: 'Pedidos' },
  { id: 'receita_bruta', rotulo: 'Receita bruta' },
  { id: 'lucro_liquido', rotulo: 'Lucro líquido' },
  { id: 'ticket_medio', rotulo: 'Ticket médio' },
  { id: 'participacao', rotulo: 'Participação' },
]

function compararUnidades(a: UnidadeDashboard, b: UnidadeDashboard, coluna: ColunaOrdenavel) {
  if (coluna === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')

  return Number(a[coluna]) - Number(b[coluna])
}

export default function DesempenhoUnidades({ busca, unidades }: DesempenhoUnidadesProps) {
  const [ordenacao, setOrdenacao] = useState<{ coluna: ColunaOrdenavel; crescente: boolean }>({
    coluna: 'receita_bruta',
    crescente: false,
  })

  const unidadesVisiveis = unidades
    .filter((unidade) => correspondeBusca(unidade.nome, busca))
    .sort((a, b) => {
      const resultado = compararUnidades(a, b, ordenacao.coluna)
      return ordenacao.crescente ? resultado : -resultado
    })

  const unidadesNoGrafico = unidades
    .filter((unidade) => correspondeBusca(unidade.nome, busca))
    .map((unidade) => ({
      nome: unidade.nome,
      receita: Number(unidade.receita_bruta),
      pedidos: unidade.total_pedidos,
      participacao: formatPercentage(unidade.participacao).replace('+', ''),
    }))
    .sort((a, b) => b.receita - a.receita)

  function ordenarPor(coluna: ColunaOrdenavel) {
    setOrdenacao((atual) => ({
      coluna,
      crescente: atual.coluna === coluna ? !atual.crescente : coluna === 'nome',
    }))
  }

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-[#314259]">
          Desempenho por unidade
        </h2>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#9caabd]">
          Receita bruta no período
        </span>
      </div>

      {unidadesNoGrafico.length > 0 && (
        <div className="mt-4" style={{ height: unidadesNoGrafico.length * 52 + 16 }}>
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={unidadesNoGrafico} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke={CORES_GRAFICO.grade} />
              <XAxis {...ESTILO_EIXO} dataKey="receita" hide type="number" />
              <YAxis
                {...ESTILO_EIXO}
                dataKey="nome"
                tick={{ ...ESTILO_EIXO.tick, fill: '#314259', fontSize: 14 }}
                type="category"
                width={200}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const unidade = payload?.[0]?.payload as (typeof unidadesNoGrafico)[number] | undefined
                  if (!active || !unidade) return null

                  return (
                    <TooltipDashboard
                      linhas={[
                        { cor: CORES_GRAFICO.destaque, rotulo: 'Receita', valor: formatCurrency(unidade.receita) },
                        { rotulo: 'Pedidos', valor: unidade.pedidos },
                        { rotulo: 'Participação', valor: unidade.participacao },
                      ]}
                      titulo={unidade.nome}
                    />
                  )
                }}
                cursor={{ fill: CORES_GRAFICO.grade }}
              />
              <Bar barSize={24} dataKey="receita" fill={CORES_GRAFICO.destaque} radius={[0, 4, 4, 0]}>
                <LabelList
                  dataKey="receita"
                  formatter={(valor) => formatarMoedaCompacta(Number(valor))}
                  position="right"
                  style={{ fill: '#223149', fontSize: 14, fontWeight: 800 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="mt-3.5 w-full min-w-[760px] border-collapse text-base">
          <thead>
            <tr>
              {COLUNAS.map((coluna) => {
                const ativa = ordenacao.coluna === coluna.id
                const Seta = ordenacao.crescente ? ArrowUp : ArrowDown

                return (
                  <th
                    aria-sort={ativa ? (ordenacao.crescente ? 'ascending' : 'descending') : 'none'}
                    className="border-b border-[#edf1f6] py-3 text-left text-sm font-black text-[#9badc1]"
                    key={coluna.id}
                  >
                    <button
                      className={`inline-flex items-center gap-1 hover:text-[#1597ff] ${ativa ? 'text-[#314259]' : ''}`}
                      onClick={() => ordenarPor(coluna.id)}
                      type="button"
                    >
                      {coluna.rotulo}
                      {ativa && <Seta size={12} />}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {unidadesVisiveis.map((unidade) => (
              <tr key={unidade.unidade_id}>
                <td className="border-b border-[#edf1f6] py-3 font-black text-[#243349]">{unidade.nome}</td>
                <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">{unidade.total_pedidos}</td>
                <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">
                  {formatCurrency(unidade.receita_bruta)}
                </td>
                <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">
                  {formatCurrency(unidade.lucro_liquido)}
                </td>
                <td className="border-b border-[#edf1f6] py-3 font-bold text-[#53657a]">
                  {formatCurrency(unidade.ticket_medio)}
                </td>
                <td className="border-b border-[#edf1f6] py-3 font-black text-[#243349]">
                  {formatPercentage(unidade.participacao).replace('+', '')}
                </td>
              </tr>
            ))}
            {!unidadesVisiveis.length && (
              <tr>
                <td
                  colSpan={COLUNAS.length}
                  className="h-20 border-b border-[#edf1f6] text-center text-base font-bold text-[#53657a]"
                >
                  {unidades.length ? 'Nenhuma unidade corresponde à pesquisa.' : 'Nenhuma venda registrada no período.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
