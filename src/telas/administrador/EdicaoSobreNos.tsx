import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Info, Move, Save, Trash2 } from 'lucide-react'
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
  ESTATISTICAS_PADRAO_SOBRE_NOS,
  obterSobreNosApi,
  TEXTO_PADRAO_SOBRE_NOS,
  type EstatisticaSobreNosApi,
} from '../../servicos/institucionalApi'
import { useAuth } from '../../contextos/useAuth'

type ImagemEdicao = SobreNosImagemApi & {
  arquivo?: File
  previewLocal?: string
}

const classeFonteBotaoAcao =
  'inline-flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 font-barlow text-xs font-semibold uppercase leading-none text-preto-v1'

export default function EdicaoSobreNos() {
  const { hasRole } = useAuth()
  const podeEditarComoAdmin = hasRole('administrador')
  const [texto, setTexto] = useState(TEXTO_PADRAO_SOBRE_NOS)
  const [estatisticas, setEstatisticas] = useState<EstatisticaSobreNosApi[]>(
    ESTATISTICAS_PADRAO_SOBRE_NOS.map((item) => ({ ...item })),
  )
  const [carregandoTexto, setCarregandoTexto] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [mostrarModalSucesso, setMostrarModalSucesso] = useState(false)

  const [imagens, setImagens] = useState<ImagemEdicao[]>([])
  const [idsImagensSalvas, setIdsImagensSalvas] = useState<number[]>([])
  const [carregandoImagens, setCarregandoImagens] = useState(true)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [posicaoSelecionada, setPosicaoSelecionada] = useState('50% 50%')
  const [imagemParaExcluir, setImagemParaExcluir] = useState<ImagemEdicao | null>(null)
  const [erroImagens, setErroImagens] = useState('')
  const proximoIdTemporario = useRef(-1)
  const imagensRef = useRef<ImagemEdicao[]>([])
  imagensRef.current = imagens

  useEffect(() => {
    let ativo = true
    obterSobreNosApi()
      .then((conteudo) => {
        if (!ativo) return
        setTexto(conteudo.texto)
        setEstatisticas(conteudo.estatisticas)
      })
      .catch((error: Error) => {
        if (ativo) setErroSalvar(error.message)
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
        if (!ativo) return
        setImagens(dados)
        setIdsImagensSalvas(dados.map((item) => item.id))
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

  useEffect(() => {
    return () => {
      imagensRef.current.forEach((imagem) => {
        if (imagem.previewLocal) URL.revokeObjectURL(imagem.previewLocal)
      })
    }
  }, [])

  const imagensOrdenadas = useMemo(() => [...imagens].sort((a, b) => a.ordem - b.ordem), [imagens])

  async function salvarAlteracoes(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!podeEditarComoAdmin) {
      setErroSalvar('Apenas administradores podem alterar o conteúdo.')
      return
    }

    const textoAtualizado = texto.trim()
    if (!textoAtualizado) {
      setErroSalvar('Preencha o texto de Sobre Nós.')
      return
    }

    const estatisticasAtualizadas = estatisticas.map((item) => ({
      valor: item.valor.trim(),
      legenda: item.legenda.trim(),
    }))
    if (estatisticasAtualizadas.some((item) => !item.valor || !item.legenda)) {
      setErroSalvar('Preencha o valor e a legenda dos três cards.')
      return
    }

    setErroSalvar('')
    setErroImagens('')
    setSalvando(true)
    try {
      const conteudo = await atualizarSobreNosApi({
        texto: textoAtualizado,
        estatisticas: estatisticasAtualizadas,
      })
      setTexto(conteudo.texto)
      setEstatisticas(conteudo.estatisticas)

      const imagensPersistidas = await persistirImagens(imagensOrdenadas, idsImagensSalvas)
      imagens
        .filter((imagem) => imagem.previewLocal)
        .forEach((imagem) => URL.revokeObjectURL(imagem.previewLocal!))
      setImagens(imagensPersistidas)
      setIdsImagensSalvas(imagensPersistidas.map((item) => item.id))
      setMostrarModalSucesso(true)
    } catch (error) {
      setErroSalvar(error instanceof Error ? error.message : 'Não foi possível salvar as alterações.')
    } finally {
      setSalvando(false)
    }
  }

  function atualizarEstatistica(
    indice: number,
    campo: keyof EstatisticaSobreNosApi,
    valor: string,
  ) {
    setErroSalvar('')
    setEstatisticas((atuais) =>
      atuais.map((item, itemIndice) => (itemIndice === indice ? { ...item, [campo]: valor } : item)),
    )
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

  function adicionarImagem() {
    if (!arquivoSelecionado || !preview) {
      setErroImagens('Selecione uma imagem para adicionar.')
      return
    }

    limparAvisosImagens()
    const maiorOrdem = imagensOrdenadas.reduce((maior, item) => Math.max(maior, item.ordem), -1)
    const novaImagem: ImagemEdicao = {
      id: proximoIdTemporario.current,
      imagem_url: preview,
      ordem: maiorOrdem + 1,
      posicao: posicaoSelecionada,
      arquivo: arquivoSelecionado,
      previewLocal: preview,
    }
    proximoIdTemporario.current -= 1

    setImagens((atuais) => [...atuais, novaImagem])
    setArquivoSelecionado(null)
    setPreview(null)
    setPosicaoSelecionada('50% 50%')
  }

  function mover(imagem: ImagemEdicao, direcao: -1 | 1) {
    const posicaoAtual = imagensOrdenadas.findIndex((item) => item.id === imagem.id)
    const vizinho = imagensOrdenadas[posicaoAtual + direcao]
    if (!vizinho) return

    limparAvisosImagens()
    setImagens((atuais) =>
      atuais.map((item) => {
        if (item.id === imagem.id) return { ...item, ordem: vizinho.ordem }
        if (item.id === vizinho.id) return { ...item, ordem: imagem.ordem }
        return item
      }),
    )
  }

  function ajustarPosicao(imagem: ImagemEdicao, evento: MouseEvent<HTMLDivElement>) {
    const novaPosicao = calcularPosicaoClique(evento)
    limparAvisosImagens()
    setImagens((atuais) =>
      atuais.map((item) => (item.id === imagem.id ? { ...item, posicao: novaPosicao } : item)),
    )
  }

  function confirmarExclusao() {
    if (!imagemParaExcluir) return

    const imagem = imagemParaExcluir
    if (imagem.previewLocal) URL.revokeObjectURL(imagem.previewLocal)
    setImagens((atuais) => atuais.filter((item) => item.id !== imagem.id))
    setImagemParaExcluir(null)
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] text-preto-v1 ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
        <form id="form-sobre-nos" onSubmit={salvarAlteracoes}>
          <div className="sticky top-16 z-40 -mx-4 mb-8 border-b border-[#d8dee7] bg-[#f4f6fb]/95 px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amarelo/15">
                  <Info size={22} strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h1 className="font-barlow-condensed text-2xl font-bold uppercase sm:text-3xl">
                    Edição de Sobre Nós
                  </h1>
                  <p className="font-barlow text-cinza-base/70">
                    Atualize o texto, os cards de estatísticas e as imagens do carrossel &quot;Nossa
                    história&quot; exibidos na página pública.
                  </p>
                </div>
              </div>
              <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-max">
                <button
                  type="button"
                  onClick={() => window.open('/sobre-nos', '_blank', 'noopener,noreferrer')}
                  className={`${classeFonteBotaoAcao} border border-[#d8dee8] bg-white transition hover:border-amarelo hover:bg-amarelo/10`}
                >
                  <ExternalLink size={14} />
                  Ver página Sobre Nós
                </button>
                <button
                  type="submit"
                  disabled={salvando || !podeEditarComoAdmin || carregandoTexto || carregandoImagens}
                  className={`${classeFonteBotaoAcao} bg-amarelo transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Save size={14} />
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
            {erroSalvar && <p className="mt-3 font-barlow text-sm text-red-600">{erroSalvar}</p>}
          </div>

          <section className="rounded-2xl border border-[#d8dee7] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
              Texto e cards
            </h2>

            {carregandoTexto ? (
              <p className="mt-6 font-barlow text-cinza-base">Carregando conteúdo...</p>
            ) : (
              <div className="mt-6 grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                    Texto
                  </span>
                  <textarea
                    value={texto}
                    onChange={(evento) => {
                      setTexto(evento.target.value)
                      setErroSalvar('')
                    }}
                    rows={8}
                    disabled={!podeEditarComoAdmin}
                    className="w-full resize-y rounded-xl border border-[#d8dee8] bg-white p-3 font-barlow leading-6 outline-none focus:border-amarelo disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:opacity-70"
                    aria-label="Texto de Sobre Nós"
                  />
                </label>

                <div className="grid gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                    Cards de estatísticas
                  </span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {estatisticas.map((item, indice) => (
                      <article
                        key={`estatistica-${indice}`}
                        className="rounded-2xl border border-[#d8dee8] bg-[#f8fafc] p-4"
                      >
                        <label className="grid gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cinza-base">
                            Valor
                          </span>
                          <input
                            value={item.valor}
                            onChange={(evento) =>
                              atualizarEstatistica(indice, 'valor', evento.target.value)
                            }
                            disabled={!podeEditarComoAdmin}
                            maxLength={20}
                            className="w-full rounded-xl border border-[#d8dee8] bg-white px-3 py-2 font-barlow-condensed text-2xl font-black uppercase text-preto-v1 outline-none focus:border-amarelo disabled:cursor-not-allowed disabled:opacity-70"
                            aria-label={`Valor do card ${indice + 1}`}
                          />
                        </label>
                        <label className="mt-3 grid gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cinza-base">
                            Legenda
                          </span>
                          <input
                            value={item.legenda}
                            onChange={(evento) =>
                              atualizarEstatistica(indice, 'legenda', evento.target.value)
                            }
                            disabled={!podeEditarComoAdmin}
                            maxLength={80}
                            className="w-full rounded-xl border border-[#d8dee8] bg-white px-3 py-2 font-barlow text-sm uppercase outline-none focus:border-amarelo disabled:cursor-not-allowed disabled:opacity-70"
                            aria-label={`Legenda do card ${indice + 1}`}
                          />
                        </label>
                      </article>
                    ))}
                  </div>
                </div>

                {!podeEditarComoAdmin && (
                  <p className="font-barlow text-sm text-cinza-base">
                    Apenas administradores podem alterar o texto, os cards e o carrossel.
                  </p>
                )}
              </div>
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={escolherArquivo}
                    disabled={!podeEditarComoAdmin || salvando}
                    className="text-sm"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={adicionarImagem}
                disabled={!podeEditarComoAdmin || salvando || !arquivoSelecionado}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-5 font-barlow-condensed text-sm font-black uppercase text-preto-v1 shadow-sm transition hover:border-amarelo hover:bg-amarelo/10 disabled:opacity-60"
              >
                <ImagePlus size={16} />
                Adicionar imagem
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
                    style={{
                      left: pontoFoco(posicaoSelecionada).x + '%',
                      top: pontoFoco(posicaoSelecionada).y + '%',
                    }}
                  />
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-cinza-base">
                  <Move size={11} />
                  Clique na prévia para escolher o enquadramento antes de adicionar
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
                            src={imagem.previewLocal ?? resolverImagemSobreNosApi(imagem.imagem_url) ?? ''}
                            alt={`Imagem ${indice + 1} do carrossel`}
                            className="h-full w-full object-cover"
                            style={{ objectPosition: imagem.posicao || 'center center' }}
                          />
                          <div
                            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amarelo bg-preto-v1/60"
                            style={{ left: `${foco.x}%`, top: `${foco.y}%` }}
                          />
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
                            disabled={!podeEditarComoAdmin || salvando || indice === 0}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-40"
                          >
                            <ArrowUp size={12} />
                            Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => mover(imagem, 1)}
                            disabled={
                              !podeEditarComoAdmin ||
                              salvando ||
                              indice === imagensOrdenadas.length - 1
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-40"
                          >
                            <ArrowDown size={12} />
                            Descer
                          </button>
                          <button
                            type="button"
                            onClick={() => setImagemParaExcluir(imagem)}
                            disabled={!podeEditarComoAdmin || salvando}
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
        </form>
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
              A exclusão será aplicada ao salvar as alterações.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400"
              >
                Sim, excluir imagem
              </button>
              <button
                type="button"
                onClick={() => setImagemParaExcluir(null)}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200"
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

async function persistirImagens(imagensAtuais: ImagemEdicao[], idsSalvos: number[]) {
  const idsAtuais = new Set(
    imagensAtuais.filter((imagem) => !imagem.arquivo).map((imagem) => imagem.id),
  )
  const idsParaExcluir = idsSalvos.filter((id) => !idsAtuais.has(id))

  for (const id of idsParaExcluir) {
    await excluirImagemSobreNosApi(id)
  }

  const persistidas: SobreNosImagemApi[] = []
  for (const [indice, imagem] of imagensAtuais.entries()) {
    const persistida = imagem.arquivo
      ? await criarImagemSobreNosApi(imagem.arquivo, imagem.posicao ?? undefined)
      : imagem

    persistidas.push({
      id: persistida.id,
      imagem_url: persistida.imagem_url,
      ordem: indice,
      posicao: imagem.posicao,
    })
  }

  await Promise.all(
    persistidas.map((imagem) =>
      atualizarImagemSobreNosApi(imagem.id, { ordem: imagem.ordem, posicao: imagem.posicao }),
    ),
  )

  return persistidas
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
