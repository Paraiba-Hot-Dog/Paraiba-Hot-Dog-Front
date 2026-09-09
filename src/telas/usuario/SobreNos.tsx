import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import BarraDeNavegacao from '../../componentes/usuario/BarraDeNavegacaoUsuario'
import Rodape from '../../componentes/usuario/Rodape'
import imgCarrossel2 from '../../imagens/sobre-nos/WhatsApp Image 2026-04-15 at 11.10.02.jpeg'
import imgCarrossel3 from '../../imagens/sobre-nos/WhatsApp Image 2026-04-15 at 11.29.49.jpeg'
import imgCarrossel4 from '../../imagens/sobre-nos/WhatsApp Image 2026-04-15 at 11.10.03.jpeg'
import { resolverUrlImagem } from '../../servicos/api'
import { listarPostsBlogApi, resolverImagemBlogApi, type BlogPostApi, type TipoBlogApi } from '../../servicos/blogApi'
import { listarAvaliacoesApi, NOTA_MAXIMA, type AvaliacaoApi } from '../../servicos/avaliacoesApi'

const smashMandacaru = resolverUrlImagem('/uploads/produtos/smash-mandacaru.jpeg') ?? ''
const dogArretado = resolverUrlImagem('/uploads/produtos/dog-arretado.jpeg') ?? ''


const historias = [
  { imagem: imgCarrossel4, posicao: 'center center' },
  { imagem: imgCarrossel2, posicao: 'center top' },
  { imagem: imgCarrossel3, posicao: 'center center' },
] as const

const noticiasFallback = [
  {
    categoria: 'noticia' as const,
    titulo: 'Nova unidade abre no Lago Sul',
    descricao: 'Mais um ponto para quem quer matar a fome com hot dog arretado.',
    imagem: smashMandacaru,
    data: '',
  },
  {
    categoria: 'promocao' as const,
    titulo: 'Combo especial: hot dog + batata + refri por R$ 25',
    descricao: 'Promo por tempo limitado para comer bem sem pesar no bolso.',
    imagem: dogArretado,
    data: '',
  },
]

type Depoimento = {
  nome: string
  texto: string
  estrelas: number
}

const depoimentosFallback: Depoimento[] = [
  {
    nome: 'Juliana Costa',
    texto:
      'Simplesmente perfeito. O sabor paraibano autêntico que eu procurava. Toda semana estou lá.',
    estrelas: 5,
  },
  {
    nome: 'Marcos Lima',
    texto:
      'O combo sai rápido e chega bonito. O atendimento e a história da marca passam muita verdade.',
    estrelas: 5,
  },
  {
    nome: 'Fernanda Alves',
    texto:
      'Sempre volto pelo sabor e pela consistência. Os dogs e os acompanhamentos não falham.',
    estrelas: 5,
  },
]

export default function SobreNos() {
  const [imagemAtiva, setImagemAtiva] = useState(0)
  const [depoimentoAtivo, setDepoimentoAtivo] = useState(0)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoApi[]>([])
  const [posts, setPosts] = useState<BlogCard[]>([])
  const [filtro, setFiltro] = useState<'todos' | TipoBlogApi>('todos')
  const [filtroExibido, setFiltroExibido] = useState<'todos' | TipoBlogApi>('todos')
  const [animandoFiltro, setAnimandoFiltro] = useState(false)
  const [animandoDepoimento, setAnimandoDepoimento] = useState(false)
  const [carregandoPosts, setCarregandoPosts] = useState(true)
  const timersRef = useRef<number[]>([])
  const depoimentoTimersRef = useRef<number[]>([])

  const depoimentos = useMemo<Depoimento[]>(() => {
    if (!avaliacoes.length) return depoimentosFallback

    return avaliacoes.map((avaliacao) => ({
      nome: avaliacao.nome_cliente,
      texto: avaliacao.descricao,
      estrelas: avaliacao.estrelas,
    }))
  }, [avaliacoes])

  const historiaAtual = historias[imagemAtiva]
  const indiceDepoimento = depoimentos.length
    ? depoimentoAtivo % depoimentos.length
    : 0
  const depoimento = depoimentos[indiceDepoimento]

  const estatisticas = useMemo(
    () => [
      { valor: '10+', legenda: 'Anos de funcionamento' },
      { valor: '4,9', legenda: 'Avaliação média' },
      { valor: '3', legenda: 'Unidades' },
    ],
    [],
  )

  useEffect(() => {
    let ativo = true

    async function carregarPosts() {
      setCarregandoPosts(true)
      try {
        const [noticiasApi, promocoesApi] = await Promise.all([
          listarPostsBlogApi('noticia'),
          listarPostsBlogApi('promocao'),
        ])

        if (!ativo) return
        const unificados = [...noticiasApi, ...promocoesApi]
          .sort((a, b) => b.data.localeCompare(a.data))
          .map(mapearPost)

        setPosts(unificados.length ? unificados : noticiasFallback.map(mapearFallback))
      } catch {
        if (ativo) setPosts(noticiasFallback.map(mapearFallback))
      } finally {
        if (ativo) setCarregandoPosts(false)
      }
    }

    carregarPosts()

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true

    listarAvaliacoesApi(true)
      .then((dados) => {
        if (ativo) setAvaliacoes(dados)
      })
      .catch(() => {
        if (ativo) setAvaliacoes([])
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current = []
      depoimentoTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      depoimentoTimersRef.current = []
    },
    [],
  )

  const trocarDepoimento = (resolver: (indiceAtual: number) => number) => {
    if (depoimentos.length < 2) return

    depoimentoTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    setAnimandoDepoimento(true)

    const trocaTimer = window.setTimeout(() => {
      setDepoimentoAtivo((atual) => resolver(atual))
    }, 160)
    const fimTimer = window.setTimeout(() => {
      setAnimandoDepoimento(false)
    }, 340)

    depoimentoTimersRef.current = [trocaTimer, fimTimer]
  }

  const atualizarFiltro = (novoFiltro: 'todos' | TipoBlogApi) => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []

    setFiltro(novoFiltro)
    setAnimandoFiltro(true)

    const hideTimer = window.setTimeout(() => {
      setFiltroExibido(novoFiltro)
    }, 140)
    const showTimer = window.setTimeout(() => {
      setAnimandoFiltro(false)
    }, 320)

    timersRef.current = [hideTimer, showTimer]
  }

  const postsFiltrados = posts.filter((post) => filtroExibido === 'todos' || post.tipo === filtroExibido)

  return (
    <>
      <BarraDeNavegacao variant="light" />

      <main className="min-h-screen bg-preto-v1 pt-16 text-branco">
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-barlow-condensed text-[clamp(2.25rem,7vw,4rem)] font-black uppercase leading-[0.9]">
              Nossa <span className="text-amarelo">história</span>
            </h1>
          </div>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-branco/10 bg-[#111] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="relative isolate overflow-hidden bg-[#090909] px-3 py-3 sm:px-4 sm:py-4">
              <div className="absolute inset-0">
                <img
                  src={historiaAtual.imagem}
                  alt=""
                  aria-hidden
                  className="h-full w-full scale-105 object-cover opacity-20 blur-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/60" />
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                  <img
                    src={historiaAtual.imagem}
                    alt="História da Paraíba Hot Dog"
                    className="h-[230px] w-full object-cover sm:h-[330px] lg:h-[390px]"
                    style={{ objectPosition: historiaAtual.posicao }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                </div>

                <button
                  type="button"
                  onClick={() => setImagemAtiva((atual) => (atual - 1 + historias.length) % historias.length)}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-branco transition hover:bg-black"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => setImagemAtiva((atual) => (atual + 1) % historias.length)}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-branco transition hover:bg-black"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-7">
              <p className="mx-auto max-w-4xl text-center font-barlow text-sm leading-7 text-branco/80 sm:text-base">
                Nascemos da paixão pela gastronomia de rua e pelo sabor autêntico da Paraíba.
                Desde 2015, levamos o melhor hot dog arretado para os brasilenses com qualidade,
                fartura e tradição. Nossa missão é servir ingredientes frescos, receitas
                exclusivas e um atendimento que faz você se sentir em casa.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
                {estatisticas.map((item) => (
                  <article key={item.legenda} className="rounded-2xl bg-[#242424] px-4 py-5 text-center">
                    <strong className="block font-barlow-condensed text-4xl font-black text-amarelo">
                      {item.valor}
                    </strong>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.2em] text-branco/70">
                      {item.legenda}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-barlow-condensed text-[clamp(2.3rem,6vw,4rem)] font-black uppercase leading-[0.9]">
              <span className="text-branco">Notícias e </span>
              <span className="text-amarelo">Promoções</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm font-black leading-7 text-branco/75 sm:text-base">
              Fique por dentro das novidades e aproveite
              <br />
              nossas ofertas.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <ul className="flex w-full max-w-sm items-center gap-1.5 rounded-2xl border border-branco/10 bg-[#171717] px-2 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.22)] select-none min-[640px]:max-w-md">
              <li className="flex-1 text-center">
                <button
                  type="button"
                  onClick={() => atualizarFiltro('todos')}
                  className={`w-full whitespace-nowrap rounded-xl px-4 py-2 font-barlow-condensed text-sm font-black uppercase leading-none transition-colors duration-200 min-[640px]:px-5 min-[640px]:py-2.5 min-[640px]:text-base ${
                    filtro === 'todos'
                      ? 'bg-amarelo text-preto-v1'
                      : 'bg-transparent text-branco/75 hover:bg-branco/10 hover:text-branco'
                  }`}
                >
                  Todos
                </button>
              </li>
              <li className="flex-1 text-center">
                <button
                  type="button"
                  onClick={() => atualizarFiltro('noticia')}
                  className={`w-full whitespace-nowrap rounded-xl px-4 py-2 font-barlow-condensed text-sm font-black uppercase leading-none transition-colors duration-200 min-[640px]:px-5 min-[640px]:py-2.5 min-[640px]:text-base ${
                    filtro === 'noticia'
                      ? 'bg-amarelo text-preto-v1'
                      : 'bg-transparent text-branco/75 hover:bg-branco/10 hover:text-branco'
                  }`}
                >
                  Notícias
                </button>
              </li>
              <li className="flex-1 text-center">
                <button
                  type="button"
                  onClick={() => atualizarFiltro('promocao')}
                  className={`w-full whitespace-nowrap rounded-xl px-4 py-2 font-barlow-condensed text-sm font-black uppercase leading-none transition-colors duration-200 min-[640px]:px-5 min-[640px]:py-2.5 min-[640px]:text-base ${
                    filtro === 'promocao'
                      ? 'bg-amarelo text-preto-v1'
                      : 'bg-transparent text-branco/75 hover:bg-branco/10 hover:text-branco'
                  }`}
                >
                  Promoções
                </button>
              </li>
            </ul>
          </div>

          {carregandoPosts && (
            <p className="mt-6 text-center text-sm text-branco/50">Carregando notícias e promoções...</p>
          )}

          <div className={`mt-8 grid gap-4 lg:grid-cols-2 lg:gap-5 transition-all duration-300 ${animandoFiltro ? 'translate-y-2 opacity-0 blur-[1px]' : 'translate-y-0 opacity-100 blur-0'}`}>
            {postsFiltrados.map((noticia) => (
              <article
                key={noticia.titulo}
                className={`group overflow-hidden rounded-[22px] border border-branco/10 bg-[#2a2a2a] shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 ${
                  animandoFiltro ? 'translate-y-3 scale-[0.98] opacity-0' : 'translate-y-0 scale-100 opacity-100'
                }`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={noticia.imagem}
                    alt={noticia.titulo}
                    className="h-[280px] w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 group-hover:brightness-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-amarelo px-2 py-1 text-[9px] font-black uppercase text-preto-v1">
                    {noticia.tipo === 'noticia' ? 'Notícias' : 'Promoções'}
                  </span>
                </div>
                <div className="px-4 py-4 sm:px-5 sm:py-5">
                  <h3 className="font-barlow-condensed text-[clamp(1.6rem,3vw,2.1rem)] font-black uppercase leading-tight text-branco">
                    {noticia.titulo}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-branco/75">{noticia.descricao}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-barlow-condensed text-[clamp(2rem,5vw,3.25rem)] font-black uppercase">
              O que nossos <span className="text-amarelo">clientes dizem</span>
            </h2>
          </div>

          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl bg-[#2a2a2a] px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.3)] sm:px-8">
            <div
              className={`transition-all duration-300 ease-out ${
                animandoDepoimento
                  ? 'translate-y-1 opacity-0 blur-[1px]'
                  : 'translate-y-0 opacity-100 blur-0'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-barlow-condensed text-xl font-black uppercase break-words">
                    {depoimento.nome}
                  </p>
                </div>
                <div
                  className="flex shrink-0 items-center gap-1 text-amarelo"
                  aria-label={`${depoimento.estrelas} de ${NOTA_MAXIMA} estrelas`}
                >
                  {Array.from({ length: NOTA_MAXIMA }).map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill={index < depoimento.estrelas ? 'currentColor' : 'none'}
                      className={index < depoimento.estrelas ? 'text-amarelo' : 'text-branco/25'}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-5 min-h-[6rem] text-sm leading-7 text-branco/80 whitespace-pre-line break-words sm:text-base">
                &quot;{depoimento.texto}&quot;
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  trocarDepoimento(
                    (atual) => (atual - 1 + depoimentos.length) % depoimentos.length,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amarelo text-preto-v1 transition hover:brightness-95"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-wrap justify-center gap-2">
                {depoimentos.map((item, index) => (
                  <button
                    key={`${item.nome}-${index}`}
                    type="button"
                    onClick={() => trocarDepoimento(() => index)}
                    className={`h-2.5 rounded-full transition-all ${index === indiceDepoimento ? 'w-8 bg-amarelo' : 'w-2.5 bg-branco/25'}`}
                    aria-label={`Ver depoimento de ${item.nome}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  trocarDepoimento((atual) => (atual + 1) % depoimentos.length)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amarelo text-preto-v1 transition hover:brightness-95"
                aria-label="Proximo depoimento"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  )
}

type BlogCard = {
  id: number
  titulo: string
  descricao: string
  imagem: string
  data: string
  tipo: TipoBlogApi
}

function mapearPost(post: BlogPostApi): BlogCard {
  return {
    id: post.id,
    titulo: post.titulo,
    descricao: post.descricao ?? '',
    imagem: resolverImagemBlogApi(post.imagem_url) ?? smashMandacaru,
    data: formatarDataBlog(post.data),
    tipo: post.tipo,
  }
}

function mapearFallback(post: (typeof noticiasFallback)[number]): BlogCard {
  return {
    id: post.titulo.length,
    titulo: post.titulo,
    descricao: post.descricao,
    imagem: post.imagem,
    data: post.data,
    tipo: post.categoria,
  }
}

function formatarDataBlog(data: string) {
  const valor = new Date(`${data}T00:00:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(valor)
    .replace('.', '')
    .toUpperCase()
}
