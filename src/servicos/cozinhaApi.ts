import { apiFetch } from './apiFetch'

export type StatusCozinha = 'aberto' | 'preparando' | 'entregue' | 'cancelado'

export type CozinhaItem = {
  pedido_id: number
  nome_comanda: string
  lote: number
  produto_variacao_id: number
  produto_id: number
  produto_nome: string
  produto_variacao_nome: string | null
  observacao: string | null
  status: StatusCozinha
  quantidade: number
  adicionais: Array<{
    adicional_id: number | null
    nome: string
    preco: string
  }>
}

export type PedidoApi = {
  id: number
  nome_comanda: string
  status: 'aberto' | 'pago' | 'cancelado'
  created_at: string
  itens: Array<{
    produto_nome: string
    produto_variacao_nome: string | null
    quantidade: number
    observacao: string | null
    status: StatusCozinha
    lote: number
    adicionais: Array<{
      adicional_id: number | null
      nome: string
      preco: string
    }>
  }>
}

export async function listarCozinha(unidadeId?: number) {
  const response = await apiFetch('/pedidos/cozinha', {
    params: { unidade_id: unidadeId },
  })

  if (!response.ok) {
    throw new Error(`Kitchen queue failed: ${response.status}`)
  }

  return (await response.json()) as CozinhaItem[]
}

export async function listarPedidosCancelados(unidadeId?: number) {
  const response = await apiFetch('/pedidos/', {
    params: {
      status: 'cancelado',
      unidade_id: unidadeId,
      limit: 100,
    },
  })

  if (!response.ok) {
    throw new Error(`Canceled orders failed: ${response.status}`)
  }

  return (await response.json()) as PedidoApi[]
}

export async function cancelarPedido(pedidoId: number, motivoCancelamento: string) {
  const response = await apiFetch(`/pedidos/${pedidoId}/cancelar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo_cancelamento: motivoCancelamento }),
  })

  if (!response.ok) {
    throw new Error(`Cancel pedido failed: ${response.status}`)
  }

  return response.json()
}

export async function atualizarStatusCozinha(pedidoId: number, lote: number, status: Extract<StatusCozinha, 'preparando' | 'entregue'>) {
  const response = await apiFetch('/pedidos/cozinha/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pedido_id: pedidoId,
      lote,
      status,
    }),
  })

  if (!response.ok) {
    throw new Error(`Kitchen status update failed: ${response.status}`)
  }

  return response.json()
}
