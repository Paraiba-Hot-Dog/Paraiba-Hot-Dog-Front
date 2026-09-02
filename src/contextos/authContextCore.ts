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
