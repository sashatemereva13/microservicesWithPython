import { api, setAccessToken } from './client'
import { mockAuthApi } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export interface AuthToken {
  access_token: string
  token_type: string
}

export interface SessionUser {
  sub: string
  role: string
  exp: number
}

async function loginWithGateway(username: string, password: string) {
  const payload = new URLSearchParams({ username, password })
  const token = await api.postForm<AuthToken>('/v1/auth/token', payload)
  setAccessToken(token.access_token)
  return token
}

export const authApi = USE_MOCK ? mockAuthApi : {
  login: loginWithGateway,
  me: () => api.get<SessionUser>('/v1/auth/me'),
  logout: () => {
    setAccessToken(null)
  },
}
