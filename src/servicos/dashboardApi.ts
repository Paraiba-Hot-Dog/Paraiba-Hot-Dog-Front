import { apiFetch } from './apiFetch'

export type DashboardApi = {
  kpis: {
    receita_bruta: string
    lucro_liquido: string
    ticket_medio: string
    total_pedidos: number
    variacao_receita_bruta: string
    variacao_lucro_liquido: string
    variacao_ticket_medio: string
    variacao_total_pedidos: string
  }
  vendas_por_hora: Array<{
    hora: string
    quantidade: number
    destaque: boolean
  }>
  top_produtos: Array<{
    rank: number
    produto_id: number
    nome: string
    quantidade: number
    receita: string
    variacao: string
  }>
  mix_produtos: Array<{
    nome: string
    percentual: string
  }>
  vendas_totais: string
  pedidos_registrados: number
  destaque: {
    nome: string
    margem_ganho: string
    margem_liquida: string
  } | null
  agrupamento_periodo: 'dia' | 'mes'
  vendas_por_periodo: Array<{
    periodo: string
    receita_bruta: string
    total_pedidos: number
  }>
  desempenho_unidades: Array<{
    unidade_id: number
    nome: string
    total_pedidos: number
    receita_bruta: string
    lucro_liquido: string
    ticket_medio: string
    participacao: string
  }>
  fidelidade: {
    pedidos_com_cliente: number
    percentual_pedidos_com_cliente: string
    clientes_unicos: number
    pontos_resgatados: number
    descontos_concedidos: string
    ticket_medio_com_cliente: string
    ticket_medio_sem_cliente: string
    top_clientes: Array<{
      cliente_id: number
      nome: string
      total_pedidos: number
      receita_bruta: string
      pontos_atuais: number
    }>
  } | null
}

export type FiltrosDashboardApi = {
  dataInicio: string
  dataFim: string
  unidadeId: string
}

export async function getDashboard(filtros: FiltrosDashboardApi, signal?: AbortSignal) {
  const response = await apiFetch('/bi/dashboard', {
    params: {
      data_inicio: filtros.dataInicio,
      data_fim: filtros.dataFim,
      unidade_id: filtros.unidadeId || undefined,
    },
    signal,
  })

  if (response.status === 401) {
    throw new Error('A API recusou a requisicao. Informe um token valido no localStorage ou nos cookies.')
  }

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os indicadores da API.')
  }

  return (await response.json()) as DashboardApi
}
