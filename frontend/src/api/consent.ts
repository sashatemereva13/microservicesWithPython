import { api } from './client'
import { mockPrivacyApi } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export interface ConsentRecord {
  user_id: string
  granted: boolean
  updated_at: string
}

export interface ActivityLogEntry {
  id: number
  user_id: string
  game_id: string
  action: string
  message: string | null
  created_at: string
}

export interface ActivityLogList {
  items: ActivityLogEntry[]
  total: number
}

async function getConsent(userId: string) {
  try {
    return await api.get<ConsentRecord>(`/v1/consent/${userId}`)
  } catch (error) {
    if (error instanceof Error && error.message === 'No consent record found') {
      return null
    }

    throw error
  }
}

export const privacyApi = USE_MOCK ? mockPrivacyApi : {
  getConsent,
  setConsent: (userId: string, granted: boolean) =>
    api.post<ConsentRecord>(`/v1/consent/${userId}`, { granted }),
  withdrawConsent: (userId: string) =>
    api.delete<ConsentRecord>(`/v1/consent/${userId}`),
  listLogs: (userId: string) =>
    api.get<ActivityLogList>(`/v1/logs/${userId}`),
  deleteLogs: (userId: string) =>
    api.delete<{ user_id: string; deleted_entries: number }>(`/v1/logs/${userId}`),
}
