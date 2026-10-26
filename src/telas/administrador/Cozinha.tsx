import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChefHat, Clock3, Info, LoaderCircle, Printer, Search, Utensils, X } from 'lucide-react'
import logoIfood from '../../imagens/social/ifood.svg'
import BarraDeNavegacaoAdmin, { CLASSE_OFFSET_BARRA_ADMIN } from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import PedidoDetalhesModal from '../../componentes/administrador/PedidoDetalhesModal'
import { PrazoConfirmacao } from '../../componentes/administrador/PrazoIfood'
import { imprimirComanda } from '../../servicos/comanda'
import { useAuth } from '../../contextos/useAuth'
import { listarUnidades, type Unidade } from '../../servicos/api'
import { atualizarStatusCozinha, cancelarPedido, listarCozinha, listarPedidosCancelados, type CozinhaItem, type PedidoApi, type StatusCozinha } from '../../servicos/cozinhaApi'
import { centralOrders, localOrder, orderCommand, type CentralOrder, type IfoodAction } from '../../servicos/ifoodApi'
import { dataPedido, estadoPedido, estadosSincronizacao, horaPedido } from '../../servicos/pedidoApresentacao'

type Aba = 'fila' | 'prontos' | 'cancelados'
type Item = { nome: string; quantidade: number; adicionais: string[]; observacao?: string | null }
type PedidoCozinha = {
  key: string; id: number; origem: 'proprio' | 'ifood'; nome: string; lote: number; createdAt: string
  status: StatusCozinha; itens: Item[]; externo?: CentralOrder
}
const abas: Array<{ id: Aba; nome: string }> = [{ id: 'fila', nome: 'Fila de preparo' }, { id: 'prontos', nome: 'Prontos / entregues' }, { id: 'cancelados', nome: 'Cancelados' }]
const controle = 'h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-amarelo focus:ring-2 focus:ring-amarelo/20'
const normalizar = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

function agrupar(items: CozinhaItem[]): PedidoCozinha[] {
  const grupos = new Map<string, PedidoCozinha>()
  for (const item of items) {
    const key = `proprio-${item.pedido_id}-${item.lote}`
    const group = grupos.get(key) ?? { key, id: item.pedido_id, origem: 'proprio', nome: item.nome_comanda,
      lote: item.lote, createdAt: item.created_at ?? '', status: item.status, itens: [] }
    if (item.status === 'preparando') group.status = 'preparando'
    else if (item.status === 'aberto' && group.status === 'entregue') group.status = 'aberto'
    group.itens.push({ nome: [item.produto_nome, item.produto_variacao_nome?.toLowerCase() === 'unico' ? null : item.produto_variacao_nome].filter(Boolean).join(' · '), quantidade: item.quantidade, adicionais: item.adicionais.map((a) => a.nome), observacao: item.observacao })
    grupos.set(key, group)
  }
  return Array.from(grupos.values())
}
function canceladosLocais(orders: PedidoApi[]): PedidoCozinha[] {
  return orders.flatMap((order) => agrupar(order.itens.map((item) => ({ ...item, pedido_id: order.id, nome_comanda: order.nome_comanda,
    created_at: order.created_at, produto_id: 0, produto_variacao_id: 0, status: 'cancelado', observacao: item.observacao ?? null,
    produto_variacao_nome: item.produto_variacao_nome ?? null }))))
}
function externoParaCard(order: CentralOrder): PedidoCozinha {
  return { key: `ifood-${order.id}`, id: order.id, origem: 'ifood', nome: order.nome, lote: 1, createdAt: order.created_at,
    status: order.estado_operacional === 'CANCELLED' ? 'cancelado' : ['READY_TO_PICKUP', 'DISPATCHED', 'CONCLUDED'].includes(order.estado_operacional) ? 'entregue' : order.estado_operacional === 'PREPARATION_STARTED' ? 'preparando' : 'aberto',
    externo: order, itens: (order.payload?.items ?? []).map((item) => ({ nome: item.name, quantidade: item.quantity,
      adicionais: (item.options ?? []).map((option) => `${option.quantity} × ${option.name}`), observacao: item.observations })) }
}
async function carregarExternos(unit: number, aba: Aba): Promise<{ items: PedidoCozinha[]; warning: string }> {
  const first = await centralOrders({ unidade_id: unit, origem: 'ifood', cozinha: true, cozinha_visao: aba, limit: 100 })
  const items = [...first.items]
  // Fetch the whole active queue; completed history follows the local 100-record limit.
  if (aba === 'fila') {
    for (let skip = 100; skip < first.total; skip += 100) {
      const page = await centralOrders({ unidade_id: unit, origem: 'ifood', cozinha: true, cozinha_visao: aba, limit: 100, skip })
      items.push(...page.items)
    }
  }
  const lastPoll = dataPedido(first.integration.last_poll_at)?.getTime()
  const stale = first.integration.enabled && (Boolean(first.integration.error) || !lastPoll || Date.now() - lastPoll > 90000)
  return {
    items: Array.from(new Map(items.map((order) => [order.id, order])).values()).map(externoParaCard),
    warning: stale ? 'A sincronização do iFood está atrasada. Confira os pedidos no Gestor antes de agir.' : '',
  }
}

function CancelarRestaurante({ pedido, fechar, confirmar }: { pedido: PedidoCozinha; fechar: () => void; confirmar: (motivo: string) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close() }, [])
  return <dialog ref={dialog} onCancel={(e) => { if (busy) e.preventDefault(); else fechar() }} aria-labelledby="cancelar-restaurante-titulo" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 p-6 font-barlow shadow-xl backdrop:bg-black/45">
    <h2 id="cancelar-restaurante-titulo" className="font-barlow-condensed text-2xl font-bold">Cancelar {pedido.nome}?</h2><p className="mt-2 text-sm text-slate-500">O pedido será removido da fila. Informe o motivo para continuar.</p><label className="mt-5 block text-sm font-semibold" htmlFor="motivo-restaurante">Motivo do cancelamento</label><textarea autoFocus id="motivo-restaurante" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-amarelo" />{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}<div className="mt-5 flex gap-3"><button disabled={busy} className={`${controle} flex-1`} onClick={fechar}>Manter pedido</button><button disabled={busy || !motivo.trim()} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={async () => { setBusy(true); try { await confirmar(motivo.trim()) } catch { setError('Não foi possível cancelar o pedido.'); setBusy(false) } }}>Cancelar pedido</button></div>
  </dialog>
}

function PedidoCard({ pedido, busy, detailBusy, preparar, pronto, cancelar, detalhes }: {
  pedido: PedidoCozinha; busy: boolean; detailBusy: boolean; preparar: () => void; pronto: () => void; cancelar: () => void; detalhes: () => void
}) {
  const external = pedido.externo
  const closed = pedido.status === 'entregue' || pedido.status === 'cancelado'
  const pending = external?.pending
  const canPrepare = external ? external.actions.includes('startPreparation') : pedido.status === 'aberto'
  const canReady = external ? external.actions.includes('readyToPickup') : !closed
  const status = external ? estadoPedido(external) : pedido.status === 'preparando' ? 'Em preparo' : pedido.status === 'entregue' ? 'Entregue' : pedido.status === 'cancelado' ? 'Cancelado' : 'Na fila'
  return <article className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${pedido.status === 'preparando' ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-slate-200'}`}>
    <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3.5"><div className="min-w-0"><div className="mb-1 flex h-6 items-center gap-2">{pedido.origem === 'ifood' ? <img src={logoIfood} alt="iFood" className="h-7 w-11 object-contain" /> : <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Utensils size={12} /> Restaurante</span>}{pedido.origem === 'ifood' && <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700">Teste</span>}</div><h2 className="truncate font-barlow-condensed text-xl font-bold">{pedido.nome}</h2><p className="mt-1 text-xs text-slate-400">{pedido.origem === 'proprio' && `#${pedido.id} · Lote ${pedido.lote} · `}{horaPedido(pedido.createdAt)}</p></div><div className="flex shrink-0">{external?.payload?.items && <button type="button" aria-label={`Imprimir comanda de ${pedido.nome}`} title="Imprimir comanda" onClick={() => imprimirComanda(external)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-preto-v1 focus-visible:outline-2 focus-visible:outline-amarelo"><Printer size={19} /></button>}<button type="button" aria-label={`Ver detalhes de ${pedido.nome}`} title="Ver detalhes do pedido" disabled={detailBusy} onClick={detalhes} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-preto-v1 focus-visible:outline-2 focus-visible:outline-amarelo">{detailBusy ? <LoaderCircle size={19} className="animate-spin" /> : <Info size={19} />}</button></div></header>
    <div className="flex-1 px-4 py-4"><ul className="space-y-4">{pedido.itens.map((item, i) => <li key={i}><div className="flex items-start gap-2.5"><span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-slate-100 px-1 text-xs font-bold">{item.quantidade}</span><p className="pt-0.5 text-sm font-semibold leading-snug">{item.nome}</p></div>{item.adicionais.length > 0 && <ul className="mt-1.5 space-y-1 pl-8 text-xs text-slate-500">{item.adicionais.map((a, j) => <li key={j}>+ {a}</li>)}</ul>}{item.observacao && <p className="mt-2 rounded-md bg-red-50 px-2.5 py-2 text-xs font-semibold leading-relaxed whitespace-pre-line text-red-700">{item.observacao}</p>}</li>)}</ul>{pedido.itens.length === 0 && <p className="text-xs text-slate-500">Consulte os detalhes para conferir este pedido.</p>}</div>
    <div className="px-4 pb-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${pedido.status === 'cancelado' ? 'bg-red-50 text-red-700' : closed ? 'bg-emerald-50 text-emerald-700' : pedido.status === 'preparando' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>{pending && <p role="status" className="mt-2 flex items-start gap-1.5 text-xs text-blue-700"><Clock3 size={13} className="shrink-0" />{estadosSincronizacao[pending.state]}</p>}{external?.estado_operacional === 'PLACED' && <div className="mt-2"><PrazoConfirmacao prazo={external.confirmation_deadline} agendado={external.scheduled} compacto /></div>}{external?.dispute && <p className="mt-2 text-xs font-semibold text-red-700">Negociação aberta pelo cliente. Abra os detalhes para responder.</p>}{external?.alerts.length && !external.dispute ? <p className="mt-2 text-xs text-amber-800">Há uma atualização importante nos detalhes.</p> : null}</div>
    {!closed && <footer className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 p-3"><button disabled={busy || !canPrepare} onClick={preparar} className="min-h-10 flex-1 rounded-lg border border-amber-200 bg-amarelo/20 px-2 text-xs font-semibold disabled:opacity-40">Preparar</button><button disabled={busy || !canReady} onClick={pronto} className="min-h-10 flex-1 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white disabled:opacity-40">{pedido.origem === 'ifood' ? 'Marcar pronto' : 'Entregue'}</button>{pedido.origem === 'proprio' && <button disabled={busy} onClick={cancelar} className="min-h-10 rounded-lg border border-red-100 px-2 text-xs font-semibold text-red-700 disabled:opacity-40">Cancelar</button>}</footer>}
  </article>
}

export default function Cozinha() {
  const { isLoadingUser, usuarioAtual } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidadeId, setUnidadeId] = useState<number | null>(null)
  const [aba, setAba] = useState<Aba>('fila')
  const [busca, setBusca] = useState('')
  const [result, setResult] = useState<{ key: string; items: PedidoCozinha[]; warning: string } | null>(null)
  const [erro, setErro] = useState('')
  const [selected, setSelected] = useState<CentralOrder | null>(null)
  const [cancelando, setCancelando] = useState<PedidoCozinha | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [detailBusy, setDetailBusy] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const detailsRequest = useRef(0)
  const requestVersion = useRef(0)
  const mutationBusy = useRef(false)
  const keys = useRef(new Map<string, string>())
  const scope = useRef('')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const key = `${unidadeId}:${aba}`
  const items = useMemo(() => result?.key === key ? result.items : [], [result, key])
  const userUnit = usuarioAtual?.unidade_id

  useEffect(() => {
    if (isLoadingUser) return
    let alive = true
    listarUnidades().then((all) => { if (!alive) return; const allowed = userUnit ? all.filter((u) => u.id === userUnit) : all; setUnidades(allowed); setUnidadeId(allowed[0]?.id ?? null) }).catch(() => { if (alive) setErro('Não foi possível carregar as unidades.') })
    return () => { alive = false }
  }, [isLoadingUser, userUnit])
  useEffect(() => { scope.current = key }, [key])
  useEffect(() => {
    if (!unidadeId) return
    let alive = true
    let running = false
    const unit = unidadeId
    async function load() {
      if (running || document.hidden) return
      running = true
      const version = ++requestVersion.current
      const [local, external] = await Promise.allSettled([
        aba === 'cancelados' ? listarPedidosCancelados(unit).then(canceladosLocais) : listarCozinha(unit, true).then(agrupar).then((all) => all.filter((o) => aba === 'fila' ? o.status !== 'entregue' && o.status !== 'cancelado' : o.status === 'entregue')),
        carregarExternos(unit, aba),
      ])
      if (alive && version === requestVersion.current) {
        const warning = [local.status === 'rejected' ? 'Não foi possível atualizar os pedidos do restaurante.' : '', external.status === 'rejected' ? 'Não foi possível atualizar os pedidos do iFood.' : external.value.warning].filter(Boolean).join(' ')
        setResult((previous) => {
          const old = previous?.key === key ? previous.items : []
          const locals = local.status === 'fulfilled' ? local.value : old.filter((o) => o.origem === 'proprio')
          const externals = external.status === 'fulfilled' ? external.value.items : old.filter((o) => o.origem === 'ifood')
          const merged = [...locals, ...externals].sort((a, b) => (dataPedido(a.createdAt)?.getTime() ?? 0) - (dataPedido(b.createdAt)?.getTime() ?? 0) || a.key.localeCompare(b.key))
          if (aba !== 'fila') merged.reverse()
          return { key, items: merged, warning }
        })
      }
      running = false
    }
    const start = window.setTimeout(() => { void load() }, 0)
    const timer = window.setInterval(() => { void load() }, 5000)
    const visible = () => { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', visible)
    return () => { alive = false; window.clearTimeout(start); window.clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [unidadeId, aba, key, refresh])

  const filtered = useMemo(() => {
    const term = normalizar(busca.trim())
    return items.filter((o) => normalizar([o.id, o.nome, o.externo?.payload?.customer?.name ?? '', ...o.itens.map((i) => i.nome)].join(' ')).includes(term))
  }, [items, busca])

  async function detalhes(order: PedidoCozinha) {
    const currentScope = key
    const request = ++detailsRequest.current
    setDetailBusy(order.key)
    try {
      const data = order.externo ?? await localOrder(order.id)
      if (scope.current === currentScope && request === detailsRequest.current) setSelected(data)
    } catch { setErro('Não foi possível abrir os detalhes do pedido.') }
    finally { if (request === detailsRequest.current) setDetailBusy(null) }
  }
  async function mudarStatus(order: PedidoCozinha, status: 'preparando' | 'entregue') {
    if (mutationBusy.current) return
    mutationBusy.current = true; setBusy(order.key); setErro(''); requestVersion.current++
    const currentScope = key
    try {
      if (order.externo) {
        const action: IfoodAction = status === 'preparando' ? 'startPreparation' : 'readyToPickup'
        const name = `${order.key}:${action}`
        const requestKey = keys.current.get(name) ?? crypto.randomUUID()
        keys.current.set(name, requestKey)
        const command = await orderCommand(order.id, action, requestKey)
        keys.current.delete(name)
        if (scope.current === currentScope) setResult((prev) => prev && prev.key === currentScope ? { ...prev, items: prev.items.map((o) => o.key === order.key && o.externo ? { ...o, externo: { ...o.externo, pending: command, actions: [] } } : o) } : prev)
      } else {
        await atualizarStatusCozinha(order.id, order.lote, status)
        if (scope.current === currentScope) setResult((prev) => prev && prev.key === currentScope ? { ...prev, items: status === 'entregue' ? prev.items.filter((o) => o.key !== order.key) : prev.items.map((o) => o.key === order.key ? { ...o, status } : o) } : prev)
      }
      requestVersion.current++; setRefresh((n) => n + 1)
    } catch (err) { setErro(err instanceof Error ? err.message : 'Não foi possível atualizar o pedido.') }
    finally { mutationBusy.current = false; setBusy(null) }
  }
  const loading = Boolean(unidadeId) && result?.key !== key
  return <main className={`min-h-screen bg-[#f8f9fb] font-barlow text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}><BarraDeNavegacaoAdmin /><section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8">
    <a href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-preto-v1"><ArrowLeft size={16} /> Painel</a>
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Operação</p><h1 className="font-barlow-condensed text-4xl font-bold uppercase">Cozinha</h1><p className="mt-1 text-sm text-slate-500">Uma fila para todos os pedidos. Prepare por ordem de chegada.</p></div><select aria-label="Unidade da cozinha" value={unidadeId ?? ''} disabled={Boolean(userUnit) || unidades.length <= 1} onChange={(e) => { setUnidadeId(Number(e.target.value) || null); setBusca(''); setSelected(null); setCancelando(null) }} className={`${controle} w-full disabled:text-slate-500 sm:w-auto sm:min-w-56`}>{!unidadeId && <option value="">Selecione uma unidade</option>}{unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select></header>
    <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row"><div role="tablist" aria-label="Visualização da cozinha" className="flex rounded-xl border border-slate-200 bg-white p-1">{abas.map((tab, i) => <button key={tab.id} ref={(el) => { tabRefs.current[i] = el }} role="tab" aria-selected={aba === tab.id} aria-controls="fila-cozinha" id={`cozinha-${tab.id}`} tabIndex={aba === tab.id ? 0 : -1} onKeyDown={(e) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setAba(abas[next].id); tabRefs.current[next]?.focus() }} onClick={() => setAba(tab.id)} className={`min-h-10 flex-1 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition sm:px-5 sm:text-sm ${aba === tab.id ? 'bg-amarelo text-preto-v1 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{tab.nome}</button>)}</div><label className="relative flex items-center lg:w-80"><Search size={18} aria-hidden className="absolute left-4 text-slate-400" /><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar pedido na cozinha" placeholder="Buscar pedido, comanda ou item…" className={`${controle} w-full pl-11 pr-9`} />{busca && <button aria-label="Limpar busca" onClick={() => setBusca('')} className="absolute right-3 p-1 text-slate-400"><X size={14} /></button>}</label></div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p>{loading ? 'Atualizando fila…' : `${filtered.length} ${filtered.length === 1 ? 'pedido' : 'pedidos'}${busca ? ` de ${items.length}` : ''}`}</p><p className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><Utensils size={12} /> Restaurante</span><span className="inline-flex items-center gap-1"><img src={logoIfood} alt="iFood" className="h-5 w-8 object-contain" /><span className="text-amber-700">Teste</span></span></p></div>
    {(erro || result?.key === key && result.warning) && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{erro || result?.warning} Os pedidos exibidos podem estar desatualizados.</p>}
    <div id="fila-cozinha" role="tabpanel" aria-labelledby={`cozinha-${aba}`} className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {filtered.map((order) => <PedidoCard key={order.key} pedido={order} busy={Boolean(busy)} detailBusy={detailBusy === order.key} preparar={() => { void mudarStatus(order, 'preparando') }} pronto={() => { void mudarStatus(order, 'entregue') }} cancelar={() => setCancelando(order)} detalhes={() => { void detalhes(order) }} />)}
    </div>
    {!loading && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center"><ChefHat size={38} className="mx-auto mb-3 text-slate-300" /><h2 className="font-semibold">{busca ? 'Nenhum pedido encontrado' : 'Nenhum pedido nesta fila'}</h2><p className="mt-1 text-sm text-slate-500">{busca ? 'Tente outro número, comanda ou item.' : 'Os pedidos do restaurante e do iFood aparecerão juntos aqui.'}</p></div>}
    {selected && <PedidoDetalhesModal key={`${selected.origem}:${selected.id}`} pedido={selected} onFechar={() => setSelected(null)} onAtualizar={() => setRefresh((n) => n + 1)} />}
    {cancelando && <CancelarRestaurante pedido={cancelando} fechar={() => setCancelando(null)} confirmar={async (motivo) => { await cancelarPedido(cancelando.id, motivo); requestVersion.current++; setResult((prev) => prev && prev.key === key ? { ...prev, items: prev.items.filter((o) => o.id !== cancelando.id || o.origem !== 'proprio') } : prev); setCancelando(null); setRefresh((n) => n + 1) }} />}
  </section></main>
}
