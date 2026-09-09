import { apiFetch, buildApiUrl } from './apiFetch'

export type SobreNosImagemApi = {
  id: number
  imagem_url: string
  ordem: number
  posicao: string | null
}

async function respostaJson<T>(response: Response, recurso: string) {
  if (!response.ok) throw new Error(`Erro ${response.status} ao consultar ${recurso}`)
  return (await response.json()) as T
}

export async function listarImagensSobreNosApi() {
  const response = await apiFetch('/sobre-nos/imagens', { auth: false })
  return respostaJson<SobreNosImagemApi[]>(response, 'sobre-nos')
}

export async function criarImagemSobreNosApi(imagemFile: File, posicao?: string) {
  const formData = new FormData()
  formData.append('imagem', imagemFile)
  if (posicao) formData.append('posicao', posicao)

  const response = await apiFetch('/sobre-nos/imagens', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) throw new Error(`Erro ${response.status} ao criar imagem`)
  return (await response.json()) as SobreNosImagemApi
}

export async function atualizarImagemSobreNosApi(id: number, dados: { ordem?: number; posicao?: string | null }) {
  const response = await apiFetch(`/sobre-nos/imagens/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  if (!response.ok) throw new Error(`Erro ${response.status} ao atualizar imagem`)
  return (await response.json()) as SobreNosImagemApi
}

export async function excluirImagemSobreNosApi(id: number) {
  const response = await apiFetch(`/sobre-nos/imagens/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erro ${response.status} ao excluir imagem`)
  }
}

export function resolverImagemSobreNosApi(caminho: string | null) {
  if (!caminho) return null
  if (/^https?:\/\//i.test(caminho)) return caminho
  return buildApiUrl(caminho)
}
