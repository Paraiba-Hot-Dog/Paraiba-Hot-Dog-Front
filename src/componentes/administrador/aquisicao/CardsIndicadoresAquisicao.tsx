import type { EscopoAquisicao, IndicadoresAquisicaoApi } from '../../../servicos/aquisicaoApi'
import DicaInfo from './DicaInfo'
import SeloEscopo from './SeloEscopo'
import { formatarNumero, formatarPercentual } from './formatacaoAquisicao'

type Card = {
  rotulo: string
  valor: string
  legenda: string
  dica: string
  escopo: EscopoAquisicao
  destaque?: 'azul' | 'amarelo'
  indisponivel?: boolean
}

export default function CardsIndicadoresAquisicao({
  indicadores,
  comUnidade,
}: {
  indicadores: IndicadoresAquisicaoApi
  /** Há filtro de unidade: mostra o escopo de cada card. */
  comUnidade: boolean
}) {
  const { escopos } = indicadores
  const taxaMista = escopos.taxa_visita_clique === 'unidade_sobre_site'

  const cards: Card[] = [
    {
      rotulo: 'Visitantes',
      valor: formatarNumero(indicadores.visitantes),
      legenda: 'visitas no período',
      dica: 'Visitas ao site no período. Cada aba do navegador conta como uma visita; não é uma contagem exata de pessoas.',
      escopo: escopos.visitantes,
      destaque: 'azul',
    },
    {
      rotulo: 'Visualizações do cardápio',
      valor: formatarNumero(indicadores.visualizacoes_cardapio),
      legenda: 'aberturas, com repetições',
      dica: 'Total de vezes que o cardápio foi aberto, contando repetições na mesma visita.',
      escopo: escopos.visualizacoes_cardapio,
    },
    {
      rotulo: 'Produtos visualizados',
      valor: formatarNumero(indicadores.produtos_visualizados),
      legenda: 'aberturas, com repetições',
      dica: 'Total de detalhes de produto abertos. Quem abre dez produtos conta dez vezes aqui e uma vez no funil.',
      escopo: escopos.produtos_visualizados,
    },
    {
      rotulo: 'Cliques para pedir',
      valor: formatarNumero(indicadores.cliques_pedir),
      legenda: 'cliques no iFood, com repetições',
      dica: 'Total de cliques no link do iFood. Mostra intenção de compra, não venda confirmada.',
      escopo: escopos.cliques_pedir,
    },
    {
      rotulo: 'Taxa visita → clique',
      valor:
        indicadores.taxa_visita_clique === null
          ? 'Taxa indisponível'
          : formatarPercentual(indicadores.taxa_visita_clique),
      legenda: taxaMista
        ? 'cliques da unidade ÷ visitas do site inteiro'
        : 'visitas que clicaram para pedir',
      dica: taxaMista
        ? 'Visitas com clique para pedir nesta unidade, divididas pelo total de visitas do site inteiro. As visitas acontecem antes da escolha da unidade, então não dá para separar por unidade.'
        : 'Visitas com pelo menos um clique para pedir, divididas pelo total de visitas. Fica indisponível quando não há visitas.',
      escopo: escopos.taxa_visita_clique,
      destaque: 'amarelo',
      indisponivel: indicadores.taxa_visita_clique === null,
    },
  ]

  return (
    <section
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Indicadores principais de aquisição"
    >
      {cards.map((card) => {
        const amarelo = card.destaque === 'amarelo'

        return (
          <article
            key={card.rotulo}
            className={`min-h-[108px] rounded-xl border p-4 shadow-sm ${
              amarelo
                ? 'border-[#ffcc00] bg-[#ffcc00]'
                : card.destaque === 'azul'
                  ? 'border-[3px] border-[#1597ff] bg-white'
                  : 'border-[#d8e1ed] bg-white'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span
                className={`block text-xs font-extrabold uppercase tracking-[0.14em] max-[900px]:text-sm sm:text-sm ${
                  amarelo ? 'text-[#725d00]' : 'text-[#8799af]'
                }`}
              >
                {card.rotulo}
              </span>
              <DicaInfo rotulo={card.rotulo} texto={card.dica} tom={amarelo ? 'escuro' : 'claro'} />
            </div>
            {comUnidade && (
              <div className="mb-2">
                <SeloEscopo escopo={card.escopo} />
              </div>
            )}
            <strong
              className={`block font-black tracking-tight text-[#223149] ${
                card.indisponivel
                  ? 'text-lg'
                  : 'text-2xl max-[900px]:text-[2.05rem] sm:text-[1.9rem]'
              }`}
            >
              {card.valor}
            </strong>
            <small
              className={`mt-2 block text-[11px] font-bold max-[900px]:text-xs ${
                amarelo ? 'text-[#725d00]' : 'text-[#9cadbf]'
              }`}
            >
              {card.legenda}
            </small>
          </article>
        )
      })}
    </section>
  )
}
