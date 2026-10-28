import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Check, LoaderCircle, Minus, Plus, X } from 'lucide-react'
import {
  atualizarClienteApi,
  listarMotivosAjustePontosApi,
  type ClienteApi,
  type MotivoAjustePontosApi,
} from '../../../servicos/clientesApi'

const MAX_OBSERVACAO = 150

type ModalPontosClienteProps = {
  cliente: ClienteApi
  onFechar: () => void
  onSalvo: (cliente: ClienteApi) => void
}

/** Pontos nunca ficam negativos nem fracionados. */
function limitarPontos(valor: number) {
  if (!Number.isFinite(valor)) return 0
  return Math.max(0, Math.round(valor))
}

export default function ModalPontosCliente({ cliente, onFechar, onSalvo }: ModalPontosClienteProps) {
  const pontosAtuais = cliente.pontos_fidelidade
  const [pontos, setPontos] = useState(pontosAtuais)
  const [pontosDraft, setPontosDraft] = useState(String(pontosAtuais))
  const [motivos, setMotivos] = useState<MotivoAjustePontosApi[]>([])
  const [carregandoMotivos, setCarregandoMotivos] = useState(true)
  const [erroMotivos, setErroMotivos] = useState('')
  const [motivoId, setMotivoId] = useState<number | null>(null)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    listarMotivosAjustePontosApi()
      .then((dados) => {
        // Motivos que exigem observacao (ex.: "Outro") ficam por ultimo na lista.
        if (ativo) setMotivos([...dados].sort((a, b) => Number(a.exige_observacao) - Number(b.exige_observacao)))
      })
      .catch((error) => {
        if (ativo) setErroMotivos(error instanceof Error ? error.message : 'Não foi possível carregar as justificativas.')
      })
      .finally(() => {
        if (ativo) setCarregandoMotivos(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const diferenca = pontos - pontosAtuais
  const motivoSelecionado = motivos.find((motivo) => motivo.id === motivoId) ?? null
  const exigeObservacao = motivoSelecionado?.exige_observacao ?? false
  const observacaoLimpa = observacao.trim()
  const podeConfirmar =
    diferenca !== 0 &&
    motivoSelecionado !== null &&
    (!exigeObservacao || observacaoLimpa.length > 0) &&
    !salvando

  function definirPontos(valor: number) {
    setErro('')
    const limitado = limitarPontos(valor)
    setPontos(limitado)
    setPontosDraft(String(limitado))
  }

  function digitarPontos(texto: string) {
    setErro('')
    const apenasDigitos = texto.replace(/\D/g, '')
    setPontosDraft(apenasDigitos)
    if (apenasDigitos !== '') setPontos(limitarPontos(Number(apenasDigitos)))
  }

  function alternarMotivo(id: number) {
    setErro('')
    setMotivoId((atual) => (atual === id ? null : id))
  }

  function fechar() {
    if (salvando) return
    onFechar()
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')

    if (diferenca === 0) {
      setErro('Altere a quantidade de pontos antes de confirmar.')
      return
    }
    if (!motivoSelecionado) {
      setErro('Selecione uma justificativa para a alteração de pontos.')
      return
    }
    if (exigeObservacao && !observacaoLimpa) {
      setErro('Descreva a justificativa da alteração.')
      return
    }

    setSalvando(true)
    try {
      const atualizado = await atualizarClienteApi(cliente.id, {
        ajuste_pontos: {
          operacao: diferenca > 0 ? 'adicionar' : 'remover',
          quantidade: Math.abs(diferenca),
          motivo_id: motivoSelecionado.id,
          observacao: exigeObservacao ? observacaoLimpa : undefined,
        },
      })
      onSalvo(atualizado)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível alterar os pontos.')
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pontos-cliente-titulo"
      onClick={fechar}
    >
      <div
        className="relative my-auto max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 pt-10 shadow-xl sm:max-h-[calc(100dvh-5rem)] sm:p-6 sm:pt-10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar alteração de pontos"
          className="absolute right-3 top-3 text-cinza-base transition-colors hover:text-preto-v1"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <h2 id="modal-pontos-cliente-titulo" className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
          Programa de fidelidade
        </h2>
        <p className="mt-1 font-barlow text-sm text-cinza-base">
          {cliente.nome} · saldo atual: <strong className="text-preto-v1">{pontosAtuais}</strong>{' '}
          {pontosAtuais === 1 ? 'ponto' : 'pontos'}
        </p>

        <form className="mt-5 grid gap-5" onSubmit={confirmar} noValidate>
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">Quantidade de pontos</span>
            <div className="flex items-start justify-center gap-2 sm:gap-3">
              <BotaoAjuste
                rotulo="Adicionar Pontos"
                onClick={() => definirPontos(pontos + 1)}
                disabled={salvando}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus size={20} aria-hidden />
              </BotaoAjuste>

              <input
                type="text"
                inputMode="numeric"
                aria-label="Quantidade de pontos"
                value={pontosDraft}
                onChange={(event) => digitarPontos(event.target.value)}
                onBlur={() => definirPontos(pontos)}
                disabled={salvando}
                className="h-12 w-24 rounded-xl border border-[#d8dee8] bg-white px-3 text-center font-barlow text-2xl font-bold text-preto-v1 outline-none focus:border-amarelo"
              />

              <BotaoAjuste
                rotulo="Remover Pontos"
                onClick={() => definirPontos(pontos - 1)}
                disabled={salvando || pontos === 0}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Minus size={20} aria-hidden />
              </BotaoAjuste>

              <BotaoAjuste
                rotulo="Remover 10"
                onClick={() => definirPontos(pontos - 10)}
                disabled={salvando || pontos === 0}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <span className="font-barlow text-sm font-black">-10</span>
              </BotaoAjuste>
            </div>
            <p className="text-center font-barlow text-sm text-cinza-base" aria-live="polite">
              {diferenca === 0
                ? 'Nenhuma alteração.'
                : diferenca > 0
                  ? <span className="font-semibold text-emerald-700">+{diferenca} {diferenca === 1 ? 'ponto' : 'pontos'}</span>
                  : <span className="font-semibold text-red-600">{diferenca} {diferenca === -1 ? 'ponto' : 'pontos'}</span>}
            </p>
          </div>

          <fieldset className="grid gap-2" disabled={salvando}>
            <legend className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
              Justificativa da alteração
            </legend>

            {carregandoMotivos ? (
              <p className="flex items-center gap-2 font-barlow text-sm text-cinza-base">
                <LoaderCircle size={16} className="animate-spin" aria-hidden /> Carregando justificativas...
              </p>
            ) : erroMotivos ? (
              <p className="font-barlow text-sm font-semibold text-red-600">{erroMotivos}</p>
            ) : motivos.length === 0 ? (
              <p className="font-barlow text-sm text-cinza-base">Nenhuma justificativa cadastrada.</p>
            ) : (
              motivos.map((motivo) => (
                <div key={motivo.id} className="grid gap-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8dee8] px-3 py-2.5 font-barlow text-sm text-preto-v1 transition hover:bg-[#f7f9fc] has-checked:border-amarelo has-checked:bg-amarelo/10">
                    <input
                      type="checkbox"
                      checked={motivoId === motivo.id}
                      onChange={() => alternarMotivo(motivo.id)}
                      className="size-4 accent-preto-v1"
                    />
                    {motivo.descricao}
                  </label>

                  {motivo.exige_observacao && motivoId === motivo.id && (
                    <label className="grid gap-1.5">
                      <span className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-cinza-base">
                        Descreva a justificativa
                        <span className={observacao.length >= MAX_OBSERVACAO ? 'text-red-600' : ''}>
                          {observacao.length}/{MAX_OBSERVACAO}
                        </span>
                      </span>
                      <textarea
                        value={observacao}
                        onChange={(event) => {
                          setErro('')
                          setObservacao(event.target.value.slice(0, MAX_OBSERVACAO))
                        }}
                        maxLength={MAX_OBSERVACAO}
                        autoFocus
                        className="min-h-24 rounded-xl border border-[#d8dee8] bg-white px-3 py-3 font-barlow text-sm outline-none focus:border-amarelo"
                        placeholder="Motivo da alteração de pontos"
                      />
                    </label>
                  )}
                </div>
              ))
            )}
          </fieldset>

          {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!podeConfirmar}
              className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
            >
              {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={fechar}
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

function BotaoAjuste({
  rotulo,
  onClick,
  disabled,
  className,
  children,
}: {
  rotulo: string
  onClick: () => void
  disabled: boolean
  className: string
  children: ReactNode
}) {
  return (
    <div className="flex w-20 flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={rotulo}
        className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {children}
      </button>
      <span className="text-center font-barlow text-[10px] font-bold uppercase leading-tight text-cinza-base" aria-hidden>
        {rotulo}
      </span>
    </div>
  )
}
