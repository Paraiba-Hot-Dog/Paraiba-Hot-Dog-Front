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
}

export async function getDashboard(
  ano: string,
  mes: string,
  fechamentoMes: boolean,
  signal?: AbortSignal,
) {
  const response = await apiFetch('/bi/dashboard', {
    params: {
      ano: ano || undefined,
      mes: mes || undefined,
      fechamento_mes: fechamentoMes || undefined,
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

export async function getDashboardPdf(ano: string) {
  return apiFetch('/bi/dashboard/pdf', {
    headers: { Accept: 'application/pdf' },
    params: { ano },
  })
}
