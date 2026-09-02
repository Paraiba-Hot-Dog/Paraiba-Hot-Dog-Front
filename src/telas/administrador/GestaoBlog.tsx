import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { CalendarDays, CheckCircle2, ImagePlus, LoaderCircle, Pencil, Plus, Save, Trash2, Type } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import {
  criarPostBlogApi,
  excluirPostBlogApi,
  listarPostsBlogApi,
  resolverImagemBlogApi,
  atualizarPostBlogApi,
  type BlogPostApi,
  type BlogPostFormApi,
  type TipoBlogApi,
} from '../../servicos/blogApi'

type FormularioBlog = BlogPostFormApi & {
  id: number | null
  imagemPreview: string | null
}

const formularioVazio: FormularioBlog = {
  id: null,
  titulo: '',
  descricao: '',
  tipo: 'noticia',
  data: new Date().toISOString().slice(0, 10),
  imagemUrl: '',
  imagemFile: null,
  imagemPreview: null,
}

export default function GestaoBlog() {
  const [posts, setPosts] = useState<BlogPostApi[]>([])
  const [formulario, setFormulario] = useState<FormularioBlog>(formularioVazio)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [postParaExcluir, setPostParaExcluir] = useState<BlogPostApi | null>(null)
  const [erro, setErro] = useState('')
  const [notificacao, setNotificacao] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    listarPostsBlogApi()
      .then((dados) => {
        if (!ativo) return
        setPosts(dados)
        if (dados[0]) setFormulario(mapearPostParaFormulario(dados[0]))
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const criando = formulario.id === null
  const imagemPreview = useMemo(
    () => formulario.imagemPreview ?? resolverImagemBlogApi(formulario.imagemUrl || null),
    [formulario.imagemPreview, formulario.imagemUrl],
  )

  useEffect(() => {
    return () => {
      if (formulario.imagemPreview) URL.revokeObjectURL(formulario.imagemPreview)
    }
  }, [formulario.imagemPreview])

  function selecionarPost(post: BlogPostApi) {
    limparAvisos()
    setFormulario(mapearPostParaFormulario(post))
  }

  function iniciarCadastro() {
    limparAvisos()
    setFormulario({ ...formularioVazio, imagemPreview: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function atualizarCampo(campo: keyof FormularioBlog, valor: string | File | null) {
    limparAvisos()
    setFormulario((atual) => {
      if (campo === 'imagemFile') {
        if (atual.imagemPreview) URL.revokeObjectURL(atual.imagemPreview)
        const arquivo = valor instanceof File ? valor : null
        return {
          ...atual,
          imagemFile: arquivo,
          imagemPreview: arquivo ? URL.createObjectURL(arquivo) : atual.imagemPreview,
        }
      }

      return {
        ...atual,
        [campo]: valor,
        imagemPreview: campo === 'imagemUrl' ? null : atual.imagemPreview,
      }
    })
  }

  function escolherImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    atualizarCampo('imagemFile', arquivo)
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    limparAvisos()
    setSalvando(true)

    try {
      const payload: BlogPostFormApi = {
        titulo: formulario.titulo.trim(),
        descricao: formulario.descricao.trim(),
        tipo: formulario.tipo,
        data: formulario.data,
        imagemUrl: formulario.imagemUrl?.trim() || null,
        imagemFile: formulario.id === null ? formulario.imagemFile : null,
      }

      if (!payload.titulo || !payload.descricao) {
        setErro('Preencha titulo e descricao.')
        return
      }

      if (formulario.id === null) {
        const criado = await criarPostBlogApi(payload)
        setPosts((atuais) => [criado, ...atuais])
        setFormulario(mapearPostParaFormulario(criado))
        setNotificacao('Post criado com sucesso.')
      } else {
        const atualizado = await atualizarPostBlogApi(formulario.id, payload)
        setPosts((atuais) =>
          atuais.map((post) => (post.id === atualizado.id ? atualizado : post)),
        )
        setFormulario(mapearPostParaFormulario(atualizado))
        setNotificacao('Post atualizado com sucesso.')
      }
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(post: BlogPostApi) {
    setPostParaExcluir(post)
  }

  async function confirmarExclusao() {
    if (!postParaExcluir) return

    const post = postParaExcluir
    setExcluindoId(post.id)
    limparAvisos()
    try {
      await excluirPostBlogApi(post.id)
      setPosts((atuais) => atuais.filter((item) => item.id !== post.id))
      if (formulario.id === post.id) setFormulario(formularioVazio)
      setNotificacao('Post removido com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setExcluindoId(null)
      setPostParaExcluir(null)
    }
  }

  function limparAvisos() {
    setErro('')
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-barlow-condensed text-sm font-black uppercase tracking-[0.24em] text-cinza-base">
              Admin
            </p>
            <h1 className="font-barlow-condensed text-3xl font-black uppercase text-preto-v1 sm:text-5xl">
              Notícias e promoções
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {notificacao && (
              <Notificacao mensagem={notificacao} onFechar={() => setNotificacao(null)} />
            )}
            <button
              type="button"
              onClick={iniciarCadastro}
              className="inline-flex items-center gap-2 rounded-xl bg-amarelo px-4 py-3 font-barlow-condensed text-sm font-black uppercase text-preto-v1 shadow-sm transition hover:brightness-95"
            >
              <Plus size={18} />
              Novo post
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
                {criando ? 'Cadastrar post' : 'Editar post'}
              </h2>
              <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[10px] font-black uppercase text-cinza-base">
                {posts.length} posts
              </span>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={salvar}>
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Título</span>
                <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
                  <Type size={16} className="text-cinza-base" />
                  <input
                    value={formulario.titulo}
                    onChange={(event) => atualizarCampo('titulo', event.target.value)}
                    className="h-11 w-full bg-transparent outline-none"
                    placeholder="Ex.: Nova unidade abre no Lago Sul"
                  />
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Descrição</span>
                <textarea
                  value={formulario.descricao}
                  onChange={(event) => atualizarCampo('descricao', event.target.value)}
                  className="min-h-28 rounded-xl border border-[#d8dee8] bg-white px-3 py-3 outline-none"
                  placeholder="Texto que vai aparecer no card do blog"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Tipo</span>
                  <select
                    value={formulario.tipo}
                    onChange={(event) => atualizarCampo('tipo', event.target.value as TipoBlogApi)}
                    className="h-11 rounded-xl border border-[#d8dee8] bg-white px-3 outline-none"
                  >
                    <option value="noticia">Notícia</option>
                    <option value="promocao">Promoção</option>
                  </select>
                </label>

                <label className="grid gap-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Data</span>
                  <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
                    <CalendarDays size={16} className="text-cinza-base" />
                    <input
                      type="date"
                      value={formulario.data}
                      onChange={(event) => atualizarCampo('data', event.target.value)}
                      className="h-11 w-full bg-transparent outline-none"
                    />
                  </div>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Imagem</span>
                {criando ? (
                  <div className="grid gap-3 rounded-xl border border-dashed border-[#d8dee8] bg-[#f8fafc] p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={escolherImagem}
                      className="text-sm"
                    />
                    <p className="text-[11px] text-cinza-base">
                      Para criar um post novo, escolha uma imagem do computador. Na edicao, use a URL atual ou troque manualmente.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
                    <ImagePlus size={16} className="text-cinza-base" />
                    <input
                      value={formulario.imagemUrl ?? ''}
                      onChange={(event) => atualizarCampo('imagemUrl', event.target.value)}
                      className="h-11 w-full bg-transparent outline-none"
                      placeholder="URL da imagem"
                    />
                  </div>
                )}
              </label>

              {imagemPreview && (
                <div className="overflow-hidden rounded-2xl border border-[#d8dee8] bg-[#f8fafc]">
                  <img src={imagemPreview} alt="Previa do post" className="h-56 w-full object-cover" />
                </div>
              )}

              {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
                >
                  {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                  {salvando ? 'Salvando...' : 'Salvar post'}
                </button>
                {!criando && (
                  <button
                    type="button"
                    onClick={iniciarCadastro}
                    className="rounded-xl border border-[#d8dee8] px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-cinza-base"
                  >
                    Novo
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
            <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
              Posts cadastrados
            </h2>

            {carregando ? (
              <p className="mt-6 text-sm text-cinza-base">Carregando posts...</p>
            ) : (
              <div className="mt-5 space-y-3">
                {posts.length === 0 ? (
                  <p className="text-sm text-cinza-base">Nenhum post cadastrado.</p>
                ) : (
                  posts.map((post) => (
                    <article
                      key={post.id}
                      className={`rounded-2xl border p-3 transition ${formulario.id === post.id ? 'border-amarelo bg-amarelo/10' : 'border-[#d8dee8] bg-white'}`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={resolverImagemBlogApi(post.imagem_url) ?? ''}
                          alt={post.titulo}
                          className="h-20 w-28 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cinza-base">
                                {post.tipo}
                              </p>
                              <h3 className="truncate font-barlow-condensed text-lg font-black uppercase text-preto-v1">
                                {post.titulo}
                              </h3>
                            </div>
                            <span className="rounded-full bg-[#f2f5fa] px-2 py-1 text-[9px] font-black uppercase text-cinza-base">
                              #{post.id}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-cinza-base">{post.descricao}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selecionarPost(post)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1"
                            >
                              <Pencil size={12} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => excluir(post)}
                              disabled={excluindoId === post.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 disabled:opacity-60"
                            >
                              <Trash2 size={12} />
                              {excluindoId === post.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {postParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-titulo"
          onClick={() => setPostParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="confirmar-exclusao-titulo"
              className="font-barlow text-lg font-bold text-preto-v1"
            >
              Tem certeza que deseja excluir este post?
            </p>
            <p className="mt-2 font-barlow text-sm text-preto-v1">
              O post &quot;{postParaExcluir.titulo}&quot; será removido permanentemente.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === postParaExcluir.id}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {excluindoId === postParaExcluir.id ? 'Excluindo...' : 'Sim, excluir post'}
              </button>
              <button
                type="button"
                onClick={() => setPostParaExcluir(null)}
                disabled={excluindoId === postParaExcluir.id}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Notificacao({
  mensagem,
  onFechar,
}: {
  mensagem: string
  onFechar: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onFechar, 2500)
    return () => window.clearTimeout(timer)
  }, [mensagem, onFechar])

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-6 py-4 font-barlow text-sm font-medium text-emerald-800 shadow-[0_4px_16px_rgba(16,185,129,0.1)] sm:text-base"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 sm:h-6 sm:w-6" aria-hidden />
      <span className="whitespace-nowrap">{mensagem}</span>
    </div>
  )
}

function mapearPostParaFormulario(post: BlogPostApi): FormularioBlog {
  return {
    id: post.id,
    titulo: post.titulo,
    descricao: post.descricao ?? '',
    tipo: post.tipo,
    data: post.data,
    imagemUrl: post.imagem_url,
    imagemFile: null,
    imagemPreview: resolverImagemBlogApi(post.imagem_url),
  }
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
