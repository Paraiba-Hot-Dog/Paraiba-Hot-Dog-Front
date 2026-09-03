import { apiFetch } from './apiFetch'

export const TEXTO_PADRAO_SOBRE_NOS =
  'Nascemos da paixão pela gastronomia de rua e pelo sabor autêntico da Paraíba. ' +
  'Desde 2015, levamos o melhor hot dog arretado para os brasilenses com qualidade, ' +
  'fartura e tradição. Nossa missão é servir ingredientes frescos, receitas exclusivas ' +
  'e um atendimento que faz você se sentir em casa.'

export type SobreNosApi = {
  id: number
  texto: string
}

async function respostaJson<T>(response: Response, recurso: string) {
  if (!response.ok) throw new Error(`Erro ${response.status} ao consultar ${recurso}`)
  return (await response.json()) as T
}

export async function obterSobreNosApi() {
  return respostaJson<SobreNosApi>(
    await apiFetch('/institucional/sobre-nos', { auth: false }),
    'Sobre Nós',
  )
}

export async function atualizarSobreNosApi(texto: string) {
  return respostaJson<SobreNosApi>(
    await apiFetch('/institucional/sobre-nos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }),
    'Sobre Nós',
  )
}
