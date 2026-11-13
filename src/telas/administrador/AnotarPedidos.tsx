import Toast, { type Notificacao } from '../../componentes/compartilhados/Toast'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Minus,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { useAuth } from '../../contextos/useAuth'
import { criarClienteApi, listarClientesApi, type ClienteApi } from '../../servicos/clientesApi'
import { listarUnidades, resolverUrlImagem, type Unidade } from '../../servicos/api'
import {
  adicionarItensPedidoApi,
  aumentarQuantidadeItemPedidoApi,
  atualizarObservacaoItemPedidoApi,
  atualizarParaViagemPedidoApi,
  cancelarItemPedidoApi,
  criarPedidoApi,
  finalizarPedidoApi,
  listarPedidosAbertosApi,
  type FormaPagamentoApi,
  type ItemPedidoPayload,
  type PedidoApi,
} from '../../servicos/pedidosApi'
import {
  listarCardapioApi,
  resolverImagemProdutoApi,
  type GrupoOpcaoApi,
  type ProdutoCardapioApi,
  type VariacaoProdutoApi,
} from '../../servicos/produtosApi'

type VariacaoProduto = {
  id: string
  nome: string
  descricao: string
  preco: number
  precoCombo?: number
  produtoVariacaoId?: number
  produtoVariacaoComboId?: number
  imagem?: string
}

type AdicionalProduto = {
  id: number
  nome: string
  preco: number
}

type OpcaoItemCombo = {
  id: string
  nome: string
  precoAdicional: number
}

type Produto = {
  id: string
  nome: string
  descricao: string
  preco: number
  imagem: string
  variacoes?: VariacaoProduto[]
  permiteCombo?: boolean
  disponivelNoCombo?: boolean
  valorAdicionalCombo?: number
  adicionais?: AdicionalProduto[]
  grupos?: GrupoOpcaoApi[]
}

type ItemPedido = {
  id: string
  nome: string
  descricao: string
  preco: number
  quantidade: number
  produtoVariacaoId?: number
  observacao?: string | null
  adicionais?: AdicionalProduto[]
}

type ClienteVinculado = {
  id: number
  nome: string
  pontos: number
  totalParaPremio: number
}

type SecaoCardapio = {
  id: string
  titulo: string
  produtos: Produto[]
}

const imagemProduto = (arquivo: string) => resolverUrlImagem('/uploads/produtos/' + arquivo) ?? ''
const smashFacheiro = imagemProduto('smash-facheiro.jpeg')
const smashMandacaru = imagemProduto('smash-mandacaru.jpeg')
const smashXiqueXique = imagemProduto('smash-xiquexique.jpeg')
const dogArretado = imagemProduto('dog-arretado.jpeg')
const dogBixin = imagemProduto('dog-bixin.jpeg')
const dogParaibano = imagemProduto('dog-paraibano.jpeg')
const dogTradicional = imagemProduto('dog-tradicional.jpeg')
const dogVegetariano = imagemProduto('dog-vegetariano.jpeg')
const bebidaSoda = imagemProduto('bedida-soda.jpeg')


const bebidasCombo = [
  'Refrigerante Lata 350ml',
  'Água Mineral sem Gás 500ml',
  'Água Mineral com Gás 500ml',
  'Suco Del Valle Uva',
  'Suco Prats 300ml',
  'Soda Italiana 400ml',
]

const SABORES_REFRIGERANTE = [
  'Coca-Cola',
  'Coca-Cola Zero',
  'Guaraná Antarctica',
  'Guaraná Antarctica Zero',
  'Fanta Laranja',
  'Sprite',
  'Sprite Zero',
]

const SABORES_SODA_ITALIANA = [
  'Tangerina',
  'Blue Curaçau Laranja',
  'Maçã Verde (Sem Açúcar)',
  'Maçã Verde',
  'Limão Siciliano (Sem Açúcar)',
  'Frutas Vermelhas (Sem Açúcar)',
  'Melancia',
]

const SABORES_PRATS = ['Laranja Integral', 'Uva Integral']
const VALOR_DESCONTO_FIDELIDADE = 17
const MARCADOR_VIAGEM = 'Para viagem'

function itemEhParaViagem(observacao?: string | null): boolean {
  return Boolean(observacao?.split('\n').some((linha) => linha.trim() === MARCADOR_VIAGEM))
}

function alternarMarcadorViagem(observacao?: string | null, ativar?: boolean): string | null {
  const linhas = (observacao ?? '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha && linha !== MARCADOR_VIAGEM)
  const deveAtivar = ativar ?? !itemEhParaViagem(observacao)
  if (deveAtivar) {
    linhas.push(MARCADOR_VIAGEM)
  }
  return linhas.join('\n') || null
}

const pagamentos = [
  { id: 'pix', label: 'Pix', icon: <QrCode size={14} /> },
  { id: 'credito', label: 'Crédito', icon: <CreditCard size={14} /> },
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={14} /> },
  { id: 'debito', label: 'Débito', icon: <CircleDollarSign size={14} /> },
]

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarHora(dataIso?: string | null): string {
  if (!dataIso) return ''
  const d = new Date(dataIso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function ehPedidoDeHoje(dataIso?: string | null): boolean {
  if (!dataIso) return true
  const d = new Date(dataIso)
  if (isNaN(d.getTime())) return true
  const hoje = new Date()
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  )
}

function tagStatusPedido(pedido: PedidoApi) {
  if (pedido.status === 'cancelado') return { label: 'Cancelado', classe: 'bg-red-100 text-red-700' }
  if (pedido.status === 'aberto') return { label: 'Aberto', classe: 'bg-amber-100 text-amber-700' }
  const todosEntregues = pedido.itens.length > 0 && pedido.itens.every((i) => i.status === 'entregue' || i.status === 'cancelado')
  if (todosEntregues) return { label: 'Entregue', classe: 'bg-slate-200 text-slate-700' }
  return { label: 'Pago', classe: 'bg-emerald-100 text-emerald-700' }
}


export default function AnotarPedidos() {
  const { usuarioAtual, isLoadingUser } = useAuth()
  const unidadeUsuarioId = usuarioAtual?.unidade_id ?? null
  const [pedido, setPedido] = useState<ItemPedido[]>([])
  const [pagamento, setPagamento] = useState('pix')
  const [fidelidade, setFidelidade] = useState<'cadastro' | 'sem-cadastro'>('sem-cadastro')
  const [produtoEmConfiguracao, setProdutoEmConfiguracao] = useState<Produto | null>(null)
  const [busca, setBusca] = useState('')
  const [secoesApi, setSecoesApi] = useState<SecaoCardapio[]>([])
  const [carregandoCardapio, setCarregandoCardapio] = useState(true)
  const [avisoCardapio, setAvisoCardapio] = useState('')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidadeId, setUnidadeId] = useState<number | null>(null)
  const [clientePedido, setClientePedido] = useState<ClienteVinculado | null>(null)
  const [nomeComanda, setNomeComanda] = useState('')
  const [comandaInvalida, setComandaInvalida] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null)
  const [mensagemPedido, definirMensagemPedido] = useState('')
  const [tipoMensagemPedido, setTipoMensagemPedido] = useState<'sucesso' | 'erro' | 'info'>('info')
  const [notificacao, setNotificacao] = useState<Notificacao | null>(null)
  function setMensagemPedido(mensagem: string, tipo: 'sucesso' | 'erro' | 'info' = 'erro') {
    definirMensagemPedido(mensagem)
    setTipoMensagemPedido(tipo)
  }
  function confirmarPedido(mensagem: string) {
    setMensagemPedido(mensagem, 'sucesso')
    setNotificacao({ id: Date.now(), mensagem, tipo: 'sucesso' })
  }
  const [pedidosAbertos, setPedidosAbertos] = useState<PedidoApi[]>([])
  const [pedidoAbertoId, setPedidoAbertoId] = useState<number | null>(null)
  const [resumoKey, setResumoKey] = useState(0)
  const [usarDescontoFidelidade, setUsarDescontoFidelidade] = useState(false)
  const [paraViagem, setParaViagem] = useState(false)
  const [modalFidelidadeAberto, setModalFidelidadeAberto] = useState(false)
  const [resumoVisivel, setResumoVisivel] = useState(false)

  useEffect(() => {
    let ativo = true

    listarCardapioApi(unidadeId ?? undefined)
      .then(({ produtos, categorias, subcategorias }) => {
        if (!ativo) return
        const secoesMapeadas = mapearCardapioApi(produtos, categorias, subcategorias)
        if (secoesMapeadas.length) {
          setSecoesApi(secoesMapeadas)
          setAvisoCardapio('')
        } else {
          setSecoesApi([])
          setAvisoCardapio('Não há produtos disponíveis no cardápio desta unidade no momento.')
        }
      })
      .catch((error) => {
        console.error('Menu lookup error:', error)
        if (ativo) {
          setSecoesApi([])
          setAvisoCardapio('Não foi possível carregar os itens do cardápio desta unidade no momento.')
        }
      })
      .finally(() => {
        if (ativo) setCarregandoCardapio(false)
      })

    return () => {
      ativo = false
    }
  }, [unidadeId])

  useEffect(() => {
    if (isLoadingUser) return

    listarUnidades()
      .then((dados) => {
        const unidadesPermitidas = unidadeUsuarioId
          ? dados.filter((unidade) => unidade.id === unidadeUsuarioId)
          : dados

        setUnidades(unidadesPermitidas)
        const unidadeSalvaId = Number(localStorage.getItem('admin_unidade_id'))
        const unidadeSalva = unidadesPermitidas.find((u) => u.id === unidadeSalvaId)
        const preferida = unidadeSalva ?? unidadesPermitidas[0]
        setUnidadeId(preferida?.id ?? null)
      })
      .catch((error) => console.error('Units lookup error:', error))
  }, [isLoadingUser, unidadeUsuarioId])

  const unidadeAtiva = useMemo(() => unidades.find((u) => u.id === unidadeId), [unidades, unidadeId])

  const [colunaPedidosAberta, setColunaPedidosAberta] = useState(() => {
    const salvo = localStorage.getItem('anotar_pedidos_sidebar_pedidos')
    return salvo === null ? true : salvo === 'true'
  })

  function alternarColunaPedidos() {
    setColunaPedidosAberta((prev) => {
      const proximo = !prev
      localStorage.setItem('anotar_pedidos_sidebar_pedidos', String(proximo))
      return proximo
    })
  }

  useEffect(() => {
    if (!unidadeId) return
    carregarPedidosAbertos(unidadeId)

    const intervalo = window.setInterval(() => {
      carregarPedidosAbertos(unidadeId)
    }, 5000)

    return () => window.clearInterval(intervalo)
  }, [unidadeId])

  useEffect(() => {
    const elementoResumo = document.getElementById('resumo-pedido')
    if (!elementoResumo) return

    const observer = new IntersectionObserver(
      ([entrada]) => setResumoVisivel(entrada.isIntersecting),
      { threshold: 0.2 },
    )
    observer.observe(elementoResumo)

    return () => observer.disconnect()
  }, [resumoKey])

  const subtotal = useMemo(() => pedido.reduce((total, item) => total + item.preco * item.quantidade, 0), [pedido])
  const pedidoSelecionado = pedidosAbertos.find((item) => item.id === pedidoAbertoId)
  const itensRegistrados = pedidoSelecionado?.itens.filter((item) => item.status !== 'cancelado') ?? []
  const pedidoEmPreparo = itensRegistrados.some((item) => item.status === 'preparando')
  const descontoNovo = !pedidoAbertoId && usarDescontoFidelidade
    ? Math.min(VALOR_DESCONTO_FIDELIDADE, subtotal)
    : 0
  const totalAtual = Number(pedidoSelecionado?.total ?? 0)
  const isPago = pedidoSelecionado?.status === 'pago'
  const totalParaFinalizar = isPago
    ? Math.max(subtotal - descontoNovo, 0)
    : Math.max(totalAtual + subtotal - descontoNovo, 0)
  const pedidoJaPagoSemNovosItens = Boolean(pedidoAbertoId && isPago && pedido.length === 0)
  const totalNovosItens = pedido.reduce((total, item) => total + item.quantidade, 0)
  const totalRegistrados = itensRegistrados.reduce((total, item) => total + item.quantidade, 0)
  const totalItens = totalNovosItens + totalRegistrados
  const cardapio = secoesApi
  const opcoesBebidas = useMemo(() => {
    const secaoBebidas = cardapio.find((secao) => normalizarTexto(secao.titulo).includes('bebida'))
    const lista = extrairOpcoesSecao(secaoBebidas)
    return lista.length > 0
      ? lista
      : bebidasCombo.map((nome) => ({ id: nome, nome, precoAdicional: 0 }))
  }, [cardapio])
  const opcoesAcompanhamentos = useMemo(() => {
    const secaoAcomp = cardapio.find((secao) => normalizarTexto(secao.titulo).includes('acompanha'))
    const lista = extrairOpcoesSecao(secaoAcomp)
    return lista.length > 0
      ? lista
      : [{ id: 'paraiba-chips', nome: 'Paraiba Chips', precoAdicional: 0 }]
  }, [cardapio])
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas')

  const secoesFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca.trim())
    const base = termo
      ? cardapio
          .map((secao) => ({
            ...secao,
            produtos: secao.produtos.filter((produto) =>
              normalizarTexto(`${produto.nome} ${produto.descricao}`).includes(termo),
            ),
          }))
          .filter((secao) => secao.produtos.length)
      : cardapio

    if (!termo && categoriaAtiva !== 'todas') {
      return base.filter((secao) => secao.id === categoriaAtiva)
    }

    return base
  }, [busca, cardapio, categoriaAtiva])

  function adicionar(produto: Produto) {
    const temOpcoes =
      (produto.variacoes && produto.variacoes.length > 1) ||
      produto.permiteCombo ||
      (produto.adicionais && produto.adicionais.length > 0) ||
      (produto.grupos && produto.grupos.length > 0)

    if (temOpcoes) {
      setProdutoEmConfiguracao(produto)
      return
    }
    const variacaoPadrao = produto.variacoes?.[0]
    adicionarAoPedido({
      id: variacaoPadrao ? `${produto.id}-${variacaoPadrao.id}` : produto.id,
      nome: variacaoPadrao?.nome ?? produto.nome,
      descricao: variacaoPadrao?.descricao ?? produto.descricao,
      preco: variacaoPadrao?.preco ?? produto.preco,
      produtoVariacaoId: variacaoPadrao?.produtoVariacaoId,
    })
  }

  function adicionarAoPedido(item: Omit<ItemPedido, 'quantidade'>) {
    setPedido((atual) => {
      const existente = atual.find((produto) => produto.id === item.id)
      if (existente) return atual.map((produto) => produto.id === item.id ? { ...produto, quantidade: produto.quantidade + 1 } : produto)
      return [...atual, { ...item, quantidade: 1 }]
    })
  }

  function alterarQuantidade(id: string, quantidade: number) {
    if (quantidade <= 0) {
      setPedido((atual) => atual.filter((item) => item.id !== id))
      return
    }
    setPedido((atual) => atual.map((item) => item.id === id ? { ...item, quantidade } : item))
  }

  function alternarViagemItem(id: string) {
    setPedido((atual) => {
      const alvo = atual.find((item) => item.id === id)
      if (!alvo) return atual
      const proximoViagem = !itemEhParaViagem(alvo.observacao)
      const baseId = alvo.id.replace(/:viagem$/, '')
      const novoId = proximoViagem ? `${baseId}:viagem` : baseId
      const novaObs = alternarMarcadorViagem(alvo.observacao, proximoViagem)
      const existente = atual.find((item) => item.id === novoId && item.id !== id)

      if (existente) {
        return atual
          .filter((item) => item.id !== id)
          .map((item) =>
            item.id === novoId
              ? { ...item, quantidade: item.quantidade + alvo.quantidade }
              : item,
          )
      }

      return atual.map((item) =>
        item.id === id ? { ...item, id: novoId, observacao: novaObs } : item,
      )
    })
  }

  async function carregarPedidosAbertos(idUnidade: number) {
    try {
      const pedidos = await listarPedidosAbertosApi(idUnidade)
      // Filtra todos os pedidos de hoje da unidade (excluindo iFood caso exista)
      // Se o pedido ainda está aberto, sempre mantém visível mesmo se tiver passado da meia-noite
      const pedidosHoje = pedidos.filter((pedido) => {
        if ((pedido as unknown as { origem?: string }).origem === 'ifood') return false
        if (pedido.status === 'aberto') return true
        return ehPedidoDeHoje(pedido.created_at)
      })
      pedidosHoje.sort((a, b) => b.id - a.id)

      setPedidosAbertos(pedidosHoje)
      setPedidoAbertoId((pedidoAtual) => {
        if (!pedidoAtual) return null
        return pedidosHoje.some((pedido) => pedido.id === pedidoAtual)
          ? pedidoAtual
          : null
      })
    } catch (error) {
      console.error('Orders lookup error:', error)
    }
  }

  function itensPedidoPayload(): ItemPedidoPayload[] {
    return pedido.map((item) => ({
      produto_variacao_id: item.produtoVariacaoId as number,
      quantidade: item.quantidade,
      observacao: item.observacao ?? null,
      adicional_ids: item.adicionais?.map((adicional) => adicional.id) ?? [],
      produto_nome: item.nome ?? null,
    }))
  }

  function validarPedido(exigirItens: boolean) {
    setMensagemPedido('')
    if (!unidadeId) {
      setMensagemPedido('Selecione uma unidade para o pedido.')
      return false
    }
    if (!nomeComanda.trim()) {
      setMensagemPedido('Informe o nome da comanda.')
      setComandaInvalida(true)
      const inputTicket = document.getElementById('comanda-ticket') as HTMLInputElement | null
      const inputMobile = document.getElementById('comanda-mobile') as HTMLInputElement | null
      if (inputTicket && inputTicket.offsetParent !== null) {
        inputTicket.focus()
      } else if (inputMobile) {
        inputMobile.focus()
      }
      return false
    }
    if (!pedidoAbertoId && fidelidade === 'cadastro' && !clientePedido) {
      setMensagemPedido('Busque e vincule um cliente da fidelidade pelo telefone/e-mail, ou selecione "Sem cadastro" para continuar.')
      return false
    }
    if (exigirItens && !pedido.length) {
      setMensagemPedido('Adicione ao menos um item ao pedido.')
      return false
    }
    if (pedido.some((item) => !item.produtoVariacaoId)) {
      setMensagemPedido('Este pedido possui itens não disponíveis para finalização. Selecione produtos ativos do cardápio.')
      return false
    }
    return true
  }

  async function alternarParaViagem(valor: boolean) {
    const anterior = paraViagem
    setParaViagem(valor)
    if (!pedidoAbertoId || !unidadeId) return
    try {
      await atualizarParaViagemPedidoApi(pedidoAbertoId, valor)
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setParaViagem(anterior)
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível atualizar o modo para viagem.')
    }
  }

  async function salvarPedidoAberto() {
    if (finalizando || !validarPedido(true) || !unidadeId) return

    setFinalizando(true)
    try {
      const salvo = pedidoAbertoId
        ? await adicionarItensPedidoApi(pedidoAbertoId, itensPedidoPayload(), paraViagem)
        : await criarPedidoApi({
            unidade_id: unidadeId,
            nome_comanda: nomeComanda.trim(),
            cliente_id: clientePedido?.id ?? null,
            usar_desconto_fidelidade: usarDescontoFidelidade,
            para_viagem: paraViagem,
            itens: itensPedidoPayload(),
          })
      setPedidoAbertoId(salvo.id)
      setParaViagem(Boolean(salvo.para_viagem))
      setPedido([])
      confirmarPedido(`Pedido #${salvo.id} mantido aberto e enviado para a cozinha.`)
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível salvar o pedido.')
    } finally {
      setFinalizando(false)
    }
  }

  async function editarItemRegistrado(item: PedidoApi['itens'][number], acao: 'adicionar' | 'remover' | 'excluir') {
    if (!pedidoAbertoId || !unidadeId || editandoItemId) return

    setEditandoItemId(item.id)
    setMensagemPedido('')
    try {
      if (acao === 'adicionar') {
        await aumentarQuantidadeItemPedidoApi(item.id)
      } else {
        await cancelarItemPedidoApi(item.id, acao === 'remover' ? 1 : undefined)
      }
      setMensagemPedido(`Pedido #${pedidoAbertoId} atualizado com sucesso.`, 'sucesso')
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível alterar o item.')
    } finally {
      setEditandoItemId(null)
    }
  }

  async function atualizarObservacaoItemRegistrado(itemId: number, observacao: string | null) {
    if (!unidadeId) return
    try {
      await atualizarObservacaoItemPedidoApi(itemId, observacao)
      setMensagemPedido('Observação atualizada.', 'sucesso')
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível atualizar a observação.')
    }
  }

  async function finalizarPedido() {
    const exigeItens = !pedidoAbertoId
    if (finalizando || !validarPedido(exigeItens) || !unidadeId) return

    setFinalizando(true)
    try {
      let idParaFinalizar = pedidoAbertoId
      const pedidoSelecionado = pedidosAbertos.find((item) => item.id === pedidoAbertoId)
      if (pedidoSelecionado?.status === 'pago' && !pedido.length) {
        setMensagemPedido(`O pedido #${pedidoSelecionado.id} já está pago e aguarda entrega da cozinha.`)
        return
      }
      if (idParaFinalizar && pedido.length) {
        await adicionarItensPedidoApi(idParaFinalizar, itensPedidoPayload(), paraViagem)
      }
      if (!idParaFinalizar) {
        const criado = await criarPedidoApi({
          unidade_id: unidadeId,
          nome_comanda: nomeComanda.trim(),
          cliente_id: clientePedido?.id ?? null,
          usar_desconto_fidelidade: usarDescontoFidelidade,
          para_viagem: paraViagem,
          itens: itensPedidoPayload(),
        })
        idParaFinalizar = criado.id
      }

      const finalizado = await finalizarPedidoApi(idParaFinalizar, pagamento as FormaPagamentoApi, paraViagem)
      setPedido([])
      setPedidoAbertoId(null)
      setNomeComanda('')
      setClientePedido(null)
      setPagamento('pix')
      setFidelidade('sem-cadastro')
      setUsarDescontoFidelidade(false)
      setParaViagem(false)
      setResumoKey((valor) => valor + 1)
      confirmarPedido(`Pedido #${finalizado.id} finalizado e enviado para a cozinha.`)
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível finalizar o pedido.')
    } finally {
      setFinalizando(false)
    }
  }

  function abrirPedidoExistente(id: number | null) {
    setPedidoAbertoId(id)
    setPedido([])
    setMensagemPedido('')
    setComandaInvalida(false)
    setParaViagem(false)
    if (!id) {
      setNomeComanda('')
      setClientePedido(null)
      setUsarDescontoFidelidade(false)
      setPagamento('pix')
      setFidelidade('sem-cadastro')
      return
    }
    const pedidoAberto = pedidosAbertos.find((item) => item.id === id)
    if (pedidoAberto) {
      setNomeComanda(pedidoAberto.nome_comanda)
      setUsarDescontoFidelidade(pedidoAberto.pontos_fidelidade_utilizados > 0)
      setPagamento(pedidoAberto.forma_pagamento ?? 'pix')
      setParaViagem(Boolean(pedidoAberto.para_viagem))
    }
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-clip bg-[#f5f7fb] text-[#18212f] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin
        acaoDireita={
          <button
            type="button"
            onClick={() => document.getElementById('resumo-pedido')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95 lg:hidden"
            aria-label="Ir para o resumo do pedido"
          >
            <ShoppingBag size={15} />
            <span>{totalItens}</span>
            <span className="hidden sm:inline">{totalItens === 1 ? 'item' : 'itens'}</span>
          </button>
        }
      />

      <div className={`mx-auto flex flex-col w-full min-w-0 max-w-[1900px] ${
        colunaPedidosAberta
          ? 'lg:grid lg:grid-cols-[210px_minmax(0,1fr)_340px] xl:grid-cols-[230px_minmax(0,1fr)_360px]'
          : 'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]'
      }`}>
        {colunaPedidosAberta && (
          <aside className="hidden border-r border-slate-200 bg-[#f5f7fb] px-3.5 py-3 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:px-4">
            <div className="mb-3.5 flex items-center justify-between lg:shrink-0">
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-preto-v1 transition"
              >
                <ArrowLeft size={14} /> Voltar ao painel
              </a>
              <button
                type="button"
                onClick={alternarColunaPedidos}
                title="Recolher pedidos"
                className="flex items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 lg:shrink-0">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Pedidos</p>
              </div>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amarelo px-1.5 text-[11px] font-black text-preto-v1">
                {pedidosAbertos.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => abrirPedidoExistente(null)}
              className={`mt-2.5 flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition lg:shrink-0 ${
                !pedidoAbertoId
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-preto-v1 text-white">
                <Plus size={15} />
              </span>
              <span className="text-xs font-black uppercase">Novo pedido</span>
            </button>

            <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {pedidosAbertos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-7 text-center">
                  <ReceiptText size={25} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-[11px] font-bold text-slate-500">Nenhum pedido hoje</p>
                </div>
              ) : pedidosAbertos.map((pedidoItem) => {
                const tag = tagStatusPedido(pedidoItem)
                const totalItensPedido = pedidoItem.itens.reduce((total, item) => total + item.quantidade, 0)
                const hora = formatarHora(pedidoItem.created_at)

                return (
                  <button
                    key={pedidoItem.id}
                    type="button"
                    onClick={() => abrirPedidoExistente(pedidoItem.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      pedidoAbertoId === pedidoItem.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-black">Pedido #{pedidoItem.id}</span>
                        {hora && <span className="text-[10px] text-slate-400">· {hora}</span>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${tag.classe}`}>
                        {tag.label}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs font-semibold text-slate-700">
                      {pedidoItem.nome_comanda || 'Sem nome'}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-1 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        {totalItensPedido} {totalItensPedido === 1 ? 'item' : 'itens'}
                        {pedidoItem.para_viagem && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">
                            <Package size={9} /> Viagem
                          </span>
                        )}
                      </span>
                      <strong className="text-slate-700">{moeda(Number(pedidoItem.total))}</strong>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <main className="min-w-0 px-4 py-3 pb-28 sm:px-6 lg:px-6 lg:py-3 lg:pb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-preto-v1 transition lg:hidden"
              >
                <ArrowLeft size={15} /> Voltar ao painel
              </a>
              {!colunaPedidosAberta && (
                <button
                  type="button"
                  onClick={alternarColunaPedidos}
                  className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition active:scale-95"
                  title="Expandir lista de pedidos"
                >
                  <PanelLeftOpen size={15} className="text-slate-500" />
                  <span>Pedidos ({pedidosAbertos.length})</span>
                </button>
              )}
              <h1 className="font-barlow-condensed text-2xl sm:text-3xl font-black uppercase leading-tight">
                Anotar pedidos
              </h1>
              {unidadeAtiva && (
                <span className="hidden sm:inline-flex items-center rounded-md bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  {unidadeAtiva.nome}
                </span>
              )}
            </div>
          </div>

          {/* Barra horizontal de pedidos no mobile */}
          <div className="mb-6 lg:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Pedidos de hoje ({pedidosAbertos.length})
              </span>
              {pedidoAbertoId && (
                <button
                  type="button"
                  onClick={() => abrirPedidoExistente(null)}
                  className="text-[11px] font-bold text-emerald-600 underline"
                >
                  + Novo pedido
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => abrirPedidoExistente(null)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-95 ${
                  !pedidoAbertoId
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Plus size={15} className={!pedidoAbertoId ? 'text-emerald-700' : 'text-slate-500'} />
                <span>Novo pedido</span>
              </button>
              {pedidosAbertos.map((pedidoItem) => {
                const tag = tagStatusPedido(pedidoItem)
                return (
                  <button
                    key={pedidoItem.id}
                    type="button"
                    onClick={() => abrirPedidoExistente(pedidoItem.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs transition active:scale-95 ${
                      pedidoAbertoId === pedidoItem.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold">#{pedidoItem.id}</span>
                    <span className="truncate max-w-[90px] font-medium">{pedidoItem.nome_comanda || 'Comanda'}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ${tag.classe}`}>
                      {tag.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* No mobile: comanda rápida no topo */}
          <div className="mb-4 lg:hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <input
                id="comanda-mobile"
                value={nomeComanda}
                onChange={(e) => {
                  setNomeComanda(e.target.value)
                  if (comandaInvalida && e.target.value.trim()) setComandaInvalida(false)
                }}
                disabled={Boolean(pedidoAbertoId)}
                placeholder="Nome da Comanda"
                className={`h-9 flex-1 rounded-lg border px-3 text-xs font-bold outline-none transition ${
                  comandaInvalida
                    ? 'border-red-500 bg-red-50/40 text-red-900 ring-2 ring-red-400/50 placeholder:text-red-400'
                    : 'border-slate-200 bg-white focus:border-amber-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setModalFidelidadeAberto(true)}
                className={`rounded-lg border px-2.5 py-2 text-xs font-bold shrink-0 transition active:scale-95 ${
                  clientePedido
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-dashed border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {clientePedido ? `👤 ${clientePedido.nome}` : '+ Fidelidade'}
              </button>
            </div>
            {clientePedido && (
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
                <span className="text-[11px] font-semibold text-emerald-700">
                  Pontos: <strong>{clientePedido.pontos}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => { setClientePedido(null); setUsarDescontoFidelidade(false) }}
                  className="text-[11px] text-slate-400 hover:text-red-600 underline"
                >
                  Remover cliente
                </button>
              </div>
            )}
          </div>

          {/* Busca e categorias fixas */}
          <div
            id="barra-categorias"
            className="sticky top-16 z-30 -mx-4 mb-4 border-b border-slate-200/60 bg-[#f5f7fb]/95 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-7 lg:px-7 max-w-[100vw]"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex h-9.5 w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 shadow-xs sm:max-w-xs">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  aria-label="Buscar no cardápio"
                  placeholder="Buscar no cardápio..."
                />
                {busca && (
                  <button type="button" onClick={() => setBusca('')} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Limpar busca">
                    <X size={14} />
                  </button>
                )}
              </label>
              <nav aria-label="Categorias do cardápio" className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaAtiva('todas')
                    setBusca('')
                    const nav = document.getElementById('barra-categorias')
                    if (nav && window.scrollY > nav.offsetTop - 70) {
                      window.scrollTo({ top: nav.offsetTop - 70, behavior: 'smooth' })
                    }
                  }}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                    categoriaAtiva === 'todas' && !busca.trim()
                      ? 'bg-amarelo text-preto-v1 shadow-sm font-black'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
                {cardapio.map((secao) => {
                  const ativa = categoriaAtiva === secao.id && !busca.trim()
                  return (
                    <button
                      key={secao.id}
                      type="button"
                      onClick={() => {
                        setCategoriaAtiva(secao.id)
                        setBusca('')
                        const nav = document.getElementById('barra-categorias')
                        if (nav && window.scrollY > nav.offsetTop - 70) {
                          window.scrollTo({ top: nav.offsetTop - 70, behavior: 'smooth' })
                        }
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                        ativa
                          ? 'bg-amarelo text-preto-v1 shadow-sm font-black'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {secao.titulo}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {carregandoCardapio && <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">Carregando cardápio...</div>}
          {!carregandoCardapio && avisoCardapio && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">{avisoCardapio}</div>}

          {!carregandoCardapio && busca.trim() && !secoesFiltradas.length && (
            <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h2 className="font-bold">Nenhum item encontrado</h2>
              <p className="mt-2 text-sm text-slate-500">Tente outro termo para encontrar seu produto.</p>
              <button type="button" onClick={() => setBusca('')} className="mt-4 rounded-lg bg-amarelo px-4 py-2 font-semibold">Limpar busca</button>
            </div>
          )}
          {secoesFiltradas.map((secao) => (
            <SecaoProdutos key={secao.id} id={secao.id} titulo={secao.titulo}>
              <div
                className={`grid gap-2.5 sm:gap-3 ${
                  colunaPedidosAberta
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                }`}
              >
                {secao.produtos.map((produto) => (
                  <CardProduto key={produto.id} produto={produto} onAdicionar={adicionar} />
                ))}
              </div>
            </SecaoProdutos>
          ))}
        </main>

        <ResumoPedido
          key={resumoKey}
          tipoMensagemPedido={tipoMensagemPedido}
          pedido={pedido}
          subtotal={subtotal}
          pagamento={pagamento}
          pedidoSelecionado={pedidoSelecionado}
          itensRegistrados={itensRegistrados}
          pedidoEmPreparo={pedidoEmPreparo}
          pedidoAbertoId={pedidoAbertoId}
          usarDescontoFidelidade={usarDescontoFidelidade}
          paraViagem={paraViagem}
          finalizando={finalizando}
          editandoItemId={editandoItemId}
          mensagemPedido={mensagemPedido}
          nomeComanda={nomeComanda}
          comandaInvalida={comandaInvalida}
          onNomeComanda={(valor) => {
            setNomeComanda(valor)
            if (comandaInvalida && valor.trim()) setComandaInvalida(false)
          }}
          clientePedido={clientePedido}
          onCliente={setClientePedido}
          onUsarDesconto={setUsarDescontoFidelidade}
          onParaViagem={alternarParaViagem}
          onAbrirFidelidade={() => setModalFidelidadeAberto(true)}
          onPagamento={setPagamento}
          onQuantidade={alterarQuantidade}
          onAlternarViagemItem={alternarViagemItem}
          onEditarItemRegistrado={editarItemRegistrado}
          onAtualizarObservacao={atualizarObservacaoItemRegistrado}
          onSalvarAberto={salvarPedidoAberto}
          onFinalizar={finalizarPedido}
          onNovoPedido={() => abrirPedidoExistente(null)}
        />
      </div>

      {modalFidelidadeAberto && (
        <ModalFidelidadeRapida
          aberto={modalFidelidadeAberto}
          onFechar={() => setModalFidelidadeAberto(false)}
          onClienteVinculado={(cliente) => {
            setClientePedido(cliente)
            if (!nomeComanda.trim()) {
              setNomeComanda(cliente.nome)
            }
          }}
        />
      )}

      {/* Barra fixa inferior de resumo no mobile */}
      {!resumoVisivel && (totalItens > 0 || pedidoAbertoId) && (
        <aside
          aria-label="Resumo rápido do pedido"
          className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.12)] backdrop-blur-md lg:hidden"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShoppingBag size={15} className="text-emerald-600" />
                <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
                {pedidoAbertoId && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    #{pedidoAbertoId}
                  </span>
                )}
              </p>
              <p className="truncate text-base font-black text-preto-v1">
                {pedidoJaPagoSemNovosItens ? `Pago · ${moeda(totalAtual)}` : moeda(totalParaFinalizar)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('resumo-pedido')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-sm transition active:scale-95"
            >
              <span>Ver comanda</span>
              <ChevronDown size={16} strokeWidth={2.5} />
            </button>
          </div>
        </aside>
      )}

      {/* Botão flutuante para voltar ao topo quando estiver no resumo */}
      {resumoVisivel && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-4 z-40 flex h-11 items-center gap-2 rounded-full bg-preto-v1 px-4 text-xs font-bold text-white shadow-xl transition active:scale-95 lg:hidden"
          aria-label="Voltar ao cardápio"
        >
          <ChevronUp size={16} strokeWidth={2.5} />
          <span>Voltar ao topo</span>
        </button>
      )}

      {notificacao && <Toast key={notificacao.id} notificacao={notificacao} onFechar={() => setNotificacao(null)} />}

      {produtoEmConfiguracao && (
        <ModalConfiguracao
          produto={produtoEmConfiguracao}
          cardapio={cardapio}
          opcoesBebidas={opcoesBebidas}
          opcoesAcompanhamentos={opcoesAcompanhamentos}
          onFechar={() => setProdutoEmConfiguracao(null)}
          onAdicionar={(item) => {
            adicionarAoPedido(item)
            setProdutoEmConfiguracao(null)
          }}
        />
      )}
    </div>
  )
}

function SecaoProdutos({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-5 scroll-mt-48 sm:scroll-mt-40">
      <h2 className="mb-2 font-barlow-condensed text-xl font-black">{titulo}</h2>
      {children}
    </section>
  )
}

function CardProduto({ produto, onAdicionar }: { produto: Produto; onAdicionar: (produto: Produto) => void }) {
  const temTamanhos = Boolean(produto.variacoes && produto.variacoes.length > 1)
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-slate-100">
        <img
          src={produto.imagem}
          alt={produto.nome}
          className="h-full w-full object-cover object-[50%_62%] transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-barlow-condensed text-base font-black leading-tight line-clamp-1" title={produto.nome}>
            {produto.nome}
          </h3>
          <div className="shrink-0 text-right">
            {temTamanhos && <span className="block text-[8px] uppercase text-slate-400 leading-none">A partir de</span>}
            <strong className="whitespace-nowrap text-xs sm:text-sm font-black text-preto-v1">{moeda(produto.preco)}</strong>
          </div>
        </div>
        <p className="mt-1 flex-1 text-[11px] leading-3.5 text-slate-400 line-clamp-2">{produto.descricao}</p>
        {temTamanhos && (
          <p className="mt-1.5 text-[9px] font-semibold text-slate-500 truncate">
            Tamanhos: {produto.variacoes?.map((v) => v.nome.replace(produto.nome, '').trim() || 'Simples').join(' · ')}
          </p>
        )}
        {produto.permiteCombo && (
          <p className="mt-0.5 text-[9px] font-bold uppercase text-emerald-600 truncate">
            Individual ou combo
          </p>
        )}
        <button
          type="button"
          onClick={() => onAdicionar(produto)}
          className="mt-2 flex h-8 sm:h-8.5 w-full items-center justify-center gap-1.5 rounded-lg bg-amarelo px-2.5 text-xs font-black transition hover:brightness-95 active:scale-95 text-preto-v1 shadow-2xs"
        >
          <Plus size={13} strokeWidth={3} /> {temTamanhos || produto.permiteCombo ? 'Escolher opções' : 'Adicionar'}
        </button>
      </div>
    </article>
  )
}

function ModalConfiguracao({
  produto,
  cardapio,
  opcoesBebidas,
  opcoesAcompanhamentos,
  onFechar,
  onAdicionar,
}: {
  produto: Produto
  cardapio?: SecaoCardapio[]
  opcoesBebidas: OpcaoItemCombo[]
  opcoesAcompanhamentos: OpcaoItemCombo[]
  onFechar: () => void
  onAdicionar: (item: Omit<ItemPedido, 'quantidade'>) => void
}) {
  const temVariacoesMultiplas = Boolean(produto.variacoes && produto.variacoes.length > 1)
  const [variacao, setVariacao] = useState<VariacaoProduto | null>(
    temVariacoesMultiplas ? null : (produto.variacoes?.[0] ?? null),
  )

  const saboresRefriDinamicos = useMemo(() => {
    if (!cardapio) return SABORES_REFRIGERANTE
    for (const secao of cardapio) {
      for (const prod of secao.produtos) {
        const n = normalizarTexto(prod.nome)
        if (n.includes('refrigerante') || n.includes('refri')) {
          const g = prod.grupos?.find((grp) => normalizarTexto(grp.nome).includes('sabor'))
          const opcoes = g?.opcoes?.filter((o) => o.ativo).map((o) => o.nome) ?? []
          if (opcoes.length > 0) return opcoes
        }
      }
    }
    return SABORES_REFRIGERANTE
  }, [cardapio])

  const saboresSodaDinamicos = useMemo(() => {
    if (!cardapio) return SABORES_SODA_ITALIANA
    for (const secao of cardapio) {
      for (const prod of secao.produtos) {
        const n = normalizarTexto(prod.nome)
        if (n.includes('soda')) {
          const g = prod.grupos?.find((grp) => normalizarTexto(grp.nome).includes('sabor'))
          const opcoes = g?.opcoes?.filter((o) => o.ativo).map((o) => o.nome) ?? []
          if (opcoes.length > 0) return opcoes
        }
      }
    }
    return SABORES_SODA_ITALIANA
  }, [cardapio])

  const saboresPratsDinamicos = useMemo(() => {
    if (!cardapio) return SABORES_PRATS
    for (const secao of cardapio) {
      for (const prod of secao.produtos) {
        const n = normalizarTexto(prod.nome)
        if (n.includes('prats')) {
          const g = prod.grupos?.find((grp) => normalizarTexto(grp.nome).includes('sabor'))
          const opcoes = g?.opcoes?.filter((o) => o.ativo).map((o) => o.nome) ?? []
          if (opcoes.length > 0) return opcoes
        }
      }
    }
    return SABORES_PRATS
  }, [cardapio])
  const grupoMaionese = produto.grupos?.find((g) => normalizarTexto(g.nome).includes('maionese'))
  const grupoRemocoes = produto.grupos?.find((g) =>
    normalizarTexto(g.nome).includes('retirar') || normalizarTexto(g.nome).includes('remover')
  )
  const opcoesMaionese =
    grupoMaionese?.opcoes?.filter((o) => o.ativo).map((o) => o.nome) ?? []
  const opcoesRetirar =
    grupoRemocoes?.opcoes?.filter((o) => o.ativo).map((o) => o.nome) ?? []
  const permiteMaionese = Boolean(grupoMaionese && opcoesMaionese.length > 0)
  const permiteRemocoes = Boolean(grupoRemocoes && opcoesRetirar.length > 0)
  const [maioneses, setMaioneses] = useState<string[]>([])
  const [ingredientesRetirar, setIngredientesRetirar] = useState<string[]>([])
  const [comboEscolha, setComboEscolha] = useState<boolean | null>(produto.permiteCombo ? null : false)
  const acompanhamentoInicial =
    opcoesAcompanhamentos.find((opcao) => normalizarTexto(opcao.nome).includes('chips')) ??
    opcoesAcompanhamentos[0] ??
    { id: 'chips', nome: 'Paraiba Chips', precoAdicional: 0 }
  const [acompanhamento, setAcompanhamento] = useState<OpcaoItemCombo>(acompanhamentoInicial)
  const bebidaInicial = opcoesBebidas[0] ?? { id: 'refri', nome: 'Refrigerante', precoAdicional: 0 }
  const [bebida, setBebida] = useState<OpcaoItemCombo>(bebidaInicial)
  const gruposEspeciais = useMemo(
    () =>
      produto.grupos?.filter((g) => {
        const n = normalizarTexto(g.nome)
        return (
          !n.includes('maionese') &&
          !n.includes('retirar') &&
          !n.includes('remover') &&
          !n.includes('adicion') &&
          !n.includes('acresc')
        )
      }) ?? [],
    [produto.grupos],
  )
  const [saborSelecionado, setSaborSelecionado] = useState<string>('')
  const [saborBebidaCombo, setSaborBebidaCombo] = useState<string>('')
  const [observacao, setObservacao] = useState('')
  const [paraViagemItem, setParaViagemItem] = useState(false)
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<number[]>([])
  const combo = comboEscolha === true
  const precoIndividual = variacao?.preco ?? produto.preco
  const adicionaisEscolhidos = produto.adicionais?.filter((adicional) => adicionaisSelecionados.includes(adicional.id)) ?? []
  const totalAdicionais = adicionaisEscolhidos.reduce((total, adicional) => total + adicional.preco, 0)
  const adicionalAcomp = combo ? acompanhamento.precoAdicional : 0
  const adicionalBebida = combo ? bebida.precoAdicional : 0
  const adicionalSabor = useMemo(() => {
    if (!saborSelecionado) return 0
    for (const g of gruposEspeciais) {
      const match = g.opcoes?.find((o) => o.nome === saborSelecionado)
      if (match && Number(match.preco) > 0) return Number(match.preco)
    }
    return 0
  }, [gruposEspeciais, saborSelecionado])
  const precoFinal =
    (combo ? (variacao?.precoCombo ?? precoIndividual) : precoIndividual) +
    totalAdicionais +
    adicionalAcomp +
    adicionalBebida +
    adicionalSabor
  const tamanhoRespondido = !temVariacoesMultiplas || variacao !== null
  const comboRespondido = !produto.permiteCombo || comboEscolha !== null
  const precisaSabor = gruposEspeciais.some((g) => g.obrigatorio) && !saborSelecionado
  const podeAdicionar = tamanhoRespondido && comboRespondido && !precisaSabor

  function alternarMaionese(opcao: string) {
    setMaioneses((atual) =>
      atual.includes(opcao) ? atual.filter((m) => m !== opcao) : [...atual, opcao],
    )
  }

  function alternarRetirar(opcao: string) {
    setIngredientesRetirar((atual) =>
      atual.includes(opcao) ? atual.filter((r) => r !== opcao) : [...atual, opcao],
    )
  }

  function alternarAdicional(id: number) {
    setAdicionaisSelecionados((atual) =>
      atual.includes(id) ? atual.filter((valor) => valor !== id) : [...atual, id],
    )
  }

  function confirmar() {
    if (!podeAdicionar) return
    const nomeBase = variacao?.nome ?? produto.nome
    const descricaoBase = variacao?.descricao ?? produto.descricao
    const idAdicionais = adicionaisEscolhidos.map((adicional) => adicional.id).sort((a, b) => a - b).join('+')
    const idObservacao = observacao.trim() ? encodeURIComponent(observacao.trim()) : ''
    const idAcomp = combo ? encodeURIComponent(acompanhamento.nome) : ''
    const idBebida = combo ? encodeURIComponent(bebida.nome) : ''
    const idMaioneses = maioneses.length ? encodeURIComponent(maioneses.slice().sort().join(',')) : ''
    const idRemocoes = ingredientesRetirar.length ? encodeURIComponent(ingredientesRetirar.slice().sort().join(',')) : ''

    const linhasObs: string[] = []
    if (maioneses.length > 0) {
      linhasObs.push(`Maionese: ${maioneses.join(', ')}`)
    }
    if (combo) {
      const extraAcomp = acompanhamento.precoAdicional > 0 ? ` (+${moeda(acompanhamento.precoAdicional)})` : ''
      const extraBebida = bebida.precoAdicional > 0 ? ` (+${moeda(bebida.precoAdicional)})` : ''
      const rotuloSaborCombo = saborBebidaCombo ? ` (${saborBebidaCombo})` : ''
      linhasObs.push(`Combo: ${acompanhamento.nome}${extraAcomp} + ${bebida.nome}${rotuloSaborCombo}${extraBebida}`)
    }
    if (saborSelecionado) {
      linhasObs.push(`Sabor: ${saborSelecionado}`)
    }
    if (ingredientesRetirar.length > 0) {
      linhasObs.push(`Remover: ${ingredientesRetirar.join(', ')}`)
    }
    if (observacao.trim()) {
      linhasObs.push(`Obs: ${observacao.trim()}`)
    }
    if (paraViagemItem) {
      linhasObs.push(MARCADOR_VIAGEM)
    }

    const bebidaTextoCombo = saborBebidaCombo ? `${bebida.nome} (${saborBebidaCombo})` : bebida.nome
    const nomeComSabor = saborSelecionado ? `${nomeBase} (${saborSelecionado})` : nomeBase

    onAdicionar({
      id: [
        produto.id,
        variacao?.id,
        combo ? 'combo' : 'individual',
        idAcomp,
        idBebida,
        saborBebidaCombo ? `sb:${encodeURIComponent(saborBebidaCombo)}` : '',
        saborSelecionado ? `s:${encodeURIComponent(saborSelecionado)}` : '',
        idMaioneses ? `m:${idMaioneses}` : '',
        idRemocoes ? `r:${idRemocoes}` : '',
        idAdicionais ? `a:${idAdicionais}` : '',
        idObservacao ? `o:${idObservacao}` : '',
        paraViagemItem ? 'viagem' : '',
      ].filter(Boolean).join(':'),
      nome: combo ? `Combo ${nomeBase}` : nomeComSabor,
      descricao: combo ? `${descricaoBase} | ${acompanhamento.nome} + ${bebidaTextoCombo}` : (saborSelecionado ? `${descricaoBase} (${saborSelecionado})` : descricaoBase),
      preco: precoFinal,
      observacao: linhasObs.join('\n') || null,
      produtoVariacaoId: combo
        ? variacao?.produtoVariacaoComboId ?? variacao?.produtoVariacaoId
        : variacao?.produtoVariacaoId,
      adicionais: adicionaisEscolhidos.length ? adicionaisEscolhidos : undefined,
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm" onClick={onFechar}>
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-36 shrink-0 overflow-hidden sm:h-48">
          <img src={variacao?.imagem ?? produto.imagem} alt={produto.nome} className="h-full w-full object-cover object-[50%_62%] transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
          <button type="button" onClick={onFechar} className="absolute right-3 top-3 rounded-full bg-white/95 p-2 shadow-md sm:right-4 sm:top-4" aria-label="Fechar">
            <X size={20} />
          </button>
          <div className="absolute bottom-3 left-4 text-white sm:bottom-4 sm:left-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amarelo">Configure o item</p>
            <h2 className="font-barlow-condensed text-2xl font-black uppercase sm:text-3xl">{produto.nome}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6">
          {/* 1. Tamanho */}
          {produto.variacoes && produto.variacoes.length > 1 && (
            <GrupoConfiguracao titulo="Escolha o tamanho" descricao="Selecione uma opção." obrigatorio>
              {produto.variacoes.map((opcao, index) => (
                <BotaoOpcao
                  key={opcao.id}
                  ativo={variacao?.id === opcao.id}
                  titulo={opcao.nome}
                  descricao={opcao.descricao}
                  preco={opcao.preco}
                  marcador={`${index + 1}x`}
                  onClick={() => setVariacao(opcao)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {/* 2. Maionese */}
          {permiteMaionese && (
            <GrupoConfiguracao
              titulo="Escolha a maionese"
              descricao="Opcional. Sem limite de escolha (marque quantas quiser ou nenhuma)."
            >
              {opcoesMaionese.map((opcao) => (
                <BotaoOpcao
                  key={opcao}
                  ativo={maioneses.includes(opcao)}
                  titulo={opcao}
                  onClick={() => alternarMaionese(opcao)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {/* 3. Combo */}
          {produto.permiteCombo && (
            <GrupoConfiguracao
              titulo="Deseja transformar em combo?"
              descricao="O combo acompanha um acompanhamento e uma bebida à sua escolha."
              obrigatorio
            >
              <BotaoOpcao
                ativo={comboEscolha === false}
                titulo="Somente o lanche"
                descricao="Sem acompanhamento ou bebida"
                preco={precoIndividual}
                onClick={() => setComboEscolha(false)}
              />
              <BotaoOpcao
                ativo={comboEscolha === true}
                titulo="Quero o combo"
                descricao="Acompanhamento + bebida"
                preco={variacao?.precoCombo ?? precoIndividual}
                onClick={() => setComboEscolha(true)}
              />
            </GrupoConfiguracao>
          )}

          {combo && (
            <GrupoConfiguracao titulo="Escolha o acompanhamento" descricao="Selecione o acompanhamento do combo.">
              {opcoesAcompanhamentos.map((opcao) => (
                <BotaoOpcao
                  key={opcao.id}
                  ativo={acompanhamento.id === opcao.id}
                  titulo={opcao.nome}
                  preco={opcao.precoAdicional > 0 ? opcao.precoAdicional : undefined}
                  rotuloPreco={opcao.precoAdicional > 0 ? `+ ${moeda(opcao.precoAdicional)}` : 'Incluso'}
                  onClick={() => setAcompanhamento(opcao)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {combo && (
            <GrupoConfiguracao titulo="Escolha a bebida" descricao="Selecione a bebida do combo.">
              {opcoesBebidas.map((opcao) => (
                <BotaoOpcao
                  key={opcao.id}
                  ativo={bebida.id === opcao.id}
                  titulo={opcao.nome}
                  preco={opcao.precoAdicional > 0 ? opcao.precoAdicional : undefined}
                  rotuloPreco={opcao.precoAdicional > 0 ? `+ ${moeda(opcao.precoAdicional)}` : 'Incluso'}
                  onClick={() => {
                    setBebida(opcao)
                    setSaborBebidaCombo('')
                  }}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {combo && (normalizarTexto(bebida.nome).includes('refrigerante') || normalizarTexto(bebida.nome).includes('refri')) && (
            <GrupoConfiguracao titulo="Sabor do refrigerante">
              {saboresRefriDinamicos.map((sabor) => (
                <BotaoOpcao
                  key={sabor}
                  ativo={saborBebidaCombo === sabor}
                  titulo={sabor}
                  rotuloPreco="Incluso"
                  onClick={() => setSaborBebidaCombo(sabor)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {combo && normalizarTexto(bebida.nome).includes('soda') && (
            <GrupoConfiguracao titulo="Sabor da soda italiana">
              {saboresSodaDinamicos.map((sabor) => (
                <BotaoOpcao
                  key={sabor}
                  ativo={saborBebidaCombo === sabor}
                  titulo={sabor}
                  rotuloPreco="Incluso"
                  onClick={() => setSaborBebidaCombo(sabor)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {combo && normalizarTexto(bebida.nome).includes('prats') && (
            <GrupoConfiguracao titulo="Sabor do suco Prats">
              {saboresPratsDinamicos.map((sabor) => (
                <BotaoOpcao
                  key={sabor}
                  ativo={saborBebidaCombo === sabor}
                  titulo={sabor}
                  rotuloPreco="Incluso"
                  onClick={() => setSaborBebidaCombo(sabor)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {/* Grupos Especiais do Produto (ex: Sabores de Refrigerante ou Soda avulsos) */}
          {gruposEspeciais.map((g) => (
            <GrupoConfiguracao
              key={g.id}
              titulo={g.nome}
              obrigatorio={g.obrigatorio}
            >
              {g.opcoes?.filter((o) => o.ativo).map((opcao) => {
                const precoNum = Number(opcao.preco || 0)
                return (
                  <BotaoOpcao
                    key={opcao.id}
                    ativo={saborSelecionado === opcao.nome}
                    titulo={opcao.nome}
                    rotuloPreco={precoNum > 0 ? `+ ${moeda(precoNum)}` : 'Incluso'}
                    onClick={() => setSaborSelecionado(opcao.nome)}
                  />
                )
              })}
            </GrupoConfiguracao>
          ))}

          {/* 4. Adicionais */}
          {produto.adicionais && produto.adicionais.length > 0 && (
            <GrupoConfiguracao titulo="Adicionais" descricao="Opcional. Pode escolher mais de um.">
              {produto.adicionais.map((adicional) => (
                <BotaoOpcao
                  key={adicional.id}
                  ativo={adicionaisSelecionados.includes(adicional.id)}
                  titulo={adicional.nome}
                  preco={adicional.preco}
                  onClick={() => alternarAdicional(adicional.id)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {/* 5. Retirar ingredientes */}
          {permiteRemocoes && (
            <GrupoConfiguracao
              titulo="Retirar ingredientes"
              descricao="Opcional. Marque os itens que NÃO devem vir no lanche."
            >
              {opcoesRetirar.map((opcao) => (
                <BotaoOpcao
                  key={opcao}
                  variante="perigo"
                  ativo={ingredientesRetirar.includes(opcao)}
                  titulo={opcao}
                  onClick={() => alternarRetirar(opcao)}
                />
              ))}
            </GrupoConfiguracao>
          )}

          {/* 6. Observações */}
          <section>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black">Alguma observação?</h3>
                <p className="mt-0.5 text-xs text-slate-400">Opcional. Aparece para a cozinha.</p>
              </div>
              <button
                type="button"
                onClick={() => setParaViagemItem((v) => !v)}
                aria-pressed={paraViagemItem}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  paraViagemItem
                    ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-1 ring-amber-400/50'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-900'
                }`}
              >
                <Package size={14} />
                Para viagem
              </button>
            </div>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: carne bem passada, pouco sal, cortar ao meio..." maxLength={200} rows={3} className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-base sm:text-sm placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
          </section>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4 sm:p-5">
          <button type="button" onClick={onFechar} className="min-h-11 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase text-slate-500 sm:px-5">Cancelar</button>
          <button type="button" disabled={!podeAdicionar} onClick={confirmar} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amarelo px-4 py-3 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Adicionar - {moeda(precoFinal)}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ModalConfirmarExclusaoItem({
  nomeItem,
  onCancelar,
  onConfirmar,
}: {
  nomeItem: string
  onCancelar: () => void
  onConfirmar: () => void
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Remover item do pedido?"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Trash2 size={22} />
        </span>
        <h2 className="mt-4 font-barlow-condensed text-xl font-black uppercase text-preto-v1">
          Remover item do pedido?
        </h2>
        <p className="mt-2 text-sm leading-5 text-slate-500">
          Tem certeza que deseja remover <strong className="text-preto-v1">{nomeItem}</strong> deste pedido?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase text-white transition hover:bg-red-700 active:scale-95 shadow-xs"
          >
            Remover
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function GrupoConfiguracao({
  titulo,
  descricao,
  obrigatorio = false,
  children,
}: {
  titulo: string
  descricao?: string
  obrigatorio?: boolean
  children: ReactNode
}) {
  return (
    <section>
      <div>
        <h3 className="text-sm font-black">
          {titulo}
          {obrigatorio && (
            <span className="ml-1 text-red-600" aria-hidden>
              *
            </span>
          )}
        </h3>
        {descricao && <p className="mt-0.5 text-xs text-slate-400">{descricao}</p>}
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  )
}

function BotaoOpcao({
  ativo,
  titulo,
  descricao,
  preco,
  rotuloPreco,
  marcador,
  variante = 'padrao',
  onClick,
}: {
  ativo: boolean
  titulo: string
  descricao?: string
  preco?: number
  rotuloPreco?: string
  marcador?: string
  variante?: 'padrao' | 'perigo'
  onClick: () => void
}) {
  const ehPerigo = variante === 'perigo'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        ativo
          ? ehPerigo
            ? 'border-red-400 bg-red-50 text-red-950 shadow-sm'
            : 'border-emerald-500 bg-emerald-50 text-slate-900 shadow-sm'
          : ehPerigo
            ? 'border-slate-200 hover:border-red-300 hover:bg-red-50/40'
            : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black transition ${
          ativo
            ? ehPerigo
              ? 'bg-red-600 text-white'
              : 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {marcador ?? (
          ehPerigo && ativo ? (
            <X size={16} strokeWidth={3} />
          ) : (
            <span
              className={`h-3 w-3 rounded-full border-2 transition ${
                ativo ? 'border-white bg-white' : 'border-slate-300'
              }`}
            />
          )
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-black ${ativo && ehPerigo ? 'text-red-900' : ''}`}>
          {titulo}
        </span>
        {descricao && <span className="mt-0.5 block text-xs text-slate-400">{descricao}</span>}
      </span>
      {rotuloPreco ? (
        <strong
          className={`whitespace-nowrap text-sm ${
            rotuloPreco === 'Incluso' ? 'font-semibold text-slate-400' : 'text-emerald-700'
          }`}
        >
          {rotuloPreco}
        </strong>
      ) : preco !== undefined ? (
        <strong className="whitespace-nowrap text-sm">{moeda(preco)}</strong>
      ) : null}
    </button>
  )
}

function formatarTelefoneExibicao(telefone?: string | null) {
  if (!telefone) return ''
  const limpo = telefone.replace(/\D/g, '')
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`
  }
  return telefone
}

function ModalFidelidadeRapida({
  aberto,
  onFechar,
  onClienteVinculado,
}: {
  aberto: boolean
  onFechar: () => void
  onClienteVinculado: (cliente: ClienteVinculado) => void
}) {
  const [identificacao, setIdentificacao] = useState('')
  const [consultando, setConsultando] = useState(false)
  const [erro, setErro] = useState('')
  const [querCadastrar, setQuerCadastrar] = useState(false)
  const [clientesEncontrados, setClientesEncontrados] = useState<ClienteApi[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  if (!aberto) return null

  async function buscar() {
    const valor = identificacao.trim()
    if (!valor) {
      setErro('Informe o telefone, e-mail ou 4 últimos dígitos.')
      return
    }
    setErro('')
    setClientesEncontrados([])
    setConsultando(true)
    try {
      const resultados = await listarClientesApi({ busca: valor, skip: 0, limit: 10 })
      if (!resultados || resultados.length === 0) {
        setErro('Cliente não encontrado com esse dado.')
        setQuerCadastrar(true)
        if (valor.includes('@')) setEmail(valor)
        else if (valor.replace(/\D/g, '').length >= 8) setTelefone(valor)
        return
      }
      if (resultados.length === 1) {
        const c = resultados[0]
        onClienteVinculado({
          id: c.id,
          nome: c.nome,
          pontos: c.pontos_fidelidade,
          totalParaPremio: 10,
        })
        onFechar()
        return
      }
      setClientesEncontrados(resultados)
    } catch {
      setErro('Não foi possível consultar a fidelidade.')
    } finally {
      setConsultando(false)
    }
  }

  async function cadastrar() {
    if (!nome.trim()) {
      setErro('Informe o nome do cliente.')
      return
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    const telLimpo = telefone.replace(/\D/g, '')
    if (!emailValido || telLimpo.length < 10) {
      setErro('Informe um e-mail válido e um telefone com DDD.')
      return
    }
    setErro('')
    setConsultando(true)
    try {
      const cliente = await criarClienteApi({ nome: nome.trim(), email: email.trim(), telefone })
      onClienteVinculado({
        id: cliente.id,
        nome: cliente.nome,
        pontos: cliente.pontos_fidelidade,
        totalParaPremio: 10,
      })
      onFechar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível cadastrar o cliente.')
    } finally {
      setConsultando(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onFechar}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <UserCheck size={16} />
            </span>
            <h3 className="font-barlow-condensed text-lg font-black uppercase text-preto-v1">
              Programa Fidelidade
            </h3>
          </div>
          <button type="button" onClick={onFechar} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {!querCadastrar ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Telefone ou E-mail do cliente
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={identificacao}
                  onChange={(e) => {
                    setIdentificacao(e.target.value)
                    if (erro) setErro('')
                    if (clientesEncontrados.length) setClientesEncontrados([])
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && buscar()}
                  placeholder=""
                  className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-amber-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={buscar}
                  disabled={consultando}
                  className="rounded-xl bg-preto-v1 px-4 text-xs font-bold text-white hover:bg-black transition disabled:opacity-50"
                >
                  {consultando ? '...' : 'Buscar'}
                </button>
              </div>
            </div>

            {erro && <p className="text-xs font-semibold text-red-600">{erro}</p>}

            {clientesEncontrados.length > 1 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-bold text-slate-600">
                  Encontrados {clientesEncontrados.length} clientes. Selecione o correto:
                </p>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {clientesEncontrados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onClienteVinculado({
                          id: c.id,
                          nome: c.nome,
                          pontos: c.pontos_fidelidade,
                          totalParaPremio: 10,
                        })
                        onFechar()
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-amber-400 hover:bg-amber-50/40 active:scale-98"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{c.nome}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatarTelefoneExibicao(c.telefone)}
                          {c.email ? ` • ${c.email}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                          {c.pontos_fidelidade} pts
                        </span>
                        <span className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700">
                          Escolher
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 text-center">
              <button
                type="button"
                onClick={() => { setQuerCadastrar(true); setErro('') }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                + Novo cadastro de cliente
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome completo</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do cliente"
                className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telefone com DDD</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(61) 99999-9999"
                className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                type="email"
                className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-amber-400"
              />
            </div>

            {erro && <p className="text-xs font-semibold text-red-600">{erro}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setQuerCadastrar(false); setErro('') }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={cadastrar}
                disabled={consultando}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {consultando ? 'Cadastrando...' : 'Cadastrar e vincular'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function ResumoPedido({
  tipoMensagemPedido,
  pedido,
  subtotal,
  pagamento,
  pedidoSelecionado,
  itensRegistrados,
  pedidoEmPreparo,
  pedidoAbertoId,
  usarDescontoFidelidade,
  finalizando,
  editandoItemId,
  mensagemPedido,
  nomeComanda,
  comandaInvalida,
  onNomeComanda,
  paraViagem,
  onParaViagem,
  onAlternarViagemItem,
  clientePedido,
  onCliente,
  onUsarDesconto,
  onAbrirFidelidade,
  onPagamento,
  onQuantidade,
  onEditarItemRegistrado,
  onAtualizarObservacao,
  onSalvarAberto,
  onFinalizar,
  onNovoPedido,
}: {
  tipoMensagemPedido?: 'sucesso' | 'erro' | 'info'
  pedido: ItemPedido[]
  subtotal: number
  pagamento: string
  pedidoSelecionado: PedidoApi | undefined
  itensRegistrados: PedidoApi['itens']
  pedidoEmPreparo: boolean
  pedidoAbertoId: number | null
  usarDescontoFidelidade: boolean
  finalizando: boolean
  editandoItemId: number | null
  mensagemPedido: string
  nomeComanda: string
  comandaInvalida?: boolean
  onNomeComanda: (nome: string) => void
  paraViagem: boolean
  onParaViagem: (valor: boolean) => void
  onAlternarViagemItem: (id: string) => void
  clientePedido: ClienteVinculado | null
  onCliente: (cliente: ClienteVinculado | null) => void
  onUsarDesconto: (usar: boolean) => void
  onAbrirFidelidade: () => void
  onPagamento: (valor: string) => void
  onQuantidade: (id: string, quantidade: number) => void
  onEditarItemRegistrado: (item: PedidoApi['itens'][number], acao: 'adicionar' | 'remover' | 'excluir') => void
  onAtualizarObservacao: (itemId: number, observacao: string | null) => Promise<void>
  onSalvarAberto: () => void
  onFinalizar: () => void
  onNovoPedido: () => void
}) {
  const [obsEditando, setObsEditando] = useState<{ itemId: number; texto: string } | null>(null)
  const [salvandoObs, setSalvandoObs] = useState(false)
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: 'novo' | 'registrado'
    novoId?: string
    itemRegistrado?: PedidoApi['itens'][number]
    nome: string
  } | null>(null)

  function confirmarExclusao() {
    if (!itemParaExcluir) return
    if (itemParaExcluir.tipo === 'registrado' && itemParaExcluir.itemRegistrado) {
      onEditarItemRegistrado(itemParaExcluir.itemRegistrado, 'excluir')
    } else if (itemParaExcluir.tipo === 'novo' && itemParaExcluir.novoId) {
      onQuantidade(itemParaExcluir.novoId, 0)
    }
    setItemParaExcluir(null)
  }

  const isPago = pedidoSelecionado?.status === 'pago'
  const visualizandoPagoSemNovosItens = Boolean(pedidoAbertoId && isPago && pedido.length === 0)
  const descontoExistente = Number(pedidoSelecionado?.desconto_fidelidade ?? 0)
  const descontoNovo = !pedidoAbertoId && usarDescontoFidelidade
    ? Math.min(VALOR_DESCONTO_FIDELIDADE, subtotal)
    : 0
  const descontoExibido = descontoExistente || descontoNovo
  const totalAtual = Number(pedidoSelecionado?.total ?? 0)
  const totalParaFinalizar = isPago
    ? Math.max(subtotal - descontoNovo, 0)
    : Math.max(totalAtual + subtotal - descontoNovo, 0)

  return (
    <aside id="resumo-pedido" className="w-full min-w-0 max-w-full scroll-mt-20 border-t border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:border-l lg:border-t-0 lg:scroll-mt-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-2 lg:px-4 lg:py-2.5 lg:shrink-0">
        <h2 className="font-barlow-condensed text-base sm:text-lg font-black uppercase tracking-wide">Resumo do pedido</h2>
        {(itensRegistrados.length > 0 || pedido.length > 0) && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {itensRegistrados.reduce((t, i) => t + i.quantidade, 0) + pedido.reduce((t, i) => t + i.quantidade, 0)} {itensRegistrados.reduce((t, i) => t + i.quantidade, 0) + pedido.reduce((t, i) => t + i.quantidade, 0) === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {/* Dados do Ticket Fixo: Comanda e Cliente Fidelidade */}
      <div className="border-b border-slate-200/80 bg-slate-50/70 p-2.5 sm:p-3 lg:shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              id="comanda-ticket"
              value={nomeComanda}
              onChange={(e) => onNomeComanda(e.target.value)}
              disabled={Boolean(pedidoAbertoId)}
              placeholder="Nome da Comanda"
              className={`h-8.5 w-full rounded-lg border px-3 text-xs font-bold outline-none transition disabled:bg-slate-100 disabled:text-slate-500 ${
                comandaInvalida
                  ? 'border-red-500 bg-red-50/40 text-red-900 ring-2 ring-red-400/50 placeholder:text-red-400'
                  : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
            />
            {pedidoAbertoId && (
              <span className="absolute right-2 top-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                #{pedidoAbertoId}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onParaViagem(!paraViagem)}
            aria-pressed={paraViagem}
            title="Marcar pedido inteiro para viagem"
            className={`inline-flex h-8.5 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition ${
              paraViagem
                ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm ring-1 ring-amber-400/50'
                : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50/60 hover:text-amber-900'
            }`}
          >
            <Package size={13} />
            <span>Para viagem</span>
          </button>
        </div>
        {comandaInvalida && (
          <p className="mt-1 text-[11px] font-bold text-red-600">
            Informe o nome da comanda
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-1.5">
          {clientePedido ? (
            <div className="flex flex-1 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <UserCheck size={13} className="text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-900 truncate text-[11px]">{clientePedido.nome}</span>
                <span className="rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[9px] font-black text-emerald-800 shrink-0">
                  {clientePedido.pontos} pts
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCliente(null)
                  onUsarDesconto(false)
                }}
                className="text-slate-400 hover:text-red-600 shrink-0 ml-1.5 p-0.5"
                title="Desvincular cliente"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAbrirFidelidade}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition active:scale-95"
            >
              <UserPlus size={13} className="text-slate-400" />
              <span>+ Cliente fidelidade</span>
            </button>
          )}
        </div>

        {clientePedido && clientePedido.pontos >= 10 && !pedidoAbertoId && (
          <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-900">
            <input
              type="checkbox"
              checked={usarDescontoFidelidade}
              onChange={(e) => onUsarDesconto(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber-600"
            />
            <span>Usar hot-dog grátis (-{moeda(VALOR_DESCONTO_FIDELIDADE)})</span>
          </label>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-3.5">
        {itensRegistrados.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Itens já registrados</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">Pedido #{pedidoAbertoId}</span></div>
            <div className="space-y-2">
              {itensRegistrados.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-bold">{item.quantidade}x {formatarItemPedido(item.produto_nome, item.produto_variacao_nome)}</p><p className="mt-1 text-[10px] text-slate-400">Lote {item.lote}</p>{item.adicionais.length > 0 && <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">+ {item.adicionais.map((adicional) => adicional.nome).join(', ')}</p>}<LinhasObservacao observacao={item.observacao} /></div>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${item.status === 'entregue' ? 'bg-emerald-100 text-emerald-700' : item.status === 'preparando' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {item.status === 'aberto' && !pedidoEmPreparo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <button
                            type="button"
                            disabled={editandoItemId === item.id}
                            onClick={() => {
                              if (item.quantidade <= 1) {
                                setItemParaExcluir({
                                  tipo: 'registrado',
                                  itemRegistrado: item,
                                  nome: formatarItemPedido(item.produto_nome, item.produto_variacao_nome),
                                })
                              } else {
                                onEditarItemRegistrado(item, 'remover')
                              }
                            }}
                            className="p-2 disabled:opacity-40"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-8 text-center text-xs font-bold">{item.quantidade}</span>
                          <button type="button" disabled={editandoItemId === item.id} onClick={() => onEditarItemRegistrado(item, 'adicionar')} className="p-2 disabled:opacity-40"><Plus size={13} /></button>
                        </div>
                        <button
                          type="button"
                          disabled={editandoItemId === item.id}
                          onClick={() => {
                            setItemParaExcluir({
                              tipo: 'registrado',
                              itemRegistrado: item,
                              nome: formatarItemPedido(item.produto_nome, item.produto_variacao_nome),
                            })
                          }}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:text-red-500 disabled:opacity-40"
                          title="Remover item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : <span className="text-[9px] font-semibold text-slate-400">Edicao bloqueada pela cozinha</span>}
                    <p className="text-right text-xs font-bold">{moeda((Number(item.preco_unitario) + item.adicionais.reduce((total, adicional) => total + Number(adicional.preco), 0)) * item.quantidade)}</p>
                  </div>
                  {item.status === 'aberto' && !pedidoEmPreparo && (
                    <div className="mt-2 border-t border-slate-100 pt-2">
                      {obsEditando?.itemId === item.id ? (
                        <div>
                          <textarea
                            value={obsEditando.texto}
                            onChange={(e) => setObsEditando({ itemId: item.id, texto: e.target.value })}
                            placeholder="Ex: sem cebola, bem passado..."
                            maxLength={200}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2 text-xs placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              disabled={salvandoObs}
                              onClick={async () => {
                                setSalvandoObs(true)
                                const partes = item.observacao?.split('\n') ?? []
                                const maioneseParte = partes.find((l) => l.startsWith('Maionese:')) ?? null
                                const comboParte = partes.find((l) => l.startsWith('Combo:') || l.startsWith('Bebida do combo:')) ?? null
                                const remocaoParte = partes.find((l) => l.startsWith('Remover:')) ?? null
                                const viagemParte = partes.find((l) => l.trim() === MARCADOR_VIAGEM) ?? null
                                const obsLimpa = obsEditando.texto.trim()
                                const novaObs = [maioneseParte, comboParte, remocaoParte, viagemParte, obsLimpa ? `Obs: ${obsLimpa}` : null].filter(Boolean).join('\n') || null
                                await onAtualizarObservacao(item.id, novaObs)
                                setObsEditando(null)
                                setSalvandoObs(false)
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                            >
                              {salvandoObs ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button type="button" onClick={() => setObsEditando(null)} className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-500">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const partes = item.observacao?.split('\n') ?? []
                            const obsLinha = partes.find((l) => l.startsWith('Obs: '))
                            setObsEditando({ itemId: item.id, texto: obsLinha ? obsLinha.slice(5) : '' })
                          }}
                          className="text-[10px] font-semibold text-emerald-600 hover:underline"
                        >
                          {item.observacao?.includes('Obs: ') ? 'Editar observação' : '+ Adicionar observação'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {pedido.length > 0 && <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Novos itens</p>}
        {pedido.length === 0 && itensRegistrados.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center"><ShoppingBag size={32} strokeWidth={1.5} className="text-slate-300" /><p className="mt-3 text-sm font-bold">Seu pedido está vazio</p><p className="mt-1 text-xs text-slate-400">Adicione produtos do cardápio.</p></div>
        ) : pedido.length > 0 ? (
          <div className="space-y-3">
            {pedido.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{item.nome}</p>
                    {item.adicionais && item.adicionais.length > 0 && (
                      <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                        + {item.adicionais.map((adicional) => adicional.nome).join(', ')}
                      </p>
                    )}
                    <LinhasObservacao observacao={item.observacao} ocultarViagem />
                    <p className="mt-1 text-xs text-slate-400">{moeda(item.preco)} cada</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setItemParaExcluir({
                        tipo: 'novo',
                        novoId: item.id,
                        nome: item.nome,
                      })
                    }}
                    className="text-slate-300 hover:text-red-500"
                    title="Remover item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantidade <= 1) {
                          setItemParaExcluir({
                            tipo: 'novo',
                            novoId: item.id,
                            nome: item.nome,
                          })
                        } else {
                          onQuantidade(item.id, item.quantidade - 1)
                        }
                      }}
                      className="p-2"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="min-w-8 text-center text-xs font-bold">{item.quantidade}</span>
                    <button type="button" onClick={() => onQuantidade(item.id, item.quantidade + 1)} className="p-2">
                      <Plus size={13} />
                    </button>
                  </div>
                  {!paraViagem && (
                    <button
                      type="button"
                      onClick={() => onAlternarViagemItem(item.id)}
                      aria-pressed={itemEhParaViagem(item.observacao)}
                      title="Marcar este item para viagem"
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                        itemEhParaViagem(item.observacao)
                          ? 'border-amber-400 bg-amber-100 text-amber-950'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-900'
                      }`}
                    >
                      <Package size={11} />
                      Viagem
                    </button>
                  )}
                  <strong className="text-sm">{moeda(item.preco * item.quantidade)}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-[#f8faff] p-2.5 sm:p-3 lg:shrink-0">
        {visualizandoPagoSemNovosItens ? (
          <div>
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>Total do pedido</span>
                <strong className="text-base font-black text-preto-v1">{moeda(totalAtual)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Status do pagamento</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  <CheckCircle2 size={12} /> Pago
                </span>
              </div>
              {descontoExistente > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Desconto fidelidade aplicado</span>
                  <span>- {moeda(descontoExistente)}</span>
                </div>
              )}
            </div>

            <div className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-center">
              <p className="text-xs font-bold text-emerald-800">
                Pedido quitado • Aguarda cozinha
              </p>
              <p className="mt-0.5 text-[10px] text-emerald-700">
                Para incluir mais produtos nesta comanda, escolha no cardápio.
              </p>
            </div>

            {mensagemPedido && (
              <p className={`mt-2 text-xs font-semibold ${tipoMensagemPedido === 'sucesso' ? 'text-emerald-700' : 'text-red-600'}`}>
                {mensagemPedido}
              </p>
            )}

            <button
              type="button"
              onClick={onNovoPedido}
              className="mt-2.5 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-black uppercase text-slate-700 hover:bg-slate-50 transition text-center shadow-2xs"
            >
              Iniciar novo pedido
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-1 text-xs text-slate-500">
              {isPago ? (
                <>
                  <div className="flex justify-between">
                    <span>Total anterior já pago</span>
                    <span>{moeda(totalAtual)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Novos itens a adicionar</span>
                    <span>{moeda(subtotal)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Novos itens</span>
                    <span>{moeda(subtotal)}</span>
                  </div>
                  {pedidoAbertoId && (
                    <div className="flex justify-between">
                      <span>Total atual do pedido</span>
                      <span>{moeda(totalAtual)}</span>
                    </div>
                  )}
                </>
              )}

              {descontoExibido > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Desconto fidelidade</span>
                  <span>- {moeda(descontoExibido)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 text-preto-v1">
                <span className="text-xs font-bold text-slate-600">Total para finalizar</span>
                <strong className="text-lg sm:text-xl font-black">{moeda(totalParaFinalizar)}</strong>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1 min-w-0">
              {pagamentos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPagamento(item.id)}
                  className={`flex h-9 flex-col items-center justify-center gap-0.5 rounded-lg border text-[9px] font-bold leading-none min-w-0 px-0.5 transition ${
                    pagamento === item.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span className="whitespace-nowrap tracking-tighter text-[8px] min-[360px]:text-[8.5px] lg:text-[8px] xl:text-[9px]">{item.label}</span>
                </button>
              ))}
            </div>

            {mensagemPedido && (
              <p className={`mt-1.5 text-xs font-semibold ${tipoMensagemPedido === 'sucesso' ? 'text-emerald-700' : 'text-red-600'}`}>
                {mensagemPedido}
              </p>
            )}

            <button
              type="button"
              onClick={onSalvarAberto}
              disabled={!pedido.length || finalizando || pedidoEmPreparo}
              className="mt-2 h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:border-slate-200 disabled:text-slate-300 active:scale-95 transition flex items-center justify-center text-center shadow-2xs"
            >
              {finalizando
                ? 'Salvando...'
                : pedidoAbertoId
                ? 'Adicionar e manter aberto'
                : 'Enviar e manter aberto'}
            </button>

            <button
              type="button"
              onClick={onFinalizar}
              disabled={(!pedido.length && !pedidoAbertoId) || finalizando || pedidoEmPreparo}
              className="mt-1.5 h-9.5 w-full rounded-lg bg-emerald-600 px-3 text-xs font-black uppercase tracking-wide text-white hover:bg-emerald-700 disabled:bg-slate-300 active:scale-95 transition flex items-center justify-center text-center shadow-xs"
            >
              {finalizando ? 'Finalizando...' : 'Finalizar e receber pagamento'}
            </button>
          </div>
        )}
      </div>

      {itemParaExcluir && (
        <ModalConfirmarExclusaoItem
          nomeItem={itemParaExcluir.nome}
          onCancelar={() => setItemParaExcluir(null)}
          onConfirmar={confirmarExclusao}
        />
      )}
    </aside>
  )
}

function formatarItemPedido(produto: string, variacao: string | null) {
  const nomeProduto = formatarNome(produto)
  if (!variacao || normalizarTexto(variacao) === 'unico') return nomeProduto
  return `${nomeProduto} - ${variacao}`
}

function LinhasObservacao({
  observacao,
  ocultarViagem = false,
}: {
  observacao: string | null | undefined
  ocultarViagem?: boolean
}) {
  if (!observacao) return null
  return (
    <>
      {observacao.split('\n').map((linha, i) => {
        if (linha.startsWith('Remover: ')) {
          return (
            <p key={i} className="mt-0.5 text-[10px] font-bold text-red-600">
              {linha}
            </p>
          )
        }
        if (linha.startsWith('Maionese: ')) {
          return (
            <p key={i} className="mt-0.5 text-[10px] font-bold text-amber-800">
              {linha}
            </p>
          )
        }
        if (linha.startsWith('Combo: ')) {
          return (
            <p key={i} className="mt-0.5 text-[10px] font-semibold text-slate-500">
              {linha}
            </p>
          )
        }
        if (linha.trim() === MARCADOR_VIAGEM) {
          if (ocultarViagem) return null
          return (
            <span
              key={i}
              className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-900"
            >
              <Package size={10} />
              Para viagem
            </span>
          )
        }
        return (
          <p
            key={i}
            className={`mt-0.5 text-[10px] font-semibold ${
              linha.startsWith('Obs: ') ? 'font-bold text-amber-800' : 'text-slate-400'
            }`}
          >
            {linha.startsWith('Obs: ') ? `Obs: ${linha.slice(5)}` : linha}
          </p>
        )
      })}
    </>
  )
}

const TAMANHOS = [
  { sufixo: /\s+duplo$/i, rotulo: 'Duplo', ordem: 1 },
  { sufixo: /\s+triplo$/i, rotulo: 'Triplo', ordem: 2 },
  { sufixo: /\s+qu[aá]druplo$/i, rotulo: 'Quádruplo', ordem: 3 },
]

function separarTamanho(nome: string) {
  const nomeLimpo = nome.trim()
  const tamanho = TAMANHOS.find(({ sufixo }) => sufixo.test(nomeLimpo))

  if (!tamanho) return { base: nomeLimpo, rotulo: 'Simples', ordem: 0 }

  return {
    base: nomeLimpo.replace(tamanho.sufixo, ''),
    rotulo: tamanho.rotulo,
    ordem: tamanho.ordem,
  }
}

function extrairDescricaoTamanho(produto: ProdutoCardapioApi, rotulo: string, ordem: number): string {
  const varNormal = produto.variacoes.find((v) => v.ativo && v.tipo === 'normal')
  if (varNormal && !['normal', 'unico', 'padrao', 'simples'].includes(normalizarTexto(varNormal.nome))) {
    return varNormal.nome
  }
  const matchDetalhe = produto.descricao?.match(/\b(\d+g|\d+\s+carnes?|\d+\s+salsichas?|blend\s+\d+g|burger\s+\d+g)\b/i)
  if (matchDetalhe) {
    return matchDetalhe[1]
  }
  if (ordem === 0) return 'Tamanho simples'
  if (ordem === 1) return 'Tamanho duplo'
  if (ordem === 2) return 'Tamanho triplo'
  return `Tamanho ${rotulo.toLowerCase()}`
}

function agruparProdutosPorTamanho(produtos: ProdutoCardapioApi[]): Produto[] {
  type ItemGrupo = {
    base: string
    rotulo: string
    ordem: number
    produto: ProdutoCardapioApi
  }

  const gruposPorChave = new Map<string, ItemGrupo[]>()

  const produtosOrdenados = [...produtos].sort((a, b) => a.id - b.id)

  produtosOrdenados.forEach((produto) => {
    const { base, rotulo, ordem } = separarTamanho(produto.nome)
    const chave = normalizarTexto(base)
    const lista = gruposPorChave.get(chave) ?? []
    lista.push({ base, rotulo, ordem, produto })
    gruposPorChave.set(chave, lista)
  })

  const produtosResultado: Produto[] = []

  gruposPorChave.forEach((itens) => {
    itens.sort((a, b) => a.ordem - b.ordem)

    if (itens.length === 1) {
      produtosResultado.push(mapearProdutoApi(itens[0].produto))
      return
    }

    const itemPrincipal = itens[0]
    const produtoBase = itemPrincipal.produto
    const variacoes: VariacaoProduto[] = []
    let temCombo = false

    itens.forEach(({ rotulo, ordem, produto }) => {
      const normais = produto.variacoes.filter((v) => v.ativo && v.tipo === 'normal')
      const combos = produto.variacoes.filter((v) => v.ativo && v.tipo === 'combo')
      if (combos.length > 0) temCombo = true

      const variacaoNormal = normais[0] ?? produto.variacoes.find((v) => v.ativo)
      if (!variacaoNormal) return

      const comboCorrespondente = combos[0] ?? encontrarCombo(variacaoNormal, combos)
      const imagemApi = resolverImagemProdutoApi(produto.imagem_url)
      const imagem = imagemApi ?? imagemProdutoLocal(produto.nome)

      variacoes.push({
        id: String(variacaoNormal.id),
        nome: `${formatarNome(itemPrincipal.base)} ${rotulo === 'Simples' ? '' : rotulo}`.trim(),
        descricao: extrairDescricaoTamanho(produto, rotulo, ordem),
        preco: Number(variacaoNormal.preco),
        precoCombo: comboCorrespondente ? Number(comboCorrespondente.preco) : undefined,
        produtoVariacaoId: variacaoNormal.id,
        produtoVariacaoComboId: comboCorrespondente?.id,
        imagem,
      })
    })

    const imagemPrincipal = resolverImagemProdutoApi(produtoBase.imagem_url) ?? imagemProdutoLocal(produtoBase.nome)
    const mapaAdicionais = new Map<number, AdicionalProduto>()
    itens.forEach(({ produto }) => {
      produto.adicionais.forEach((adicional) => {
        if (!mapaAdicionais.has(adicional.id)) {
          mapaAdicionais.set(adicional.id, {
            id: adicional.id,
            nome: adicional.nome,
            preco: Number(adicional.preco),
          })
        }
      })
    })

    produtosResultado.push({
      id: String(produtoBase.id),
      nome: formatarNome(itemPrincipal.base),
      descricao: produtoBase.descricao ?? '',
      preco: Math.min(...variacoes.map((v) => v.preco)),
      imagem: imagemPrincipal,
      variacoes,
      permiteCombo: temCombo,
      disponivelNoCombo: produtoBase.disponivel_no_combo ?? produtoBase.disponivel_combo ?? false,
      valorAdicionalCombo: Number(produtoBase.valor_adicional_combo ?? 0),
      adicionais: Array.from(mapaAdicionais.values()),
      grupos: itemPrincipal.produto.grupos ?? [],
    })
  })

  return produtosResultado
}

const PRIORIDADE_CATEGORIAS: RegExp[] = [
  /smash/i,
  /hot\s*[-_]?\s*dog/i,
  /acompanha/i,
  /bebida/i,
]

function obterPrioridadeCategoria(nome: string): number {
  const index = PRIORIDADE_CATEGORIAS.findIndex((padrao) => padrao.test(nome))
  return index === -1 ? PRIORIDADE_CATEGORIAS.length : index
}

function mapearCardapioApi(
  produtosApi: ProdutoCardapioApi[],
  categoriasApi: Array<{ id: number; nome: string }>,
  subcategoriasApi: Array<{ id: number; nome: string; categoria_id: number }>,
) {
  const categoriasPorId = new Map(categoriasApi.map((categoria) => [categoria.id, categoria.nome]))
  const subcategoriasPorId = new Map(subcategoriasApi.map((subcategoria) => [subcategoria.id, subcategoria]))
  const produtosValidos = produtosApi.filter((produto) => produto.ativo && produto.variacoes.some((variacao) => variacao.ativo))
  const grupos = new Map<string, ProdutoCardapioApi[]>()

  produtosValidos.forEach((produto) => {
    const subcategoria = subcategoriasPorId.get(produto.subcategoria_id)
    const categoria = subcategoria ? categoriasPorId.get(subcategoria.categoria_id) : undefined
    const titulo = categoria ?? subcategoria?.nome ?? 'Cardapio'
    const produtos = grupos.get(titulo) ?? []
    produtos.push(produto)
    grupos.set(titulo, produtos)
  })

  return Array.from(grupos.entries())
    .sort(([tituloA], [tituloB]) => {
      const prioridadeA = obterPrioridadeCategoria(tituloA)
      const prioridadeB = obterPrioridadeCategoria(tituloB)
      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB
      }
      return tituloA.localeCompare(tituloB, 'pt-BR')
    })
    .map(([titulo, produtosSecao], index) => ({
      id: `api-${index}-${normalizarTexto(titulo)}`,
      titulo,
      produtos: agruparProdutosPorTamanho(produtosSecao),
    }))
}

function mapearProdutoApi(produto: ProdutoCardapioApi): Produto {
  const normais = produto.variacoes.filter((variacao) => variacao.ativo && variacao.tipo === 'normal')
  const combos = produto.variacoes.filter((variacao) => variacao.ativo && variacao.tipo === 'combo')
  const variacoesBase = normais.length ? normais : produto.variacoes.filter((variacao) => variacao.ativo)
  const imagemApi = resolverImagemProdutoApi(produto.imagem_url)
  const imagemPadrao = imagemApi ?? imagemProdutoLocal(produto.nome)
  const variacoes = variacoesBase.map((variacao) => ({
    id: String(variacao.id),
    nome: nomeVariacao(produto.nome, variacao),
    descricao: variacao.nome,
    preco: Number(variacao.preco),
    precoCombo: encontrarCombo(variacao, combos)?.preco
      ? Number(encontrarCombo(variacao, combos)?.preco)
      : undefined,
    produtoVariacaoId: variacao.id,
    produtoVariacaoComboId: encontrarCombo(variacao, combos)?.id,
    imagem: imagemPadrao,
  }))

  return {
    id: String(produto.id),
    nome: formatarNome(produto.nome),
    descricao: produto.descricao ?? '',
    preco: Math.min(...variacoes.map((variacao) => variacao.preco)),
    imagem: imagemPadrao,
    variacoes,
    permiteCombo: combos.length > 0,
    disponivelNoCombo: produto.disponivel_no_combo ?? produto.disponivel_combo ?? false,
    valorAdicionalCombo: Number(produto.valor_adicional_combo ?? 0),
    adicionais: produto.adicionais.map((adicional) => ({
      id: adicional.id,
      nome: adicional.nome,
      preco: Number(adicional.preco),
    })),
    grupos: produto.grupos ?? [],
  }
}

function encontrarCombo(variacao: VariacaoProdutoApi, combos: VariacaoProdutoApi[]) {
  const nomeVariacao = normalizarTexto(variacao.nome)
  const quantidade = variacao.nome.match(/\d+/)?.[0]
  const porQuantidade = quantidade
    ? combos.find((combo) => combo.nome.includes(quantidade))
    : undefined
  if (porQuantidade) return porQuantidade

  if (nomeVariacao.includes('duplo') || quantidade === '2') {
    return combos.find((combo) => normalizarTexto(combo.nome).includes('duplo'))
  }
  if (nomeVariacao.includes('triplo') || quantidade === '3') {
    return combos.find((combo) => normalizarTexto(combo.nome).includes('triplo'))
  }
  if (nomeVariacao.includes('simples') || quantidade === '1') {
    return combos.find((combo) => normalizarTexto(combo.nome).includes('simples'))
      ?? combos.find((combo) => normalizarTexto(combo.nome) === 'combo')
  }

  return combos.find((combo) => normalizarTexto(combo.nome).includes(nomeVariacao))
    ?? (combos.length === 1 ? combos[0] : undefined)
}

function nomeVariacao(produtoNome: string, variacao: VariacaoProdutoApi) {
  const nomeProduto = formatarNome(produtoNome)
  const nome = normalizarTexto(variacao.nome)
  if (nome.includes('duplo') || nome.includes('2 carne') || nome.includes('2 salsicha')) return `${nomeProduto} Duplo`
  if (nome.includes('triplo') || nome.includes('3 carne')) return `${nomeProduto} Triplo`
  if (nome.includes('4 carne')) return `${nomeProduto} Quadruplo`
  return nomeProduto
}

function imagemProdutoLocal(nome: string) {
  const valor = normalizarTexto(nome)
  if (valor.includes('facheiro')) return smashFacheiro
  if (valor.includes('mandacaru')) return smashMandacaru
  if (valor.includes('xique')) return smashXiqueXique
  if (valor.includes('arretado')) return dogArretado
  if (valor.includes('bixin')) return dogBixin
  if (valor.includes('paraibano')) return dogParaibano
  if (valor.includes('tradicional')) return dogTradicional
  if (valor.includes('vegetariano')) return dogVegetariano
  return bebidaSoda
}

function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function formatarNome(valor: string) {
  return valor.toLocaleLowerCase('pt-BR').replace(/(^|\s)\S/g, (letra) => letra.toLocaleUpperCase('pt-BR'))
}

function rotuloOpcaoVariacao(produtoNome: string, variacao: VariacaoProduto): string {
  const nomeProd = formatarNome(produtoNome)
  const normProd = normalizarTexto(nomeProd)
  const nomeVar = (variacao.nome || '').trim()
  const descVar = (variacao.descricao || '').trim()

  let rotulo = ''
  if (nomeVar && normalizarTexto(nomeVar) !== normProd && !['normal', 'unico', 'padrao'].includes(normalizarTexto(nomeVar))) {
    rotulo = nomeVar
  } else if (descVar && !['normal', 'unico', 'padrao'].includes(normalizarTexto(descVar))) {
    rotulo = descVar
  }

  if (!rotulo) return nomeProd

  const normRotulo = normalizarTexto(rotulo)
  if (normRotulo.includes(normProd)) return formatarNome(rotulo)
  if (['refrigerante', 'refrigerantes', 'bebida', 'bebidas'].includes(normProd)) {
    return formatarNome(rotulo)
  }
  return `${nomeProd} (${formatarNome(rotulo)})`
}

function extrairOpcoesSecao(secao?: SecaoCardapio): OpcaoItemCombo[] {
  if (!secao || !secao.produtos.length) return []
  const opcoes: OpcaoItemCombo[] = []

  // Filtra produtos marcados como disponiveis no combo
  const produtosCombo = secao.produtos.filter((p) => p.disponivelNoCombo === true)
  const produtosParaUsar = produtosCombo.length > 0 ? produtosCombo : secao.produtos

  produtosParaUsar.forEach((produto) => {
    if (produtosCombo.length > 0 && !produto.disponivelNoCombo) return

    const precoAdicional = Number(produto.valorAdicionalCombo || 0)

    if (produto.variacoes && produto.variacoes.length > 1) {
      produto.variacoes.forEach((variacao) => {
        opcoes.push({
          id: `${produto.id}-${variacao.id}`,
          nome: rotuloOpcaoVariacao(produto.nome, variacao),
          precoAdicional,
        })
      })
    } else {
      opcoes.push({
        id: String(produto.id),
        nome: formatarNome(produto.nome),
        precoAdicional,
      })
    }
  })

  const nomesVistos = new Set<string>()
  return opcoes.filter((item) => {
    if (nomesVistos.has(item.nome)) return false
    nomesVistos.add(item.nome)
    return true
  })
}
