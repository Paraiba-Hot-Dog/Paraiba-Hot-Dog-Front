import type { CentralOrder, IfoodAction } from './ifoodApi'

export const estadosIfood: Record<string, string> = {
  UNKNOWN: 'Aguardando atualização', PLACED: 'Aguardando confirmação', CONFIRMED: 'Confirmado',
  PREPARATION_STARTED: 'Em preparo', READY_TO_PICKUP: 'Pronto', DISPATCHED: 'Saiu para entrega',
  CONCLUDED: 'Concluído', CANCELLED: 'Cancelado',
}
export const nomesAcoes: Record<IfoodAction, string> = {
  confirm: 'Confirmar pedido', startPreparation: 'Preparar', readyToPickup: 'Marcar pronto',
  dispatch: 'Saiu para entrega', requestCancellation: 'Solicitar cancelamento',
}
export const estadosSincronizacao: Record<string, string> = {
  queued: 'Ação enviada. Aguarde a confirmação.', sending: 'Enviando ação…',
  pending: 'Aguardando confirmação do iFood', indeterminate: 'Confirmação pendente. Estamos verificando com o iFood.',
  confirmed: 'Confirmado', rejected: 'Não autorizado pelo iFood', superseded: 'Atualizado no iFood',
}
export function estadoPedido(order: CentralOrder) {
  if (order.origem === 'proprio') return ({ PLACED: 'Na fila', PREPARATION_STARTED: 'Em preparo', CONCLUDED: 'Finalizado na cozinha', CANCELLED: 'Cancelado' } as Record<string, string>)[order.estado_operacional] ?? 'Em acompanhamento'
  if (order.estado_operacional === 'DISPATCHED' && order.order_type !== 'DELIVERY') return 'Retirado'
  return estadosIfood[order.estado_operacional] ?? 'Em acompanhamento'
}
export const moeda = (value: string | number | undefined) => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export function dataPedido(value?: string | null) {
  if (!value) return null
  return new Date(/(Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
}
export const dataHora = (value?: string | null) => dataPedido(value)?.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) ?? '—'
export const horaPedido = (value?: string | null) => dataPedido(value)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) ?? '—'


export function responsavelEntrega(order: CentralOrder) {
  if (order.order_type === 'TAKEOUT') return 'Retirada pelo cliente na loja'
  if (order.order_type === 'DINE_IN') return 'Consumo na loja'
  if (order.order_type !== 'DELIVERY') return 'Modalidade ainda não informada'
  if (order.delivered_by === 'IFOOD') return 'Responsável pela entrega: iFood'
  if (order.delivered_by === 'MERCHANT') return order.payload?.isTest
    ? 'Pedido de teste gerado com entrega pela loja'
    : 'Responsável pela entrega: restaurante'
  return 'Responsável pela entrega ainda não informado pelo iFood'
}
