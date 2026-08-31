import { apiFetch, saveAuthTokens } from './apiFetch'

type LoginResponse = {
  access_token: string
  expires_in?: number
  refresh_token?: string
  token_type?: string
}

export async function login(email: string, password: string) {
  const response = await apiFetch('/auth/login', {
    auth: false,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`)
  }

  const tokens = (await response.json()) as LoginResponse
  saveAuthTokens(tokens)

  return tokens
}

export async function solicitarRecuperacaoSenha(email: string) {
  const response = await apiFetch('/auth/esqueci-senha', {
    auth: false,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    throw new Error(`Password recovery failed: ${response.status}`)
  }

  const result = (await response.json()) as {
    email_status: string
    message: string
  }

  if (result.email_status !== 'sent') {
    throw new Error(`Password recovery email not sent: ${result.email_status}`)
  }

  return result
}

export async function redefinirSenha(token: string, novaSenha: string) {
  const response = await apiFetch('/auth/redefinir-senha', {
    auth: false,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      nova_senha: novaSenha,
    }),
  })

  if (!response.ok) {
    throw new Error(`Password reset failed: ${response.status}`)
  }
}
