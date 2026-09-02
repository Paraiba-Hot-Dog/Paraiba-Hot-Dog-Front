const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(
  /\/$/,
  '',
)

export type Endereco = {
  id: number
  cep: string
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
}

export type Unidade = {
  id: number
  nome: string
  imagem: string | null
  abertura: string
  fechamento: string
  descricao: string | null
  mapa_url: string | null
  endereco: Endereco
}

export type Produto = {
  id: number
  nome: string
  descricao: string | null
  imagem_url: string | null
  ativo: boolean
}

async function buscar<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`)

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao consultar ${caminho}`)
  }

  return resposta.json() as Promise<T>
}

export function listarUnidades() {
  return buscar<Unidade[]>('/unidades/')
}

export function listarProdutos() {
  return buscar<Produto[]>('/produtos/?limit=100')
}

export function resolverUrlImagem(caminho: string | null | undefined) {
  if (!caminho) return null
  if (/^https?:\/\//i.test(caminho)) return caminho

  return `${API_URL}${caminho.startsWith('/') ? caminho : `/${caminho}`}`
}

export function resolverUrlMapaEmbed(
  mapaUrl: string | null | undefined,
  enderecoAlternativo: string,
) {
  if (mapaUrl?.includes('output=embed')) return mapaUrl

  const coordenadasDoLocal = mapaUrl?.match(
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  )
  const coordenadasDaVisualizacao = mapaUrl?.match(
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  )
  const coordenadas = coordenadasDoLocal ?? coordenadasDaVisualizacao
  const consulta = coordenadas
    ? `${coordenadas[1]},${coordenadas[2]}`
    : enderecoAlternativo

  return `https://www.google.com/maps?q=${encodeURIComponent(consulta)}&output=embed`
}

function normalizarSlug(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(avenida|av|das|da|do|de)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function criarSlugUnidade(unidade: Unidade) {
  const bairro = normalizarSlug(unidade.endereco.bairro)
  const logradouro = normalizarSlug(unidade.endereco.logradouro)

  return `${bairro}-${logradouro}`
}
