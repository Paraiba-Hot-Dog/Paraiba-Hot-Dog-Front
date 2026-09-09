import { apiFetch } from './apiFetch'

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

export async function obterSobreNosApi() {
  const conteudo = await respostaJson<SobreNosApi>(
    await apiFetch('/institucional/sobre-nos', { auth: false }),
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
  const response = await apiFetch('/institucional/sobre-nos', {
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
