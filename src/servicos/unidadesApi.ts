import type { Unidade } from './api'
import { apiFetch } from './apiFetch'

export type UnidadeCreateApi = {
  nome: string
  abertura: string
  fechamento: string
  cep: string
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  descricao: string | null
  mapaUrl: string | null
  imagem: File
}

export type UnidadeUpdateApi = {
  nome: string
  abertura: string
  fechamento: string
  descricao: string | null
  mapaUrl: string | null
  cep: string
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  imagem?: File | null
}

async function respostaJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>

  let mensagem = `Erro ${response.status}`
  try {
    const body = (await response.json()) as { detail?: string | Array<{ msg?: string }> }
    if (typeof body.detail === 'string') mensagem = body.detail
    if (Array.isArray(body.detail)) {
      mensagem = body.detail.map((item) => item.msg).filter(Boolean).join(', ') || mensagem
    }
  } catch {
    // Mantem a mensagem baseada no status quando a API nao retorna JSON.
  }

  throw new Error(mensagem)
}

export async function listarUnidadesApi() {
  return respostaJson<Unidade[]>(await apiFetch('/unidades/', { auth: false }))
}

export async function criarUnidadeApi(data: UnidadeCreateApi) {
  const formData = new FormData()
  formData.append('nome', data.nome)
  formData.append('abertura', data.abertura)
  formData.append('fechamento', data.fechamento)
  formData.append('cep', data.cep)
  formData.append('logradouro', data.logradouro)
  formData.append('bairro', data.bairro)
  formData.append('cidade', data.cidade)
  formData.append('estado', data.estado)
  formData.append('imagem', data.imagem)
  if (data.numero) formData.append('numero', data.numero)
  if (data.complemento) formData.append('complemento', data.complemento)
  if (data.descricao) formData.append('descricao', data.descricao)
  if (data.mapaUrl) formData.append('mapa_url', data.mapaUrl)

  return respostaJson<Unidade>(
    await apiFetch('/unidades/', {
      method: 'POST',
      body: formData,
    }),
  )
}

export async function atualizarUnidadeApi(
  unidadeId: number,
  data: UnidadeUpdateApi,
) {
  const formData = new FormData()
  formData.append('nome', data.nome)
  formData.append('abertura', data.abertura)
  formData.append('fechamento', data.fechamento)
  formData.append('cep', data.cep)
  formData.append('logradouro', data.logradouro)
  formData.append('bairro', data.bairro)
  formData.append('cidade', data.cidade)
  formData.append('estado', data.estado)
  formData.append('descricao', data.descricao ?? '')
  formData.append('mapa_url', data.mapaUrl ?? '')
  formData.append('numero', data.numero ?? '')
  formData.append('complemento', data.complemento ?? '')
  if (data.imagem) formData.append('imagem', data.imagem)

  return respostaJson<Unidade>(
    await apiFetch(`/unidades/${unidadeId}`, {
      method: 'PATCH',
      body: formData,
    }),
  )
}

export async function excluirUnidadeApi(unidadeId: number) {
  const response = await apiFetch(`/unidades/${unidadeId}`, {
    method: 'DELETE',
  })
  if (!response.ok) await respostaJson<never>(response)
}
