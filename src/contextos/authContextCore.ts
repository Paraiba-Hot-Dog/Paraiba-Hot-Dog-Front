import { createContext } from 'react'
import type { NomePermissaoApi, UsuarioApi } from '../servicos/usuariosApi'

export type AuthContextValue = {
  token: string | null
  roles: string[]
  usuarioAtual: UsuarioApi | null
  permissoes: NomePermissaoApi[]
  isAuthenticated: boolean
  isLoadingUser: boolean
  getToken: () => string | null
  getAuthHeaders: () => HeadersInit
  hasRole: (role: string) => boolean
  hasPermission: (permission: NomePermissaoApi) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const cachedUserKey = 'cached_usuario_atual'

export function getCachedUser(): UsuarioApi | null {
  try {
    const raw = sessionStorage.getItem(cachedUserKey) || localStorage.getItem(cachedUserKey)
    return raw ? (JSON.parse(raw) as UsuarioApi) : null
  } catch {
    return null
  }
}

export function setCachedUser(usuario: UsuarioApi | null) {
  if (usuario) {
    const serialized = JSON.stringify(usuario)
    sessionStorage.setItem(cachedUserKey, serialized)
    localStorage.setItem(cachedUserKey, serialized)
  } else {
    sessionStorage.removeItem(cachedUserKey)
    localStorage.removeItem(cachedUserKey)
  }
}
