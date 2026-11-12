const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const tokenKeys = ['token', 'access_token', 'auth_token'] as const

type QueryParams = Record<string, string | number | boolean | null | undefined>

type ApiFetchOptions = RequestInit & {
  auth?: boolean
  baseUrl?: string
  params?: QueryParams
  timeoutMs?: number
}

export function clearAuthTokens() {
  for (const key of tokenKeys) {
    localStorage.removeItem(key)
  }
  localStorage.removeItem('logged_user_email')
  sessionStorage.removeItem('cached_usuario_atual')
  localStorage.removeItem('cached_usuario_atual')
}

export function getStoredToken() {
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key)
    if (token) return token
  }

  return null
}

export function saveAuthTokens(tokens: {
  access_token: string
  expires_in?: number
  id_token?: string
  refresh_expires_in?: number
  refresh_token?: string
  token_type?: string
}) {
  localStorage.setItem('token', tokens.access_token)
  localStorage.setItem('access_token', tokens.access_token)

  if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token)
  if (tokens.id_token) localStorage.setItem('id_token', tokens.id_token)
  if (tokens.token_type) localStorage.setItem('token_type', tokens.token_type)
  if (tokens.expires_in) localStorage.setItem('expires_in', String(tokens.expires_in))
  if (tokens.refresh_expires_in) localStorage.setItem('refresh_expires_in', String(tokens.refresh_expires_in))
}

export function buildApiUrl(path: string, params?: QueryParams, baseUrl = apiBaseUrl) {
  const url = /^https?:\/\//i.test(baseUrl)
    ? new URL(path, baseUrl)
    : new URL(
        `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
        window.location.origin,
      )

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

export async function apiFetch(
  path: string,
  {
    auth = true,
    baseUrl,
    params,
    headers,
    timeoutMs = 15000,
    signal,
    ...options
  }: ApiFetchOptions = {},
) {
  const requestHeaders = new Headers(headers)
  const token = getStoredToken()

  if (auth && token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let requestSignal = signal

  if (!requestSignal && timeoutMs > 0) {
    const controller = new AbortController()
    timeoutId = setTimeout(() => {
      controller.abort(new Error(`Timeout de ${timeoutMs}ms excedido na requisição para ${path}`))
    }, timeoutMs)
    requestSignal = controller.signal
  }

  try {
    return await fetch(buildApiUrl(path, params, baseUrl), {
      ...options,
      headers: requestHeaders,
      signal: requestSignal,
    })
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
