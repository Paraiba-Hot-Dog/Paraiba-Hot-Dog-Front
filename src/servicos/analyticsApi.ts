import { buildApiUrl } from './apiFetch'

/**
 * Captura first-party de eventos de navegacao do site publico.
 *
 * Nenhum identificador de visita, dispositivo ou pessoa sai do navegador. O
 * controle da visita (origem e etapas ja enviadas) fica no sessionStorage da
 * aba e serve apenas para calcular `primeiro_na_visita`.
 *
 * Este modulo nao le token, cliente logado nem outro dado de autenticacao.
 */

export type TipoEventoAnalytics =
  | 'visita_site'
  | 'abertura_cardapio'
  | 'selecao_unidade'
  | 'visualizacao_produto'
  | 'clique_pedir'

export type DadosEventoAnalytics = {
  unidadeId?: number | null
  produtoId?: number | null
}

type OrigemVisita = {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer_host: string | null
}

type EstadoVisita = {
  origem: OrigemVisita
  etapas: TipoEventoAnalytics[]
  // Ultima unidade escolhida na visita; usada nos eventos seguintes que nao
  // informam unidade (ex.: clique no iFood). Nunca e enviada como identificador.
  unidadeId: number | null
}

export type PayloadEventoAnalytics = OrigemVisita & {
  tipo: TipoEventoAnalytics
  primeiro_na_visita: boolean
  unidade_id: number | null
  produto_id: number | null
  versao_coleta: number
}

export const CHAVE_VISITA = 'paraiba_analytics_visita'
export const CHAVE_NAO_MEDIR = 'paraiba_analytics_nao_medir'

/**
 * Versão das regras de disparo dos eventos. Incrementar sempre que mudar
 * quando ou como algum evento é enviado (ex.: novo ponto de captura), para
 * explicar degraus nos gráficos. Registrar a mudança no repositório Docs.
 * O back aceita de 1 a 100.
 */
export const VERSAO_COLETA = 1
const PARAMETRO_NAO_MEDIR = 'analytics'
// Fora de /analytics/: a lista EasyPrivacy (uBlock Origin) bloqueia "/analytics/event".
const CAMINHO_EVENTOS = '/eventos'

function coletaAtiva() {
  return import.meta.env.VITE_ANALYTICS_ATIVO === 'true'
}

/**
 * Le e aplica o modo "nao medir este navegador".
 * `?analytics=off` grava a marca no localStorage; `?analytics=on` remove.
 */
function medicaoDesligada() {
  try {
    const preferencia = new URLSearchParams(window.location.search).get(PARAMETRO_NAO_MEDIR)
    if (preferencia === 'off') localStorage.setItem(CHAVE_NAO_MEDIR, '1')
    if (preferencia === 'on') localStorage.removeItem(CHAVE_NAO_MEDIR)
    return localStorage.getItem(CHAVE_NAO_MEDIR) === '1'
  } catch {
    return false
  }
}

function lerParametro(parametros: URLSearchParams, nome: string) {
  const valor = parametros.get(nome)?.trim()
  return valor ? valor : null
}

/** Retorna so o dominio do referrer externo, nunca a URL completa. */
function dominioDoReferrer() {
  try {
    if (!document.referrer) return null
    const url = new URL(document.referrer)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.hostname === window.location.hostname) return null
    return url.hostname || null
  } catch {
    return null
  }
}

function capturarOrigem(): OrigemVisita {
  const parametros = new URLSearchParams(window.location.search)
  return {
    utm_source: lerParametro(parametros, 'utm_source'),
    utm_medium: lerParametro(parametros, 'utm_medium'),
    utm_campaign: lerParametro(parametros, 'utm_campaign'),
    referrer_host: dominioDoReferrer(),
  }
}

function lerEstado(): EstadoVisita | null {
  const bruto = sessionStorage.getItem(CHAVE_VISITA)
  if (!bruto) return null
  try {
    const estado = JSON.parse(bruto) as EstadoVisita
    if (!estado?.origem || !Array.isArray(estado.etapas)) return null
    return { ...estado, unidadeId: estado.unidadeId ?? null }
  } catch {
    return null
  }
}

/**
 * Carrega a visita da aba ou inicia uma nova. A origem e first-touch: e lida
 * so na primeira pagina e vale para todos os eventos da visita.
 * Retorna null se o sessionStorage estiver indisponivel.
 */
function carregarVisita(): EstadoVisita | null {
  try {
    const existente = lerEstado()
    if (existente) return existente
    const nova: EstadoVisita = { origem: capturarOrigem(), etapas: [], unidadeId: null }
    sessionStorage.setItem(CHAVE_VISITA, JSON.stringify(nova))
    return nova
  } catch {
    return null
  }
}

function salvarVisita(estado: EstadoVisita) {
  try {
    sessionStorage.setItem(CHAVE_VISITA, JSON.stringify(estado))
    return true
  } catch {
    return false
  }
}

function enviar(payload: PayloadEventoAnalytics) {
  try {
    // Corpo em texto puro evita o preflight de CORS, que nao combina bem com
    // keepalive. keepalive garante o envio quando o clique abre outra aba.
    void fetch(buildApiUrl(CAMINHO_EVENTOS), {
      method: 'POST',
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined)
  } catch {
    // Analytics nunca quebra a tela.
  }
}

function registrarNoEstado(
  estado: EstadoVisita,
  tipo: TipoEventoAnalytics,
  dados: DadosEventoAnalytics,
): PayloadEventoAnalytics | null {
  const primeiro = !estado.etapas.includes(tipo)
  if (tipo === 'visita_site' && !primeiro) return null

  if (primeiro) estado.etapas.push(tipo)
  if (tipo === 'selecao_unidade' && dados.unidadeId != null) {
    estado.unidadeId = dados.unidadeId
  }

  const unidadeId =
    tipo === 'visita_site' ? null : (dados.unidadeId ?? estado.unidadeId ?? null)

  return {
    tipo,
    primeiro_na_visita: primeiro,
    unidade_id: unidadeId,
    produto_id: dados.produtoId ?? null,
    versao_coleta: VERSAO_COLETA,
    ...estado.origem,
  }
}

/**
 * Registra um evento do site publico. Nao bloqueia a renderizacao e ignora
 * erros, entao as telas nao precisam de try/catch.
 *
 * Chamar apenas em useEffect ou em handlers de clique.
 */
export function registrarEvento(tipo: TipoEventoAnalytics, dados: DadosEventoAnalytics = {}) {
  if (!coletaAtiva() || medicaoDesligada()) return

  const estado = carregarVisita()
  if (!estado) return

  const payloads: PayloadEventoAnalytics[] = []
  if (tipo !== 'visita_site') {
    // Garante a visita quando a primeira pagina dispara outro evento antes
    // do efeito do App (efeitos dos filhos rodam antes dos do pai).
    const visita = registrarNoEstado(estado, 'visita_site', {})
    if (visita) payloads.push(visita)
  }
  const evento = registrarNoEstado(estado, tipo, dados)
  if (evento) payloads.push(evento)

  if (!payloads.length || !salvarVisita(estado)) return
  payloads.forEach(enviar)
}

/** Registra a visita uma unica vez por aba. Chamar nas paginas publicas. */
export function registrarVisita() {
  registrarEvento('visita_site')
}
