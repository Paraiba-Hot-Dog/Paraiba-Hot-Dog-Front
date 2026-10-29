import { useEffect, useState, type FormEvent } from 'react'
import { CheckCircle2, EyeOff, LoaderCircle, Pencil, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react'
import BarraDeNavegacaoAdmin, {
  CLASSE_OFFSET_BARRA_ADMIN,
} from '../../componentes/administrador/BarraDeNavegacaoAdmin'
import {
  atualizarMotivoAjustePontosApi,
  criarMotivoAjustePontosApi,
  excluirMotivoAjustePontosApi,
  listarMotivosAjustePontosApi,
  type MotivoAjustePontosApi,
} from '../../servicos/clientesApi'

const MAX_DESCRICAO = 120

// Colunas fixas para tag e botoes ficarem alinhados entre as linhas.
const COLUNAS_LINHA = 'grid grid-cols-[minmax(0,1fr)_9rem_7rem_7rem] items-center gap-4'

type FormularioJustificativa = {
  descricao: string
  exige_observacao: boolean
  ativo: boolean
}

// null em justificativa indica criacao; preenchida, edicao.
type EstadoModal = { justificativa: MotivoAjustePontosApi | null } | null

/** Ativas primeiro; dentro de cada grupo mantem a ordem alfabetica vinda do back. */
function ordenar(motivos: MotivoAjustePontosApi[]) {
  return [...motivos].sort((a, b) => Number(b.ativo) - Number(a.ativo))
}

export default function AuditoriaJustificativas() {
  const [justificativas, setJustificativas] = useState<MotivoAjustePontosApi[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [tentativa, setTentativa] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [alterandoId, setAlterandoId] = useState<number | null>(null)
  const [modal, setModal] = useState<EstadoModal>(null)
  const [justificativaParaExcluir, setJustificativaParaExcluir] = useState<MotivoAjustePontosApi | null>(null)
  const [erro, setErro] = useState('')
  const [erroModal, setErroModal] = useState('')
  const [notificacao, setNotificacao] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    // apenasAtivos = false: a auditoria precisa enxergar tambem as desativadas.
    listarMotivosAjustePontosApi(false)
      .then((dados) => {
        if (ativo) setJustificativas(ordenar(dados))
      })
      .catch((error) => {
        if (ativo) setErroCarregamento(mensagemErro(error))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [tentativa])

  function tentarNovamente() {
    setCarregando(true)
    setErroCarregamento('')
    setTentativa((atual) => atual + 1)
  }

  function abrirModal(justificativa: MotivoAjustePontosApi | null) {
    setErroModal('')
    setModal({ justificativa })
  }

  function substituir(atualizada: MotivoAjustePontosApi) {
    setJustificativas((atuais) => ordenar(atuais.map((item) => (item.id === atualizada.id ? atualizada : item))))
  }

  async function salvar(dados: FormularioJustificativa) {
    if (!modal) return

    const alvo = modal.justificativa
    const descricao = dados.descricao.trim()
    setErroModal('')
    if (!descricao) {
      setErroModal('Informe a descrição da justificativa.')
      return
    }

    setSalvando(true)
    try {
      if (alvo) {
        substituir(await atualizarMotivoAjustePontosApi(alvo.id, {
          descricao,
          exige_observacao: dados.exige_observacao,
          ativo: dados.ativo,
        }))
        setNotificacao('Justificativa atualizada com sucesso.')
      } else {
        const criada = await criarMotivoAjustePontosApi({ descricao, exige_observacao: dados.exige_observacao })
        setJustificativas((atuais) => ordenar(
          [...atuais, criada].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR')),
        ))
        setNotificacao('Justificativa criada com sucesso.')
      }
      setModal(null)
    } catch (error) {
      setErroModal(mensagemErro(error))
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!justificativaParaExcluir) return

    const alvo = justificativaParaExcluir
    setAlterandoId(alvo.id)
    setErro('')
    try {
      await excluirMotivoAjustePontosApi(alvo.id)
      substituir({ ...alvo, ativo: false })
      setNotificacao('Justificativa desativada com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setAlterandoId(null)
      setJustificativaParaExcluir(null)
    }
  }

  async function reativar(alvo: MotivoAjustePontosApi) {
    setAlterandoId(alvo.id)
    setErro('')
    try {
      substituir(await atualizarMotivoAjustePontosApi(alvo.id, { ativo: true }))
      setNotificacao('Justificativa reativada com sucesso.')
    } catch (error) {
      setErro(mensagemErro(error))
    } finally {
      setAlterandoId(null)
    }
  }

  const totalAtivas = justificativas.filter((item) => item.ativo).length

  return (
    <div className={`min-h-screen bg-[#f4f6fb] ${CLASSE_OFFSET_BARRA_ADMIN}`}>
      <BarraDeNavegacaoAdmin />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-barlow-condensed text-sm font-black uppercase tracking-[0.24em] text-cinza-base">
              Admin
            </p>
            <h1 className="font-barlow-condensed text-3xl font-black uppercase text-preto-v1 sm:text-5xl">
              Edição de justificativas
            </h1>
            <p className="mt-1 font-barlow text-sm text-cinza-base">
              Justificativas usadas nas alterações dos pontos de fidelidade dos clientes.
            </p>
          </div>

          {notificacao && (
            <Notificacao mensagem={notificacao} onFechar={() => setNotificacao(null)} />
          )}
        </div>

        <section className="mt-8 rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
                Justificativas cadastradas
              </h2>
              <span className="rounded-full bg-[#f2f5fa] px-3 py-1 text-[10px] font-black uppercase text-cinza-base">
                {totalAtivas} {totalAtivas === 1 ? 'ativa' : 'ativas'} de {justificativas.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => abrirModal(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white transition hover:bg-cinza-botao"
            >
              <Plus size={16} aria-hidden />
              Nova justificativa
            </button>
          </div>

          {erro && <p className="mt-4 text-sm font-semibold text-red-600">{erro}</p>}

          {carregando ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-cinza-base">
              <LoaderCircle size={16} className="animate-spin" aria-hidden /> Carregando justificativas...
            </p>
          ) : erroCarregamento ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              <p className="text-sm text-cinza-base">{erroCarregamento}</p>
              <button
                type="button"
                onClick={tentarNovamente}
                className="rounded-lg bg-preto-v1 px-4 py-2 font-barlow-condensed font-bold uppercase text-white transition hover:bg-cinza-botao"
              >
                Tentar novamente
              </button>
            </div>
          ) : justificativas.length === 0 ? (
            <p className="mt-6 text-sm text-cinza-base">Nenhuma justificativa cadastrada.</p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-[#d8dee8]">
              <div className="min-w-160">
                <ul>
                  {justificativas.map((justificativa) => (
                    <ItemJustificativa
                      key={justificativa.id}
                      justificativa={justificativa}
                      alterando={alterandoId === justificativa.id}
                      onEditar={() => abrirModal(justificativa)}
                      onExcluir={() => setJustificativaParaExcluir(justificativa)}
                      onReativar={() => reativar(justificativa)}
                    />
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>

      {modal && (
        <ModalJustificativa
          key={modal.justificativa?.id ?? 'nova'}
          justificativa={modal.justificativa}
          salvando={salvando}
          erro={erroModal}
          onSalvar={salvar}
          onCancelar={() => setModal(null)}
        />
      )}

      {justificativaParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-justificativa-titulo"
          onClick={() => setJustificativaParaExcluir(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-branco px-8 py-10 text-center shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="confirmar-exclusao-justificativa-titulo"
              className="font-barlow text-lg font-bold text-preto-v1"
            >
              Tem certeza que deseja excluir esta justificativa?
            </p>
            <p
              title={justificativaParaExcluir.descricao}
              // Descricoes longas (inclusive sem espacos) quebram e sao limitadas a 3 linhas.
              className="mt-3 line-clamp-3 rounded-md bg-[#f2f5fa] px-3 py-2 font-barlow text-sm font-semibold text-preto-v1 [overflow-wrap:anywhere]"
            >
              {justificativaParaExcluir.descricao}
            </p>
            <p className="mt-3 font-barlow text-sm text-preto-v1">
              Ela deixará de aparecer nas novas alterações de pontos. O histórico que já a utilizou não será alterado.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={alterandoId === justificativaParaExcluir.id}
                className="w-full rounded-md bg-red-600 py-2 font-barlow text-base font-semibold text-branco transition-colors hover:bg-red-400 disabled:opacity-60"
              >
                {alterandoId === justificativaParaExcluir.id ? 'Excluindo...' : 'Sim, excluir justificativa'}
              </button>
              <button
                type="button"
                onClick={() => setJustificativaParaExcluir(null)}
                disabled={alterandoId === justificativaParaExcluir.id}
                className="w-full rounded-md border border-gray-400 bg-gray-100 py-2 font-barlow text-base font-semibold text-preto-v1 transition-colors hover:bg-gray-200 disabled:opacity-60"
              >
                Não, manter justificativa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ItemJustificativaProps = {
  justificativa: MotivoAjustePontosApi
  alterando: boolean
  onEditar: () => void
  onExcluir: () => void
  onReativar: () => void
}

function ItemJustificativa({ justificativa, alterando, onEditar, onExcluir, onReativar }: ItemJustificativaProps) {
  return (
    <li
      className={`${COLUNAS_LINHA} border-b border-[#eef1f5] px-4 py-3 last:border-0 ${
        justificativa.ativo ? 'bg-white' : 'bg-[#f7f9fc]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <p
          title={justificativa.descricao}
          className={`truncate font-barlow text-base font-semibold ${
            justificativa.ativo ? 'text-preto-v1' : 'text-cinza-base'
          }`}
        >
          {justificativa.descricao}
        </p>
        {!justificativa.ativo && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eef1f5] px-2 py-0.5 text-[9px] font-black uppercase text-cinza-base">
            <EyeOff size={10} />
            Desativada
          </span>
        )}
      </div>

      <div className="text-center">
        {justificativa.exige_observacao && (
          <span className="whitespace-nowrap rounded-full bg-amarelo/20 px-2 py-0.5 text-[10px] font-black uppercase text-preto-v1">
            Exige observação
          </span>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onEditar}
          disabled={alterando}
          aria-label={`Editar ${justificativa.descricao}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[#d8dee8] px-2.5 py-1.5 text-[10px] font-black uppercase text-preto-v1 disabled:opacity-60"
        >
          <Pencil size={12} />
          Editar
        </button>
      </div>

      <div className="text-center">
        {justificativa.ativo ? (
          <button
            type="button"
            onClick={onExcluir}
            disabled={alterando}
            aria-label={`Excluir ${justificativa.descricao}`}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-black uppercase text-red-600 disabled:opacity-60"
          >
            <Trash2 size={12} />
            {alterando ? 'Excluindo...' : 'Excluir'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onReativar}
            disabled={alterando}
            aria-label={`Reativar ${justificativa.descricao}`}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[10px] font-black uppercase text-emerald-700 disabled:opacity-60"
          >
            <RotateCcw size={12} />
            {alterando ? 'Reativando...' : 'Reativar'}
          </button>
        )}
      </div>
    </li>
  )
}

type ModalJustificativaProps = {
  justificativa: MotivoAjustePontosApi | null
  salvando: boolean
  erro: string
  onSalvar: (dados: FormularioJustificativa) => void
  onCancelar: () => void
}

function ModalJustificativa({
  justificativa,
  salvando,
  erro,
  onSalvar,
  onCancelar,
}: ModalJustificativaProps) {
  const edicao = justificativa !== null
  const [dados, setDados] = useState<FormularioJustificativa>({
    descricao: justificativa?.descricao ?? '',
    exige_observacao: justificativa?.exige_observacao ?? false,
    ativo: justificativa?.ativo ?? true,
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
      aria-labelledby="modal-justificativa-titulo"
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
          aria-label={edicao ? 'Fechar edição' : 'Fechar nova justificativa'}
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <h2
          id="modal-justificativa-titulo"
          className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1"
        >
          {edicao ? 'Editar justificativa' : 'Nova justificativa'}
        </h2>

        <form className="mt-5 grid gap-4" onSubmit={enviar}>
          <CampoDescricao
            valor={dados.descricao}
            autoFocus
            onChange={(descricao) => setDados((atual) => ({ ...atual, descricao }))}
          />

          <CampoExigeObservacao
            marcado={dados.exige_observacao}
            onChange={(exige_observacao) => setDados((atual) => ({ ...atual, exige_observacao }))}
          />

          {/* Toda justificativa nasce ativa; o status so e editavel depois de criada. */}
          {edicao && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dados.ativo}
                onChange={(event) => setDados((atual) => ({ ...atual, ativo: event.target.checked }))}
                className="size-4 accent-amarelo"
              />
              <span className="font-barlow text-sm text-preto-v1">Disponível para novas alterações de pontos</span>
            </label>
          )}

          {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

          <div className="mt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
            >
              {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Salvando...' : edicao ? 'Salvar alterações' : 'Adicionar justificativa'}
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

function CampoDescricao({
  valor,
  autoFocus,
  onChange,
}: {
  valor: string
  autoFocus?: boolean
  onChange: (valor: string) => void
}) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
        Descrição
        <span className={valor.length >= MAX_DESCRICAO ? 'text-red-600' : ''}>
          {valor.length}/{MAX_DESCRICAO}
        </span>
      </span>
      <input
        autoFocus={autoFocus}
        value={valor}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_DESCRICAO))}
        maxLength={MAX_DESCRICAO}
        className="h-11 w-full rounded-xl border border-[#d8dee8] bg-white px-3 outline-none focus:border-amarelo"
        placeholder="Ex.: Cliente realizou um novo pedido"
      />
    </label>
  )
}

function CampoExigeObservacao({ marcado, onChange }: { marcado: boolean; onChange: (valor: boolean) => void }) {
  return (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-amarelo"
      />
      <span className="font-barlow text-sm text-preto-v1">
        Exigir observação
        <span className="block text-xs text-cinza-base">
          Ao usar esta justificativa, o responsável precisa descrever o motivo (ex.: &quot;Outro&quot;).
        </span>
      </span>
    </label>
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

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
