import { useEffect, useState, type FormEvent } from 'react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import { solicitarRecuperacaoSenha } from '../../servicos/authApi'

const CHAVE_PRAZOS = 'recuperacao-senha-prazos'

function formatarTempo(total: number) {
  const minutos = Math.floor(total / 60)
  const segundos = total % 60
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
}

function lerPrazos() {
  try {
    const bruto = sessionStorage.getItem(CHAVE_PRAZOS)
    if (!bruto) return {}
    const dados = JSON.parse(bruto) as Record<string, number>
    return dados && typeof dados === 'object' ? dados : {}
  } catch {
    return {}
  }
}

function gravarPrazo(email: string, segundos: number) {
  const prazos = lerPrazos()
  prazos[email.trim().toLowerCase()] = Date.now() + segundos * 1000
  sessionStorage.setItem(CHAVE_PRAZOS, JSON.stringify(prazos))
}

function segundosDoEmail(email: string) {
  const expira = lerPrazos()[email.trim().toLowerCase()]
  if (!expira) return 0
  return Math.max(Math.ceil((expira - Date.now()) / 1000), 0)
}

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [segundos, setSegundos] = useState(0)
  const [jaEnviou, setJaEnviou] = useState(false)
  const [contagemDoLimite, setContagemDoLimite] = useState(false)

  useEffect(() => {
    const chave = email.trim().toLowerCase()
    const tinhaPrazo = Boolean(chave && lerPrazos()[chave] != null)
    setSegundos(segundosDoEmail(email))
    setJaEnviou(tinhaPrazo)
    setContagemDoLimite(false)
  }, [email])

  useEffect(() => {
    if (segundos <= 0) return undefined

    const timer = window.setInterval(() => {
      setSegundos((atual) => (atual > 0 ? atual - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [segundos > 0])

  function iniciarContagem(total: number, limite: boolean) {
    gravarPrazo(email, total)
    setSegundos(total)
    setJaEnviou(true)
    setContagemDoLimite(limite)
  }

  async function enviarInstrucoes() {
    setLoading(true)
    setMensagem('')

    try {
      const response = await solicitarRecuperacaoSenha(email)
      if (response.email_status !== 'sent' && response.email_status !== 'skipped') {
        setMensagem(response.message)
      }

      const validade = (response.link_valido_minutos ?? 30) * 60
      if (response.email_status === 'limite') {
        iniciarContagem(response.aguardar_segundos ?? 0, true)
      } else if (response.email_status === 'error') {
        if ((response.aguardar_segundos ?? 0) > 0) {
          iniciarContagem(response.aguardar_segundos ?? 0, true)
        }
      } else if (response.email_status === 'cooldown') {
        iniciarContagem(response.aguardar_segundos ?? validade, false)
      } else {
        iniciarContagem(validade, false)
      }
    } catch (error) {
      console.error('Password recovery error:', error)
      setMensagem('Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  function handleRecuperarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (segundos > 0) return
    void enviarInstrucoes()
  }

  let rotulo = 'ENVIAR INSTRUÇÕES'
  if (loading) rotulo = 'ENVIANDO...'
  else if (segundos > 0) {
    rotulo = contagemDoLimite
      ? `REENVIAR EM ${formatarTempo(segundos)}`
      : `LINK EXPIRA EM ${formatarTempo(segundos)}`
  } else if (jaEnviou) rotulo = 'REENVIAR'

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="flex h-16 w-full items-center overflow-visible bg-preto-v1 px-6 py-2">
        <a href="/" aria-label="Paraiba Hot Dog - inicio">
          <img
            src={logoBranca}
            alt="Paraiba Hot Dog"
            className="relative z-10 h-24 w-auto object-contain"
          />
        </a>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white px-8 py-10 shadow-lg">
          <h1 className="mb-2 font-barlow-condensed text-4xl font-black uppercase tracking-wide text-preto-v1">
            Recuperar senha
          </h1>
          <p className="mb-8 font-barlow text-sm leading-relaxed text-cinza-base">
            Informe o e-mail cadastrado para receber as instruções de acesso.
          </p>

          <form onSubmit={handleRecuperarSenha} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-recuperacao" className="font-barlow text-sm font-semibold text-preto-v1">
                E-mail <span className="text-[#9b111e]" aria-hidden="true">*</span>
              </label>
              <input
                id="email-recuperacao"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setMensagem('')
                }}
                required
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || segundos > 0}
              className="mt-1 w-full rounded-xl bg-amarelo px-4 py-3 font-barlow-condensed text-base font-bold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rotulo}
            </button>

            <p className="rounded-xl bg-[#f4f7fb] px-4 py-3 text-justify [text-align-last:justify] font-barlow text-sm leading-relaxed text-cinza-base">
              O envio de e-mails de recuperação é limitado a 2 solicitações por hora. Em situações urgentes, entre em contato com o administrador.
            </p>
          </form>

          {mensagem && (
            <p className="mt-5 rounded-xl bg-[#f4f7fb] px-4 py-3 font-barlow text-sm font-semibold leading-relaxed text-preto-v1" role="status">
              {mensagem}
            </p>
          )}

          <a
            href="/login"
            className="mt-7 block text-right font-barlow text-sm font-semibold text-cinza-base transition-colors hover:text-amarelo"
          >
            Voltar para o login
          </a>
        </div>
      </main>
    </div>
  )
}
