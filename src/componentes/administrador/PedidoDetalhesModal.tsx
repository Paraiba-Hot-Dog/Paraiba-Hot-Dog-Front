import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Clock3, CreditCard, MapPin, Package, Phone, Truck, UserRound, X } from 'lucide-react'
import logoIfood from '../../imagens/social/ifood.svg'
import { useAuth } from '../../contextos/useAuth'
import { cancellationReasons, externalOrder, localOrder, orderCommand, type CentralOrder, type IfoodAction } from '../../servicos/ifoodApi'
import { dataHora, estadoPedido, estadosIfood, estadosSincronizacao, moeda, nomesAcoes, responsavelEntrega } from '../../servicos/pedidoApresentacao'

const controle = 'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-amarelo disabled:cursor-not-allowed disabled:opacity-50'
function detalheEvento(metadata: unknown, name: string): string | null {
  if (!metadata || typeof metadata !== 'object') return null
  const value = (metadata as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : null
}

const eventos: Record<string, string> = {
  ...estadosIfood, ASSIGN_DRIVER: 'Entregador designado', GOING_TO_ORIGIN: 'Entregador a caminho da loja',
  ARRIVED_AT_ORIGIN: 'Entregador chegou à loja', COLLECTED: 'Pedido coletado', ARRIVED_AT_DESTINATION: 'Entregador chegou ao destino',
  CANCELLATION_REQUESTED: 'Cancelamento solicitado', CANCELLATION_REQUEST_FAILED: 'Cancelamento não autorizado',
  ORDER_PATCHED: 'Pedido atualizado', HANDSHAKE_DISPUTE: 'Solicitação do cliente — conferir no Gestor iFood',
  HANDSHAKE_SETTLEMENT: 'Solicitação resolvida', RECOMMENDED_PREPARATION_START: 'Horário de preparo atualizado',
}

export default function PedidoDetalhesModal({ pedido, onFechar, onAtualizar }: {
  pedido: CentralOrder; onFechar: () => void; onAtualizar?: () => void
}) {
  const { hasRole, hasPermission } = useAuth()
  const [order, setOrder] = useState(pedido)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [busy, setBusy] = useState(false)
  const [reasons, setReasons] = useState<Array<{ code: string; description: string }> | null>(null)
  const [reason, setReason] = useState('')
  const modal = useRef<HTMLDialogElement>(null)
  const busyRef = useRef(false)
  const keys = useRef(new Map<string, string>())
  const callback = useRef(onAtualizar)
  const requestId = useRef(0)
  const canManage = hasRole('administrador') || hasPermission('anotar_pedidos')

  useEffect(() => { callback.current = onAtualizar }, [onAtualizar])
  useEffect(() => {
    const dialog = modal.current
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  useEffect(() => {
    let alive = true
    let running = false
    async function load() {
      if (running || document.hidden || busyRef.current) return
      running = true
      const request = ++requestId.current
      try {
        const data = await (pedido.origem === 'ifood' ? externalOrder(pedido.id) : localOrder(pedido.id))
        if (alive && request === requestId.current) { setOrder(data); setErro('') }
      } catch (err) {
        if (alive) setErro(err instanceof Error ? err.message : 'Não foi possível carregar os detalhes.')
      } finally { running = false; if (alive) setLoading(false) }
    }
    void load()
    const timer = window.setInterval(() => { void load() }, 5000)
    return () => { alive = false; window.clearInterval(timer) }
  }, [pedido.id, pedido.origem])

  async function executar(action: IfoodAction) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setErro(''); setMensagem(''); requestId.current++
    try {
      if (action === 'requestCancellation' && reasons === null) {
        setReasons(await cancellationReasons(order.id)); return
      }
      if (action === 'requestCancellation' && !reason) return
      const name = `${action}:${reason}`
      const key = keys.current.get(name) ?? crypto.randomUUID()
      keys.current.set(name, key)
      const command = await orderCommand(order.id, action, key, action === 'requestCancellation' ? reason : undefined)
      keys.current.delete(name)
      setOrder((current) => ({ ...current, pending: command, actions: [] }))
      setMensagem(estadosSincronizacao[command.state] ?? 'Solicitação recebida.')
      setReasons(null)
      callback.current?.()
      setOrder(await externalOrder(order.id))
    } catch (err) { setErro(err instanceof Error ? err.message : 'Não foi possível enviar a ação.') }
    finally { busyRef.current = false; setBusy(false) }
  }

  const payload = order.payload
  const address = payload?.delivery?.deliveryAddress
  const totals = typeof payload?.total === 'object' ? payload.total : null
  const driver = order.events?.find((event) => event.code === 'ASSIGN_DRIVER')
  const driverName = detalheEvento(driver?.metadata, 'workerName')
  const allowed = order.actions.filter((a) => canManage || a === 'startPreparation' || a === 'readyToPickup')
  return <dialog ref={modal} aria-labelledby="pedido-detalhes-titulo" onCancel={onFechar}
    onClick={(e) => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onFechar() } }}
    className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 font-barlow text-preto-v1 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm">
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
      <div><div className="mb-1 flex items-center gap-2">{order.origem === 'ifood' ? <img src={logoIfood} alt="iFood" className="h-7 w-12 object-contain" /> : <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurante</span>}{order.origem === 'ifood' && <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">TESTE</span>}</div><h2 id="pedido-detalhes-titulo" className="font-barlow-condensed text-2xl font-bold">{order.nome}{order.origem === 'proprio' && ` · #${order.id}`}</h2><p className="mt-1 text-sm text-slate-500">{dataHora(order.created_at)} · {estadoPedido(order)}</p></div>
      <button type="button" aria-label="Fechar detalhes" onClick={onFechar} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-amarelo"><X size={21} /></button>
    </header>
    <div className="space-y-6 px-6 py-5">
      {loading && <p role="status" className="text-sm text-slate-500">Atualizando detalhes…</p>}
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
      {mensagem && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{mensagem}</p>}
      {payload && <><section><h3 className="mb-3 flex items-center gap-2 font-semibold"><Package size={17} /> Itens do pedido</h3><ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
        {payload?.items?.map((item, i) => <li key={item.id ?? i} className="py-3"><div className="flex justify-between gap-3"><strong className="text-sm">{item.quantity} × {item.name}</strong><span className="shrink-0 text-sm">{moeda(item.totalPrice ?? (item.unitPrice ?? 0) * item.quantity)}</span></div>{item.options?.map((o, j) => <p key={j} className="mt-1 text-sm text-slate-600">+ {o.quantity} × {o.name}</p>)}{item.observations && <p className="mt-2 text-sm font-semibold text-red-700">{item.observations}</p>}</li>)}
        {payload?.itens?.map((item, i) => <li key={i} className="py-3"><div className="flex justify-between gap-3"><strong className="text-sm">{item.quantidade} × {item.produto_nome}{item.produto_variacao_nome && ` · ${item.produto_variacao_nome}`}</strong><span className="text-sm">{moeda(Number(item.preco_unitario ?? 0) * item.quantidade)}</span></div>{item.status === 'cancelado' && <span className="text-xs text-red-700">Item cancelado</span>}{item.adicionais?.map((a, j) => <p key={j} className="mt-1 text-sm text-slate-600">+ {a.nome} · {moeda(a.preco)}</p>)}{item.observacao && <p className="mt-2 text-sm font-semibold text-red-700">{item.observacao}</p>}</li>)}
      </ul>{(payload?.observacao || payload?.extraInfo) && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm"><strong>Observações:</strong> {payload.observacao ?? payload.extraInfo}</p>}</section>
      {payload?.customer && <section className="rounded-xl bg-slate-50 p-4"><h3 className="mb-2 flex items-center gap-2 font-semibold"><UserRound size={17} /> Cliente</h3><p className="text-sm">{payload.customer.name ?? 'Nome não informado'}</p>{payload.customer.phone?.number && <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Phone size={14} />{payload.customer.phone.number}</p>}{payload.customer.documentNumber && <p className="mt-1 text-xs text-slate-500">Documento: {payload.customer.documentNumber}</p>}</section>}
      {order.origem === 'ifood' && <section><h3 className="mb-2 flex items-center gap-2 font-semibold"><Truck size={17} /> Entrega ou retirada</h3><p className="text-sm">{responsavelEntrega(order)}</p>{order.order_type === 'DELIVERY' && order.delivered_by === 'IFOOD' && <p className="mt-2 text-xs text-slate-500">A saída para entrega será atualizada automaticamente pelo iFood.</p>}{order.order_type === 'DELIVERY' && order.delivered_by === 'MERCHANT' && payload?.isTest && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Este teste veio do iFood com entrega própria da loja. Para testar a entrega por entregadores do iFood, configure a loja de teste para Entrega iFood no Portal do Desenvolvedor e gere um novo pedido.</p>}{driverName && <p className="mt-2 text-sm text-slate-600">Entregador: {driverName}</p>}{address && <p className="mt-2 flex gap-2 text-sm text-slate-600"><MapPin size={16} className="shrink-0" /><span>{address.streetName}, {address.streetNumber} · {address.neighborhood}, {address.city}<br />{[address.complement, address.reference].filter(Boolean).join(' · ')}</span></p>}{order.preparation_start_at && <p className="mt-2 text-sm">Preparo previsto: {dataHora(order.preparation_start_at)}</p>}{order.confirmation_deadline && <p className="mt-2 text-sm font-semibold text-amber-800">Confirmar até {dataHora(order.confirmation_deadline)}</p>}</section>}
      <section><h3 className="mb-3 flex items-center gap-2 font-semibold"><CreditCard size={17} /> Pagamento</h3>{order.origem === 'proprio' ? <p className="text-sm text-slate-600">{payload?.status === 'pago' ? 'Pago' : payload?.status === 'cancelado' ? 'Cancelado' : 'Em aberto'} · {payload?.forma_pagamento ?? 'Forma não informada'}</p> : payload?.payments?.methods?.map((p, i) => <div key={i} className="mb-2 text-sm"><p>{p.method} {p.card?.brand} · {moeda(p.value)} · {p.prepaid || p.type === 'ONLINE' ? 'Pago online' : 'Pagamento na entrega/loja'}</p>{Boolean(p.cash?.changeFor) && <p className="text-slate-500">Troco para {moeda(p.cash?.changeFor)} · devolver {moeda(Math.max(0, (p.cash?.changeFor ?? 0) - p.value))}</p>}</div>)}
        {totals && <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-slate-500"><dt>Itens</dt><dd className="text-right">{moeda(totals.subTotal)}</dd><dt>Entrega</dt><dd className="text-right">{moeda(totals.deliveryFee)}</dd><dt>Descontos</dt><dd className="text-right">{moeda(totals.benefits)}</dd><dt>Taxas</dt><dd className="text-right">{moeda(totals.additionalFees)}</dd></dl>}{payload?.benefits?.map((b, i) => <p key={i} className="mt-2 text-xs text-slate-500">Desconto de {moeda(b.value)} · {b.sponsorshipValues?.map((s) => `${s.name}: ${moeda(s.value)}`).join(' · ')}</p>)}<div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 font-semibold"><span>Total do pedido</span><span className="text-xl">{moeda(order.total)}</span></div></section>
      </>}
      {order.pending && <p role="status" className="flex gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-800"><Clock3 size={17} className="shrink-0" /><span>{estadosSincronizacao[order.pending.state]}{order.pending.error && <span className="block">{order.pending.error}</span>}</span></p>}
      {order.alerts.length > 0 && <div className="space-y-2 rounded-xl bg-amber-50 p-3">{order.alerts.map((a) => <p key={a} className="flex gap-2 text-sm text-amber-900"><AlertCircle size={16} className="shrink-0" />{a.startsWith('Evento requer') ? 'Há uma atualização que precisa ser conferida no Gestor do iFood.' : a}</p>)}</div>}
      {reasons !== null ? <section className="rounded-xl border border-red-100 bg-red-50/50 p-4"><label className="block text-sm font-semibold" htmlFor="motivo-ifood">Motivo do cancelamento</label><select id="motivo-ifood" value={reason} onChange={(e) => setReason(e.target.value)} className={`${controle} mt-2 w-full`}><option value="">Selecione um motivo</option>{reasons.map((r) => <option key={r.code} value={r.code}>{r.description}</option>)}</select>{reasons.length === 0 && <p className="mt-2 text-sm">O iFood não disponibilizou motivos de cancelamento para este pedido.</p>}<div className="mt-3 flex gap-2"><button className={`${controle} text-red-700`} disabled={busy || !reason} onClick={() => { void executar('requestCancellation') }}>Solicitar cancelamento</button><button className={controle} disabled={busy} onClick={() => { setReasons(null); setReason('') }}>Voltar</button></div></section> : allowed.length > 0 && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">{allowed.map((a) => <button key={a} className={`${controle} ${a === 'requestCancellation' ? 'text-red-700' : 'border-amarelo bg-amarelo/90 hover:bg-amarelo'}`} disabled={busy || loading} onClick={() => { void executar(a) }}>{nomesAcoes[a]}</button>)}</div>}
      {(order.events?.length || order.commands?.length) ? <details className="border-t border-slate-100 pt-4"><summary className="cursor-pointer text-sm font-semibold">Histórico do pedido</summary><ol className="mt-3 space-y-3 border-l border-slate-200 pl-4">{order.events?.map((e) => <li key={e.id} className="text-sm"><p>{eventos[e.code] ?? 'Atualização recebida do iFood'}</p><p className="text-xs text-slate-500">{dataHora(e.created_at)}</p>{e.code === 'CANCELLED' && detalheEvento(e.metadata, 'CANCEL_REASON') && <p className="mt-1 text-xs text-slate-500">Motivo: {detalheEvento(e.metadata, 'CANCEL_REASON')}</p>}{e.error && <p className="text-xs text-red-700">{e.error}</p>}</li>)}</ol>{order.commands?.map((c) => <p key={c.id} className="mt-3 text-xs text-slate-500">{dataHora(c.created_at)} · {nomesAcoes[c.action]} · {estadosSincronizacao[c.state] ?? 'Em acompanhamento'}{c.error && ` · ${c.error}`}</p>)}</details> : null}
    </div>
  </dialog>
}
