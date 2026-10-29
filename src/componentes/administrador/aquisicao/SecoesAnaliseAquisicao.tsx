import { useId, useState, type ReactNode } from 'react'
import type {
  AcoesGeradasApi,
  EscopoAquisicao,
  EtapaFunilAquisicao,
  OrigemCanalApi,
  ProdutoVisualizadoApi,
  UnidadeComparacaoApi,
} from '../../../servicos/aquisicaoApi'
import DicaInfo from './DicaInfo'
import SeloEscopo from './SeloEscopo'
import { ROTULOS_CANAL, formatarNumero, formatarPercentual, formatarRazao } from './formatacaoAquisicao'
import { resumirAcoes, resumirOrigem, resumirProdutos, resumirUnidades } from './resumosAnaliseAquisicao'

const CLASSE_TH = 'border-b border-[#edf1f6] py-3 pr-3 text-left align-bottom font-black text-[#9badc1]'
const CLASSE_TD = 'border-b border-[#edf1f6] py-3 pr-3 font-bold text-[#53657a]'

const ROTULOS_ACAO: Record<EtapaFunilAquisicao, string> = {
  visita_site: 'Visitas ao site',
  abertura_cardapio: 'Aberturas do cardápio',
  selecao_unidade: 'Escolhas de unidade',
  visualizacao_produto: 'Visualizações de produto',
  clique_pedir: 'Cliques para pedir',
}

function percentualOuTraco(valor: string | null) {
  return valor === null ? '—' : formatarPercentual(valor)
}

function CartaoSecao({
  titulo,
  resumo,
  descricao,
  dica,
  selo,
  children,
}: {
  titulo: string
  resumo: string
  descricao: string
  dica: string
  selo?: EscopoAquisicao | null
  children: ReactNode
}) {
  const [aberta, setAberta] = useState(false)
  const idDetalhes = useId()

  return (
    <article className="min-w-0 rounded-xl border border-[#d8e1ed] bg-white shadow-sm">
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-black text-[#172033] max-[900px]:text-lg">{titulo}</h3>
          <p className="mt-1 mb-0 text-sm font-medium text-[#7d8ea4] max-[900px]:text-base">{resumo}</p>
        </div>
        <button
          type="button"
          onClick={() => setAberta(!aberta)}
          aria-expanded={aberta}
          aria-controls={idDetalhes}
          className="-mx-2 inline-flex min-h-11 shrink-0 items-center self-start rounded-lg px-2 text-[#1597ff] hover:text-[#0b5fa8] focus-visible:outline-2 focus-visible:outline-[#1597ff] sm:mx-0 sm:w-[min(30vw,22rem)] sm:self-center"
        >
          <span className="text-sm font-semibold max-[900px]:text-base">
            {aberta ? 'Ocultar detalhes' : 'Ver detalhes'}
          </span>
        </button>
      </div>

      {aberta && (
        <div id={idDetalhes} className="border-t border-[#edf1f6] px-5 pt-4 pb-5">
          <div className="flex items-start justify-between gap-2">
            <p className="m-0 text-xs font-bold text-[#9cadbf] max-[900px]:text-sm">{descricao}</p>
            <DicaInfo rotulo={titulo} texto={dica} />
          </div>
          {selo && (
            <div className="mt-2">
              <SeloEscopo escopo={selo} />
            </div>
          )}
          <div className="mt-3">{children}</div>
        </div>
      )}
    </article>
  )
}

function TituloColuna({ texto, escopo }: { texto: string; escopo: EscopoAquisicao | null }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span>{texto}</span>
      {escopo && <SeloEscopo escopo={escopo} />}
    </span>
  )
}

function LinhaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="h-20 border-b border-[#edf1f6] text-center text-sm font-bold text-[#53657a] max-[900px]:text-base"
      >
        {texto}
      </td>
    </tr>
  )
}

export function OrigemAcessos({ origem, comUnidade }: { origem: OrigemCanalApi[]; comUnidade: boolean }) {
  const escopos = origem[0]
  const taxaMista = escopos?.escopo_taxa === 'unidade_sobre_site'

  return (
    <CartaoSecao
      titulo="Origem dos acessos"
      resumo={resumirOrigem(origem)}
      descricao="Visitas por canal de chegada e quantas clicaram para pedir."
      dica={
        taxaMista
          ? 'O canal é o da chegada ao site. A taxa divide as visitas com clique nesta unidade pelas visitas do canal no site inteiro, porque a visita acontece antes da escolha da unidade.'
          : 'O canal é o da chegada ao site e vale para a visita inteira. A taxa divide as visitas com clique para pedir pelas visitas do canal.'
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-xs max-[900px]:text-sm sm:text-sm">
          <thead>
            <tr>
              <th className={CLASSE_TH}>Canal</th>
              <th className={CLASSE_TH}>
                <TituloColuna texto="Visitantes" escopo={comUnidade ? 'site' : null} />
              </th>
              <th className={CLASSE_TH}>Participação</th>
              <th className={CLASSE_TH}>
                <TituloColuna texto="Cliques" escopo={comUnidade && escopos ? escopos.escopo_cliques : null} />
              </th>
              <th className={CLASSE_TH}>
                <TituloColuna
                  texto="Visita → clique"
                  escopo={comUnidade && escopos ? escopos.escopo_taxa : null}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {origem.map((linha) => (
              <tr key={linha.canal}>
                <td className={`${CLASSE_TD} font-black text-[#243349]`}>{ROTULOS_CANAL[linha.canal]}</td>
                <td className={CLASSE_TD}>{formatarNumero(linha.visitantes)}</td>
                <td className={`${CLASSE_TD} w-[30%]`}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-[#edf2f8]" aria-hidden>
                      <div
                        className="h-full rounded-full bg-[#1597ff]"
                        style={{ width: `${Math.min(Number(linha.participacao ?? 0), 100)}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right">{percentualOuTraco(linha.participacao)}</span>
                  </div>
                </td>
                <td className={CLASSE_TD}>{formatarNumero(linha.cliques_pedir)}</td>
                <td className={`${CLASSE_TD} font-black text-[#243349]`}>
                  {percentualOuTraco(linha.taxa_visita_clique)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CartaoSecao>
  )
}

export function AcoesGeradas({ acoes, comUnidade }: { acoes: AcoesGeradasApi; comUnidade: boolean }) {
  const maiorTotal = Math.max(...acoes.por_tipo.map((acao) => acao.total), 0)

  return (
    <CartaoSecao
      titulo="Ações geradas"
      resumo={resumirAcoes(acoes)}
      descricao="Tudo o que os visitantes fizeram no site, com repetições."
      dica="Soma de todos os eventos registrados no período: visitas, aberturas do cardápio, escolhas de unidade, produtos abertos e cliques para pedir. Ações por visita divide essa soma pelo número de visitas."
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border-[3px] border-[#1597ff] p-3">
          <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8799af] max-[900px]:text-sm">
            Total de ações
          </span>
          <strong className="mt-1 block text-2xl font-black tracking-tight text-[#223149] sm:text-[1.9rem]">
            {formatarNumero(acoes.total_acoes)}
          </strong>
        </div>
        <div className="rounded-lg border border-[#ffcc00] bg-[#ffcc00] p-3">
          <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-[#725d00] max-[900px]:text-sm">
            Ações por visita
          </span>
          <strong
            className={`mt-1 block font-black tracking-tight text-[#223149] ${
              acoes.acoes_por_visita === null ? 'text-lg' : 'text-2xl sm:text-[1.9rem]'
            }`}
          >
            {acoes.acoes_por_visita === null ? 'Indisponível' : formatarRazao(acoes.acoes_por_visita)}
          </strong>
          {comUnidade && (
            <div className="mt-1">
              <SeloEscopo escopo={acoes.escopo_acoes_por_visita} />
            </div>
          )}
        </div>
      </div>

      <ul className="mt-4 grid gap-2.5" aria-label="Ações por tipo">
        {acoes.por_tipo.map((acao) => (
          <li key={acao.tipo} className="grid gap-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs font-bold text-[#53657a] max-[900px]:text-sm sm:text-sm">
              <span className="flex items-center gap-2">
                <span className="font-black text-[#243349]">{ROTULOS_ACAO[acao.tipo]}</span>
                {comUnidade && <SeloEscopo escopo={acao.escopo} />}
              </span>
              <span>{formatarNumero(acao.total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#edf2f8]" aria-hidden>
              <div
                className="h-full rounded-full bg-[#9fd0ff]"
                style={{ width: `${maiorTotal > 0 ? (acao.total / maiorTotal) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </CartaoSecao>
  )
}

export function ProdutosMaisVisualizados({
  produtos,
  comUnidade,
}: {
  produtos: ProdutoVisualizadoApi[]
  comUnidade: boolean
}) {
  return (
    <CartaoSecao
      titulo="Produtos mais visualizados"
      resumo={resumirProdutos(produtos)}
      descricao="Top 10 produtos com mais detalhes abertos, com repetições."
      dica="Conta cada vez que o detalhe de um produto foi aberto. Produtos apagados do cardápio aparecem como “Produto removido”, sem esconder o volume."
      selo={comUnidade ? 'unidade' : null}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-xs max-[900px]:text-sm sm:text-sm">
          <thead>
            <tr>
              <th className={CLASSE_TH}>Rank</th>
              <th className={CLASSE_TH}>Produto</th>
              <th className={`${CLASSE_TH} text-right`}>Visualizações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.produto_id ?? 'removido'}>
                <td className={`${CLASSE_TD} w-16 font-black text-[#8a6f00]`}>
                  #{String(produto.rank).padStart(2, '0')}
                </td>
                <td
                  className={`${CLASSE_TD} font-black ${
                    produto.produto_id === null ? 'italic text-[#7d8ea4]' : 'text-[#243349]'
                  }`}
                >
                  {produto.nome}
                </td>
                <td className={`${CLASSE_TD} text-right`}>{formatarNumero(produto.visualizacoes)}</td>
              </tr>
            ))}
            {!produtos.length && (
              <LinhaVazia colunas={3} texto="Nenhum produto visualizado no período e nos filtros selecionados." />
            )}
          </tbody>
        </table>
      </div>
    </CartaoSecao>
  )
}

export function ComparacaoUnidades({
  unidades,
  comUnidade,
}: {
  unidades: UnidadeComparacaoApi[]
  comUnidade: boolean
}) {
  return (
    <CartaoSecao
      titulo="Comparação por unidade"
      resumo={resumirUnidades(unidades)}
      descricao="Visitas que escolheram cada unidade e quantas clicaram para pedir."
      dica="A base de cada unidade são as visitas que a escolheram no seletor do cardápio, porque a visita ao site acontece antes da escolha. Cliques sem unidade escolhida, ou de unidades apagadas, aparecem em “Sem unidade ou removida”."
      selo={comUnidade ? 'unidade' : null}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-xs max-[900px]:text-sm sm:text-sm">
          <thead>
            <tr>
              <th className={CLASSE_TH}>Unidade</th>
              <th className={CLASSE_TH}>Escolhas</th>
              <th className={CLASSE_TH}>Participação</th>
              <th className={CLASSE_TH}>Cliques</th>
              <th className={CLASSE_TH}>Escolha → clique</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((unidade) => (
              <tr key={unidade.unidade_id ?? 'sem-unidade'}>
                <td
                  className={`${CLASSE_TD} font-black ${
                    unidade.unidade_id === null ? 'italic text-[#7d8ea4]' : 'text-[#243349]'
                  }`}
                >
                  {unidade.nome}
                </td>
                <td className={CLASSE_TD}>{formatarNumero(unidade.escolhas)}</td>
                <td className={CLASSE_TD}>{percentualOuTraco(unidade.participacao_escolhas)}</td>
                <td className={CLASSE_TD}>{formatarNumero(unidade.cliques_pedir)}</td>
                <td className={`${CLASSE_TD} font-black text-[#243349]`}>
                  {percentualOuTraco(unidade.taxa_escolha_clique)}
                </td>
              </tr>
            ))}
            {!unidades.length && (
              <LinhaVazia colunas={5} texto="Nenhuma unidade escolhida no período e nos filtros selecionados." />
            )}
          </tbody>
        </table>
      </div>
    </CartaoSecao>
  )
}
