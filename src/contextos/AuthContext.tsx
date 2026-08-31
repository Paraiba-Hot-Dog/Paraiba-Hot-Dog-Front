import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getStoredToken } from '../servicos/apiFetch'
import {
  extrairEmailToken,
  extrairRolesToken,
  extrairSubjectToken,
  tokenExpirado,
} from '../servicos/authToken'
import { listarUsuariosApi, type UsuarioApi } from '../servicos/usuariosApi'
import { AuthContext, type AuthContextValue } from './authContextCore'

const loggedUserEmailKey = 'logged_user_email'

function readCookie(name: string) {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

function readToken() {
  const storedToken = getStoredToken()
  if (storedToken) return storedToken

  for (const key of ['token', 'access_token', 'auth_token']) {
    const cookieToken = readCookie(key)
    if (cookieToken) return cookieToken
  }

  return null
}

const cachedUserKey = 'cached_usuario_atual'

function getCachedUser(): UsuarioApi | null {
  try {
    const raw = sessionStorage.getItem(cachedUserKey)
    return raw ? (JSON.parse(raw) as UsuarioApi) : null
  } catch {
    return null
  }
}

function setCachedUser(usuario: UsuarioApi | null) {
  if (usuario) {
    sessionStorage.setItem(cachedUserKey, JSON.stringify(usuario))
  } else {
    sessionStorage.removeItem(cachedUserKey)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = readToken()
  const isAuthenticated = Boolean(token) && !tokenExpirado(token)
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioApi | null>(
    isAuthenticated ? getCachedUser() : null,
  )
  const [isLoadingUser, setIsLoadingUser] = useState(
    isAuthenticated && !getCachedUser(),
  )
  const tokenRoles = tokenExpirado(token) ? [] : extrairRolesToken(token)
  const roles = useMemo(() => {
    const combined = new Set(tokenRoles)
    if (usuarioAtual?.funcao) combined.add(usuarioAtual.funcao)
    return [...combined]
  }, [tokenRoles, usuarioAtual])
  const permissoes = useMemo(
    () => usuarioAtual?.permissoes.map((permissao) => permissao.nome) ?? [],
    [usuarioAtual],
  )

  useEffect(() => {
    const emailToken = extrairEmailToken(token)
    const emailSalvo = localStorage.getItem(loggedUserEmailKey)
    const identificadorEmail = emailToken?.includes('@') ? emailToken : emailSalvo
    const subject = extrairSubjectToken(token)

    if (!isAuthenticated) {
      setUsuarioAtual(null)
      setCachedUser(null)
      setIsLoadingUser(false)
      return
    }

    let ativo = true
    if (!getCachedUser()) setIsLoadingUser(true)

    const carregarUsuario = identificadorEmail
      ? listarUsuariosApi({ email: identificadorEmail })
      : listarUsuariosApi()

    carregarUsuario
      .then((usuarios) => {
        if (!ativo) return

        const usuarioEncontrado =
          usuarios.find((usuario) => subject && usuario.auth_provider_id === subject) ??
          usuarios.find((usuario) => emailToken && usuario.email === emailToken) ??
          usuarios.find((usuario) => identificadorEmail && usuario.email === identificadorEmail) ??
          null

        setUsuarioAtual(usuarioEncontrado)
        setCachedUser(usuarioEncontrado)
      })
      .catch(() => {
        if (ativo) setUsuarioAtual(null)
      })
      .finally(() => {
        if (ativo) setIsLoadingUser(false)
      })

    return () => {
      ativo = false
    }
  }, [isAuthenticated, token])

  const value = useMemo<AuthContextValue>(() => {
    const getToken = () => readToken()
    return {
      token,
      roles,
      usuarioAtual,
      permissoes,
      isAuthenticated,
      isLoadingUser,
      getToken,
      getAuthHeaders: () => {
        const token = getToken()
        return token ? { Authorization: `Bearer ${token}` } : ({} as HeadersInit)
      },
      hasRole: (role) => roles.includes(role),
      hasPermission: (permission) =>
        permissoes.includes(permission) || roles.includes('administrador'),
    }
  }, [isAuthenticated, isLoadingUser, permissoes, roles, token, usuarioAtual])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
