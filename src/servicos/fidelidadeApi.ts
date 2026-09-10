import { apiFetch } from './apiFetch'

export type FidelidadeCliente = {
  id: number
  nome: string
  pontos: number
  total_para_premio: number
}

export async function consultarFidelidade(cadastro: string) {
  const response = await apiFetch('/fidelidade', {
    auth: false,
    params: { cadastro },
  })

  if (response.status === 404) {
    return null
  }

  if (response.status >= 400 && response.status < 500) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Loyalty lookup failed: ${response.status}`)
  }

  return (await response.json()) as FidelidadeCliente
}
