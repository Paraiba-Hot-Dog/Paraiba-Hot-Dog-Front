import { apiFetch } from './apiFetch'

export type IfoodAction = 'confirm' | 'startPreparation' | 'readyToPickup' | 'dispatch' | 'requestCancellation'
export type SyncCommand = { id: number; action: IfoodAction; state: string; error: string | null; created_at: string; updated_at: string }
export type OrderItem = { id?: string; name: string; quantity: number; unitPrice?: number; totalPrice?: number; observations?: string; options?: OrderItem[]; customization?: OrderItem[]; groupName?: string }
export type ExternalPayload = {
  isTest?: boolean
  items?: OrderItem[]; observacao?: string; observacoes?: string; extraInfo?: string
  customer?: { name?: string; documentNumber?: string; phone?: { number?: string } }
  delivery?: { deliveryAddress?: { streetName?: string; streetNumber?: string; neighborhood?: string; city?: string; complement?: string; reference?: string }; observations?: string }
  takeout?: { takeoutDateTime?: string; observations?: string }
  schedule?: { deliveryDateTimeStart?: string; deliveryDateTimeEnd?: string }
  payments?: { prepaid?: number; pending?: number; methods?: Array<{ method: string; value: number; prepaid?: boolean; type?: string; cash?: { changeFor?: number }; card?: { brand?: string } }> }
  benefits?: Array<{ value: number; sponsorshipValues?: Array<{ name: string; value: number }> }>
  total?: string | { subTotal?: number; deliveryFee?: number; benefits?: number; additionalFees?: number; orderAmount?: number }
  subtotal?: string; desconto_fidelidade?: string
  itens?: Array<{ produto_nome: string; produto_variacao_nome?: string; preco_unitario?: string; status?: string; quantidade: number; observacao?: string; adicionais?: Array<{ nome: string; preco: string }> }>
  status?: string; forma_pagamento?: string | null
}
export type CentralOrder = {
  id: number; origem: 'proprio' | 'ifood'; unidade_id: number; nome: string
  estado_operacional: string; total: string; created_at: string; synced_at: string | null
  order_type?: string; delivered_by?: string; actions: IfoodAction[]; pending: SyncCommand | null; alerts: string[]
  preparation_start_at?: string | null; confirmation_deadline?: string | null; scheduled?: boolean
  pickup_code?: string | null; driver_assigned?: boolean; dispute?: Dispute | null
  payload?: ExternalPayload; commands?: SyncCommand[]
  events?: Array<{ id: string; code: string; created_at: string; metadata: unknown; error: string | null }>
}
type Money = { currency?: string; value?: string | number }
export type DisputeAlternative = {
  id: string; type: 'REFUND' | 'ADDITIONAL_TIME' | string
  metadata?: { maxAmount?: Money; allowedsAdditionalTimeInMinutes?: number[]; allowedsAdditionalTimeReasons?: string[] }
}
export type Dispute = {
  id: string; type?: string | null; action?: string | null; message?: string | null; expires_at: string
  timeout_action?: string | null; alternatives: DisputeAlternative[]; accept_reasons: string[]
  evidences: Array<{ contentType?: string; url?: string }>
  items: Array<{ id?: string; quantity?: number; reason?: string; amount?: Money }>
  pending: Omit<SyncCommand, 'action'> & { action: string } | null
}
export type Tracking = {
  available: boolean; latitude?: number | null; longitude?: number | null; expectedDelivery?: string | null
  pickupEtaStart?: string | null; deliveryEtaEnd?: string | null; trackDate?: string | null
}
export type CentralPage = {
  items: CentralOrder[]; total: number; skip: number; limit: number
  integration: { enabled: boolean; environment: string; last_poll_at: string | null; error: string | null; abandoned_events?: number }
}
async function json<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : 'Não foi possível consultar os pedidos.')
  }
  return response.json() as Promise<T>
}
export async function centralOrders(params: { unidade_id?: number; origem?: string; estado_operacional?: string; cozinha?: boolean; cozinha_visao?: string; busca?: string; skip?: number; limit?: number }) {
  return json<CentralPage>(await apiFetch('/pedidos/centralizados', { params: { limit: 30, ...params } }))
}
export async function externalOrder(id: number) {
  return json<CentralOrder>(await apiFetch(`/integracoes/ifood/pedidos/${id}`))
}
export async function cancellationReasons(id: number) {
  const body = await json<{ reasons: Array<{ code: string; description: string }> } | Array<{ code: string; description: string }>>(
    await apiFetch(`/integracoes/ifood/pedidos/${id}/motivos-cancelamento`))
  return Array.isArray(body) ? body : body.reasons
}
export async function orderCommand(id: number, action: IfoodAction, key: string, reason?: string) {
  return json<SyncCommand>(await apiFetch(`/integracoes/ifood/pedidos/${id}/acoes/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ reason }),
  }))
}

export type DisputeReply = { reason?: string; alternative_id?: string; amount?: string; minutes?: number }
export async function answerDispute(id: number, disputeId: string, action: 'accept' | 'reject' | 'alternative', key: string, body: DisputeReply) {
  return json<SyncCommand>(await apiFetch(`/integracoes/ifood/pedidos/${id}/disputas/${encodeURIComponent(disputeId)}/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body),
  }))
}
export async function validatePickupCode(id: number, code: string) {
  return json<{ valid: boolean }>(await apiFetch(`/integracoes/ifood/pedidos/${id}/validar-coleta`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }),
  }))
}
export async function orderTracking(id: number) {
  return json<Tracking>(await apiFetch(`/integracoes/ifood/pedidos/${id}/rastreamento`))
}

export async function localOrder(id: number) {
  return json<CentralOrder>(await apiFetch(`/pedidos/centralizados/proprio/${id}`))
}
