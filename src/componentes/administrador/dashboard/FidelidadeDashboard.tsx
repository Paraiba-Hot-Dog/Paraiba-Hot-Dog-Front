import type { DashboardApi } from '../../../servicos/dashboardApi'
import { correspondeBusca, formatCurrency, formatPercentage } from './formatacaoDashboard'
import { CORES_GRAFICO } from './temaGraficos'

type FidelidadeDashboardProps = {
  busca: string
  fidelidade: NonNullable<DashboardApi['fidelidade']>
}

export default function FidelidadeDashboard({ busca, fidelidade }: FidelidadeDashboardProps) {
  const ticketComCliente = Number(fidelidade.ticket_medio_com_cliente)
  const ticketSemCliente = Number(fidelidade.ticket_medio_sem_cliente)
  const maiorTicket = Math.max(ticketComCliente, ticketSemCliente, 1)
  const clientesVisiveis = fidelidade.top_clientes.filter((cliente) => correspondeBusca(cliente.nome, busca))

  const indicadores = [
    {
      rotulo: 'Pedidos identificados',
      valor: String(fidelidade.pedidos_com_cliente),
      detalhe: `${formatPercentage(fidelidade.percentual_pedidos_com_cliente).replace('+', '')} dos pedidos`,
    },
    {
      rotulo: 'Clientes atendidos',
      valor: String(fidelidade.clientes_unicos),
      detalhe: 'com cadastro no programa',
    },
    {
      rotulo: 'Pontos resgatados',
      valor: String(fidelidade.pontos_resgatados),
      detalhe: 'usados como desconto',
    },
    {
      rotulo: 'Descontos concedidos',
      valor: formatCurrency(fidelidade.descontos_concedidos),
      detalhe: 'pelo programa de fidelidade',
    },
  ]

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <h2 className="m-0 text-xl font-black text-[#314259]">Fidelidade</h2>

      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => (
          <div className="rounded-lg bg-[#f7fbff] p-3" key={indicador.rotulo}>
            <span className="block text-sm font-extrabold uppercase tracking-[0.14em] text-[#8799af]">
              {indicador.rotulo}
            </span>
            <strong className="mt-1 block text-2xl font-black text-[#223149]">{indicador.valor}</strong>
            <small className="text-sm font-bold text-[#9cadbf]">{indicador.detalhe}</small>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] [&>*]:min-w-0">
        <div>
          <h3 className="m-0 text-base font-black text-[#314259]">Ticket médio</h3>
          {[
            { rotulo: 'Com cadastro', valor: ticketComCliente, cor: CORES_GRAFICO.destaque },
            { rotulo: 'Sem cadastro', valor: ticketSemCliente, cor: CORES_GRAFICO.neutra },
          ].map((ticket) => (
            <div className="mt-3" key={ticket.rotulo}>
              <div className="flex justify-between text-sm font-extrabold text-[#7d8ea4]">
                <span>{ticket.rotulo}</span>
                <strong className="text-[#1e2d42]">{formatCurrency(ticket.valor)}</strong>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-[#edf1f6]">
                <div
                  className="h-2.5 rounded-full"
                  style={{ backgroundColor: ticket.cor, width: `${(ticket.valor / maiorTicket) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <h3 className="m-0 text-base font-black text-[#314259]">Clientes que mais compraram</h3>
          <table className="mt-1 w-full min-w-[480px] border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-[#edf1f6] py-2.5 text-left text-sm font-black text-[#9badc1]">Cliente</th>
                <th className="border-b border-[#edf1f6] py-2.5 text-left text-sm font-black text-[#9badc1]">Pedidos</th>
                <th className="border-b border-[#edf1f6] py-2.5 text-left text-sm font-black text-[#9badc1]">Receita</th>
                <th className="border-b border-[#edf1f6] py-2.5 text-left text-sm font-black text-[#9badc1]">Pontos atuais</th>
              </tr>
            </thead>
            <tbody>
              {clientesVisiveis.map((cliente) => (
                <tr key={cliente.cliente_id}>
                  <td className="border-b border-[#edf1f6] py-2.5 font-black text-[#243349]">{cliente.nome}</td>
                  <td className="border-b border-[#edf1f6] py-2.5 font-bold text-[#53657a]">{cliente.total_pedidos}</td>
                  <td className="border-b border-[#edf1f6] py-2.5 font-bold text-[#53657a]">
                    {formatCurrency(cliente.receita_bruta)}
                  </td>
                  <td className="border-b border-[#edf1f6] py-2.5 font-bold text-[#53657a]">{cliente.pontos_atuais}</td>
                </tr>
              ))}
              {!clientesVisiveis.length && (
                <tr>
                  <td colSpan={4} className="h-16 border-b border-[#edf1f6] text-center text-base font-bold text-[#53657a]">
                    {fidelidade.top_clientes.length
                      ? 'Nenhum cliente corresponde à pesquisa.'
                      : 'Nenhum pedido com cliente identificado no período.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
