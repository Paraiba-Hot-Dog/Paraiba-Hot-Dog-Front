import { apiFetch, buildApiUrl } from './apiFetch'

export const TEXTO_PADRAO_SOBRE_NOS =
  'Nascemos da paixão pela gastronomia de rua e pelo sabor autêntico da Paraíba. ' +
  'Desde 2015, levamos o melhor hot dog arretado para os brasilenses com qualidade, ' +
  'fartura e tradição. Nossa missão é servir ingredientes frescos, receitas exclusivas ' +
  'e um atendimento que faz você se sentir em casa.'

export type EstatisticaSobreNosApi = {
  valor: string
  legenda: string
}

export const ESTATISTICAS_PADRAO_SOBRE_NOS: EstatisticaSobreNosApi[] = [
  { valor: '10+', legenda: 'Anos de funcionamento' },
  { valor: '4,9', legenda: 'Avaliação média' },
  { valor: '3', legenda: 'Unidades' },
]

export type SobreNosApi = {
  id: number
  texto: string
  estatisticas: EstatisticaSobreNosApi[]
}

export type SobreNosImagemApi = {
  id: number
  imagem_url: string
  ordem: number
  posicao: string | null
}

export function normalizarEstatisticasSobreNos(
  estatisticas?: EstatisticaSobreNosApi[] | null,
): EstatisticaSobreNosApi[] {
  if (!estatisticas || estatisticas.length !== 3) {
    return ESTATISTICAS_PADRAO_SOBRE_NOS.map((item) => ({ ...item }))
  }

  return estatisticas.map((item) => ({
    valor: item.valor?.trim() || '',
    legenda: item.legenda?.trim() || '',
  }))
}

async function respostaJson<T>(response: Response, recurso: string) {
  if (!response.ok) throw new Error(`Erro ${response.status} ao consultar ${recurso}`)
  return (await response.json()) as T
}

// ---------------------------------------------------------------------------
// Texto Institucional e Estatísticas
// ---------------------------------------------------------------------------

export async function obterSobreNosApi() {
  const conteudo = await respostaJson<SobreNosApi>(
    await apiFetch('/sobre-nos', { auth: false }),
    'Sobre Nós',
  )

  return {
    ...conteudo,
    estatisticas: normalizarEstatisticasSobreNos(conteudo.estatisticas),
  }
}

export async function atualizarSobreNosApi(payload: {
  texto: string
  estatisticas: EstatisticaSobreNosApi[]
}) {
  const response = await apiFetch('/sobre-nos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error(`Erro ${response.status} ao atualizar conteúdo`)
  const conteudo = (await response.json()) as SobreNosApi
  return {
    ...conteudo,
    estatisticas: normalizarEstatisticasSobreNos(conteudo.estatisticas),
  }
}

// ---------------------------------------------------------------------------
// Carrossel de Mídias (Imagens e Vídeos)
// ---------------------------------------------------------------------------

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

export async function atualizarImagemSobreNosApi(
  id: number,
  dados: { ordem?: number; posicao?: string | null },
) {
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

export function ehVideoSobreNos(caminho: string | null | undefined) {
  if (!caminho) return false
  return /\.mp4(?:$|[?#])/i.test(caminho)
}
