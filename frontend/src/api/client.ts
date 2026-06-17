const BASE_URL = 'http://localhost:8000'
const TOKEN_STORAGE_KEY = 'gamehub.access_token'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

let accessToken =
  typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(TOKEN_STORAGE_KEY)

function withAuth(headers?: HeadersInit): Headers {
  const finalHeaders = new Headers(headers)

  if (accessToken && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  return finalHeaders
}

async function parseError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }))
    return payload.detail ?? response.statusText
  }

  const text = await response.text().catch(() => '')
  return text || response.statusText || 'Unknown error'
}

async function request<T>(method: HttpMethod, path: string, body?: BodyInit | unknown, headers?: HeadersInit): Promise<T> {
  const finalHeaders = withAuth(headers)
  const isBodyInit =
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    typeof body === 'string' ||
    body instanceof Blob ||
    body instanceof ArrayBuffer

  if (body !== undefined && !isBodyInit && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isBodyInit
          ? body
          : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return response.text() as Promise<T>
}

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token

  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export const api = {
  get: <T>(path: string, headers?: HeadersInit) => request<T>('GET', path, undefined, headers),
  post: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>('POST', path, body, headers),
  postForm: <T>(path: string, body: URLSearchParams) =>
    request<T>('POST', path, body, { 'Content-Type': 'application/x-www-form-urlencoded' }),
  patch: <T>(path: string, body: unknown, headers?: HeadersInit) => request<T>('PATCH', path, body, headers),
  delete: <T>(path: string, headers?: HeadersInit) => request<T>('DELETE', path, undefined, headers),
}
