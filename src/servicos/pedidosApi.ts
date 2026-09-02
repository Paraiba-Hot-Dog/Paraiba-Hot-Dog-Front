import { apiFetch } from './apiFetch'

export type FormaPagamentoApi = 'pix' | 'credito' | 'debito' | 'dinheiro'

export type PedidoApi = {
  id: number
  unidade_id: number
  nome_comanda: string
  cliente_id: number | null
  status: string
  subtotal: string
  desconto_fidelidade: string
  total: string
  pontos_fidelidade_utilizados: number
  created_at: string
  itens: Array<{
    id: number
    produto_variacao_id: number
    produto_nome: string
    produto_variacao_nome: string | null
    quantidade: number
    preco_unitario: string
    observacao: string | null
    lote: number
    status: 'aberto' | 'preparando' | 'entregue' | 'cancelado'
  }>
}

export async function atualizarObservacaoItemPedidoApi(itemId: number, observacao: string | null) {
  const response = await apiFetch(`/pedidos/itens/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacao }),
  })

  if (!response.ok) throw await erroApi(response, 'atualizar observação do item')
  return (await response.json()) as PedidoApi
}

export async function cancelarItemPedidoApi(itemId: number, quantidade?: number) {
  const response = await apiFetch(`/pedidos/itens/${itemId}/cancelar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      motivo_cancelamento: quantidade ? 'Quantidade alterada no caixa' : 'Item removido no caixa',
      quantidade,
    }),
  })

  if (!response.ok) throw await erroApi(response, 'alterar item do pedido')
  return (await response.json()) as PedidoApi
}

export async function aumentarQuantidadeItemPedidoApi(itemId: number, quantidade = 1) {
  const response = await apiFetch(`/pedidos/itens/${itemId}/aumentar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantidade }),
  })

  if (!response.ok) throw await erroApi(response, 'aumentar quantidade do item')
  return (await response.json()) as PedidoApi
}

export type ItemPedidoPayload = {
  produto_variacao_id: number
  quantidade: number
  observacao: string | null
  adicional_ids: number[]
}

export async function criarPedidoApi(data: {
  unidade_id: number
  nome_comanda: string
  cliente_id: number | null
  usar_desconto_fidelidade: boolean
  itens: ItemPedidoPayload[]
}) {
  const response = await apiFetch('/pedidos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) throw await erroApi(response, 'criar pedido')
  return (await response.json()) as PedidoApi
}

export async function listarPedidosAbertosApi(unidadeId?: number) {
  const response = await apiFetch('/pedidos/', {
    params: { unidade_id: unidadeId, limit: 100 },
  })

  if (!response.ok) throw await erroApi(response, 'listar pedidos abertos')
  return (await response.json()) as PedidoApi[]
}

export async function adicionarItensPedidoApi(pedidoId: number, itens: ItemPedidoPayload[]) {
  const response = await apiFetch(`/pedidos/${pedidoId}/itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itens }),
  })

  if (!response.ok) throw await erroApi(response, 'adicionar itens ao pedido')
  return (await response.json()) as PedidoApi
}

export async function finalizarPedidoApi(pedidoId: number, formaPagamento: FormaPagamentoApi) {
  const response = await apiFetch(`/pedidos/${pedidoId}/finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forma_pagamento: formaPagamento }),
  })

  if (!response.ok) throw await erroApi(response, 'finalizar pedido')
  return (await response.json()) as PedidoApi
}

async function erroApi(response: Response, operacao: string) {
  const body = await response.json().catch(() => null) as { detail?: string } | null
  return new Error(body?.detail ?? `Erro ${response.status} ao ${operacao}`)
}
