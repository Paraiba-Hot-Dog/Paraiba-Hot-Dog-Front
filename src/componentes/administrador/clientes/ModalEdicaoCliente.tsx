import { useState, type FormEvent, type ReactNode } from 'react'
import { LoaderCircle, Mail, Phone, Save, User, X } from 'lucide-react'
import { atualizarClienteApi, formatarTelefone, type ClienteApi } from '../../../servicos/clientesApi'

const MAX_NOME = 120
const MAX_EMAIL = 120
const MAX_DIGITOS_TELEFONE = 11
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ModalEdicaoClienteProps = {
  cliente: ClienteApi
  onFechar: () => void
  onSalvo: (cliente: ClienteApi) => void
}

export default function ModalEdicaoCliente({ cliente, onFechar, onSalvo }: ModalEdicaoClienteProps) {
  const [nome, setNome] = useState(cliente.nome)
  const [email, setEmail] = useState(cliente.email ?? '')
  const [telefone, setTelefone] = useState(formatarTelefone(cliente.telefone))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const nomeLimpo = nome.trim()
  const emailLimpo = email.trim()
  const digitosTelefone = telefone.replace(/\D/g, '')
  const formularioValido =
    nomeLimpo.length > 0 &&
    digitosTelefone.length >= 10 &&
    (emailLimpo === '' || REGEX_EMAIL.test(emailLimpo))
  const houveAlteracao =
    nomeLimpo !== cliente.nome ||
    emailLimpo !== (cliente.email ?? '') ||
    digitosTelefone !== cliente.telefone.replace(/\D/g, '')

  function fechar() {
    if (salvando) return
    onFechar()
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')

    if (!nomeLimpo) {
      setErro('Informe o nome do cliente.')
      return
    }
    if (digitosTelefone.length < 10) {
      setErro('Informe um telefone válido com DDD.')
      return
    }
    if (emailLimpo && !REGEX_EMAIL.test(emailLimpo)) {
      setErro('Informe um e-mail válido.')
      return
    }

    setSalvando(true)
    try {
      const atualizado = await atualizarClienteApi(cliente.id, {
        nome: nomeLimpo,
        telefone: digitosTelefone,
        email: emailLimpo || null,
      })
      onSalvo(atualizado)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível atualizar o cliente.')
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 sm:items-center sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-edicao-cliente-titulo"
      onClick={fechar}
    >
      <div
        className="relative my-auto max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 pt-10 shadow-xl sm:max-h-[calc(100dvh-5rem)] sm:p-6 sm:pt-10"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar edição de cliente"
          className="absolute right-3 top-3 text-cinza-base transition-colors hover:text-preto-v1"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <h2 id="modal-edicao-cliente-titulo" className="font-barlow-condensed text-2xl font-black uppercase text-preto-v1">
          Editar cliente
        </h2>

        <form className="mt-5 grid gap-4" onSubmit={salvar} noValidate>
          <CampoTexto rotulo="Nome" icone={<User size={16} className="text-cinza-base" />}>
            <input
              value={nome}
              onChange={(event) => {
                setErro('')
                setNome(event.target.value.slice(0, MAX_NOME))
              }}
              maxLength={MAX_NOME}
              className="h-11 w-full bg-transparent outline-none"
              placeholder="Nome do cliente"
            />
          </CampoTexto>

          <CampoTexto rotulo="E-mail" icone={<Mail size={16} className="text-cinza-base" />}>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setErro('')
                setEmail(event.target.value.slice(0, MAX_EMAIL))
              }}
              maxLength={MAX_EMAIL}
              className="h-11 w-full bg-transparent outline-none"
              placeholder="email@exemplo.com"
            />
          </CampoTexto>

          <CampoTexto rotulo="Telefone" icone={<Phone size={16} className="text-cinza-base" />}>
            <input
              type="tel"
              value={telefone}
              onChange={(event) => {
                setErro('')
                setTelefone(formatarTelefone(event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITOS_TELEFONE)))
              }}
              className="h-11 w-full bg-transparent outline-none"
              placeholder="(61) 99999-9999"
            />
          </CampoTexto>

          {erro && <p className="text-sm font-semibold text-red-600">{erro}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={salvando || !formularioValido || !houveAlteracao}
              className="inline-flex items-center gap-2 rounded-xl bg-preto-v1 px-5 py-3 font-barlow-condensed text-sm font-black uppercase text-white disabled:opacity-60"
            >
              {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              {salvando ? 'Salvando...' : 'Salvar edição'}
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

function CampoTexto({ rotulo, icone, children }: { rotulo: string; icone: ReactNode; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-cinza-base">{rotulo}</span>
      <div className="flex items-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-3">
        {icone}
        {children}
      </div>
    </label>
  )
}
