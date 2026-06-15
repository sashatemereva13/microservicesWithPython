import { api } from './client'
import { mockNotificationsApi } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export interface NotificationItem {
  id: string
  user_id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

export interface NotificationList {
  items: NotificationItem[]
  total: number
  limit: number
  offset: number
}

function normalizeNotifications(
  payload: NotificationList | Array<Record<string, unknown>>,
): NotificationList {
  if (Array.isArray(payload)) {
    const items = payload.map((item, index) => ({
      id: String(item.id ?? `${item.user_id ?? 'notification'}-${index}`),
      user_id: String(item.user_id ?? ''),
      type: 'activity_notification',
      message: String(item.message ?? ''),
      read: Boolean(item.read ?? false),
      created_at: String(item.created_at ?? item.received_at ?? new Date().toISOString()),
    }))

    return {
      items,
      total: items.length,
      limit: items.length || 20,
      offset: 0,
    }
  }

  return {
    ...payload,
    items: payload.items.map((item) => ({
      ...item,
      read: Boolean(item.read),
    })),
  }
}

export const notificationsApi = USE_MOCK ? mockNotificationsApi : {
  listByUser: async (userId: string, limit = 20, offset = 0) => {
    const payload = await api.get<NotificationList | Array<Record<string, unknown>>>(
      `/v1/notifications/${userId}?limit=${limit}&offset=${offset}`,
    )

    return normalizeNotifications(payload)
  },
}
