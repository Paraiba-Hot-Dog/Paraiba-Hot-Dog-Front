import { useEffect, useState } from 'react'
import { useFiltroAquisicao } from '../../../hooks/useFiltroAquisicao'
import {
  CANAIS_AQUISICAO,
  getAnalisesAquisicao,
  type AnalisesAquisicaoApi,
  type FiltroAquisicao,
} from '../../../servicos/aquisicaoApi'
import { BotaoLimparFiltros } from './BarraFiltrosAquisicao'
import { AcoesGeradas, ComparacaoUnidades, OrigemAcessos, ProdutosMaisVisualizados } from './SecoesAnaliseAquisicao'

function analisesVazias(filtro: FiltroAquisicao): AnalisesAquisicaoApi {
  return {
    origem: (filtro.canal === null ? CANAIS_AQUISICAO : [filtro.canal]).map((canal) => ({
      canal,
      visitantes: 0,
      participacao: null,
      cliques_pedir: 0,
      escopo_cliques: 'site',
      taxa_visita_clique: null,
      escopo_taxa: 'site',
    })),
    acoes: {
      total_acoes: 0,
      acoes_por_visita: null,
      escopo_acoes_por_visita: 'site',
      por_tipo: (
        ['visita_site', 'abertura_cardapio', 'selecao_unidade', 'visualizacao_produto', 'clique_pedir'] as const
      ).map((tipo) => ({ tipo, total: 0, escopo: 'site' })),
    },
    produtos: [],
    unidades: [],
  }
}

type Resultado =
  | { chave: string; dados: AnalisesAquisicaoApi; erro: null }
  | { chave: string; dados: null; erro: string }

function chaveDoFiltro(filtro: FiltroAquisicao) {
  return `${filtro.periodo}|${filtro.unidadeId ?? ''}|${filtro.canal ?? ''}`
}

export default function AnalisesAquisicao() {
  const { filtro } = useFiltroAquisicao()
  const chave = chaveDoFiltro(filtro)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [ultimosDados, setUltimosDados] = useState<AnalisesAquisicaoApi | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getAnalisesAquisicao(filtro, controller.signal)
      .then((dados) => {
        setResultado({ chave, dados, erro: null })
        setUltimosDados(dados)
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === 'AbortError') return
        setResultado({
          chave,
          dados: null,
          erro: erro instanceof Error ? erro.message : 'Erro inesperado ao carregar as análises.',
        })
      })

    return () => controller.abort()
  }, [filtro, chave])

  const carregando = resultado?.chave !== chave
  const erro = !carregando ? (resultado?.erro ?? null) : null
  const dados = (!carregando ? resultado?.dados : null) ?? ultimosDados ?? analisesVazias(filtro)
  const comUnidade = filtro.unidadeId !== null
  const semResultados = !carregando && !erro && dados.acoes.total_acoes === 0

  return (
    <section className="grid min-w-0 gap-3" aria-label="Análises de aquisição" aria-busy={carregando}>
      {(carregando || erro) && (
        <div
          role={erro ? 'alert' : 'status'}
          className={`rounded border px-3 py-2.5 text-xs font-extrabold ${
            erro
              ? 'border-[#f4a5ad] bg-[#ffe4e7] text-[#8a1018]'
              : 'border-[#ffdb38] bg-[#fff1a6] text-[#604f00]'
          }`}
        >
          {erro ?? 'Carregando análises de aquisição da API...'}
        </div>
      )}

      {semResultados && (
        <div role="status" className="rounded-xl border border-[#d8e1ed] bg-white p-6 shadow-sm">
          <h2 className="m-0 text-lg font-black text-[#172033] max-[900px]:text-xl">Nenhum resultado neste recorte</h2>
          <p className="mt-2 mb-4 text-sm font-medium text-[#7d8ea4] max-[900px]:text-base">
            Não há acessos registrados para esta combinação de período, unidade e canal.
          </p>
          <BotaoLimparFiltros />
        </div>
      )}

      {!erro && !semResultados && (
        <h2 className="m-0 mt-3 text-xl font-black text-[#172033] max-[900px]:text-2xl">Explore os detalhes</h2>
      )}

      {!erro && !semResultados && (
        <div className={`grid gap-3 transition-opacity ${carregando && ultimosDados ? 'opacity-60' : ''}`}>
          <OrigemAcessos origem={dados.origem} comUnidade={comUnidade} />
          <AcoesGeradas acoes={dados.acoes} comUnidade={comUnidade} />
          <ProdutosMaisVisualizados produtos={dados.produtos} comUnidade={comUnidade} />
          <ComparacaoUnidades unidades={dados.unidades} comUnidade={comUnidade} />
        </div>
      )}
    </section>
  )
}
