import { useState, type FormEvent } from 'react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import { solicitarRecuperacaoSenha } from '../../servicos/authApi'

export default function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')

  async function handleRecuperarSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMensagem('')

    try {
      const response = await solicitarRecuperacaoSenha(email)
      setMensagem(response.message)
    } catch (error) {
      console.error('Password recovery error:', error)
      setMensagem('Não foi possível enviar o e-mail. Verifique se este e-mail está cadastrado como usuário no sistema.')
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
            Recuperar senha
          </h1>
          <p className="mb-8 font-barlow text-sm leading-relaxed text-cinza-base">
            Informe o e-mail cadastrado para receber as instruções de acesso.
          </p>

          <form onSubmit={handleRecuperarSenha} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email-recuperacao" className="font-barlow text-sm font-semibold text-preto-v1">
                E-mail
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
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-amarelo py-3 font-barlow-condensed text-base font-bold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
            </button>
          </form>

          {mensagem && (
            <p className="mt-5 rounded-xl bg-[#f4f7fb] px-4 py-3 font-barlow text-sm font-semibold leading-relaxed text-preto-v1" role="status">
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
