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

export type MotivoAjustePontosApi = {
  id: number
  descricao: string
  exige_observacao: boolean
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

export async function listarMotivosAjustePontosApi() {
  const response = await apiFetch('/clientes/pontos/motivos')

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao carregar justificativas`)
  }

  return (await response.json()) as MotivoAjustePontosApi[]
}

export function formatarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, '')
  if (numeros.length === 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  if (numeros.length === 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`
  return telefone
}
