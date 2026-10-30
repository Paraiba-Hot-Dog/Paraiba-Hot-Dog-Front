import { apiFetch } from './apiFetch'

export const PERIODOS_AQUISICAO = ['ultimos_7_dias', 'ultimos_30_dias', 'ultimos_90_dias'] as const
export type PeriodoAquisicao = (typeof PERIODOS_AQUISICAO)[number]
export const PERIODO_AQUISICAO_PADRAO: PeriodoAquisicao = 'ultimos_30_dias'

export const CANAIS_AQUISICAO = [
  'instagram',
  'qrcode',
  'campanha_outros',
  'busca',
  'outros_sites',
  'direto',
] as const
export type CanalAquisicao = (typeof CANAIS_AQUISICAO)[number]

export type EtapaFunilAquisicao =
  | 'visita_site'
  | 'abertura_cardapio'
  | 'selecao_unidade'
  | 'visualizacao_produto'
  | 'clique_pedir'

export type FiltroAquisicao = {
  periodo: PeriodoAquisicao
  unidadeId: number | null
  canal: CanalAquisicao | null
}

/**
 * De onde vem um número quando há filtro de unidade.
 * `site`: todo o site; `unidade`: só a unidade filtrada;
 * `unidade_sobre_site`: taxa que divide um número da unidade por um do site.
 */
export type EscopoAquisicao = 'site' | 'unidade' | 'unidade_sobre_site'

export type FunilEtapaApi = {
  etapa: EtapaFunilAquisicao
  volume: number
  escopo: EscopoAquisicao
  /** Percentual em texto (ex.: "42.50"). null na primeira etapa ou se a anterior for zero. Pode passar de 100. */
  conversao_etapa_anterior: string | null
  /** Escopo da conversão e da perda; null na primeira etapa. */
  escopo_conversao: EscopoAquisicao | null
  /** Pode ser negativa quando a etapa tem mais visitas que a anterior. */
  perda: number
  maior_abandono: boolean
}

export type IndicadoresAquisicaoApi = {
  visitantes: number
  visualizacoes_cardapio: number
  produtos_visualizados: number
  cliques_pedir: number
  /** Percentual em texto (ex.: "12.34"). null quando nao houve visitas. */
  taxa_visita_clique: string | null
  escopos: Record<
    'visitantes' | 'visualizacoes_cardapio' | 'produtos_visualizados' | 'cliques_pedir' | 'taxa_visita_clique',
    EscopoAquisicao
  >
}

export type AquisicaoApi = {
  funil: FunilEtapaApi[]
  indicadores: IndicadoresAquisicaoApi
}

export async function getAquisicao(filtro: FiltroAquisicao, signal?: AbortSignal) {
  const response = await apiFetch('/analytics/aquisicao', {
    params: {
      periodo: filtro.periodo,
      unidade_id: filtro.unidadeId ?? undefined,
      canal: filtro.canal ?? undefined,
    },
    signal,
  })

  if (response.status === 401) {
    throw new Error('A API recusou a requisicao. Informe um token valido no localStorage ou nos cookies.')
  }

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os dados de aquisicao da API.')
  }

  return (await response.json()) as AquisicaoApi
}
