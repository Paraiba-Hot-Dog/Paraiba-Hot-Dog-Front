import { apiFetch } from './apiFetch'

export type ClienteApi = {
  id: number
  nome: string
  telefone: string
  email: string | null
  pontos_fidelidade: number
  data_cadastro: string
}

export type ListarClientesParams = {
  skip: number
  limit: number
  nome?: string
  email?: string
  telefone?: string
  busca?: string
}

export async function listarClientesApi(params: ListarClientesParams) {
  const response = await apiFetch('/clientes/', { params })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Erro ${response.status} ao carregar clientes`)
  }

  return (await response.json()) as ClienteApi[]
}

export async function criarClienteApi(data: {
  nome: string
  telefone: string
  email: string
}) {
  const response = await apiFetch('/clientes/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, pontos_fidelidade: 0 }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Erro ${response.status} ao cadastrar cliente`)
  }

  return (await response.json()) as ClienteApi
}

export async function obterClienteApi(id: number) {
  const response = await apiFetch(`/clientes/${id}`)

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Erro ${response.status} ao carregar cliente`)
  }

  return (await response.json()) as ClienteApi
}

export type MotivoAjustePontosApi = {
  id: number
  descricao: string
  exige_observacao: boolean
  ativo: boolean
}

export type HistoricoAjustePontosApi = {
  id: number
  cliente_id: number
  motivo: MotivoAjustePontosApi
  observacao: string | null
  /** Variação do saldo: positiva ao adicionar, negativa ao remover. */
  quantidade: number
  pontos_anterior: number
  pontos_atual: number
  usuario_id: number | null
  usuario_nome: string | null
  data_ajuste: string
}

export async function listarHistoricoPontosApi(clienteId: number) {
  const response = await apiFetch(`/clientes/${clienteId}/pontos/historico`)

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Erro ${response.status} ao carregar histórico de pontos`)
  }

  return (await response.json()) as HistoricoAjustePontosApi[]
}

export type AjustePontosApi = {
  operacao: 'adicionar' | 'remover'
  quantidade: number
  motivo_id: number
  observacao?: string
}

export type ClienteUpdateApi = {
  nome?: string
  telefone?: string
  email?: string | null
  ajuste_pontos?: AjustePontosApi
}

export async function atualizarClienteApi(id: number, data: ClienteUpdateApi) {
  const response = await apiFetch(`/clientes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: unknown } | null
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Erro ${response.status} ao atualizar cliente`)
  }

  return (await response.json()) as ClienteApi
}

/** apenasAtivos = false inclui as justificativas desativadas (tela de auditoria). */
export async function listarMotivosAjustePontosApi(apenasAtivos = true) {
  const response = await apiFetch('/clientes/pontos/motivos', {
    params: { apenas_ativos: apenasAtivos },
  })

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao carregar justificativas`)
  }

  return (await response.json()) as MotivoAjustePontosApi[]
}

export type MotivoAjustePontosFormApi = {
  descricao?: string
  exige_observacao?: boolean
  ativo?: boolean
}

async function lerErroMotivo(response: Response, padrao: string) {
  const body = await response.json().catch(() => null) as { detail?: unknown } | null
  return new Error(typeof body?.detail === 'string' ? body.detail : `Erro ${response.status} ${padrao}`)
}

export async function criarMotivoAjustePontosApi(dados: { descricao: string; exige_observacao: boolean }) {
  const response = await apiFetch('/clientes/pontos/motivos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  if (!response.ok) throw await lerErroMotivo(response, 'ao cadastrar justificativa')

  return (await response.json()) as MotivoAjustePontosApi
}

export async function atualizarMotivoAjustePontosApi(id: number, dados: MotivoAjustePontosFormApi) {
  const response = await apiFetch(`/clientes/pontos/motivos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  if (!response.ok) throw await lerErroMotivo(response, 'ao atualizar justificativa')

  return (await response.json()) as MotivoAjustePontosApi
}

/** O back apenas desativa a justificativa, preservando o historico que ja a utilizou. */
export async function excluirMotivoAjustePontosApi(id: number) {
  const response = await apiFetch(`/clientes/pontos/motivos/${id}`, { method: 'DELETE' })

  if (!response.ok) throw await lerErroMotivo(response, 'ao excluir justificativa')
}

export function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, '')
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  return telefone
}
