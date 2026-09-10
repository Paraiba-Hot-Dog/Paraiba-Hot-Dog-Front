import { apiFetch, buildApiUrl } from './apiFetch'

export type TipoBlogApi = 'noticia' | 'promocao'

export type BlogPostApi = {
  id: number
  titulo: string
  imagem_url: string | null
  descricao: string | null
  tipo: TipoBlogApi
  data: string
}

export type BlogPostFormApi = {
  titulo: string
  descricao: string
  tipo: TipoBlogApi
  data: string
  imagemUrl?: string | null
  imagemFile?: File | null
}

async function respostaJson<T>(response: Response, recurso: string) {
  if (!response.ok) throw new Error(`Erro ${response.status} ao consultar ${recurso}`)
  return (await response.json()) as T
}

export async function listarPostsBlogApi(tipo?: TipoBlogApi) {
  const response = await apiFetch('/blog/', {
    auth: false,
    params: { tipo, limit: 20 },
  })

  return respostaJson<BlogPostApi[]>(response, 'blog')
}

export async function criarPostBlogApi(dados: BlogPostFormApi) {
  const temArquivo = Boolean(dados.imagemFile)
  const response = await apiFetch('/blog/', {
    method: 'POST',
    headers: temArquivo ? undefined : { 'Content-Type': 'application/json' },
    body: temArquivo
      ? montarFormData(dados)
      : JSON.stringify({
          titulo: dados.titulo,
          descricao: dados.descricao,
          tipo: dados.tipo,
          data: dados.data,
          imagem_url: dados.imagemUrl ?? null,
        }),
  })

  if (!response.ok) throw new Error(`Erro ${response.status} ao criar post`)
  return (await response.json()) as BlogPostApi
}

export async function atualizarPostBlogApi(id: number, dados: BlogPostFormApi) {
  const response = await apiFetch(`/blog/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: dados.titulo,
      descricao: dados.descricao,
      tipo: dados.tipo,
      data: dados.data,
      imagem_url: dados.imagemUrl ?? null,
    }),
  })

  if (!response.ok) throw new Error(`Erro ${response.status} ao atualizar post`)
  return (await response.json()) as BlogPostApi
}

export async function excluirPostBlogApi(id: number) {
  const response = await apiFetch(`/blog/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    throw new Error(`Erro ${response.status} ao excluir post`)
  }
}

export function resolverImagemBlogApi(caminho: string | null) {
  if (!caminho) return null
  if (/^https?:\/\//i.test(caminho)) return caminho
  return buildApiUrl(caminho)
}

function montarFormData(dados: BlogPostFormApi) {
  const formData = new FormData()
  formData.append('titulo', dados.titulo)
  formData.append('descricao', dados.descricao)
  formData.append('tipo', dados.tipo)
  formData.append('data', dados.data)
  if (dados.imagemFile) formData.append('imagem', dados.imagemFile)
  return formData
}
