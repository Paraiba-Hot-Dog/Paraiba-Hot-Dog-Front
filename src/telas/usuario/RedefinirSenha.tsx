import { useMemo, useState, type FormEvent } from 'react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import { redefinirSenha } from '../../servicos/authApi'

export default function RedefinirSenha() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') ?? '', [])
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleRedefinirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagem('')
    setSucesso(false)

    if (!token) {
      setMensagem('Link de recuperação inválido ou incompleto.')
      return
    }

    if (senha.length < 8) {
      setMensagem('A nova senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmacao) {
      setMensagem('As senhas informadas não conferem.')
      return
    }

    try {
      setLoading(true)
      await redefinirSenha(token, senha)
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
                Nova senha
              </label>
              <input
                id="nova-senha"
                type="password"
                autoComplete="new-password"
                placeholder="Minimo de 8 caracteres"
                value={senha}
                onChange={(event) => {
                  setSenha(event.target.value)
                  setMensagem('')
                }}
                required
                disabled={loading || sucesso}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmar-senha" className="font-barlow text-sm font-semibold text-preto-v1">
                Confirmar senha
              </label>
              <input
                id="confirmar-senha"
                type="password"
                autoComplete="new-password"
                placeholder="Digite novamente"
                value={confirmacao}
                onChange={(event) => {
                  setConfirmacao(event.target.value)
                  setMensagem('')
                }}
                required
                disabled={loading || sucesso}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading || sucesso}
              className="mt-1 w-full rounded-xl bg-amarelo py-3 font-barlow-condensed text-base font-bold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
            </button>
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

          <a
            href="/login"
            className="mt-7 inline-block font-barlow text-sm font-semibold text-cinza-base transition-colors hover:text-amarelo"
          >
            Voltar para o login
          </a>
        </div>
      </main>
    </div>
  )
}
