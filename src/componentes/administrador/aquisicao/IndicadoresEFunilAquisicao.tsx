import { useEffect, useState } from 'react'
import { useFiltroAquisicao } from '../../../hooks/useFiltroAquisicao'
import {
  getAquisicao,
  type AquisicaoApi,
  type FiltroAquisicao,
} from '../../../servicos/aquisicaoApi'
import CardsIndicadoresAquisicao from './CardsIndicadoresAquisicao'
import FunilAquisicao from './FunilAquisicao'

const ETAPAS_VAZIAS: AquisicaoApi['funil'] = (
  ['visita_site', 'abertura_cardapio', 'selecao_unidade', 'visualizacao_produto', 'clique_pedir'] as const
).map((etapa) => ({
  etapa,
  volume: 0,
  conversao_etapa_anterior: null,
  perda: 0,
  maior_abandono: false,
}))

const AQUISICAO_VAZIA: AquisicaoApi = {
  funil: ETAPAS_VAZIAS,
  indicadores: {
    visitantes: 0,
    visualizacoes_cardapio: 0,
    produtos_visualizados: 0,
    cliques_pedir: 0,
    taxa_visita_clique: null,
  },
}

type Resultado =
  | { chave: string; dados: AquisicaoApi; erro: null }
  | { chave: string; dados: null; erro: string }

function chaveDoFiltro(filtro: FiltroAquisicao) {
  return `${filtro.periodo}|${filtro.unidadeId ?? ''}|${filtro.canal ?? ''}`
}

/**
 * Bloco de indicadores e funil da aba de Aquisição (Pessoa A).
 * Lê o filtro compartilhado; ao trocar o filtro, mantém os números
 * anteriores esmaecidos até a resposta nova chegar. Em erro, mostra só
 * a mensagem, para não exibir números de outro filtro.
 */
export default function IndicadoresEFunilAquisicao() {
  const { filtro } = useFiltroAquisicao()
  const chave = chaveDoFiltro(filtro)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [ultimosDados, setUltimosDados] = useState<AquisicaoApi | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    getAquisicao(filtro, controller.signal)
      .then((dados) => {
        setResultado({ chave, dados, erro: null })
        setUltimosDados(dados)
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === 'AbortError') return
        setResultado({
          chave,
          dados: null,
          erro: erro instanceof Error ? erro.message : 'Erro inesperado ao carregar a aquisição.',
        })
      })

    return () => controller.abort()
  }, [filtro, chave])

  const carregando = resultado?.chave !== chave
  const erro = !carregando ? resultado?.erro ?? null : null
  const dados = (!carregando ? resultado?.dados : null) ?? ultimosDados ?? AQUISICAO_VAZIA
  const semResultados =
    !carregando &&
    !erro &&
    dados.indicadores.visitantes === 0 &&
    dados.funil.every((etapa) => etapa.volume === 0)

  return (
    <div className="grid gap-3" aria-busy={carregando}>
      {(carregando || erro) && (
        <div
          role={erro ? 'alert' : 'status'}
          className={`rounded border px-3 py-2.5 text-xs font-extrabold ${
            erro
              ? 'border-[#f4a5ad] bg-[#ffe4e7] text-[#8a1018]'
              : 'border-[#ffdb38] bg-[#fff1a6] text-[#604f00]'
          }`}
        >
          {erro ?? 'Carregando dados de aquisição da API...'}
        </div>
      )}

      {semResultados && (
        <div
          role="status"
          className="rounded border border-[#d8e1ed] bg-white px-3 py-2.5 text-xs font-extrabold text-[#53657a] max-[900px]:text-sm"
        >
          Nenhuma visita registrada no período e nos filtros selecionados.
        </div>
      )}

      {!erro && (
        <div className={`grid gap-3 transition-opacity ${carregando && ultimosDados ? 'opacity-60' : ''}`}>
          <CardsIndicadoresAquisicao indicadores={dados.indicadores} />
          <FunilAquisicao funil={dados.funil} />
        </div>
      )}
    </div>
  )
}
