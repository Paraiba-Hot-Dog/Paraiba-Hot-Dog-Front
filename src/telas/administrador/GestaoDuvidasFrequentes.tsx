import { useEffect, useState, type FormEvent } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CheckCircle2,
  EyeOff,
  GripVertical,
  ListOrdered,
  LoaderCircle,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import {
  atualizarDuvidaApi,
  atualizarOrdemDuvidaApi,
  criarDuvidaApi,
  excluirDuvidaApi,
  listarDuvidasApi,
  type DuvidaApi,
  type DuvidaFormApi,
} from '../../servicos/duvidasApi'

type FormularioDuvida = {
  pergunta: string
  resposta: string
  ativo: boolean
}

// A edicao tambem controla a posicao, alternativa acessivel ao arrastar.
type FormularioEdicao = FormularioDuvida & {
  posicao: number
}

const formularioVazio: FormularioDuvida = {
  pergunta: '',
  resposta: '',
  ativo: true,
}

export default function GestaoDuvidasFrequentes() {
  const [duvidas, setDuvidas] = useState<DuvidaApi[]>([])
  const [formulario, setFormulario] = useState<FormularioDuvida>(formularioVazio)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoOrdem, setSalvandoOrdem] = useState(false)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)
  const [duvidaParaEditar, setDuvidaParaEditar] = useState<DuvidaApi | null>(null)
  const [duvidaParaExcluir, setDuvidaParaExcluir] = useState<DuvidaApi | null>(null)
  const [erro, setErro] = useState('')
  const [erroModal, setErroModal] = useState('')
  const [notificacao, setNotificacao] = useState<string | null>(null)

  const sensores = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    let ativo = true

    // apenasAtivas = false: o admin precisa enxergar tambem as duvidas despublicadas.
    listarDuvidasApi(false)
      .then((dados) => {
        if (ativo) setDuvidas(dados)
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

  function atualizarCampo(campo: keyof FormularioDuvida, valor: string | boolean) {
    setErro('')
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function criar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')

    const payload: DuvidaFormApi = {
      pergunta: formulario.pergunta.trim(),
      resposta: formulario.resposta.trim(),
      ordem: proximaOrdem(duvidas),
      ativo: formulario.ativo,
    }

    // A validacao real esta no backend; esta aqui so evita o round-trip.
    if (!payload.pergunta || !payload.resposta) {
      setErro('Preencha pergunta e resposta.')
      return
    }

    setSalvando(true)
    try {
      const criada = await criarDuvidaApi(payload)
      setDuvidas((atuais) => [...atuais, criada])
      setFormulario(formularioVazio)
      setNotificacao('Dúvida criada com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function salvarEdicao(dados: FormularioEdicao) {
    if (!duvidaParaEditar) return

    const alvo = duvidaParaEditar
    setErroModal('')

    const pergunta = dados.pergunta.trim()
    const resposta = dados.resposta.trim()
    if (!pergunta || !resposta) {
      setErroModal('Preencha pergunta e resposta.')
      return
    }

    const anterior = duvidas
    setSalvando(true)
    try {
      const atualizada = await atualizarDuvidaApi(alvo.id, {
        pergunta,
        resposta,
        ordem: alvo.ordem,
        ativo: dados.ativo,
      })

      const lista = anterior.map((item) => (item.id === atualizada.id ? atualizada : item))
      const atual = lista.findIndex((item) => item.id === alvo.id)
      // O campo e 1-based na tela; internamente ordem continua sendo o indice.
      const destino = Math.min(Math.max(dados.posicao - 1, 0), lista.length - 1)

      setDuvidaParaEditar(null)

      if (destino === atual) {
        setDuvidas(lista)
        setNotificacao('Dúvida atualizada com sucesso.')
        return
      }

      await aplicarOrdem(
        arrayMove(lista, atual, destino),
        anterior,
        'Dúvida atualizada com sucesso.',
      )
    } catch (error) {
      setErroModal(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!duvidaParaExcluir) return

    const duvida = duvidaParaExcluir
    setExcluindoId(duvida.id)
    setErro('')
    try {
      await excluirDuvidaApi(duvida.id)
      setDuvidas((atuais) => atuais.filter((item) => item.id !== duvida.id))
      setNotificacao('Dúvida removida com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setExcluindoId(null)
      setDuvidaParaExcluir(null)
    }
  }

  /**
   * Renumera a lista pela posicao (ordem = indice) e persiste so quem mudou.
   * Compartilhado pelo arrastar e pelo campo de posicao do modal.
   */
  async function aplicarOrdem(
    reordenadas: DuvidaApi[],
    anterior: DuvidaApi[],
    mensagemSucesso: string,
  ) {
    const renumeradas = reordenadas.map((item, indice) => ({ ...item, ordem: indice }))
    const alteradas = renumeradas.filter((item) => {
      const original = anterior.find((candidata) => candidata.id === item.id)
      return original?.ordem !== item.ordem
    })

    setDuvidas(renumeradas)
    if (alteradas.length === 0) {
      setNotificacao(mensagemSucesso)
      return
    }

    setSalvandoOrdem(true)
    setErro('')
    try {
      await Promise.all(alteradas.map((item) => atualizarOrdemDuvidaApi(item.id, item.ordem)))
      setNotificacao(mensagemSucesso)
    } catch (error) {
      setErro(`${mensagemErro(error)} A lista foi recarregada do servidor.`)
      // Um PATCH pode ter falhado no meio; recarrega para nao deixar a tela mentindo.
      try {
        setDuvidas(await listarDuvidasApi(false))
      } catch {
        setDuvidas(anterior)
      }
    } finally {
      setSalvandoOrdem(false)
    }
  }

  async function aoSoltar(evento: DragEndEvent) {
    const { active, over } = evento
    if (!over || active.id === over.id) return

    const anterior = duvidas
    const de = anterior.findIndex((item) => item.id === active.id)
    const para = anterior.findIndex((item) => item.id === over.id)
    if (de < 0 || para < 0) return

    await aplicarOrdem(arrayMove(anterior, de, para), anterior, 'Ordem atualizada.')
  }

  return (
    <div className={`min-h-screen bg-[#f4f6fb] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-barlow-condensed text-sm font-black uppercase tracking-[0.24em] text-cinza-base">
              Admin
            </p>
            <h1 className="font-barlow-condensed text-3xl font-black uppercase text-preto-v1 sm:text-5xl">
              Dúvidas frequentes
            </h1>
          </div>

          {notificacao && (
            <Notificacao mensagem={notificacao} onFechar={() => setNotificacao(null)} />
          )}
        </div>

        <div className="mt-8 grid gap-6">
          <section className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
            <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
              Nova dúvida
            </h2>

            <form className="mt-5 grid gap-4" onSubmit={criar}>
              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Pergunta
                </span>
                <input
                  value={formulario.pergunta}
                  onChange={(event) => atualizarCampo('pergunta', event.target.value)}
                  maxLength={255}
                  className="h-11 w-full rounded-xl border border-[#d8dee8] bg-white px-3 outline-none"
                  placeholder="Ex.: Vocês fazem delivery?"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                  Resposta
                </span>
                <textarea
                  value={formulario.resposta}
                  onChange={(event) => atualizarCampo('resposta', event.target.value)}
                  className="min-h-28 rounded-xl border border-[#d8dee8] bg-white px-3 py-3 outline-none"
                  placeholder="Texto que aparece quando o cliente abre a pergunta"
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formulario.ativo}
                  onChange={(event) => atualizarCampo('ativo', event.target.checked)}
                  className="size-4 accent-amarelo"
                />
                <span className="font-barlow text-sm text-preto-v1">Exibir no site público</span>
              </label>

              {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

              <div>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
                >
                  {salvando ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {salvando ? 'Salvando...' : 'Adicionar dúvida'}
                </button>
              </div>

              <p className="text-[11px] text-cinza-base">
                A dúvida entra no fim da lista. Arraste pelo punho para reposicionar.
              </p>
            </form>
          </section>

          <section className="rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
                Dúvidas cadastradas
              </h2>
              <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[10px] font-black uppercase text-cinza-base">
                {salvandoOrdem ? 'Salvando ordem...' : `${duvidas.length} dúvidas`}
              </span>
            </div>

            {carregando ? (
              <p className="mt-6 text-sm text-cinza-base">Carregando dúvidas...</p>
            ) : duvidas.length === 0 ? (
              <p className="mt-6 text-sm text-cinza-base">Nenhuma dúvida cadastrada.</p>
            ) : (
              <DndContext
                sensors={sensores}
                collisionDetection={closestCenter}
                onDragEnd={aoSoltar}
              >
                <SortableContext
                  items={duvidas.map((duvida) => duvida.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="mt-5 space-y-3">
                    {duvidas.map((duvida, indice) => (
                      <ItemDuvida
                        key={duvida.id}
                        duvida={duvida}
                        posicao={indice + 1}
                        excluindo={excluindoId === duvida.id}
                        onEditar={() => {
                          setErroModal('')
                          setDuvidaParaEditar(duvida)
                        }}
                        onExcluir={() => setDuvidaParaExcluir(duvida)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </div>
      </main>

      {duvidaParaEditar && (
        <ModalEdicaoDuvida
          key={duvidaParaEditar.id}
          duvida={duvidaParaEditar}
          posicao={duvidas.findIndex((item) => item.id === duvidaParaEditar.id) + 1}
          total={duvidas.length}
          salvando={salvando}
          erro={erroModal}
          onSalvar={salvarEdicao}
          onCancelar={() => setDuvidaParaEditar(null)}
        />
      )}

      {duvidaParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-duvida-titulo"
          onClick={() => setDuvidaParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="confirmar-exclusao-duvida-titulo"
              className="font-barlow text-lg font-bold text-preto-v1"
            >
              Tem certeza que deseja excluir esta dúvida?
            </p>
            <p className="mt-2 font-barlow text-sm text-preto-v1">
              A pergunta &quot;{duvidaParaExcluir.pergunta}&quot; será removida permanentemente.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === duvidaParaExcluir.id}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {excluindoId === duvidaParaExcluir.id ? 'Excluindo...' : 'Sim, excluir dúvida'}
              </button>
              <button
                type="button"
                onClick={() => setDuvidaParaExcluir(null)}
                disabled={excluindoId === duvidaParaExcluir.id}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter dúvida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ItemDuvidaProps = {
  duvida: DuvidaApi
  posicao: number
  excluindo: boolean
  onEditar: () => void
  onExcluir: () => void
}

function ItemDuvida({ duvida, posicao, excluindo, onEditar, onExcluir }: ItemDuvidaProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: duvida.id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-3 rounded-2xl border bg-white p-3 ${
        isDragging ? 'z-10 border-amarelo shadow-lg' : 'border-[#d8dee8]'
      }`}
    >
      <button
        type="button"
        // touch-none impede o navegador de rolar a pagina enquanto se arrasta no celular.
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-cinza-base hover:bg-[#f2f5fa] active:cursor-grabbing"
        aria-label={`Reordenar: ${duvida.pergunta}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#f2f5fa] px-2 py-1 text-[9px] font-black uppercase text-cinza-base">
            {posicao}ª
          </span>
          {!duvida.ativo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f5fa] px-2 py-1 text-[9px] font-black uppercase text-cinza-base">
              <EyeOff size={10} />
              Oculta
            </span>
          )}
        </div>
        <h3 className="mt-1 font-barlow-condensed text-lg font-black uppercase text-preto-v1">
          {duvida.pergunta}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-cinza-base">{duvida.resposta}</p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-3 py-2 text-[10px] font-black uppercase text-preto-v1"
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            type="button"
            onClick={onExcluir}
            disabled={excluindo}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-[10px] font-black uppercase text-red-600 disabled:opacity-60"
          >
            <Trash2 size={12} />
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </li>
  )
}

type ModalEdicaoDuvidaProps = {
  duvida: DuvidaApi
  posicao: number
  total: number
  salvando: boolean
  erro: string
  onSalvar: (dados: FormularioEdicao) => void
  onCancelar: () => void
}

function ModalEdicaoDuvida({
  duvida,
  posicao,
  total,
  salvando,
  erro,
  onSalvar,
  onCancelar,
}: ModalEdicaoDuvidaProps) {
  const [dados, setDados] = useState<FormularioEdicao>({
    pergunta: duvida.pergunta,
    resposta: duvida.resposta,
    ativo: duvida.ativo,
    posicao,
  })

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onCancelar()
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onCancelar])

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onSalvar(dados)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editar-duvida-titulo"
      onClick={onCancelar}
    >
      <div
        className="relative w-full max-w-lg rounded-lg bg-branco p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancelar}
          className="absolute top-3 right-4 text-cinza-base transition-colors hover:text-preto-v1"
          aria-label="Fechar edição"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <h2
          id="editar-duvida-titulo"
          className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1"
        >
          Editar dúvida
        </h2>

        <form className="mt-5 grid gap-4" onSubmit={enviar}>
          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
              Pergunta
            </span>
            <input
              autoFocus
              value={dados.pergunta}
              onChange={(event) =>
                setDados((atual) => ({ ...atual, pergunta: event.target.value }))
              }
              maxLength={255}
              className="h-11 w-full rounded-xl border border-[#d8dee8] bg-white px-3 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
              Resposta
            </span>
            <textarea
              value={dados.resposta}
              onChange={(event) =>
                setDados((atual) => ({ ...atual, resposta: event.target.value }))
              }
              className="min-h-32 rounded-xl border border-[#d8dee8] bg-white px-3 py-3 outline-none"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
              Posição na lista
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
              <ListOrdered size={16} className="text-cinza-base" />
              <input
                type="number"
                min={1}
                max={total}
                value={dados.posicao}
                onChange={(event) =>
                  setDados((atual) => ({
                    ...atual,
                    posicao: Number(event.target.value) || atual.posicao,
                  }))
                }
                className="h-11 w-full bg-transparent outline-none"
                aria-describedby="ajuda-posicao"
              />
            </div>
            <span id="ajuda-posicao" className="text-[11px] text-cinza-base">
              De 1 a {total}. Alternativa ao arrastar — as demais dúvidas se reacomodam.
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dados.ativo}
              onChange={(event) => setDados((atual) => ({ ...atual, ativo: event.target.checked }))}
              className="size-4 accent-amarelo"
            />
            <span className="font-barlow text-sm text-preto-v1">Exibir no site público</span>
          </label>

          {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
            >
              {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button
              type="button"
              onClick={onCancelar}
              disabled={salvando}
              className="rounded-xl border border-[#d8dee8] px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-cinza-base disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Notificacao({ mensagem, onFechar }: { mensagem: string; onFechar: () => void }) {
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

function proximaOrdem(duvidas: DuvidaApi[]) {
  return duvidas.reduce((maior, duvida) => Math.max(maior, duvida.ordem), -1) + 1
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
