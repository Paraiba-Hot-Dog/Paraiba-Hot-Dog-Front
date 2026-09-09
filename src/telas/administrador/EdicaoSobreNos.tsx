import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Info, LoaderCircle, Move, Save, Trash2, Upload } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import ModalSucesso from '../../componentes/administrador/painel/ModalSucesso'
import {
  atualizarImagemSobreNosApi,
  criarImagemSobreNosApi,
  excluirImagemSobreNosApi,
  listarImagensSobreNosApi,
  resolverImagemSobreNosApi,
  type SobreNosImagemApi,
} from '../../servicos/sobreNosApi'
import {
  atualizarSobreNosApi,
  obterSobreNosApi,
  TEXTO_PADRAO_SOBRE_NOS,
} from '../../servicos/institucionalApi'
import { useAuth } from '../../contextos/useAuth'

export default function EdicaoSobreNos() {
  const { hasRole } = useAuth()
  const podeEditarComoAdmin = hasRole('administrador')
  const [texto, setTexto] = useState(TEXTO_PADRAO_SOBRE_NOS)
  const [carregandoTexto, setCarregandoTexto] = useState(true)
  const [salvandoTexto, setSalvandoTexto] = useState(false)
  const [erroTexto, setErroTexto] = useState('')
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false)

  const [imagens, setImagens] = useState<SobreNosImagemApi[]>([])
  const [carregandoImagens, setCarregandoImagens] = useState(true)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [posicaoSelecionada, setPosicaoSelecionada] = useState('50% 50%')
  const [enviando, setEnviando] = useState(false)
  const [reordenandoId, setReordenandoId] = useState<number | null>(null)
  const [ajustandoPosicaoId, setAjustandoPosicaoId] = useState<number | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [imagemParaExcluir, setImagemParaExcluir] = useState<SobreNosImagemApi | null>(null)
  const [erroImagens, setErroImagens] = useState('')

  useEffect(() => {
    let ativo = true
    obterSobreNosApi()
      .then((conteudo) => {
        if (ativo) setTexto(conteudo.texto)
      })
      .catch((error: Error) => {
        if (ativo) setErroTexto(error.message)
      })
      .finally(() => {
        if (ativo) setCarregandoTexto(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true

    listarImagensSobreNosApi()
      .then((dados) => {
        if (ativo) setImagens(dados)
      })
      .catch((error) => {
        if (ativo) setErroImagens(mensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregandoImagens(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const imagensOrdenadas = useMemo(() => [...imagens].sort((a, b) => a.ordem - b.ordem), [imagens])

  async function salvarTexto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!podeEditarComoAdmin) {
      setErroTexto('Apenas administradores podem alterar o texto.')
      return
    }

    const textoAtualizado = texto.trim()
    if (!textoAtualizado) {
      setErroTexto('Preencha o texto de Sobre Nós.')
      return
    }

    setErroTexto('')
    setSalvandoTexto(true)
    try {
      const conteudo = await atualizarSobreNosApi(textoAtualizado)
      setTexto(conteudo.texto)
      setMostrarModalSucesso(true)
    } catch (error) {
      setErroTexto(error instanceof Error ? error.message : 'Não foi possível salvar o texto.')
    } finally {
      setSalvandoTexto(false)
    }
  }

  function limparAvisosImagens() {
    setErroImagens('')
  }

  function escolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    limparAvisosImagens()
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    if (preview) URL.revokeObjectURL(preview)
    setArquivoSelecionado(arquivo)
    setPreview(URL.createObjectURL(arquivo))
    setPosicaoSelecionada('50% 50%')
  }

  function calcularPosicaoClique(evento: MouseEvent<HTMLDivElement>) {
    const area = evento.currentTarget.getBoundingClientRect()
    const x = Math.round(((evento.clientX - area.left) / area.width) * 100)
    const y = Math.round(((evento.clientY - area.top) / area.height) * 100)
    return `${clamp(x)}% ${clamp(y)}%`
  }

  async function enviarImagem() {
    if (!arquivoSelecionado) {
      setErroImagens('Selecione uma imagem para enviar.')
      return
    }

    limparAvisosImagens()
    setEnviando(true)
    try {
      const criada = await criarImagemSobreNosApi(arquivoSelecionado, posicaoSelecionada)
      setImagens((atuais) => [...atuais, criada])
      setArquivoSelecionado(null)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(null)
      setPosicaoSelecionada('50% 50%')
    } catch (error) {
      setErroImagens(mensagemErro(error))
    } finally {
      setEnviando(false)
    }
  }

  async function mover(imagem: SobreNosImagemApi, direcao: -1 | 1) {
    const posicaoAtual = imagensOrdenadas.findIndex((item) => item.id === imagem.id)
    const vizinho = imagensOrdenadas[posicaoAtual + direcao]
    if (!vizinho) return

    limparAvisosImagens()
    setReordenandoId(imagem.id)
    try {
      const [imagemAtualizada, vizinhoAtualizado] = await Promise.all([
        atualizarImagemSobreNosApi(imagem.id, { ordem: vizinho.ordem }),
        atualizarImagemSobreNosApi(vizinho.id, { ordem: imagem.ordem }),
      ])
      setImagens((atuais) =>
        atuais.map((item) => {
          if (item.id === imagemAtualizada.id) return imagemAtualizada
          if (item.id === vizinhoAtualizado.id) return vizinhoAtualizado
          return item
        }),
      )
    } catch (error) {
      setErroImagens(mensagemErro(error))
    } finally {
      setReordenandoId(null)
    }
  }

  async function ajustarPosicao(imagem: SobreNosImagemApi, evento: MouseEvent<HTMLDivElement>) {
    const novaPosicao = calcularPosicaoClique(evento)

    limparAvisosImagens()
    setAjustandoPosicaoId(imagem.id)
    try {
      const atualizada = await atualizarImagemSobreNosApi(imagem.id, { posicao: novaPosicao })
      setImagens((atuais) => atuais.map((item) => (item.id === atualizada.id ? atualizada : item)))
    } catch (error) {
      setErroImagens(mensagemErro(error))
    } finally {
      setAjustandoPosicaoId(null)
    }
  }

  async function confirmarExclusao() {
    if (!imagemParaExcluir) return

    const imagem = imagemParaExcluir
    setExcluindoId(imagem.id)
    limparAvisosImagens()
    try {
      await excluirImagemSobreNosApi(imagem.id)
      setImagens((atuais) => atuais.filter((item) => item.id !== imagem.id))
    } catch (error) {
      setErroImagens(mensagemErro(error))
    } finally {
      setExcluindoId(null)
      setImagemParaExcluir(null)
    }
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amarelo/15">
            <Info size={22} strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="font-barlow-condensed text-2xl font-bold uppercase sm:text-3xl">
              Edição de Sobre Nós
            </h1>
            <p className="font-barlow text-cinza-base/70">
              Atualize o texto e as imagens do carrossel &quot;Nossa história&quot; exibidos na página pública.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-[#d8dee7] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">Texto</h2>

          {carregandoTexto ? (
            <p className="mt-6 font-barlow text-cinza-base">Carregando conteúdo...</p>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={salvarTexto}>
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Texto
                </span>
                <textarea
                  value={texto}
                  onChange={(evento) => {
                    setTexto(evento.target.value)
                    setErroTexto('')
                  }}
                  rows={8}
                  disabled={!podeEditarComoAdmin}
                  className="w-full resize-y rounded-xl border border-[#d8dee8] bg-white p-3 font-barlow leading-6 outline-none focus:border-amarelo disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:opacity-70"
                  aria-label="Texto de Sobre Nós"
                />
              </label>
              {erroTexto && <p className="font-barlow text-red-600">{erroTexto}</p>}
              {!podeEditarComoAdmin && (
                <p className="font-barlow text-sm text-cinza-base">
                  Apenas administradores podem alterar o texto.
                </p>
              )}
              <button
                type="submit"
                disabled={salvandoTexto || !podeEditarComoAdmin}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-amarelo px-5 py-3 font-barlow-condensed font-black uppercase text-preto-v1 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {salvandoTexto ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </form>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
            Adicionar imagem
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1.5">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                Arquivo de imagem
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#d8dee8] bg-[#f8fafc] px-3 py-3">
                <ImagePlus size={16} className="text-cinza-base" />
                <input type="file" accept="image/*" onChange={escolherArquivo} className="text-sm" />
              </div>
            </label>

            <button
              type="button"
              onClick={enviarImagem}
              disabled={enviando || !arquivoSelecionado}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amarelo px-5 font-barlow-condensed text-sm font-black uppercase text-preto-v1 shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {enviando ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              {enviando ? 'Enviando...' : 'Enviar imagem'}
            </button>
          </div>

          {preview && (
            <div className="mt-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Clique para escolher o enquadramento da imagem"
                onClick={(evento) => setPosicaoSelecionada(calcularPosicaoClique(evento))}
                className="relative h-56 w-full cursor-crosshair overflow-hidden rounded-2xl border border-[#d8dee8] bg-[#f8fafc]"
              >
                <img
                  src={preview}
                  alt="Prévia da imagem selecionada"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: posicaoSelecionada }}
                />
                <div
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amarelo bg-preto-v1/60"
                  style={{ left: pontoFoco(posicaoSelecionada).x + '%', top: pontoFoco(posicaoSelecionada).y + '%' }}
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[10px] text-cinza-base">
                <Move size={11} />
                Clique na prévia para escolher o enquadramento antes de enviar
              </p>
            </div>
          )}

          {erroImagens && <p className="mt-4 text-sm font-semibold text-red-600">{erroImagens}</p>}
        </section>

        <section className="mt-6 rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
              Imagens do carrossel
            </h2>
            <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[10px] font-black uppercase text-cinza-base">
              {imagensOrdenadas.length} imagens
            </span>
          </div>

          {carregandoImagens ? (
            <p className="mt-6 text-sm text-cinza-base">Carregando imagens...</p>
          ) : imagensOrdenadas.length === 0 ? (
            <p className="mt-6 text-sm text-cinza-base">Nenhuma imagem cadastrada ainda.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {imagensOrdenadas.map((imagem, indice) => {
                const foco = pontoFoco(imagem.posicao)
                return (
                  <article
                    key={imagem.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#d8dee8] bg-white p-3 sm:flex-row"
                  >
                    <div className="shrink-0">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label="Clique para ajustar o enquadramento da imagem"
                        onClick={(evento) => ajustarPosicao(imagem, evento)}
                        className="relative h-40 w-full cursor-crosshair overflow-hidden rounded-xl border border-[#d8dee8] sm:h-28 sm:w-40"
                      >
                        <img
                          src={resolverImagemSobreNosApi(imagem.imagem_url) ?? ''}
                          alt={`Imagem ${indice + 1} do carrossel`}
                          className="h-full w-full object-cover"
                          style={{ objectPosition: imagem.posicao || 'center center' }}
                        />
                        <div
                          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amarelo bg-preto-v1/60"
                          style={{ left: `${foco.x}%`, top: `${foco.y}%` }}
                        />
                        {ajustandoPosicaoId === imagem.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <LoaderCircle size={20} className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-cinza-base">
                        <Move size={11} />
                        Clique para ajustar o enquadramento
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cinza-base">
                        Posição {indice + 1}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => mover(imagem, -1)}
                          disabled={indice === 0 || reordenandoId !== null}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-40"
                        >
                          <ArrowUp size={12} />
                          Subir
                        </button>
                        <button
                          type="button"
                          onClick={() => mover(imagem, 1)}
                          disabled={indice === imagensOrdenadas.length - 1 || reordenandoId !== null}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-40"
                        >
                          <ArrowDown size={12} />
                          Descer
                        </button>
                        <button
                          type="button"
                          onClick={() => setImagemParaExcluir(imagem)}
                          disabled={excluindoId === imagem.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 disabled:opacity-60"
                        >
                          <Trash2 size={12} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {imagemParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-imagem-titulo"
          onClick={() => setImagemParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="confirmar-exclusao-imagem-titulo" className="font-barlow text-lg font-bold text-preto-v1">
              Tem certeza que deseja excluir esta imagem?
            </p>
            <p className="mt-2 font-barlow text-sm text-preto-v1">
              A imagem será removida permanentemente do carrossel.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === imagemParaExcluir.id}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {excluindoId === imagemParaExcluir.id ? 'Excluindo...' : 'Sim, excluir imagem'}
              </button>
              <button
                type="button"
                onClick={() => setImagemParaExcluir(null)}
                disabled={excluindoId === imagemParaExcluir.id}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter imagem
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalSucesso aberto={mostrarModalSucesso} onFechar={() => setMostrarModalSucesso(false)} />
    </div>
  )
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}

function clamp(valor: number) {
  return Math.min(100, Math.max(0, valor))
}

const PALAVRAS_CHAVE_POSICAO: Record<string, string> = {
  left: '0%',
  top: '0%',
  center: '50%',
  right: '100%',
  bottom: '100%',
}

function paraPercentual(valor: string | undefined) {
  if (!valor) return 50
  const traduzido = PALAVRAS_CHAVE_POSICAO[valor] ?? valor
  return Number.parseFloat(traduzido) || 50
}

function pontoFoco(posicao: string | null) {
  const [x, y] = (posicao || '50% 50%').trim().split(/\s+/)
  return { x: paraPercentual(x), y: paraPercentual(y) }
}
