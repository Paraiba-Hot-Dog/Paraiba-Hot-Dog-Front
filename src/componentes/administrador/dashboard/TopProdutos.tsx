import type { DashboardApi } from '../../../servicos/dashboardApi'
import { correspondeBusca, formatCurrency, formatPercentage, variationTone } from './formatacaoDashboard'
import { CORES_GRAFICO } from './temaGraficos'

type TopProdutosProps = {
  busca: string
  produtos: DashboardApi['top_produtos']
}

const CLASSE_CABECALHO = 'border-b border-[#edf1f6] py-3 text-left text-sm font-black text-[#9badc1]'
const CLASSE_CELULA = 'border-b border-[#edf1f6] py-3'

export default function TopProdutos({ busca, produtos }: TopProdutosProps) {
  const produtosVisiveis = produtos.filter((produto) => correspondeBusca(produto.nome, busca))
  const maiorQuantidade = Math.max(...produtos.map((produto) => produto.quantidade), 1)

  return (
    <article className="rounded-xl border border-[#d8e1ed] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-xl font-black text-[#314259]">
          Top 10 produtos mais vendidos
        </h2>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#9caabd]">
          Por quantidade vendida
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="mt-3.5 w-full min-w-[760px] border-collapse text-base tabular-nums">
          <thead>
            <tr>
              <th className={CLASSE_CABECALHO}>Rank</th>
              <th className={CLASSE_CABECALHO}>Produto</th>
              <th className={`${CLASSE_CABECALHO} w-[32%]`}>Quantidade</th>
              <th className={CLASSE_CABECALHO}>Receita</th>
              <th className={CLASSE_CABECALHO}>Variação</th>
            </tr>
          </thead>
          <tbody>
            {produtosVisiveis.map((produto) => (
              <tr className="transition-colors hover:bg-[#f7fbff]" key={produto.produto_id}>
                <td className={`${CLASSE_CELULA} w-16`}>
                  <span
                    className={`inline-grid h-7 w-10 place-items-center rounded-md text-sm font-black ${
 produto.rank <= 3 ? 'bg-[#ffcc00] text-black' : 'bg-[#f1f5fa] text-[#7d8ea4]'
 }`}
                  >
                    #{String(produto.rank).padStart(2, '0')}
                  </span>
                </td>
                <td className={`${CLASSE_CELULA} font-black text-[#243349]`}>{produto.nome}</td>
                <td className={CLASSE_CELULA}>
                  <div className="flex items-center gap-3 pr-6">
                    <div className="h-2 flex-1 rounded-full bg-[#f1f5fa]">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          backgroundColor: CORES_GRAFICO.destaque,
                          width: `${(produto.quantidade / maiorQuantidade) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right font-bold whitespace-nowrap text-[#53657a]">{produto.quantidade} un.</span>
                  </div>
                </td>
                <td className={`${CLASSE_CELULA} font-bold text-[#53657a]`}>{formatCurrency(produto.receita)}</td>
                <td
                  className={`${CLASSE_CELULA} font-black ${
 variationTone(produto.variacao) === 'negative' ? 'text-[#b3141c]' : 'text-[#06705a]'
 }`}
                >
                  {formatPercentage(produto.variacao)}
                </td>
              </tr>
            ))}
            {!produtosVisiveis.length && (
              <tr>
                <td
                  colSpan={5}
                  className="h-20 border-b border-[#edf1f6] text-center text-base font-bold text-[#53657a]"
                >
                  {produtos.length ? 'Nenhum produto corresponde à pesquisa.' : 'Nenhum produto vendido no período.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}
