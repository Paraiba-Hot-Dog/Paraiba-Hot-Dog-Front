import { apiFetch, buildApiUrl } from './apiFetch'

export type CategoriaProdutoApi = {
  id: number
  nome: string
}

export type SubcategoriaProdutoApi = {
  id: number
  nome: string
  categoria_id: number
}

export type VariacaoProdutoApi = {
  id: number
  produto_id: number
  nome: string
  tipo: 'normal' | 'combo'
  preco: string
  ativo: boolean
}

export type AdicionalProdutoApi = {
  id: number
  produto_id: number
  nome: string
  preco: string
}

export type ProdutoCardapioApi = {
  id: number
  nome: string
  descricao: string | null
  imagem_url: string | null
  ativo: boolean
  pontos_fidelidade_por_unidade: number
  disponivel_todas_unidades: boolean
  subcategoria_id: number
  unidade_ids: number[]
  variacoes: VariacaoProdutoApi[]
  adicionais: AdicionalProdutoApi[]
}

async function respostaJson<T>(response: Response, recurso: string) {
  if (!response.ok) throw new Error(`Erro ${response.status} ao consultar ${recurso}`)
  return (await response.json()) as T
}

export async function listarCardapioApi(unidadeId?: number) {
  const [produtosResponse, categoriasResponse, subcategoriasResponse] = await Promise.all([
    apiFetch('/produtos/', { auth: false, params: { limit: 100, unidade_id: unidadeId } }),
    apiFetch('/produtos/categorias', { auth: false }),
    apiFetch('/produtos/subcategorias', { auth: false }),
  ])

  const [produtos, categorias, subcategorias] = await Promise.all([
    respostaJson<ProdutoCardapioApi[]>(produtosResponse, 'produtos'),
    respostaJson<CategoriaProdutoApi[]>(categoriasResponse, 'categorias'),
    respostaJson<SubcategoriaProdutoApi[]>(subcategoriasResponse, 'subcategorias'),
  ])

  return { produtos, categorias, subcategorias }
}

export function resolverImagemProdutoApi(caminho: string | null) {
  if (!caminho) return null
  if (/^https?:\/\//i.test(caminho)) return caminho
  return buildApiUrl(caminho)
}
