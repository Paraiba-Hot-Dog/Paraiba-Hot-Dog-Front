import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { useAuth } from '../../contextos/useAuth'
import { listarUnidades, type Unidade } from '../../servicos/api'
import {
  atualizarStatusCozinha,
  cancelarPedido,
  listarCozinha,
  listarPedidosCancelados,
  type CozinhaItem,
  type PedidoApi,
  type StatusCozinha,
} from '../../servicos/cozinhaApi'

type AbaCozinha = 'fila' | 'entregues' | 'cancelados'

const ABAS_COZINHA: Array<{ id: AbaCozinha; label: string }> = [
  { id: 'fila', label: 'Fila de pedidos' },
  { id: 'entregues', label: 'Entregues' },
  { id: 'cancelados', label: 'Cancelados' },
]

function textoQuantidadePedidos(
  aba: AbaCozinha,
  total: number,
  filtrados: number,
  buscaAtiva: boolean,
) {
  const contexto =
    aba === 'fila' ? 'na fila' : aba === 'entregues' ? 'entregues' : 'cancelados'
  const pedidoLabel = (quantidade: number) => (quantidade === 1 ? 'pedido' : 'pedidos')

  if (buscaAtiva && filtrados !== total) {
    return `${filtrados} de ${total} ${pedidoLabel(total)} ${contexto}`
  }

  return `${total} ${pedidoLabel(total)} ${contexto}`
}

const acaoBotaoBase =
  'flex h-11 min-w-0 items-center justify-center rounded-[6px] border-2 px-2 font-barlow text-xs font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'

const modalOverlayClass =
  'fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-4 pb-6 pt-24 backdrop-blur-sm lg:items-center lg:pt-6'
const modalPanelClass =
  'w-full max-w-md rounded-[12px] border border-[#DADEE3] bg-white px-6 py-7 text-[#121212] shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:px-8 sm:py-8'
const modalTitleClass =
  'font-barlow-condensed text-[1.7rem] font-bold uppercase leading-none tracking-wide text-[#121212]'
const modalDescriptionClass = 'mt-2 font-barlow text-sm leading-6 text-[#444444]'
const modalLabelClass =
  'mt-6 block text-left font-barlow text-sm font-semibold text-[#121212]'
const modalTextareaClass =
  'mt-2 w-full resize-none rounded-[6px] border border-[#DADEE3] bg-[rgba(244,246,248,0.4)] px-3 py-2.5 font-barlow text-sm text-[#121212] outline-none transition placeholder:text-[#8b8b8b] focus:border-amarelo focus:ring-2 focus:ring-amarelo/25'
const modalDangerButtonClass =
  'w-full rounded-[6px] border-2 border-[#D92B2B] bg-[#D92B2B] px-5 py-3 font-barlow-condensed text-lg font-semibold uppercase tracking-wide text-white transition-colors hover:border-red-700 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50'
const modalSecondaryButtonClass =
  'w-full rounded-[6px] border-2 border-[#CCCCCC] bg-white px-5 py-3 font-barlow-condensed text-lg font-semibold uppercase tracking-wide text-[#666666] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50'

type PedidoCozinha = {
  id: number
  hora: string
  mesa: string
  lote: number
  status: StatusCozinha
  itens: Array<{
    nome: string
    adicionais: string[]
    observacao?: string | null
    quantidade: number
  }>
}

function agruparItens(items: CozinhaItem[]) {
  const grupos = new Map<string, PedidoCozinha>()

  items.forEach((item) => {
    const key = `${item.pedido_id}-${item.lote}`
    const pedido = grupos.get(key) ?? {
      id: item.pedido_id,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      mesa: item.nome_comanda,
      lote: item.lote,
      status: item.status,
      itens: [],
    }

    // preparando tem prioridade sobre aberto; entregue só se todos estiverem entregues
    if (item.status === 'preparando') pedido.status = 'preparando'
    else if (item.status === 'aberto' && pedido.status === 'entregue') pedido.status = 'aberto'

    pedido.itens.push({
      nome: `${item.quantidade}x ${nomeItemCozinha(item.produto_nome, item.produto_variacao_nome)}`,
      adicionais: item.adicionais.map((adicional) => adicional.nome),
      observacao: item.observacao,
      quantidade: item.quantidade,
    })
    grupos.set(key, pedido)
  })

  return Array.from(grupos.values())
}

function nomeItemCozinha(produto: string, variacao: string | null) {
  const nomeProduto = formatarNomeProduto(produto)
  const nomeVariacao = variacao?.trim()

  if (!nomeVariacao || nomeVariacao.toLocaleLowerCase('pt-BR') === 'unico') {
    return nomeProduto
  }

  return `${nomeProduto} - ${nomeVariacao}`
}

function formatarNomeProduto(nome: string) {
  return nome
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s-])\S/g, (letra) => letra.toLocaleUpperCase('pt-BR'))
}

function pedidosCanceladosParaCards(pedidos: PedidoApi[]): PedidoCozinha[] {
  return pedidos.flatMap((pedido) => {
    const grupos = new Map<number, PedidoCozinha>()
    const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    pedido.itens.forEach((item) => {
      const grupo = grupos.get(item.lote) ?? {
        id: pedido.id,
        hora,
        mesa: pedido.nome_comanda,
        lote: item.lote,
        status: 'cancelado',
        itens: [],
      }

      grupo.itens.push({
        nome: `${item.quantidade}x ${nomeItemCozinha(item.produto_nome, item.produto_variacao_nome)}`,
        adicionais: item.adicionais.map((adicional) => adicional.nome),
        observacao: item.observacao,
        quantidade: item.quantidade,
      })
      grupos.set(item.lote, grupo)
    })

    return Array.from(grupos.values())
  })
}


function textoBotaoStatus(status: StatusCozinha) {
  return status === 'preparando' ? 'Preparando' : 'Preparar'
}

function emojiProduto(nome: string) {
  const normalized = nome.toLowerCase()

  if (normalized.includes('smash')) return '🍔'
  if (normalized.includes('batata')) return '🍟'
  if (normalized.includes('coca') || normalized.includes('refri')) return '🥤'

  return '🌭'
}

function pedidoCorrespondeBusca(pedido: PedidoCozinha, termo: string) {
  const busca = termo.trim().toLocaleLowerCase('pt-BR')
  if (!busca) return true

  if (String(pedido.id).includes(busca)) return true
  if (`${pedido.id}-${pedido.lote}`.includes(busca)) return true
  if (pedido.mesa.toLocaleLowerCase('pt-BR').includes(busca)) return true

  return pedido.itens.some(
    (item) =>
      item.nome.toLocaleLowerCase('pt-BR').includes(busca) ||
      item.adicionais.some((adicional) => adicional.toLocaleLowerCase('pt-BR').includes(busca)),
  )
}

function SeletorAbaCozinha({
  aba,
  onChange,
}: {
  aba: AbaCozinha
  onChange: (aba: AbaCozinha) => void
}) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listaId = useId()
  const labelAtual = ABAS_COZINHA.find((item) => item.id === aba)?.label ?? 'Fila de pedidos'

  useEffect(() => {
    if (!aberto) return

    function fecharAoClicarFora(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [aberto])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={listaId}
        onClick={() => setAberto((atual) => !atual)}
        className={[
          'flex w-full items-center justify-between rounded-lg border bg-white px-5 py-3.5 font-barlow-condensed text-base font-semibold uppercase tracking-wide text-preto-v1 shadow-sm transition-all duration-200 sm:text-lg',
          aberto ? 'border-gray-400 shadow-md' : 'border-gray-300 hover:border-gray-400',
        ].join(' ')}
      >
        <span className="truncate text-left">{labelAtual}</span>
        <ChevronDown
          size={22}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${aberto ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          aria-label="Visualização da cozinha"
          className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {ABAS_COZINHA.map((opcao) => {
            const selecionada = opcao.id === aba

            return (
              <li key={opcao.id} role="option" aria-selected={selecionada}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opcao.id)
                    setAberto(false)
                  }}
                  className={[
                    'w-full px-5 py-3.5 text-left font-barlow-condensed text-base font-semibold uppercase tracking-wide transition-colors sm:text-lg',
                    selecionada ? 'bg-gray-200 text-preto-v1' : 'bg-white text-preto-v1 hover:bg-yellow-50',
                  ].join(' ')}
                >
                  {opcao.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function CancelarModal({
  pedido,
  onFechar,
  onConfirmar,
}: {
  pedido: PedidoCozinha
  onFechar: () => void
  onConfirmar: (motivo: string) => void
}) {
  const [motivo, setMotivo] = useState('')
  const motivoValido = motivo.trim().length > 0

  return (
    <div
      className={modalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cancelar-titulo"
      aria-describedby="modal-cancelar-descricao"
      onClick={onFechar}
    >
      <div
        className={modalPanelClass}
        onClick={(e) => e.stopPropagation()}
      >
        <p id="modal-cancelar-titulo" className={modalTitleClass}>
          Cancelar pedido #{pedido.id}?
        </p>
        <p id="modal-cancelar-descricao" className={modalDescriptionClass}>
          O pedido da {pedido.mesa} será removido da fila e não poderá reverter essa exclusão.
        </p>

        <label className={modalLabelClass}>
          <span className="inline-flex items-center gap-1">
            Motivo do cancelamento
            <span className="text-red-600" aria-hidden>
              *
            </span>
          </span>
          <textarea
            className={modalTextareaClass}
            placeholder="Descreva o motivo"
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            aria-required="true"
          />
        </label>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={!motivoValido}
            onClick={() => onConfirmar(motivo.trim())}
            className={modalDangerButtonClass}
          >
            Sim, cancelar pedido
          </button>
          <button
            type="button"
            onClick={onFechar}
            className={modalSecondaryButtonClass}
          >
            Não, manter pedido
          </button>
        </div>
      </div>
    </div>
  )
}

function PedidoCard({
  disabled = false,
  onCancelar,
  onEntregar,
  onPreparar,
  pedido,
}: {
  disabled?: boolean
  onCancelar?: (pedido: PedidoCozinha) => void
  onEntregar?: (pedido: PedidoCozinha) => void
  onPreparar?: (pedido: PedidoCozinha) => void
  pedido: PedidoCozinha
}) {
  const preparando = pedido.status === 'preparando'
  const entregue = pedido.status === 'entregue'
  const cancelado = pedido.status === 'cancelado'

  const cardSurface = entregue
    ? 'border border-emerald-200 bg-[#f4fbf7]'
    : cancelado
      ? 'border border-[#ff2b2b]/35 bg-[#fff8f8]'
      : preparando
        ? 'border-2 border-amarelo bg-[#f7f7f7]'
        : 'border border-[#e0e0e0] bg-[#f7f7f7]'

  return (
    <article
      className={`w-[min(100%,300px)] shrink-0 snap-start overflow-hidden rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:w-[300px] ${cardSurface}`}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="font-barlow-condensed text-sm font-black uppercase tracking-wider text-preto-v1">
          Pedido #{pedido.id}
        </span>
        <time className="font-barlow-condensed text-sm font-black tracking-wider text-amarelo">
          {pedido.hora}
        </time>
      </div>

      <div className="mx-4 mb-4 h-px bg-[#e8e8e8]" />

      <div className="min-h-[180px] px-4 pb-4">
        <p className="mb-3 text-xs font-bold tracking-widest uppercase text-[#999]">{pedido.mesa}</p>
        <div className="space-y-4">
          {pedido.itens.map((item, index) => (
            <section key={`${item.nome}-${index}`}>
              <h3 className="font-barlow-condensed text-[15px] font-black uppercase leading-none tracking-wider text-preto-v1 sm:text-base">
                {item.nome} <span aria-hidden>{emojiProduto(item.nome)}</span>
              </h3>
              {!!item.adicionais.length && (
                <ul className="mt-1.5 space-y-0.5 text-[11px] font-semibold leading-tight tracking-wide text-[#888] sm:text-xs">
                  {item.adicionais.map((adicional) => (
                    <li key={adicional}>• {adicional}</li>
                  ))}
                </ul>
              )}
              {item.observacao && item.observacao.split('\n').map((linha, i) =>
                linha.startsWith('Obs: ') ? (
                  <p key={i} className="mt-1.5 text-[13px] font-bold leading-tight tracking-wide text-[#d71920] sm:text-sm">
                    observação: {linha.slice(5)}
                  </p>
                ) : (
                  <p key={i} className="mt-1.5 text-[11px] font-bold leading-tight tracking-wide text-[#d71920] sm:text-xs">
                    {linha}
                  </p>
                )
              )}
            </section>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-[#e8e8e8]" />

      {entregue || cancelado ? (
        <div className="px-4 py-3">
          <div
            className={`flex min-h-11 items-center justify-center rounded-[6px] px-3 py-2 text-center font-barlow-condensed text-sm font-semibold uppercase leading-snug tracking-wide sm:text-base ${
              cancelado
                ? 'bg-[#ffe8e8] text-[#d71920]'
                : 'bg-emerald-600 text-white shadow-sm'
            }`}
          >
            {cancelado ? `Cancelado às ${pedido.hora}` : `Entregue às ${pedido.hora}`}
          </div>
        </div>
      ) : (
        <footer className="grid grid-cols-3 gap-2 px-4 py-3">
          <button
            className={`${acaoBotaoBase} ${
              preparando
                ? 'border-[#c99d00] bg-amarelo text-preto-v1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]'
                : 'border-amarelo bg-amarelo/15 text-preto-v1 hover:bg-amarelo/25 active:border-amarelo active:bg-amarelo active:text-preto-v1'
            }`}
            disabled={disabled || preparando}
            onClick={() => onPreparar?.(pedido)}
            type="button"
          >
            {textoBotaoStatus(pedido.status)}
          </button>
          <button
            className={`${acaoBotaoBase} border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
            disabled={disabled}
            onClick={() => onEntregar?.(pedido)}
            type="button"
          >
            Entregue
          </button>
          <button
            className={`${acaoBotaoBase} border-[#D92B2B] bg-[#D92B2B]/10 text-[#D92B2B] hover:bg-[#D92B2B]/15`}
            disabled={disabled}
            onClick={() => onCancelar?.(pedido)}
            type="button"
          >
            Cancelar
          </button>
        </footer>
      )}
    </article>
  )
}

export default function Cozinha() {
  const { isLoadingUser, usuarioAtual } = useAuth()
  const unidadeUsuarioId = usuarioAtual?.unidade_id ?? null
  const [aba, setAba] = useState<AbaCozinha>('fila')
  const [cancelados, setCancelados] = useState<PedidoCozinha[]>([])
  const [entregues, setEntregues] = useState<PedidoCozinha[]>([])
  const [erro, setErro] = useState('')
  const [fila, setFila] = useState<PedidoCozinha[]>([])
  const [loading, setLoading] = useState(true)
  const [pedidoCancelando, setPedidoCancelando] = useState<PedidoCozinha | null>(null)
  const [updatingKey, setUpdatingKey] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState<number | null>(null)

  const unidadeSelecionada = useMemo(
    () => unidades.find((unidade) => unidade.id === unidadeSelecionadaId) ?? null,
    [unidadeSelecionadaId, unidades],
  )

  async function carregarCozinha() {
    if (!unidadeSelecionadaId) return

    try {
      setLoading(true)
      setErro('')
      const items = await listarCozinha(unidadeSelecionadaId)
      const grupos = agruparItens(items)
      setFila(grupos.filter((p) => p.status !== 'entregue' && p.status !== 'cancelado'))
      setEntregues(grupos.filter((p) => p.status === 'entregue'))
    } catch {
      setErro('Não foi possível carregar a fila da API.')
      setFila([])
      setEntregues([])
    } finally {
      setLoading(false)
    }
  }

  async function carregarCancelados() {
    if (!unidadeSelecionadaId) return

    try {
      setLoading(true)
      setErro('')
      const pedidos = await listarPedidosCancelados(unidadeSelecionadaId)
      setCancelados(pedidosCanceladosParaCards(pedidos))
    } catch {
      setErro('Não foi possível carregar os pedidos cancelados.')
      setCancelados([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoadingUser) return

    let ativo = true
    setLoading(true)

    listarUnidades()
      .then((unidadesApi) => {
        if (!ativo) return

        const unidadesPermitidas = unidadeUsuarioId
          ? unidadesApi.filter((unidade) => unidade.id === unidadeUsuarioId)
          : unidadesApi

        setUnidades(unidadesPermitidas)
        setUnidadeSelecionadaId(unidadesPermitidas[0]?.id ?? null)
      })
      .catch(() => {
        if (!ativo) return
        setErro('Não foi possível carregar as unidades.')
        setUnidades([])
        setUnidadeSelecionadaId(null)
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })

    return () => {
      ativo = false
    }
  }, [isLoadingUser, unidadeUsuarioId])

  useEffect(() => {
    if (!unidadeSelecionadaId) return

    if (aba === 'cancelados') {
      void carregarCancelados()
      return
    }

    const timeout = window.setTimeout(() => {
      void carregarCozinha()
    }, 0)

    const intervalo = window.setInterval(() => {
      void carregarCozinha()
    }, 5000)

    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(intervalo)
    }
  }, [aba, unidadeSelecionadaId])

  const pedidosVisiveis = useMemo(() => {
    if (aba === 'fila') return fila
    if (aba === 'entregues') return entregues
    return cancelados
  }, [aba, cancelados, entregues, fila])

  const pedidosFiltrados = useMemo(
    () => pedidosVisiveis.filter((pedido) => pedidoCorrespondeBusca(pedido, busca)),
    [busca, pedidosVisiveis],
  )

  const buscaAtiva = busca.trim().length > 0
  const textoContagem = textoQuantidadePedidos(
    aba,
    pedidosVisiveis.length,
    pedidosFiltrados.length,
    buscaAtiva,
  )

  function atualizarPedidoLocal(pedido: PedidoCozinha, status: 'preparando' | 'entregue') {
    if (status === 'entregue') {
      setFila((atual) => atual.filter((item) => !(item.id === pedido.id && item.lote === pedido.lote)))
      setEntregues((atual) => [{ ...pedido, status: 'entregue' }, ...atual])
      return
    }

    setFila((atual) =>
      atual.map((item) => (item.id === pedido.id && item.lote === pedido.lote ? { ...item, status } : item)),
    )
  }

  async function mudarStatus(pedido: PedidoCozinha, status: 'preparando' | 'entregue') {
    const key = `${pedido.id}-${pedido.lote}`
    setUpdatingKey(key)

    try {
      await atualizarStatusCozinha(pedido.id, pedido.lote, status)
      atualizarPedidoLocal(pedido, status)
    } catch {
      setErro('Não foi possível atualizar o pedido agora.')
    } finally {
      setUpdatingKey(null)
    }
  }

  function cancelarPedidoLocal(pedido: PedidoCozinha) {
    setFila((atual) => atual.filter((item) => !(item.id === pedido.id && item.lote === pedido.lote)))
    setCancelados((atual) => [{ ...pedido, status: 'cancelado' }, ...atual])
    setPedidoCancelando(null)
  }

  return (
    <main className={`min-h-screen bg-branco text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      {pedidoCancelando && (
        <CancelarModal
          pedido={pedidoCancelando}
          onFechar={() => setPedidoCancelando(null)}
          onConfirmar={async (motivo) => {
            if (!pedidoCancelando) return
            try {
              await cancelarPedido(pedidoCancelando.id, motivo)
              cancelarPedidoLocal(pedidoCancelando)
            } catch {
              setErro('Não foi possível cancelar o pedido agora.')
            }
          }}
        />
      )}

      <BarraDeNavegacaoAdmin />

      <section className="min-h-[calc(100vh-4rem)] bg-branco px-3 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mb-4 lg:mx-auto lg:max-w-4xl">
          <label
            htmlFor="unidade-cozinha"
            className="mb-1.5 block font-barlow-condensed text-xs font-black uppercase tracking-[0.18em] text-slate-400"
          >
            Unidade
          </label>
          <select
            id="unidade-cozinha"
            value={unidadeSelecionadaId ?? ''}
            onChange={(event) => {
              setUnidadeSelecionadaId(Number(event.target.value) || null)
              setBusca('')
              setFila([])
              setEntregues([])
              setCancelados([])
            }}
            disabled={Boolean(unidadeUsuarioId) || isLoadingUser || unidades.length <= 1}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-barlow text-sm text-preto-v1 outline-none focus:border-amarelo focus:ring-2 focus:ring-amarelo/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          >
            {!unidadeSelecionada && <option value="">Selecione uma unidade</option>}
            {unidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:mx-auto lg:mb-8 lg:max-w-4xl">
          <div className="min-w-0 flex-1">
            <SeletorAbaCozinha
              aba={aba}
              onChange={(novaAba) => {
                setAba(novaAba)
                if (novaAba === 'cancelados') void carregarCancelados()
              }}
            />
          </div>
          <label className="flex h-12 w-full shrink-0 items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 shadow-sm transition-colors focus-within:border-gray-400 sm:max-w-xs">
            <Search size={18} className="shrink-0 text-gray-400" aria-hidden />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="min-w-0 flex-1 bg-transparent font-barlow text-sm text-preto-v1 outline-none placeholder:text-gray-400"
              placeholder="Buscar pedido..."
              aria-label="Buscar pedido"
            />
          </label>
        </div>

        {!loading && (
          <p className="mb-4 font-barlow text-sm text-[#666666] lg:mx-auto lg:max-w-3xl">
            {textoContagem}
          </p>
        )}

        {(loading || erro) && (
          <p className="mb-5 min-h-6 font-barlow text-xs font-bold text-[#777]">
            {loading ? 'Carregando pedidos...' : erro}
          </p>
        )}

        <div className="-mx-3 flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto overscroll-x-contain px-3 pb-3 pt-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-auto lg:max-w-7xl lg:flex-none lg:grid lg:grid-cols-[repeat(auto-fit,minmax(280px,320px))] lg:items-start lg:justify-center lg:justify-items-center lg:gap-6 lg:overflow-visible lg:px-8 lg:pb-0 lg:snap-none">
          {pedidosFiltrados.length > 0 ? (
            pedidosFiltrados.map((pedido) => (
              <PedidoCard
                disabled={updatingKey === `${pedido.id}-${pedido.lote}`}
                key={`${pedido.id}-${pedido.lote}-${pedido.hora}`}
                onCancelar={aba === 'cancelados' ? undefined : (item) => setPedidoCancelando(item)}
                onEntregar={aba === 'cancelados' ? undefined : (item) => mudarStatus(item, 'entregue')}
                onPreparar={aba === 'cancelados' ? undefined : (item) => mudarStatus(item, 'preparando')}
                pedido={pedido}
              />
            ))
          ) : (
            !loading && (
              <p className="w-full min-w-full basis-full py-8 text-center font-barlow text-sm text-[#777]">
                {busca.trim()
                  ? 'Nenhum pedido encontrado para essa busca.'
                  : 'Nenhum pedido nesta visualização.'}
              </p>
            )
          )}
        </div>
      </section>
    </main>
  )
}
