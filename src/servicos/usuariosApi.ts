import { apiFetch } from './apiFetch'

export type FuncaoUsuarioApi = 'administrador' | 'caixa' | 'cozinha'
export type NomePermissaoApi =
  | 'anotar_pedidos'
  | 'cozinha'
  | 'dashboard'
  | 'configuracoes'

export type PermissaoApi = {
  id: number
  nome: NomePermissaoApi
}

export type UsuarioApi = {
  id: number
  nome: string
  email: string
  funcao: FuncaoUsuarioApi
  unidade_id: number | null
  auth_provider_id: string | null
  permissoes: PermissaoApi[]
}

export type UsuarioCreateApi = {
  nome: string
  email: string
  senha: string
  funcao: FuncaoUsuarioApi
  unidade_id: number | null
  permissao_ids: number[]
}

export type UsuarioUpdateApi = Partial<Omit<UsuarioCreateApi, 'senha'>> & {
  senha?: string
}

type ListarUsuariosParams = {
  email?: string | null
  nome?: string | null
}

async function respostaJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>

  let mensagem = `Erro ${response.status}`

  try {
    const body = (await response.json()) as { detail?: string }
    if (body.detail) mensagem = body.detail
  } catch {
    // Mantem a mensagem baseada no status quando a API nao retorna JSON.
  }

  throw new Error(mensagem)
}

export async function listarUsuariosApi(params?: ListarUsuariosParams) {
  return respostaJson<UsuarioApi[]>(await apiFetch('/usuarios/', { params }))
}

export async function listarPermissoesApi() {
  return respostaJson<PermissaoApi[]>(await apiFetch('/permissoes/'))
}

export async function criarUsuarioApi(data: UsuarioCreateApi) {
  return respostaJson<UsuarioApi>(
    await apiFetch('/usuarios/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  )
}

export async function atualizarUsuarioApi(
  usuarioId: number,
  data: UsuarioUpdateApi,
) {
  return respostaJson<UsuarioApi>(
    await apiFetch(`/usuarios/${usuarioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  )
}

export async function excluirUsuarioApi(usuarioId: number) {
  const response = await apiFetch(`/usuarios/${usuarioId}`, {
    method: 'DELETE',
  })

  if (!response.ok) await respostaJson<never>(response)
}
