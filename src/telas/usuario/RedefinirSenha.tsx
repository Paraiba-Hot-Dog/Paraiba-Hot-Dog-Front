import { useMemo, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import { redefinirSenha } from '../../servicos/authApi'

function impedirCopiaCola(event: ClipboardEvent<HTMLInputElement> | DragEvent<HTMLInputElement>) {
  event.preventDefault()
}

function impedirAtalhoCopiaCola(event: KeyboardEvent<HTMLInputElement>) {
  const tecla = event.key.toLowerCase()
  if ((event.ctrlKey || event.metaKey) && (tecla === 'c' || tecla === 'v' || tecla === 'x')) {
    event.preventDefault()
  }
  if (event.shiftKey && event.key === 'Insert') {
    event.preventDefault()
  }
}

function mensagemDoLink(erro: string) {
  const texto = erro.toLowerCase()
  if (texto.includes('expired') || texto.includes('invalid')) {
    return 'Este link expirou ou já foi usado. Peça um novo e-mail em Esqueci a senha, abra só a mensagem mais recente e clique uma vez.'
  }
  return erro
}

function credencialDoLink() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = hash.get('access_token') ?? ''
  const erro = mensagemDoLink(hash.get('error_description') ?? '')

  if (accessToken || erro) {
    window.history.replaceState({}, '', window.location.pathname)
  }

  return {
    token: search.get('token') ?? '',
    accessToken,
    erro,
  }
}

export default function RedefinirSenha() {
  const credencial = useMemo(() => credencialDoLink(), [])
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState(credencial.erro)
  const [sucesso, setSucesso] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false)

  async function handleRedefinirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagem('')
    setSucesso(false)

    if (senha.length === 0 && confirmacao.length === 0) {
      setMensagem('Nenhuma senha foi incluída.')
      return
    }

    const senhaCurta = senha.length < 8
    const confirmacaoCurta = confirmacao.length > 0 && confirmacao.length < 8
    if (senhaCurta || confirmacaoCurta) {
      setMensagem('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (confirmacao.length === 0) {
      setMensagem('Digite a senha novamente no campo de confirmação.')
      return
    }

    if (senha !== confirmacao) {
      setMensagem('As senhas informadas não conferem.')
      return
    }

    if (!credencial.token && !credencial.accessToken) {
      setMensagem('Link de recuperação inválido ou incompleto.')
      return
    }

    try {
      setLoading(true)
      await redefinirSenha(senha, credencial)
      setSucesso(true)
      setMensagem('Senha redefinida com sucesso. Você já pode acessar sua conta.')
      setSenha('')
      setConfirmacao('')
    } catch (error) {
      console.error('Password reset error:', error)
      setMensagem('Não foi possível redefinir a senha. O link pode estar expirado ou já ter sido usado.')
    } finally {
      setLoading(false)
    }
  }

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
            Nova senha
          </h1>
          <p className="mb-8 font-barlow text-sm leading-relaxed text-cinza-base">
            Crie uma nova senha para voltar a acessar sua conta.
          </p>

          <form onSubmit={handleRedefinirSenha} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nova-senha" className="font-barlow text-sm font-semibold text-preto-v1">
                Nova senha <span className="text-[#9b111e]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="nova-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimo de 8 caracteres"
                  value={senha}
                  onChange={(event) => {
                    setSenha(event.target.value)
                    setMensagem('')
                  }}
                  required
                  disabled={loading || sucesso}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((atual) => !atual)}
                  disabled={loading || sucesso}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-preto-v1 disabled:opacity-60"
                >
                  {mostrarSenha ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmar-senha" className="font-barlow text-sm font-semibold text-preto-v1">
                Confirmar senha <span className="text-[#9b111e]" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmar-senha"
                  type={mostrarConfirmacao ? 'text' : 'password'}
                  autoComplete="off"
                  placeholder="Digite novamente"
                  value={confirmacao}
                  onChange={(event) => {
                    setConfirmacao(event.target.value)
                    setMensagem('')
                  }}
                  onPaste={impedirCopiaCola}
                  onCopy={impedirCopiaCola}
                  onCut={impedirCopiaCola}
                  onDrop={impedirCopiaCola}
                  onKeyDown={impedirAtalhoCopiaCola}
                  required
                  disabled={loading || sucesso}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacao((atual) => !atual)}
                  disabled={loading || sucesso}
                  aria-label={mostrarConfirmacao ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-preto-v1 disabled:opacity-60"
                >
                  {mostrarConfirmacao ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {sucesso ? (
              <a
                href="/login"
                className="mt-1 block w-full rounded-xl bg-amarelo py-3 text-center font-barlow-condensed text-base font-bold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80"
              >
                Voltar para o login
              </a>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl bg-amarelo py-3 font-barlow-condensed text-base font-bold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
              </button>
            )}
          </form>

          {mensagem && (
            <p
              className={`mt-5 rounded-xl px-4 py-3 font-barlow text-sm font-semibold leading-relaxed ${
                sucesso ? 'bg-[#e8fff6] text-[#075f48]' : 'bg-[#fff1f1] text-[#9b111e]'
              }`}
              role="status"
            >
              {mensagem}
            </p>
          )}

          {!sucesso && (
            <a
              href="/login"
              className="mt-7 inline-block font-barlow text-sm font-semibold text-cinza-base transition-colors hover:text-amarelo"
            >
              Voltar para o login
            </a>
          )}
        </div>
      </main>
    </div>
  )
}
