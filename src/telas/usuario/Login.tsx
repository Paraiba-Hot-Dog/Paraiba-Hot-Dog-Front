import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import logoBranca from '../../imagens/logos/logo-branca.png'
import { login } from '../../servicos/authApi'
import { extrairEmailToken } from '../../servicos/authToken'
import { listarUsuariosApi } from '../../servicos/usuariosApi'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const tokens = await login(email, password)
      localStorage.setItem('logged_user_email', email)

      const emailToken = extrairEmailToken(tokens.access_token)
      const usuarios = emailToken ? await listarUsuariosApi({ email: emailToken }) : []
      const usuario = usuarios[0]

      if (usuario?.funcao === 'administrador' || usuario?.permissoes.length) {
        window.location.href = '/admin'
        return
      }

      window.location.href = '/'
    } catch (error) {
      console.error('Login error:', error)
      alert('Credenciais invalidas ou servidor fora do ar. Verifique seus dados e tente novamente.')
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
        <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-lg">
          <h1 className="mb-2 font-barlow-condensed text-4xl font-black uppercase tracking-wide text-preto-v1">
            Login
          </h1>
          <p className="mb-8 font-barlow text-sm text-cinza-base">
            Acesse o painel Paraiba Hot Dog
          </p>

          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-barlow text-sm font-semibold text-preto-v1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-barlow text-sm font-semibold text-preto-v1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 font-barlow text-sm text-preto-v1 outline-none transition-colors placeholder:text-gray-400 focus:border-amarelo focus:ring-2 focus:ring-amarelo/30 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-preto-v1 disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={2} />
                  ) : (
                    <Eye size={18} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-amarelo py-3 font-barlow-condensed text-base font-semibold uppercase tracking-widest text-preto-v1 shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

        </div>
      </main>
    </div>
  )
}
