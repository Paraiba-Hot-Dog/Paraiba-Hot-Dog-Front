type JwtPayload = {
  exp?: number
  sub?: string
  email?: string
  preferred_username?: string
  role?: string
  user_metadata?: {
    nome?: string
    funcao?: string
  }
  app_metadata?: {
    role?: string
  }
}

function decodificarBase64Url(valor: string) {
  const base64 = valor.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)

  return atob(`${base64}${padding}`)
}

export function lerPayloadToken(token: string | null): JwtPayload | null {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    return JSON.parse(decodificarBase64Url(payload)) as JwtPayload
  } catch {
    return null
  }
}

export function extrairRolesToken(token: string | null) {
  const payload = lerPayloadToken(token)
  const roles = new Set<string>()

  // Supabase Auth: role pode estar em diferentes lugares
  if (payload?.role) roles.add(payload.role)
  if (payload?.user_metadata?.funcao) roles.add(payload.user_metadata.funcao)
  if (payload?.app_metadata?.role) roles.add(payload.app_metadata.role)

  return [...roles]
}

export function tokenExpirado(token: string | null) {
  const expiracao = lerPayloadToken(token)?.exp

  return expiracao ? expiracao * 1000 <= Date.now() : false
}

export function extrairEmailToken(token: string | null) {
  const payload = lerPayloadToken(token)

  return payload?.email ?? payload?.preferred_username ?? null
}

export function extrairSubjectToken(token: string | null) {
  return lerPayloadToken(token)?.sub ?? null
}
