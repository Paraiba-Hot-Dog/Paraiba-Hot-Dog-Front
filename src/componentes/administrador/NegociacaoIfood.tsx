import { useRef, useState } from 'react'
import { Handshake } from 'lucide-react'
import { answerDispute, type Dispute, type DisputeReply, type SyncCommand } from '../../servicos/ifoodApi'
import { dataHora, dataPedido, estadosSincronizacao, moeda } from '../../servicos/pedidoApresentacao'
import { tempoRestante, useAgora } from '../../servicos/useAgora'

import EvidenciaIfood from './EvidenciaIfood'
import { reaisDoHandshake } from '../../servicos/valoresIfood'

const controle = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-amarelo disabled:opacity-50'
const tipos: Record<string, string> = {
  AFTER_DELIVERY: 'Problema relatado após a entrega', AFTER_DELIVERY_PARTIALLY: 'Problema em parte dos itens',
  PREPARATION_TIME: 'Cliente pede cancelamento pela demora no preparo', DELAY: 'Cliente pede cancelamento por atraso',
}
const motivos: Record<string, string> = {
  HIGH_STORE_DEMAND: 'Alta demanda na loja', STORE_SYSTEM_ISSUES: 'Problemas no sistema da loja',
  STORE_INTERNAL_DIFFICULTIES: 'Dificuldades internas da loja', LACK_OF_DRIVERS: 'Falta de entregadores',
  OTHER_REASONS: 'Outros motivos', OPERATIONAL_ISSUES: 'Problemas operacionais',
  ORDER_OUT_FOR_DELIVERY: 'Pedido já saiu para entrega', DRIVER_IS_ALREADY_AT_THE_ADDRESS: 'Entregador já está no endereço',
}
const nome = (code: string) => motivos[code] ?? code

export default function NegociacaoIfood({ pedidoId, dispute, podeResponder, onEnviado }: {
  pedidoId: number; dispute: Dispute; podeResponder: boolean; onEnviado: (command: SyncCommand) => void
}) {
  const agora = useAgora()
  const [modo, setModo] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [amount, setAmount] = useState('')
  const [minutes, setMinutes] = useState('')
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const keys = useRef(new Map<string, string>())
  const restante = (dataPedido(dispute.expires_at)?.getTime() ?? 0) - agora
  const expirada = restante <= 0
  const alternativa = dispute.alternatives.find((a) => a.id === modo)

  function abrir(value: string | null) { setModo(value); setReason(''); setAmount(''); setMinutes(''); setErro('') }
  async function enviar(action: 'accept' | 'reject' | 'alternative', body: DisputeReply) {
    setBusy(true); setErro('')
    const name = JSON.stringify([dispute.id, action, body])
    const key = keys.current.get(name) ?? crypto.randomUUID()
    keys.current.set(name, key)
    try {
      const command = await answerDispute(pedidoId, dispute.id, action, key, body)
      keys.current.delete(name)
      abrir(null); onEnviado(command)
    } catch (err) { setErro(err instanceof Error ? err.message : 'Não foi possível enviar a resposta.') }
    finally { setBusy(false) }
  }

  const max = reaisDoHandshake(alternativa?.metadata?.maxAmount?.value)
  const monetaria = alternativa?.type === 'REFUND' || alternativa?.type === 'BENEFIT'
  const valido = modo === 'accept' ? dispute.accept_reasons.length === 0 || Boolean(reason)
    : modo === 'reject' ? Boolean(reason.trim())
    : monetaria ? /^\d+(?:\.\d{1,2})?$/.test(amount) && Number(amount) > 0 && Number(amount) <= max
    : alternativa?.type === 'ADDITIONAL_TIME' ? Boolean(minutes && reason) : false
  function confirmar() {
    if (modo === 'accept') void enviar('accept', reason ? { reason } : {})
    else if (modo === 'reject') void enviar('reject', { reason: reason.trim() })
    else if (alternativa && monetaria) void enviar('alternative', { alternative_id: alternativa.id, amount })
    else if (alternativa) void enviar('alternative', { alternative_id: alternativa.id, minutes: Number(minutes), reason })
  }

  return <section aria-labelledby="negociacao-titulo" className="rounded-xl border-2 border-red-200 bg-red-50/40 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 id="negociacao-titulo" className="flex items-center gap-2 font-semibold text-red-900"><Handshake size={18} /> Negociação aberta pelo cliente</h3>
      <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${expirada ? 'bg-slate-200 text-slate-700' : restante < 2 * 60_000 ? 'bg-red-600 text-white' : 'bg-white text-red-800'}`}>{expirada ? 'Prazo encerrado' : `Responder em ${tempoRestante(restante)}`}</span>
    </div>
    <p className="mt-2 text-sm">{tipos[dispute.type ?? ''] ?? 'Solicitação do cliente'}{dispute.action === 'PARTIAL_CANCELLATION' ? ' · cancelamento parcial' : dispute.action === 'CANCELLATION' ? ' · cancelamento' : ''}</p>
    {dispute.message && <p className="mt-2 rounded-lg bg-white p-3 text-sm italic">“{dispute.message}”</p>}
    {dispute.items.length > 0 && <ul className="mt-2 space-y-1 text-sm">{dispute.items.map((item, i) => <li key={item.id ?? i}>{item.quantity ?? 1} item(ns) · {item.reason ?? 'sem motivo'}{item.amount?.value !== undefined && ` · ${moeda(reaisDoHandshake(item.amount.value))}`}</li>)}</ul>}
    {dispute.evidences.length > 0 && <div className="mt-2 grid gap-2">{dispute.evidences.map((_evidence, i) => <EvidenciaIfood key={`${dispute.id}:${i}`} pedidoId={pedidoId} disputaId={dispute.id} indice={i} />)}</div>}
    <p className="mt-2 text-xs text-slate-600">Prazo: {dataHora(dispute.expires_at)} · Sem resposta: {dispute.timeout_action === 'REJECT_CANCELLATION' ? 'a solicitação é recusada automaticamente' : 'o iFood decide automaticamente (geralmente com reembolso)'}.</p>

    {dispute.pending ? <p role="status" className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{estadosSincronizacao[dispute.pending.state] ?? 'Resposta em acompanhamento'}{dispute.pending.error && <span className="block">{dispute.pending.error}</span>}</p>
      : !podeResponder ? <p className="mt-3 text-sm text-slate-600">Peça a um responsável pelos pedidos para responder.</p>
      : !expirada && <>
        {modo === null && <div className="mt-3 flex flex-wrap gap-2">
          <button className={controle} onClick={() => abrir('accept')}>Aceitar</button>
          {dispute.alternatives.map((a) => <button key={a.id} className={controle} onClick={() => abrir(a.id)}>{a.type === 'REFUND' ? 'Propor reembolso' : a.type === 'BENEFIT' ? 'Propor crédito' : a.type === 'ADDITIONAL_TIME' ? 'Propor mais tempo' : 'Contraproposta'}</button>)}
          <button className={`${controle} text-red-700`} onClick={() => abrir('reject')}>Recusar</button>
        </div>}
        {modo !== null && <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
          {modo === 'accept' && (dispute.accept_reasons.length > 0
            ? <label className="block text-sm font-semibold">Motivo<select value={reason} onChange={(e) => setReason(e.target.value)} className={`${controle} mt-1 w-full font-normal`}><option value="">Selecione</option>{dispute.accept_reasons.map((r) => <option key={r} value={r}>{nome(r)}</option>)}</select></label>
            : <p className="text-sm">Aceitar a solicitação do cliente{dispute.action?.includes('CANCELLATION') ? ' cancela o pedido (ou os itens indicados) no iFood' : ''}.</p>)}
          {modo === 'reject' && <label className="block text-sm font-semibold">Motivo da recusa<textarea rows={2} maxLength={250} value={reason} onChange={(e) => setReason(e.target.value)} className={`${controle} mt-1 w-full font-normal`} /></label>}
          {monetaria && <label className="block text-sm font-semibold">{alternativa?.type === 'BENEFIT' ? 'Valor do crédito' : 'Valor do reembolso'} (até {moeda(max)})<input type="number" inputMode="decimal" min="0.01" max={max} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${controle} mt-1 w-full font-normal`} /></label>}
          {alternativa?.type === 'ADDITIONAL_TIME' && <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Tempo adicional<select value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${controle} mt-1 w-full font-normal`}><option value="">Selecione</option>{alternativa.metadata?.allowedsAdditionalTimeInMinutes?.map((m) => <option key={m} value={m}>{m} minutos</option>)}</select></label>
            <label className="block text-sm font-semibold">Motivo<select value={reason} onChange={(e) => setReason(e.target.value)} className={`${controle} mt-1 w-full font-normal`}><option value="">Selecione</option>{alternativa.metadata?.allowedsAdditionalTimeReasons?.map((r) => <option key={r} value={r}>{nome(r)}</option>)}</select></label>
          </div>}
          {alternativa && !['REFUND', 'BENEFIT', 'ADDITIONAL_TIME'].includes(alternativa.type) && <p className="text-sm">Esta contraproposta precisa ser respondida no Gestor iFood.</p>}
          <div className="flex gap-2"><button className={`${controle} border-amarelo bg-amarelo/90 font-semibold`} disabled={busy || !valido} onClick={confirmar}>Enviar resposta</button><button className={controle} disabled={busy} onClick={() => abrir(null)}>Voltar</button></div>
        </div>}
      </>}
    {erro && <p role="alert" className="mt-2 text-sm text-red-700">{erro}</p>}
  </section>
}
