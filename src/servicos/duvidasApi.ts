import { apiFetch } from './apiFetch'

export type DuvidaApi = {
  id: number
  pergunta: string
  resposta: string
  ordem: number
  ativo: boolean
}

export type DuvidaFormApi = {
  pergunta: string
  resposta: string
  ordem: number
  ativo: boolean
}

async function respostaJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>

  let mensagem = `Erro ${response.status}`
  try {
    const body = (await response.json()) as { detail?: string | Array<{ msg?: string }> }
    if (typeof body.detail === 'string') mensagem = body.detail
    if (Array.isArray(body.detail)) {
      mensagem = body.detail.map((item) => item.msg).filter(Boolean).join(', ') || mensagem
    }
  } catch {
    // Mantem a mensagem baseada no status quando a API nao retorna JSON.
  }

  throw new Error(mensagem)
}

export async function listarDuvidasApi(apenasAtivas = true) {
  const response = await apiFetch('/duvidas/', {
    auth: false,
    params: { apenas_ativas: apenasAtivas },
  })

  return respostaJson<DuvidaApi[]>(response)
}

export async function criarDuvidaApi(dados: DuvidaFormApi) {
  const response = await apiFetch('/duvidas/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  return respostaJson<DuvidaApi>(response)
}

export async function atualizarDuvidaApi(id: number, dados: DuvidaFormApi) {
  const response = await apiFetch(`/duvidas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })

  return respostaJson<DuvidaApi>(response)
}

// PATCH parcial: envia apenas a ordem, sem reenviar pergunta/resposta.
export async function atualizarOrdemDuvidaApi(id: number, ordem: number) {
  const response = await apiFetch(`/duvidas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ordem }),
  })

  return respostaJson<DuvidaApi>(response)
}

export async function excluirDuvidaApi(id: number) {
  const response = await apiFetch(`/duvidas/${id}`, {
    method: 'DELETE',
  })

  if (response.ok || response.status === 204) return

  // Reaproveita o parser para exibir o detail da API (403, 404) em vez do status cru.
  await respostaJson<never>(response)
}
