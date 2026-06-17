import { api } from './client'
import { mockHealthApi } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export interface GatewayHealth {
  status: string
  service: string
  services?: Record<string, string>
}

export const healthApi = USE_MOCK ? mockHealthApi : {
  get: () => api.get<GatewayHealth>('/health'),
}
