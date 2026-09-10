import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardPen,
  CreditCard,
  Mail,
  Minus,
  Phone,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import { useAuth } from '../../contextos/useAuth'
import { consultarFidelidade, type FidelidadeCliente } from '../../servicos/fidelidadeApi'
import { criarClienteApi } from '../../servicos/clientesApi'
import { listarUnidades, resolverUrlImagem, type Unidade } from '../../servicos/api'
import {
  adicionarItensPedidoApi,
  aumentarQuantidadeItemPedidoApi,
  atualizarObservacaoItemPedidoApi,
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
}

type Produto = {
  id: string
  nome: string
  descricao: string
  preco: number
  imagem: string
  variacoes?: VariacaoProduto[]
  permiteCombo?: boolean
}

type ItemPedido = {
  id: string
  nome: string
  descricao: string
  preco: number
  quantidade: number
  produtoVariacaoId?: number
  observacao?: string | null
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
  subtitulo: string
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


const bebidasCombo = ['Coca-Cola lata', 'Guarana lata', 'Fanta lata']
const VALOR_DESCONTO_FIDELIDADE = 17

const smashdogs: Produto[] = [
  {
    id: 'facheiro',
    nome: 'Facheiro',
    descricao: 'Pao brioche, smash bovino, queijo e molho especial da casa.',
    preco: 29,
    imagem: smashFacheiro,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Facheiro', descricao: '1 carne smash - 120g', preco: 29, precoCombo: 41.9 },
      { id: 'duplo', nome: 'Facheiro Duplo', descricao: '2 carnes smash - 240g', preco: 36.9, precoCombo: 49.9 },
      { id: 'triplo', nome: 'Facheiro Triplo', descricao: '3 carnes smash - 360g', preco: 43.9, precoCombo: 57.9 },
    ],
  },
  {
    id: 'mandacaru',
    nome: 'Mandacaru',
    descricao: 'Pao brioche, smash bovino, bacon, salada, queijo e molho especial.',
    preco: 34.9,
    imagem: smashMandacaru,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Mandacaru', descricao: '1 carne smash - 120g', preco: 34.9, precoCombo: 47.9 },
      { id: 'duplo', nome: 'Mandacaru Duplo', descricao: '2 carnes smash - 240g', preco: 42.9, precoCombo: 55.9 },
      { id: 'triplo', nome: 'Mandacaru Triplo', descricao: '3 carnes smash - 360g', preco: 49.9, precoCombo: 63.9 },
    ],
  },
  {
    id: 'xique-xique',
    nome: 'Xique-Xique',
    descricao: 'Pao brioche, smash bovino, cheddar, cebola roxa e molho secreto.',
    preco: 35.9,
    imagem: smashXiqueXique,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Xique-Xique', descricao: '1 carne smash - 120g', preco: 35.9, precoCombo: 48.9 },
      { id: 'duplo', nome: 'Xique-Xique Duplo', descricao: '2 carnes smash - 240g', preco: 43.9, precoCombo: 56.9 },
      { id: 'triplo', nome: 'Xique-Xique Triplo', descricao: '3 carnes smash - 360g', preco: 50.9, precoCombo: 64.9 },
    ],
  },
]

const hotdogs: Produto[] = [
  {
    id: 'bixin',
    nome: 'Bixin!',
    descricao: 'Salsicha Perdigao, molho de tomate caseiro e batata palha.',
    preco: 13,
    imagem: dogBixin,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Bixin!', descricao: '1 salsicha', preco: 13, precoCombo: 26.9 },
      { id: 'duplo', nome: 'Bixin! Duplo', descricao: '2 salsichas', preco: 16.9, precoCombo: 29.9 },
    ],
  },
  {
    id: 'tradicional',
    nome: 'Tradicional',
    descricao: 'Salsicha, queijo, molho caseiro, milho e batata palha.',
    preco: 19.9,
    imagem: dogTradicional,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Tradicional', descricao: '1 salsicha', preco: 19.9, precoCombo: 32.9 },
      { id: 'duplo', nome: 'Tradicional Duplo', descricao: '2 salsichas', preco: 23.9, precoCombo: 36.9 },
    ],
  },
  {
    id: 'vegetariano',
    nome: 'Vegetariano',
    descricao: 'Queijo, molho caseiro, milho, vinagrete, ovo de codorna e batata palha.',
    preco: 21.9,
    imagem: dogVegetariano,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Vegetariano', descricao: 'Tamanho unico', preco: 21.9, precoCombo: 34.9 },
    ],
  },
  {
    id: 'paraibano',
    nome: 'Paraibano',
    descricao: 'Salsicha, carne moida temperada, molho caseiro, milho e vinagrete.',
    preco: 23.9,
    imagem: dogParaibano,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Paraibano', descricao: '1 salsicha', preco: 23.9, precoCombo: 36.9 },
      { id: 'duplo', nome: 'Paraibano Duplo', descricao: '2 salsichas', preco: 27.9, precoCombo: 40.9 },
    ],
  },
  {
    id: 'arretado',
    nome: 'Arretado',
    descricao: 'Salsicha, queijo, carne moida, milho, vinagrete e molho caseiro.',
    preco: 24.9,
    imagem: dogArretado,
    permiteCombo: true,
    variacoes: [
      { id: 'simples', nome: 'Arretado', descricao: '1 salsicha', preco: 24.9, precoCombo: 37.9 },
      { id: 'duplo', nome: 'Arretado Duplo', descricao: '2 salsichas', preco: 28.9, precoCombo: 41.9 },
    ],
  },
]

const acompanhamentos: Produto[] = [
  { id: 'chips', nome: 'Paraiba Chips', descricao: 'Batata em chips. Porcao de 50g.', preco: 9, imagem: dogParaibano },
  { id: 'maionese-ervas', nome: 'Maionese de Ervas', descricao: 'Maionese caseira com especiarias.', preco: 3, imagem: smashMandacaru },
  { id: 'maionese-alho', nome: 'Maionese de Alho', descricao: 'Maionese caseira de alho.', preco: 3, imagem: smashMandacaru },
  { id: 'maionese-tradicional', nome: 'Maionese Tradicional', descricao: 'Receita tradicional da casa.', preco: 3, imagem: smashMandacaru },
  { id: 'maionese-apimentada', nome: 'Maionese Apimentada', descricao: 'Maionese da casa com pimenta.', preco: 3, imagem: smashMandacaru },
  { id: 'maionese-bacon', nome: 'Maionese de Bacon', descricao: 'Maionese saborizada com bacon.', preco: 3, imagem: smashMandacaru },
]

const bebidas: Produto[] = [
  {
    id: 'refrigerantes',
    nome: 'Refrigerantes',
    descricao: 'Escolha o sabor da lata.',
    preco: 8,
    imagem: bebidaSoda,
    variacoes: [
      { id: 'coca', nome: 'Coca-Cola', descricao: 'Lata 350ml', preco: 8 },
      { id: 'guarana', nome: 'Guarana', descricao: 'Lata 350ml', preco: 8 },
      { id: 'fanta', nome: 'Fanta Laranja', descricao: 'Lata 350ml', preco: 8 },
    ],
  },
  {
    id: 'suco-prats',
    nome: 'Suco Prats!',
    descricao: 'Sucos integrais.',
    preco: 13,
    imagem: bebidaSoda,
    variacoes: [
      { id: 'uva', nome: 'Suco Prats Uva', descricao: 'Garrafa individual', preco: 13 },
      { id: 'laranja', nome: 'Suco Prats Laranja', descricao: 'Garrafa individual', preco: 13 },
    ],
  },
  { id: 'paraiba-refrescante', nome: 'Paraiba Refrescante', descricao: 'Soda italiana 400ml.', preco: 16.9, imagem: bebidaSoda },
]

const secoes: SecaoCardapio[] = [
  { id: 'smashdogs', titulo: 'Smashdogs', subtitulo: 'Escolha o tamanho e decida se deseja transformar em combo.', produtos: smashdogs },
  { id: 'hotdogs', titulo: 'Hot-dogs tradicionais', subtitulo: 'Escolha simples ou duplo e adicione o combo se desejar.', produtos: hotdogs },
  { id: 'bebidas', titulo: 'Bebidas', subtitulo: 'Refrigerantes, sucos e soda italiana.', produtos: bebidas },
  { id: 'acompanhamentos', titulo: 'Acompanhamentos', subtitulo: 'Chips e maioneses artesanais da casa.', produtos: acompanhamentos },
]

const pagamentos = [
  { id: 'pix', label: 'Pix', icon: <QrCode size={19} /> },
  { id: 'credito', label: 'Crédito', icon: <CreditCard size={19} /> },
  { id: 'dinheiro', label: 'Dinheiro', icon: <Banknote size={19} /> },
  { id: 'debito', label: 'Débito', icon: <CircleDollarSign size={19} /> },
]

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AnotarPedidos() {
  const { usuarioAtual, isLoadingUser } = useAuth()
  const unidadeUsuarioId = usuarioAtual?.unidade_id ?? null
  const [pedido, setPedido] = useState<ItemPedido[]>([])
  const [pagamento, setPagamento] = useState('pix')
  const [fidelidade, setFidelidade] = useState<'cadastro' | 'sem-cadastro'>('cadastro')
  const [produtoEmConfiguracao, setProdutoEmConfiguracao] = useState<Produto | null>(null)
  const [busca, setBusca] = useState('')
  const [secoesApi, setSecoesApi] = useState<SecaoCardapio[]>([])
  const [carregandoCardapio, setCarregandoCardapio] = useState(true)
  const [avisoCardapio, setAvisoCardapio] = useState('')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [unidadeId, setUnidadeId] = useState<number | null>(null)
  const [clientePedido, setClientePedido] = useState<ClienteVinculado | null>(null)
  const [nomeComanda, setNomeComanda] = useState('')
  const [finalizando, setFinalizando] = useState(false)
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null)
  const [mensagemPedido, setMensagemPedido] = useState('')
  const [pedidosAbertos, setPedidosAbertos] = useState<PedidoApi[]>([])
  const [pedidoAbertoId, setPedidoAbertoId] = useState<number | null>(null)
  const [resumoKey, setResumoKey] = useState(0)
  const [usarDescontoFidelidade, setUsarDescontoFidelidade] = useState(false)

  useEffect(() => {
    let ativo = true

    listarCardapioApi()
      .then(({ produtos, categorias, subcategorias }) => {
        if (!ativo) return
        const secoesMapeadas = mapearCardapioApi(produtos, categorias, subcategorias)
        if (secoesMapeadas.length) {
          setSecoesApi(secoesMapeadas)
          setAvisoCardapio('')
        } else {
          setAvisoCardapio('O backend respondeu, mas o banco ainda não possui produtos ativos com variações e preços. Exibindo o cardápio de demonstração.')
        }
      })
      .catch((error) => {
        console.error('Menu lookup error:', error)
        if (ativo) setAvisoCardapio('Não foi possível carregar o cardápio do backend. Exibindo o cardápio de demonstração.')
      })
      .finally(() => {
        if (ativo) setCarregandoCardapio(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (isLoadingUser) return

    listarUnidades()
      .then((dados) => {
        const unidadesPermitidas = unidadeUsuarioId
          ? dados.filter((unidade) => unidade.id === unidadeUsuarioId)
          : dados

        setUnidades(unidadesPermitidas)
        setUnidadeId(unidadesPermitidas[0]?.id ?? null)
      })
      .catch((error) => console.error('Units lookup error:', error))
  }, [isLoadingUser, unidadeUsuarioId])

  useEffect(() => {
    if (!unidadeId) return
    carregarPedidosAbertos(unidadeId)

    const intervalo = window.setInterval(() => {
      carregarPedidosAbertos(unidadeId)
    }, 5000)

    return () => window.clearInterval(intervalo)
  }, [unidadeId])

  const subtotal = useMemo(() => pedido.reduce((total, item) => total + item.preco * item.quantidade, 0), [pedido])
  const cardapio = secoesApi.length ? secoesApi : secoes
  const secoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return cardapio
    return cardapio.map((secao) => ({ ...secao, produtos: secao.produtos.filter((produto) => `${produto.nome} ${produto.descricao}`.toLocaleLowerCase('pt-BR').includes(termo)) })).filter((secao) => secao.produtos.length)
  }, [busca, cardapio])

  function adicionar(produto: Produto) {
    if (produto.variacoes?.length || produto.permiteCombo) {
      setProdutoEmConfiguracao(produto)
      return
    }
    adicionarAoPedido({ id: produto.id, nome: produto.nome, descricao: produto.descricao, preco: produto.preco })
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

  async function carregarPedidosAbertos(idUnidade: number) {
    try {
      const pedidos = await listarPedidosAbertosApi(idUnidade)
      const pedidosPendentes = pedidos.filter((pedidoAberto) => {
        if (pedidoAberto.status === 'cancelado') return false
        if (pedidoAberto.status === 'aberto') return true
        // pago: só some quando a cozinha entregar todos os itens
        return pedidoAberto.itens.some((item) => item.status !== 'entregue' && item.status !== 'cancelado')
      })
      setPedidosAbertos(pedidosPendentes)
      setPedidoAbertoId((pedidoAtual) => {
        if (!pedidoAtual) return null
        return pedidosPendentes.some((pedidoAberto) => pedidoAberto.id === pedidoAtual)
          ? pedidoAtual
          : null
      })
    } catch (error) {
      console.error('Open orders lookup error:', error)
    }
  }

  function itensPedidoPayload(): ItemPedidoPayload[] {
    return pedido.map((item) => ({
      produto_variacao_id: item.produtoVariacaoId as number,
      quantidade: item.quantidade,
      observacao: item.observacao ?? null,
      adicional_ids: [],
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
      return false
    }
    if (exigirItens && !pedido.length) {
      setMensagemPedido('Adicione ao menos um item ao pedido.')
      return false
    }
    if (pedido.some((item) => !item.produtoVariacaoId)) {
      setMensagemPedido('Este pedido possui itens demonstrativos. Cadastre o cardápio real no backend antes de finalizar.')
      return false
    }
    return true
  }

  async function salvarPedidoAberto() {
    if (!validarPedido(true) || !unidadeId) return

    setFinalizando(true)
    try {
      const salvo = pedidoAbertoId
        ? await adicionarItensPedidoApi(pedidoAbertoId, itensPedidoPayload())
        : await criarPedidoApi({
            unidade_id: unidadeId,
            nome_comanda: nomeComanda.trim(),
            cliente_id: clientePedido?.id ?? null,
            usar_desconto_fidelidade: usarDescontoFidelidade,
            itens: itensPedidoPayload(),
          })
      setPedidoAbertoId(salvo.id)
      setPedido([])
      setMensagemPedido(`Pedido #${salvo.id} mantido aberto e enviado para a cozinha.`)
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
      setMensagemPedido(`Pedido #${pedidoAbertoId} atualizado com sucesso.`)
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
      setMensagemPedido('Observação atualizada.')
      await carregarPedidosAbertos(unidadeId)
    } catch (error) {
      setMensagemPedido(error instanceof Error ? error.message : 'Não foi possível atualizar a observação.')
    }
  }

  async function finalizarPedido() {
    const exigeItens = !pedidoAbertoId
    if (!validarPedido(exigeItens) || !unidadeId) return

    setFinalizando(true)
    try {
      let idParaFinalizar = pedidoAbertoId
      const pedidoSelecionado = pedidosAbertos.find((item) => item.id === pedidoAbertoId)
      if (pedidoSelecionado?.status === 'pago' && !pedido.length) {
        setMensagemPedido(`O pedido #${pedidoSelecionado.id} já está pago e aguarda entrega da cozinha.`)
        return
      }
      if (idParaFinalizar && pedido.length) {
        await adicionarItensPedidoApi(idParaFinalizar, itensPedidoPayload())
      }
      if (!idParaFinalizar) {
        const criado = await criarPedidoApi({
          unidade_id: unidadeId,
          nome_comanda: nomeComanda.trim(),
          cliente_id: clientePedido?.id ?? null,
          usar_desconto_fidelidade: usarDescontoFidelidade,
          itens: itensPedidoPayload(),
        })
        idParaFinalizar = criado.id
      }

      const finalizado = await finalizarPedidoApi(idParaFinalizar, pagamento as FormaPagamentoApi)
      setPedido([])
      setPedidoAbertoId(null)
      setNomeComanda('')
      setClientePedido(null)
      setPagamento('pix')
      setFidelidade('cadastro')
      setUsarDescontoFidelidade(false)
      setResumoKey((valor) => valor + 1)
      setMensagemPedido(`Pedido #${finalizado.id} finalizado e enviado para a cozinha.`)
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
    if (!id) {
      setNomeComanda('')
      setClientePedido(null)
      setUsarDescontoFidelidade(false)
      return
    }
    const pedidoAberto = pedidosAbertos.find((item) => item.id === id)
    if (pedidoAberto) {
      setNomeComanda(pedidoAberto.nome_comanda)
      setUsarDescontoFidelidade(pedidoAberto.pontos_fidelidade_utilizados > 0)
    }
  }

  function alterarUnidade(id: number) {
    if (unidadeUsuarioId) return

    setUnidadeId(id || null)
    setPedidoAbertoId(null)
    setPedido([])
    setNomeComanda('')
    setClientePedido(null)
    setUsarDescontoFidelidade(false)
    setMensagemPedido('')
  }

  return (
    <div className={`min-h-screen bg-[#f5f7fb] text-[#18212f] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin
        acaoDireita={
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70 lg:hidden">
            <ShoppingBag size={17} /> {pedido.reduce((total, item) => total + item.quantidade, 0)} itens
          </div>
        }
      />

      <div className="mx-auto grid max-w-[1900px] lg:grid-cols-[230px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-[#f5f7fb] px-4 py-8 lg:block">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Pedidos abertos</p>
              <p className="mt-1 text-[10px] text-slate-400">Ainda não finalizados</p>
            </div>
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amarelo px-2 text-xs font-black text-preto-v1">{pedidosAbertos.length}</span>
          </div>

          <button type="button" onClick={() => abrirPedidoExistente(null)} className={`mt-5 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${!pedidoAbertoId ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-preto-v1 text-white"><Plus size={17} /></span>
            <span><span className="block text-xs font-black uppercase">Novo pedido</span><span className="text-[10px] text-slate-400">Iniciar nova comanda</span></span>
          </button>

          <div className="mt-3 max-h-[calc(100vh-13rem)] space-y-2 overflow-y-auto pr-1">
            {pedidosAbertos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-7 text-center">
                <ReceiptText size={25} className="mx-auto text-slate-300" />
                <p className="mt-2 text-[11px] font-bold text-slate-500">Nenhum pedido aberto</p>
              </div>
            ) : pedidosAbertos.map((pedidoAberto) => (
              <button key={pedidoAberto.id} type="button" onClick={() => abrirPedidoExistente(pedidoAberto.id)} className={`w-full rounded-xl border p-3 text-left transition ${pedidoAbertoId === pedidoAberto.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                <div className="flex items-start justify-between gap-2"><span className="text-xs font-black">Pedido #{pedidoAberto.id}</span><span className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${pedidoAberto.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{pedidoAberto.status === 'pago' ? 'Pago' : 'Aberto'}</span></div>
                <p className="mt-2 truncate text-xs font-semibold text-slate-600">{pedidoAberto.nome_comanda}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>{pedidoAberto.itens.reduce((total, item) => total + item.quantidade, 0)} itens</span><strong className="text-slate-700">{moeda(Number(pedidoAberto.total))}</strong></div>
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2 text-sm font-semibold text-emerald-600"><ClipboardPen size={18} /> Novo pedido</div><h1 className="mt-1 font-barlow-condensed text-3xl font-black uppercase">Anotar pedidos</h1></div>
            <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:max-w-xs"><Search size={18} className="text-slate-400" /><input value={busca} onChange={(event) => setBusca(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar no cardápio..." /></label>
          </div>

          {carregandoCardapio && <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">Carregando cardápio do backend...</div>}
          {!carregandoCardapio && avisoCardapio && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">{avisoCardapio}</div>}

          {secoesFiltradas.map((secao) => (
            <SecaoProdutos key={secao.id} id={secao.id} titulo={secao.titulo} subtitulo={secao.subtitulo}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{secao.produtos.map((produto) => <CardProduto key={produto.id} produto={produto} onAdicionar={adicionar} />)}</div>
            </SecaoProdutos>
          ))}
        </main>

        <ResumoPedido key={resumoKey} pedido={pedido} subtotal={subtotal} pagamento={pagamento} fidelidade={fidelidade} unidades={unidades} unidadeId={unidadeId} unidadeBloqueada={Boolean(unidadeUsuarioId)} nomeComanda={nomeComanda} clientePedido={clientePedido} pedidosAbertos={pedidosAbertos} pedidoAbertoId={pedidoAbertoId} usarDescontoFidelidade={usarDescontoFidelidade} finalizando={finalizando} editandoItemId={editandoItemId} mensagemPedido={mensagemPedido} onPagamento={setPagamento} onFidelidade={setFidelidade} onQuantidade={alterarQuantidade} onEditarItemRegistrado={editarItemRegistrado} onAtualizarObservacao={atualizarObservacaoItemRegistrado} onUnidade={alterarUnidade} onNomeComanda={setNomeComanda} onCliente={setClientePedido} onUsarDesconto={setUsarDescontoFidelidade} onSalvarAberto={salvarPedidoAberto} onFinalizar={finalizarPedido} />
      </div>

      <button
        type="button"
        onClick={() =>
          document.getElementById('resumo-pedido')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        className="fixed bottom-5 left-1/2 z-40 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_8px_24px_rgba(5,150,105,0.35)] transition hover:brightness-95 active:scale-95 lg:hidden"
        aria-label="Ir para o resumo do pedido"
      >
        <ChevronDown size={24} strokeWidth={2.5} />
      </button>

      {produtoEmConfiguracao && <ModalConfiguracao produto={produtoEmConfiguracao} onFechar={() => setProdutoEmConfiguracao(null)} onAdicionar={(item) => { adicionarAoPedido(item); setProdutoEmConfiguracao(null) }} />}
    </div>
  )
}

function SecaoProdutos({ id, titulo, subtitulo, children }: { id: string; titulo: string; subtitulo: string; children: ReactNode }) {
  return <section id={id} className="mb-10 scroll-mt-6"><h2 className="font-barlow-condensed text-2xl font-black">{titulo}</h2><p className="mb-4 mt-1 text-xs text-slate-400">{subtitulo}</p>{children}</section>
}

function CardProduto({ produto, onAdicionar }: { produto: Produto; onAdicionar: (produto: Produto) => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <img src={produto.imagem} alt={produto.nome} className="h-40 w-full object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3"><h3 className="font-barlow-condensed text-lg font-black">{produto.nome}</h3><div className="shrink-0 text-right">{produto.variacoes && <span className="block text-[9px] uppercase text-slate-400">A partir de</span>}<strong className="whitespace-nowrap text-sm">{moeda(produto.preco)}</strong></div></div>
        <p className="mt-1 flex-1 text-xs leading-5 text-slate-400">{produto.descricao}</p>
        {produto.permiteCombo && <p className="mt-2 text-[10px] font-bold uppercase text-emerald-600">Disponivel individual ou combo</p>}
        <button type="button" onClick={() => onAdicionar(produto)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amarelo px-4 py-2.5 text-xs font-black transition hover:brightness-95"><Plus size={15} /> {produto.variacoes || produto.permiteCombo ? 'Escolher opções' : 'Adicionar'}</button>
      </div>
    </article>
  )
}

function ModalConfiguracao({ produto, onFechar, onAdicionar }: { produto: Produto; onFechar: () => void; onAdicionar: (item: Omit<ItemPedido, 'quantidade'>) => void }) {
  const temVariacoesMultiplas = Boolean(produto.variacoes && produto.variacoes.length > 1)
  const [variacao, setVariacao] = useState<VariacaoProduto | null>(
    temVariacoesMultiplas ? null : (produto.variacoes?.[0] ?? null),
  )
  const [comboEscolha, setComboEscolha] = useState<boolean | null>(produto.permiteCombo ? null : false)
  const [bebida, setBebida] = useState(bebidasCombo[0])
  const [observacao, setObservacao] = useState('')
  const combo = comboEscolha === true
  const precoIndividual = variacao?.preco ?? produto.preco
  const precoFinal = combo ? (variacao?.precoCombo ?? precoIndividual + 13) : precoIndividual
  const tamanhoRespondido = !temVariacoesMultiplas || variacao !== null
  const comboRespondido = !produto.permiteCombo || comboEscolha !== null
  const podeAdicionar = tamanhoRespondido && comboRespondido

  function confirmar() {
    if (!podeAdicionar) return
    const nomeBase = variacao?.nome ?? produto.nome
    const descricaoBase = variacao?.descricao ?? produto.descricao
    onAdicionar({
      id: [produto.id, variacao?.id, combo ? 'combo' : 'individual', combo ? bebida : ''].filter(Boolean).join(':'),
      nome: combo ? `Combo ${nomeBase}` : nomeBase,
      descricao: combo ? `${descricaoBase} | Paraiba Chips + ${bebida}` : descricaoBase,
      preco: precoFinal,
      observacao: [combo ? `Bebida do combo: ${bebida}` : null, observacao.trim() ? `Obs: ${observacao.trim()}` : null].filter(Boolean).join('\n') || null,
      produtoVariacaoId: combo
        ? variacao?.produtoVariacaoComboId ?? variacao?.produtoVariacaoId
        : variacao?.produtoVariacaoId,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm" onClick={onFechar}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="relative h-40 overflow-hidden sm:h-48"><img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" /><button type="button" onClick={onFechar} className="absolute right-4 top-4 rounded-full bg-white/95 p-2 shadow-md" aria-label="Fechar"><X size={20} /></button><div className="absolute bottom-4 left-5 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amarelo">Configure o item</p><h2 className="font-barlow-condensed text-3xl font-black uppercase">{produto.nome}</h2></div></div>
        <div className="space-y-6 p-5 sm:p-6">
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

          {produto.permiteCombo && (
            <GrupoConfiguracao
              titulo="Deseja transformar em combo?"
              descricao="O combo acompanha Paraíba Chips e uma bebida."
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
                descricao="Paraiba Chips + bebida"
                preco={variacao?.precoCombo ?? precoIndividual + 13}
                onClick={() => setComboEscolha(true)}
              />
            </GrupoConfiguracao>
          )}

          {combo && <GrupoConfiguracao titulo="Escolha a bebida" descricao="Selecione a bebida do combo.">{bebidasCombo.map((opcao) => <BotaoOpcao key={opcao} ativo={bebida === opcao} titulo={opcao} onClick={() => setBebida(opcao)} />)}</GrupoConfiguracao>}

          <section>
            <div><h3 className="text-sm font-black">Alguma observação?</h3><p className="mt-0.5 text-xs text-slate-400">Opcional. Aparece para a cozinha.</p></div>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: sem cebola, ponto da carne bem passado..." maxLength={200} rows={3} className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
          </section>

          <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 border-t border-slate-200 bg-white p-5 sm:-mx-6 sm:-mb-6 sm:p-6"><button type="button" onClick={onFechar} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold uppercase text-slate-500">Cancelar</button><button type="button" disabled={!podeAdicionar} onClick={confirmar} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amarelo px-4 py-3 text-xs font-black uppercase disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Adicionar - {moeda(precoFinal)}</button></div>
        </div>
      </div>
    </div>
  )
}

function GrupoConfiguracao({
  titulo,
  descricao,
  obrigatorio = false,
  children,
}: {
  titulo: string
  descricao: string
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
        <p className="mt-0.5 text-xs text-slate-400">{descricao}</p>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  )
}

function BotaoOpcao({ ativo, titulo, descricao, preco, marcador, onClick }: { ativo: boolean; titulo: string; descricao?: string; preco?: number; marcador?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${ativo ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${ativo ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{marcador ?? <span className={`h-3 w-3 rounded-full border-2 ${ativo ? 'border-white bg-white' : 'border-slate-300'}`} />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{titulo}</span>{descricao && <span className="mt-0.5 block text-xs text-slate-400">{descricao}</span>}</span>{preco !== undefined && <strong className="whitespace-nowrap text-sm">{moeda(preco)}</strong>}</button>
}

function ResumoPedido({ pedido, subtotal, pagamento, fidelidade, unidades, unidadeId, unidadeBloqueada, nomeComanda, clientePedido, pedidosAbertos, pedidoAbertoId, usarDescontoFidelidade, finalizando, editandoItemId, mensagemPedido, onPagamento, onFidelidade, onQuantidade, onEditarItemRegistrado, onAtualizarObservacao, onUnidade, onNomeComanda, onCliente, onUsarDesconto, onSalvarAberto, onFinalizar }: { pedido: ItemPedido[]; subtotal: number; pagamento: string; fidelidade: 'cadastro' | 'sem-cadastro'; unidades: Unidade[]; unidadeId: number | null; unidadeBloqueada: boolean; nomeComanda: string; clientePedido: ClienteVinculado | null; pedidosAbertos: PedidoApi[]; pedidoAbertoId: number | null; usarDescontoFidelidade: boolean; finalizando: boolean; editandoItemId: number | null; mensagemPedido: string; onPagamento: (valor: string) => void; onFidelidade: (valor: 'cadastro' | 'sem-cadastro') => void; onQuantidade: (id: string, quantidade: number) => void; onEditarItemRegistrado: (item: PedidoApi['itens'][number], acao: 'adicionar' | 'remover' | 'excluir') => void; onAtualizarObservacao: (itemId: number, observacao: string | null) => Promise<void>; onUnidade: (id: number) => void; onNomeComanda: (nome: string) => void; onCliente: (cliente: ClienteVinculado | null) => void; onUsarDesconto: (usar: boolean) => void; onSalvarAberto: () => void; onFinalizar: () => void }) {
  const [identificacao, setIdentificacao] = useState('')
  const [clienteVinculado, setClienteVinculado] = useState<FidelidadeCliente | null>(null)
  const [consultandoCliente, setConsultandoCliente] = useState(false)
  const [querCadastrar, setQuerCadastrar] = useState(false)
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cadastroConcluido, setCadastroConcluido] = useState(false)
  const [erroFidelidade, setErroFidelidade] = useState('')
  const [obsEditando, setObsEditando] = useState<{ itemId: number; texto: string } | null>(null)
  const [salvandoObs, setSalvandoObs] = useState(false)
  const pedidoSelecionado = pedidosAbertos.find((item) => item.id === pedidoAbertoId)
  const itensRegistrados = pedidoSelecionado?.itens.filter((item) => item.status !== 'cancelado') ?? []
  const pedidoEmPreparo = itensRegistrados.some((item) => item.status === 'preparando')
  const descontoExistente = Number(pedidoSelecionado?.desconto_fidelidade ?? 0)
  const descontoNovo = !pedidoAbertoId && usarDescontoFidelidade
    ? Math.min(VALOR_DESCONTO_FIDELIDADE, subtotal)
    : 0
  const descontoExibido = descontoExistente || descontoNovo
  const totalAtual = Number(pedidoSelecionado?.total ?? 0)
  const totalParaFinalizar = Math.max(totalAtual + subtotal - descontoNovo, 0)

  function mudarFidelidade(valor: 'cadastro' | 'sem-cadastro') {
    onFidelidade(valor)
    onCliente(null)
    onUsarDesconto(false)
    setErroFidelidade('')
    setClienteVinculado(null)
    setCadastroConcluido(false)
    if (valor === 'cadastro') setQuerCadastrar(false)
  }

  async function vincularCliente() {
    const valor = identificacao.trim()
    if (!valor) {
      setErroFidelidade('Informe o telefone ou e-mail do cliente.')
      return
    }

    setErroFidelidade('')
    setConsultandoCliente(true)
    try {
      const cliente = await consultarFidelidade(valor)
      if (!cliente) {
        setClienteVinculado(null)
        setErroFidelidade('Cliente não encontrado no programa fidelidade.')
        return
      }
      setClienteVinculado(cliente)
      onCliente({ id: cliente.id, nome: cliente.nome, pontos: cliente.pontos, totalParaPremio: cliente.total_para_premio })
      if (!nomeComanda.trim()) onNomeComanda(cliente.nome)
    } catch (error) {
      console.error('Loyalty lookup error:', error)
      setErroFidelidade('Não foi possível consultar a fidelidade agora.')
    } finally {
      setConsultandoCliente(false)
    }
  }

  function cadastroValido() {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    const telefoneLimpo = telefone.replace(/\D/g, '')
    if (!emailValido || telefoneLimpo.length < 10) {
      setErroFidelidade('Informe um e-mail valido e um telefone com DDD.')
      return false
    }
    setErroFidelidade('')
    return true
  }

  return (
    <aside id="resumo-pedido" className="scroll-mt-20 border-t border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:flex-col lg:border-l lg:border-t-0 lg:scroll-mt-0">
      <div className="border-b border-slate-200 px-6 py-6">
        <h2 className="font-barlow-condensed text-xl font-black uppercase">Resumo do pedido</h2>
        <p className="mt-1 text-xs text-slate-400">Confira os itens antes de finalizar.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-5 grid gap-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Unidade</label>
          <select value={unidadeId ?? ''} onChange={(event) => onUnidade(Number(event.target.value))} disabled={unidadeBloqueada} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
            <option value="">Selecione</option>
            {unidades.map((unidade) => <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>)}
          </select>
          {pedidoAbertoId && <p className={`rounded-lg px-3 py-2 text-[10px] font-semibold ${pedidoEmPreparo ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>{pedidoEmPreparo ? `O pedido #${pedidoAbertoId} já está sendo preparado e não pode mais ser alterado.` : `Editando o pedido #${pedidoAbertoId}. Se ele já estiver pago, será reaberto e precisará de novo fechamento.`}</p>}
          <label className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Nome da comanda</label>
          <input value={nomeComanda} onChange={(event) => onNomeComanda(event.target.value)} disabled={Boolean(pedidoAbertoId)} placeholder="Ex.: Mesa 3 ou Samuel" className="h-10 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500 disabled:bg-slate-100" />
        </div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Programa fidelidade</p>
        <div className="grid grid-cols-2 gap-2">
          <BotaoEscolha ativo={fidelidade === 'cadastro'} onClick={() => mudarFidelidade('cadastro')} titulo="Tem cadastro" texto="Ja e cliente fidelidade" />
          <BotaoEscolha ativo={fidelidade === 'sem-cadastro'} onClick={() => mudarFidelidade('sem-cadastro')} titulo="Sem cadastro" texto="Pode cadastrar agora" />
        </div>

        {fidelidade === 'cadastro' && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {clienteVinculado ? (
              <SaldoFidelidade cliente={clienteVinculado} onAlterar={() => { setClienteVinculado(null); onCliente(null) }} />
            ) : (
              <>
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Telefone ou e-mail</label>
                <div className="mt-2 flex gap-2">
                  <CampoComIcone icone={<Search size={15} />} valor={identificacao} onChange={setIdentificacao} placeholder="Buscar cliente..." />
                  <button type="button" onClick={vincularCliente} disabled={consultandoCliente} className="rounded-lg bg-preto-v1 px-3 text-[10px] font-black uppercase text-white disabled:opacity-60">{consultandoCliente ? 'Buscando...' : 'Buscar'}</button>
                </div>
              </>
            )}
          </div>
        )}

        {fidelidade === 'sem-cadastro' && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            {cadastroConcluido ? (
              <MensagemSucesso icone={<CheckCircle2 size={18} />} titulo="Cliente cadastrado" texto={`${email} | ${telefone}`} onAlterar={() => setCadastroConcluido(false)} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-bold">Deseja cadastrar o cliente?</p><p className="mt-0.5 text-[10px] text-slate-400">O pedido pode continuar sem cadastro.</p></div>
                  <button type="button" onClick={() => { setQuerCadastrar((valor) => !valor); setErroFidelidade('') }} className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase ${querCadastrar ? 'bg-slate-200 text-slate-600' : 'bg-amarelo text-preto-v1'}`}>{querCadastrar ? 'Agora não' : 'Cadastrar'}</button>
                </div>
                {querCadastrar && (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <CampoComIcone icone={<UserPlus size={15} />} valor={nomeComanda} onChange={onNomeComanda} placeholder="Nome do cliente" />
                    <CampoComIcone icone={<Mail size={15} />} valor={email} onChange={setEmail} placeholder="E-mail do cliente" tipo="email" />
                    <CampoComIcone icone={<Phone size={15} />} valor={telefone} onChange={setTelefone} placeholder="Telefone com DDD" tipo="tel" />
                    <button type="button" onClick={async () => {
                      if (!nomeComanda.trim()) { setErroFidelidade('Informe o nome do cliente.'); return }
                      if (!cadastroValido()) return
                      try {
                        const cliente = await criarClienteApi({ nome: nomeComanda.trim(), email: email.trim(), telefone })
                        setCadastroConcluido(true)
                        onCliente({ id: cliente.id, nome: cliente.nome, pontos: cliente.pontos_fidelidade, totalParaPremio: 10 })
                      } catch (error) {
                        setErroFidelidade(error instanceof Error ? error.message : 'Não foi possível cadastrar o cliente.')
                      }
                    }} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-[10px] font-black uppercase text-white"><UserPlus size={15} /> Cadastrar e vincular</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {erroFidelidade && <p className="mt-2 text-[10px] font-semibold text-red-600">{erroFidelidade}</p>}
        {clientePedido && clientePedido.pontos >= 10 && (
          <div className="mt-3 rounded-xl border border-amarelo bg-amber-50 p-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={usarDescontoFidelidade}
                disabled={Boolean(pedidoAbertoId) && !pedidoSelecionado?.pontos_fidelidade_utilizados}
                onChange={(event) => onUsarDesconto(event.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              <span className="flex-1"><span className="block text-xs font-black text-preto-v1">Usar hot-dog gratis</span><span className="block text-[10px] text-slate-500">Consome 10 pontos e aplica {moeda(VALOR_DESCONTO_FIDELIDADE)} de desconto.</span></span>
            </label>
            {pedidoAbertoId && !pedidoSelecionado?.pontos_fidelidade_utilizados && <p className="mt-2 text-[9px] text-amber-700">O resgate deve ser escolhido ao iniciar um novo pedido.</p>}
          </div>
        )}
        <div className="my-5 h-px bg-slate-100" />

        {itensRegistrados.length > 0 && (
          <section className="mb-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Itens já registrados</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">Pedido #{pedidoAbertoId}</span></div>
            <div className="space-y-2">
              {itensRegistrados.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-bold">{item.quantidade}x {formatarItemPedido(item.produto_nome, item.produto_variacao_nome)}</p><p className="mt-1 text-[10px] text-slate-400">Lote {item.lote}</p>{item.observacao && item.observacao.split('\n').map((linha, i) => <p key={i} className={`mt-0.5 text-[10px] font-semibold ${linha.startsWith('Obs: ') ? 'text-red-500' : 'text-slate-400'}`}>{linha.startsWith('Obs: ') ? `observação: ${linha.slice(5)}` : linha}</p>)}</div>
                    <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${item.status === 'entregue' ? 'bg-emerald-100 text-emerald-700' : item.status === 'preparando' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {item.status === 'aberto' && !pedidoEmPreparo ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <button type="button" disabled={editandoItemId === item.id} onClick={() => onEditarItemRegistrado(item, 'remover')} className="p-2 disabled:opacity-40"><Minus size={13} /></button>
                          <span className="min-w-8 text-center text-xs font-bold">{item.quantidade}</span>
                          <button type="button" disabled={editandoItemId === item.id} onClick={() => onEditarItemRegistrado(item, 'adicionar')} className="p-2 disabled:opacity-40"><Plus size={13} /></button>
                        </div>
                        <button type="button" disabled={editandoItemId === item.id} onClick={() => onEditarItemRegistrado(item, 'excluir')} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:text-red-500 disabled:opacity-40"><Trash2 size={14} /></button>
                      </div>
                    ) : <span className="text-[9px] font-semibold text-slate-400">Edicao bloqueada pela cozinha</span>}
                    <p className="text-right text-xs font-bold">{moeda(Number(item.preco_unitario) * item.quantidade)}</p>
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
                                const comboParte = partes.find((l) => l.startsWith('Bebida do combo:')) ?? null
                                const obsLimpa = obsEditando.texto.trim()
                                const novaObs = [comboParte, obsLimpa ? `Obs: ${obsLimpa}` : null].filter(Boolean).join('\n') || null
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
          <div className="space-y-3">{pedido.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.nome}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{item.descricao}</p><p className="mt-1 text-xs text-slate-400">{moeda(item.preco)} cada</p></div><button type="button" onClick={() => onQuantidade(item.id, 0)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center overflow-hidden rounded-lg border border-slate-200"><button type="button" onClick={() => onQuantidade(item.id, item.quantidade - 1)} className="p-2"><Minus size={13} /></button><span className="min-w-8 text-center text-xs font-bold">{item.quantidade}</span><button type="button" onClick={() => onQuantidade(item.id, item.quantidade + 1)} className="p-2"><Plus size={13} /></button></div><strong className="text-sm">{moeda(item.preco * item.quantidade)}</strong></div></div>)}</div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-[#f8faff] p-5">
        <div className="space-y-2 text-xs text-slate-500"><div className="flex justify-between"><span>Novos itens</span><span>{moeda(subtotal)}</span></div>{pedidoAbertoId && <div className="flex justify-between"><span>Total atual do pedido</span><span>{moeda(totalAtual)}</span></div>}{descontoExibido > 0 && <div className="flex justify-between font-semibold text-emerald-700"><span>Desconto fidelidade</span><span>- {moeda(descontoExibido)}</span></div>}<div className="flex items-end justify-between border-t border-slate-200 pt-3 text-preto-v1"><span className="font-bold">Total para finalizar</span><strong className="text-2xl">{moeda(totalParaFinalizar)}</strong></div></div>
        <div className="mt-4 grid grid-cols-2 gap-2">{pagamentos.map((item) => <button key={item.id} type="button" onClick={() => onPagamento(item.id)} className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] font-bold uppercase ${pagamento === item.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}>{item.icon}{item.label}</button>)}</div>
        {mensagemPedido && <p className={`mt-3 text-xs font-semibold ${mensagemPedido.includes('aberto') || mensagemPedido.includes('finalizado') ? 'text-emerald-700' : 'text-red-600'}`}>{mensagemPedido}</p>}
        <button type="button" onClick={onSalvarAberto} disabled={!pedido.length || finalizando || pedidoEmPreparo} className="mt-4 w-full rounded-xl border-2 border-emerald-600 bg-white px-5 py-3 text-xs font-black uppercase text-emerald-700 disabled:border-slate-300 disabled:text-slate-400">{finalizando ? 'Salvando...' : pedidoAbertoId ? 'Adicionar e manter aberto' : 'Enviar para cozinha e manter aberto'}</button>
        <button type="button" onClick={onFinalizar} disabled={(!pedido.length && !pedidoAbertoId) || finalizando || pedidoEmPreparo} className="mt-2 w-full rounded-xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase text-white disabled:bg-slate-300">{finalizando ? 'Finalizando...' : 'Finalizar e receber pagamento'}</button>
      </div>
    </aside>
  )
}

function CampoComIcone({ icone, valor, onChange, placeholder, tipo = 'text' }: { icone: ReactNode; valor: string; onChange: (valor: string) => void; placeholder: string; tipo?: 'text' | 'email' | 'tel' }) {
  return <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 focus-within:border-emerald-500">{icone}<input type={tipo} value={valor} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-xs text-preto-v1 outline-none" /></label>
}

function formatarItemPedido(produto: string, variacao: string | null) {
  const nomeProduto = formatarNome(produto)
  if (!variacao || normalizarTexto(variacao) === 'unico') return nomeProduto
  return `${nomeProduto} - ${variacao}`
}

function MensagemSucesso({ icone, titulo, texto, onAlterar }: { icone: ReactNode; titulo: string; texto: string; onAlterar: () => void }) {
  return <div className="flex items-center gap-3 text-emerald-700"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">{icone}</span><div className="min-w-0 flex-1"><p className="text-xs font-black">{titulo}</p><p className="truncate text-[10px] text-emerald-600">{texto}</p></div><button type="button" onClick={onAlterar} className="text-[9px] font-bold uppercase text-slate-400 hover:text-preto-v1">Alterar</button></div>
}

function SaldoFidelidade({ cliente, onAlterar }: { cliente: FidelidadeCliente; onAlterar: () => void }) {
  const pontos = Math.min(cliente.pontos, cliente.total_para_premio)
  const faltam = Math.max(cliente.total_para_premio - pontos, 0)

  return (
    <div>
      <div className="flex items-center gap-3 text-emerald-700">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100"><UserCheck size={18} /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{cliente.nome}</p><p className="text-[10px] text-emerald-600">Cliente vinculado ao pedido</p></div>
        <button type="button" onClick={onAlterar} className="text-[9px] font-bold uppercase text-slate-400 hover:text-preto-v1">Alterar</button>
      </div>
      <div className="mt-3 rounded-lg bg-white p-3">
        <div className="flex items-end justify-between"><span className="text-[10px] font-bold uppercase text-slate-400">Saldo fidelidade</span><strong className="text-lg text-preto-v1">{pontos}/{cliente.total_para_premio}</strong></div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">{Array.from({ length: cliente.total_para_premio }, (_, index) => <span key={index} className={`h-2.5 rounded-full ${index < pontos ? 'bg-amarelo' : 'bg-slate-200'}`} />)}</div>
        <p className="mt-2 text-[10px] font-semibold text-slate-500">{faltam > 0 ? `Faltam ${faltam} hot-dog${faltam > 1 ? 's' : ''} para ganhar o premio.` : 'Hot-dog gratis liberado!'}</p>
      </div>
    </div>
  )
}

function BotaoEscolha({ ativo, onClick, titulo, texto }: { ativo: boolean; onClick: () => void; titulo: string; texto: string }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border p-3 text-left transition ${ativo ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}><span className="flex items-center gap-2 text-xs font-bold"><span className={`h-3 w-3 rounded-full border-2 ${ativo ? 'border-emerald-500 bg-emerald-500 shadow-[inset_0_0_0_2px_white]' : 'border-slate-300'}`} />{titulo}</span><span className="mt-1 block pl-5 text-[9px] text-slate-400">{texto}</span></button>
}

function mapearCardapioApi(
  produtosApi: ProdutoCardapioApi[],
  categoriasApi: Array<{ id: number; nome: string }>,
  subcategoriasApi: Array<{ id: number; nome: string; categoria_id: number }>,
) {
  const categoriasPorId = new Map(categoriasApi.map((categoria) => [categoria.id, categoria.nome]))
  const subcategoriasPorId = new Map(subcategoriasApi.map((subcategoria) => [subcategoria.id, subcategoria]))
  const produtosValidos = produtosApi.filter((produto) => produto.ativo && produto.variacoes.some((variacao) => variacao.ativo))
  const grupos = new Map<string, Produto[]>()

  produtosValidos.forEach((produto) => {
    const subcategoria = subcategoriasPorId.get(produto.subcategoria_id)
    const categoria = subcategoria ? categoriasPorId.get(subcategoria.categoria_id) : undefined
    const titulo = categoria ?? subcategoria?.nome ?? 'Cardapio'
    const produtos = grupos.get(titulo) ?? []
    produtos.push(mapearProdutoApi(produto))
    grupos.set(titulo, produtos)
  })

  return Array.from(grupos.entries()).map(([titulo, produtos], index) => ({
    id: `api-${index}-${normalizarTexto(titulo)}`,
    titulo,
    subtitulo: 'Produtos e preços carregados diretamente do backend.',
    produtos,
  }))
}

function mapearProdutoApi(produto: ProdutoCardapioApi): Produto {
  const normais = produto.variacoes.filter((variacao) => variacao.ativo && variacao.tipo === 'normal')
  const combos = produto.variacoes.filter((variacao) => variacao.ativo && variacao.tipo === 'combo')
  const variacoesBase = normais.length ? normais : produto.variacoes.filter((variacao) => variacao.ativo)
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
  }))
  const imagemApi = resolverImagemProdutoApi(produto.imagem_url)

  return {
    id: String(produto.id),
    nome: formatarNome(produto.nome),
    descricao: produto.descricao ?? '',
    preco: Math.min(...variacoes.map((variacao) => variacao.preco)),
    imagem: imagemApi ?? imagemProdutoLocal(produto.nome),
    variacoes,
    permiteCombo: combos.length > 0,
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
