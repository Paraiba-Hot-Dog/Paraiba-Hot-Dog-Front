import { apiFetch } from './apiFetch'

export type ClienteApi = {
  id: number
  nome: string
  telefone: string
  email: string | null
  pontos_fidelidade: number
  data_cadastro: string
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
