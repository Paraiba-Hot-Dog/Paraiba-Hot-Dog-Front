import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ClipboardList, Info, LayoutGrid, Search, Utensils, X } from 'lucide-react'
import logoIfood from '../../imagens/social/ifood.svg'
import { useAuth } from '../../contextos/useAuth'
import { listarUnidades, type Unidade } from '../../servicos/api'
import { centralOrders, type CentralOrder, type CentralPage } from '../../servicos/ifoodApi'
import { dataHora, estadoPedido, estadosIfood, estadosSincronizacao, moeda } from '../../servicos/pedidoApresentacao'
import PedidoDetalhesModal from './PedidoDetalhesModal'
import { PrazoConfirmacao } from './PrazoIfood'

type Origem = 'proprio' | 'ifood'
type Visao = Origem | 'todos'
const origens: Origem[] = ['proprio', 'ifood']
const visoes: Visao[] = ['todos', 'proprio', 'ifood']
const titulos = { proprio: 'Pedidos do restaurante', ifood: 'Pedidos do iFood' }

const controle = 'h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amarelo focus:ring-2 focus:ring-amarelo/20'

export default function PedidosCentralizados() {
  const { usuarioAtual, hasRole } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidade, setUnidade] = useState('')
  const [origem, setOrigem] = useState<Visao>('proprio')
  const [estado, setEstado] = useState('')
  const [busca, setBusca] = useState('')
  const [offsets, setOffsets] = useState<Record<Origem, number>>({ proprio: 0, ifood: 0 })
  const resetOffsets = () => setOffsets({ proprio: 0, ifood: 0 })
  const limit = origem === 'todos' ? 10 : 30
  const [result, setResult] = useState<{ key: string; data: Partial<Record<Origem, CentralPage>>; errors: Partial<Record<Origem, string>>; checkedAt: number } | null>(null)
  const [selected, setSelected] = useState<CentralOrder | null>(null)
  const [erro, setErro] = useState('')
  const [refresh, setRefresh] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const unidadeId = usuarioAtual?.unidade_id ?? (Number(unidade) || undefined)
  const queryKey = JSON.stringify([unidadeId, origem, estado, busca.trim(), offsets, limit])
  const pages = result?.key === queryKey ? result.data : {}
  const errors = result?.key === queryKey ? result.errors : {}
  const ifoodPage = pages.ifood
  const visibleOrigins: Origem[] = origem === 'todos' ? origens : [origem]
  const admin = hasRole('administrador')

  useEffect(() => {
    if (!admin) return
    let alive = true
    listarUnidades().then((value) => { if (alive) setUnidades(value) }).catch(() => { if (alive) setErro('Não foi possível carregar as unidades.') })
    return () => { alive = false }
  }, [admin])

  useEffect(() => {
    let alive = true
    let running = false
    async function load() {
      if (running || document.hidden) return
      running = true
      try {
        const requested: Origem[] = origem === 'todos' ? origens : [origem]
        const responses = await Promise.allSettled(requested.map((source) => centralOrders({
          unidade_id: unidadeId, origem: source, estado_operacional: estado || undefined,
          busca: busca.trim(), skip: offsets[source], limit,
        })))
        if (alive) {
          const checkedAt = Date.now()
          const correctedOffsets = { ...offsets }
          let changed = false
          responses.forEach((response, index) => {
            if (response.status !== 'fulfilled') return
            const source = requested[index]
            const lastOffset = Math.max(0, Math.floor((response.value.total - 1) / limit) * limit)
            if (correctedOffsets[source] > lastOffset) { correctedOffsets[source] = lastOffset; changed = true }
          })
          if (changed) setOffsets(correctedOffsets)
          setResult((previous) => {
            const data: Partial<Record<Origem, CentralPage>> = previous?.key === queryKey ? { ...previous.data } : {}
            const requestErrors: Partial<Record<Origem, string>> = {}
            responses.forEach((response, index) => {
              const source = requested[index]
              if (response.status === 'fulfilled') data[source] = response.value
              else requestErrors[source] = response.reason instanceof Error ? response.reason.message : 'Não foi possível carregar os pedidos.'
            })
            return { key: queryKey, data, errors: requestErrors, checkedAt }
          })
          setErro('')
        }
      } catch (err) { if (alive) setErro(err instanceof Error ? err.message : 'Não foi possível carregar os pedidos.') }
      finally { running = false }
    }
    const initial = window.setTimeout(() => { void load() }, busca.trim() ? 300 : 0)
    const timer = window.setInterval(() => { void load() }, 5000)
    const visible = () => { if (!document.hidden) void load() }
    document.addEventListener('visibilitychange', visible)
    return () => { alive = false; window.clearTimeout(initial); window.clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [unidadeId, origem, estado, busca, offsets, limit, queryKey, refresh])

  function trocarOrigem(value: Visao) {
    setOrigem(value); resetOffsets(); setEstado(''); setSelected(null); setErro('')
  }
  function tecladoAba(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3
    trocarOrigem(visoes[next]); tabs.current[next]?.focus()
  }
  const stale = ifoodPage?.integration.enabled && (!ifoodPage.integration.last_poll_at || (result?.checkedAt ?? 0) - new Date(ifoodPage.integration.last_poll_at).getTime() > 90000)
  const statusOptions = origem === 'todos' ? { ...estadosIfood, PLACED: 'Na fila / aguardando confirmação', CONCLUDED: 'Finalizados / concluídos' } : origem === 'ifood' ? estadosIfood : { PLACED: 'Na fila', PREPARATION_STARTED: 'Em preparo', CONCLUDED: 'Finalizado na cozinha', CANCELLED: 'Cancelado' }
  return <section className="mx-auto max-w-6xl font-barlow text-preto-v1">
    <a href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-preto-v1"><ArrowLeft size={16} /> Painel</a>
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Atendimento</p><h1 className="font-barlow-condensed text-4xl font-bold uppercase">Pedidos</h1><p className="mt-1 text-sm text-slate-500">Encontre um pedido e acompanhe cada etapa.</p></div><a href="/admin/cozinha" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-amarelo">Abrir cozinha</a></header>
    <div role="tablist" aria-label="Origem dos pedidos" className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
      {visoes.map((value, i) => <button key={value} type="button" role="tab" id={`pedidos-aba-${value}`} aria-selected={origem === value} aria-controls="pedidos-lista" tabIndex={origem === value ? 0 : -1} ref={(el) => { tabs.current[i] = el }} onKeyDown={(e) => tecladoAba(e, i)} onClick={() => trocarOrigem(value)} className={`flex min-h-20 items-center justify-center gap-3 rounded-2xl border-2 px-2 py-4 text-center transition sm:min-h-24 lg:justify-start sm:px-4 lg:px-6 lg:text-left ${origem === value ? value === 'ifood' ? 'border-[#ea1d2c] bg-white shadow-sm' : 'border-amarelo bg-white shadow-sm' : 'border-transparent bg-slate-100/80 hover:bg-white'}`}>
        {value === 'todos' ? <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 lg:flex"><LayoutGrid size={24} className="text-slate-600" /></span> : value === 'ifood' ? <span className="hidden h-12 w-14 shrink-0 lg:flex items-center justify-center rounded-xl bg-red-50"><img src={logoIfood} alt="" className="h-10 w-12 object-contain" /></span> : <span className="hidden h-12 w-12 shrink-0 lg:flex items-center justify-center rounded-xl bg-amber-50"><Utensils size={24} className="text-amber-700" /></span>}
        <span><span className="block font-barlow-condensed text-lg font-bold sm:text-xl lg:text-2xl">{value === 'todos' ? 'Todos Pedidos' : value === 'ifood' ? 'iFood' : 'Restaurante'}</span><span className="mt-0.5 hidden text-xs text-slate-500 lg:block">{value === 'todos' ? 'As duas origens lado a lado' : value === 'ifood' ? 'Pedidos recebidos pelo iFood' : 'Pedidos e comandas da loja'}</span></span>
        {origem === value && <span aria-hidden className={`ml-auto hidden h-2 w-2 shrink-0 rounded-full lg:block ${value === 'ifood' ? 'bg-[#ea1d2c]' : 'bg-amarelo'}`} />}
      </button>)}
    </div>
    <div className="mb-5 flex flex-col gap-3 md:flex-row">
      <label className="relative flex min-w-0 flex-1 items-center"><Search size={18} className="absolute left-4 text-slate-400" aria-hidden /><input type="search" maxLength={120} value={busca} onChange={(e) => { setBusca(e.target.value); resetOffsets() }} placeholder="Buscar por número, cliente ou comanda…" aria-label="Buscar por número do pedido, cliente ou comanda" className={`${controle} w-full pl-11 pr-10`} />{busca && <button type="button" aria-label="Limpar busca" onClick={() => { setBusca(''); resetOffsets() }} className="absolute right-3 rounded p-1 text-slate-500"><X size={15} /></button>}</label>
      {admin && <select aria-label="Filtrar por unidade" value={unidade} onChange={(e) => { setUnidade(e.target.value); resetOffsets(); setSelected(null) }} className={`${controle} md:max-w-52`}><option value="">Todas as unidades</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}</select>}
      <select aria-label="Filtrar por status" value={estado} onChange={(e) => { setEstado(e.target.value); resetOffsets() }} className={`${controle} md:max-w-56`}><option value="">Todos os status</option>{Object.entries(statusOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select>
    </div>
    {origem !== 'proprio' && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{!ifoodPage ? 'Atualizando iFood…' : ifoodPage.integration.enabled ? `Última atualização: ${dataHora(ifoodPage.integration.last_poll_at)}` : 'Integração desativada'}</span></div>}
    {origem !== 'proprio' && (stale || ifoodPage?.integration.error) && <p role="status" className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">A atualização dos pedidos está demorando. Confira o status no Gestor do iFood antes de agir.</p>}
    {origem !== 'proprio' && Boolean(ifoodPage?.integration.abandoned_events) && <p role="status" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">{ifoodPage?.integration.abandoned_events === 1 ? '1 atualização do iFood não pôde ser importada' : `${ifoodPage?.integration.abandoned_events} atualizações do iFood não puderam ser importadas`} após 10 minutos de tentativas. Confira os pedidos recentes no Gestor iFood.</p>}
    {erro && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
    {origem === 'todos' && <nav aria-label="Ir para uma origem" className="mb-4 flex gap-2 text-sm lg:hidden"><a href="#lista-proprio" className={`${controle} inline-flex flex-1 items-center justify-center`}>Restaurante</a><a href="#lista-ifood" className={`${controle} inline-flex flex-1 items-center justify-center`}>iFood</a></nav>}
    <div id="pedidos-lista" role="tabpanel" aria-labelledby={`pedidos-aba-${origem}`} className={origem === 'todos' ? 'grid items-start gap-5 lg:grid-cols-2' : ''}>
      {visibleOrigins.map((source) => <ListaOrigem key={source} source={source} page={pages[source]} error={errors[source]}
        compact={origem === 'todos'} unidades={unidades} offset={offsets[source]} limit={limit}
        buscaAtiva={Boolean(busca.trim())} filtrosAtivos={Boolean(busca || estado)} abrir={setSelected}
        limpar={() => { setBusca(''); setEstado(''); resetOffsets() }}
        paginar={(offset) => setOffsets((current) => ({ ...current, [source]: offset }))}
        tentarNovamente={() => setRefresh((n) => n + 1)} />)}
    </div>
    {selected && <PedidoDetalhesModal key={`${selected.origem}:${selected.id}`} pedido={selected} onFechar={() => setSelected(null)} onAtualizar={() => setRefresh((n) => n + 1)} />}
  </section>
}


function ListaOrigem({ source, page, error, compact, unidades, offset, limit, buscaAtiva, filtrosAtivos, abrir, limpar, paginar, tentarNovamente }: {
  source: Origem; page?: CentralPage; error?: string; compact: boolean; unidades: Unidade[]; offset: number; limit: number
  buscaAtiva: boolean; filtrosAtivos: boolean; abrir: (order: CentralOrder) => void; limpar: () => void
  paginar: (offset: number) => void; tentarNovamente: () => void
}) {
  return <section id={`lista-${source}`} aria-label={titulos[source]} className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <div className={`flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 ${compact ? source === 'ifood' ? 'border-t-4 border-t-[#ea1d2c]' : 'border-t-4 border-t-amarelo' : ''}`}><h2 className="flex items-center gap-2 text-sm font-semibold">{compact && (source === 'ifood' ? <img src={logoIfood} alt="" className="h-7 w-10 object-contain" /> : <Utensils size={18} className="text-amber-700" />)}{titulos[source]}</h2><span className="shrink-0 text-xs text-slate-500">{page ? `${page.total} ${page.total === 1 ? 'pedido' : 'pedidos'}` : error ? 'Indisponível' : 'Buscando…'}</span></div>
    {error && <div role="alert" className="m-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}{page && ' Os pedidos exibidos podem estar desatualizados.'}<button className="mt-2 block font-semibold underline" onClick={tentarNovamente}>Tentar novamente</button></div>}
    {!page && !error && <p role="status" className="py-16 text-center text-sm text-slate-500">Buscando pedidos…</p>}
    {page?.items.length === 0 && <div className="px-5 py-16 text-center"><ClipboardList size={34} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold">{buscaAtiva ? 'Nenhum pedido encontrado' : 'Nenhum pedido por aqui'}</p><p className="mt-1 text-sm text-slate-500">{buscaAtiva ? 'Confira o número ou o nome e tente novamente.' : 'Os pedidos desta origem aparecerão nesta lista.'}</p>{filtrosAtivos && <button className="mt-4 text-sm font-semibold underline underline-offset-4" onClick={limpar}>Limpar filtros</button>}</div>}
    <div className="divide-y divide-slate-100">{page?.items.map((order) => <article key={`${order.origem}:${order.id}`} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 transition ${order.origem === 'ifood' ? 'border-l-4 border-l-[#ea1d2c] hover:bg-slate-50/60' : 'hover:bg-slate-50/60'} ${compact ? '' : 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto]'}`}>
      <div className="min-w-0"><p className="truncate font-semibold">{order.nome}{order.origem === 'proprio' && <span className="ml-2 text-xs font-normal text-slate-400">#{order.id}</span>}</p><p className="mt-1 text-xs text-slate-500">{dataHora(order.created_at)} · {unidades.find((u) => u.id === order.unidade_id)?.nome ?? `Unidade ${order.unidade_id}`}</p>{order.pending && <p className="mt-1 text-xs text-blue-700">{estadosSincronizacao[order.pending.state]}</p>}{order.estado_operacional === 'PLACED' && order.origem === 'ifood' && <div className="mt-1.5"><PrazoConfirmacao prazo={order.confirmation_deadline} agendado={order.scheduled} compacto /></div>}{order.dispute && <p className="mt-1 text-xs font-semibold text-red-700">Negociação aberta pelo cliente</p>}</div>
      <div className={`row-start-2 ${compact ? '' : 'md:row-auto'}`}><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${order.estado_operacional === 'CANCELLED' ? 'bg-red-50 text-red-700' : ['CONCLUDED', 'READY_TO_PICKUP'].includes(order.estado_operacional) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-900'}`}>{estadoPedido(order)}</span></div>
      <p className={`col-start-2 row-start-1 text-right text-sm font-semibold ${compact ? '' : 'md:col-auto md:row-auto'}`}>{moeda(order.total)}</p>
      <button type="button" onClick={() => abrir(order)} aria-label={`Ver detalhes de ${order.nome}`} className={`col-start-2 inline-flex items-center justify-end gap-2 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-preto-v1 focus-visible:outline-2 focus-visible:outline-amarelo ${compact ? '' : 'md:col-auto'}`}><Info size={18} /><span className="hidden sm:inline">Detalhes</span></button>
    </article>)}</div>
    {page && page.total > limit && <nav aria-label={`Paginação: ${titulos[source]}`} className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>{offset + 1}–{Math.min(offset + limit, page.total)} de {page.total}</span><div className="flex gap-2"><button className={`${controle} disabled:opacity-40`} disabled={offset === 0} onClick={() => paginar(Math.max(0, offset - limit))} aria-label={`Página anterior: ${titulos[source]}`}><ChevronLeft size={18} /></button><button className={`${controle} disabled:opacity-40`} disabled={offset + limit >= page.total} onClick={() => paginar(offset + limit)} aria-label={`Próxima página: ${titulos[source]}`}><ChevronRight size={18} /></button></div></nav>}
  </section>
}
