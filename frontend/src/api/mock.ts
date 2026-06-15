import data from './mock-data.json'
import { getAccessToken, setAccessToken } from './client'
import type { Activity, ActivityCreate, ActivityList } from './activities'
import type { AuthToken, SessionUser } from './auth'
import type { ActivityLogEntry, ActivityLogList, ConsentRecord } from './consent'
import type { Game, GameList, GameCreate } from './games'
import type { GatewayHealth } from './health'
import type { NotificationItem, NotificationList } from './notifications'
import type { User, UserList, UserCreate } from './users'

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

const mockUsers = [...data.users.items] as User[]
const mockGames = [...data.games.items] as Game[]

let mockActivities: Activity[] = [
  {
    id: 'activity-1',
    user_id: mockUsers[0]?.id ?? '',
    action: 'played',
    duration_minutes: 95,
    created_at: '2025-03-11T18:30:00Z',
    game: {
      id: mockGames[0]?.id ?? '',
      title: mockGames[0]?.title ?? 'Hollow Knight',
      genre: mockGames[0]?.genre ?? 'metroidvania',
      platform: mockGames[0]?.platform ?? 'PC',
      cover_url: mockGames[0]?.cover_url ?? null,
    },
  },
  {
    id: 'activity-2',
    user_id: mockUsers[1]?.id ?? '',
    action: 'completed',
    duration_minutes: 130,
    created_at: '2025-03-10T14:20:00Z',
    game: {
      id: mockGames[2]?.id ?? '',
      title: mockGames[2]?.title ?? 'Hades',
      genre: mockGames[2]?.genre ?? 'roguelike',
      platform: mockGames[2]?.platform ?? 'PC',
      cover_url: mockGames[2]?.cover_url ?? null,
    },
  },
  {
    id: 'activity-3',
    user_id: mockUsers[0]?.id ?? '',
    action: 'wishlist_added',
    duration_minutes: null,
    created_at: '2025-03-09T09:10:00Z',
    game: {
      id: mockGames[3]?.id ?? '',
      title: mockGames[3]?.title ?? 'Elden Ring',
      genre: mockGames[3]?.genre ?? 'action-rpg',
      platform: mockGames[3]?.platform ?? 'PS5',
      cover_url: mockGames[3]?.cover_url ?? null,
    },
  },
]

let mockNotifications: NotificationItem[] = [
  {
    id: 'notification-1',
    user_id: mockUsers[0]?.id ?? '',
    type: 'activity_notification',
    message: 'Your privacy dashboard noticed a new play session for Hollow Knight.',
    read: false,
    created_at: '2025-03-11T18:31:00Z',
  },
  {
    id: 'notification-2',
    user_id: mockUsers[0]?.id ?? '',
    type: 'activity_notification',
    message: 'Tracking is currently enabled. You can withdraw consent at any time.',
    read: true,
    created_at: '2025-03-08T11:00:00Z',
  },
]

const consentStore = new Map<string, ConsentRecord>([
  [
    mockUsers[0]?.id ?? '',
    {
      user_id: mockUsers[0]?.id ?? '',
      granted: true,
      updated_at: '2025-03-08T10:30:00Z',
    },
  ],
  [
    mockUsers[1]?.id ?? '',
    {
      user_id: mockUsers[1]?.id ?? '',
      granted: false,
      updated_at: '2025-03-07T15:00:00Z',
    },
  ],
])

let mockLogs: ActivityLogEntry[] = [
  {
    id: 1,
    user_id: mockUsers[0]?.id ?? '',
    game_id: mockGames[0]?.id ?? '',
    action: 'played',
    message: 'Someone just played Hollow Knight',
    created_at: '2025-03-11T18:31:00Z',
  },
  {
    id: 2,
    user_id: mockUsers[0]?.id ?? '',
    game_id: mockGames[3]?.id ?? '',
    action: 'wishlist_added',
    message: 'Someone just wishlist_added Elden Ring',
    created_at: '2025-03-09T09:10:30Z',
  },
]

const mockAccounts: Record<string, { password: string; role: string }> = {
  testuser: { password: 'password', role: 'gamer' },
  admin: { password: 'adminpass', role: 'admin' },
}

function paginate<T>(items: T[], limit = 20, offset = 0) {
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    limit,
    offset,
  }
}

function getConsentRecord(userId: string) {
  return consentStore.get(userId) ?? null
}

export const mockUsersApi = {
  list: async (limit = 20, offset = 0): Promise<UserList> => {
    await delay()
    const items = mockUsers.slice(offset, offset + limit)
    return { items, total: mockUsers.length, limit, offset }
  },

  get: async (id: string): Promise<User> => {
    await delay()
    const user = mockUsers.find(u => u.id === id)
    if (!user) throw new Error('User not found')
    return user
  },

  create: async (body: UserCreate): Promise<User> => {
    await delay()
    return {
      id: crypto.randomUUID(),
      username: body.username,
      email: body.email,
      is_active: true,
      created_at: new Date().toISOString(),
    }
  },
}

export const mockGamesApi = {
  list: async (limit = 20, offset = 0): Promise<GameList> => {
    await delay()
    const items = mockGames.slice(offset, offset + limit)
    return { items, total: mockGames.length, limit, offset }
  },

  get: async (id: string): Promise<Game> => {
    await delay()
    const game = mockGames.find(g => g.id === id)
    if (!game) throw new Error('Game not found')
    return game
  },

  search: async (q: string, limit = 20, offset = 0): Promise<GameList> => {
    await delay()
    const lower = q.toLowerCase()
    const all = mockGames.filter(g =>
      g.title.toLowerCase().includes(lower)
    )
    return { items: all.slice(offset, offset + limit), total: all.length, limit, offset }
  },

  create: async (body: GameCreate): Promise<Game> => {
    await delay()
    return {
      id: crypto.randomUUID(),
      title: body.title,
      genre: body.genre,
      platform: body.platform,
      release_year: body.release_year ?? null,
      cover_url: body.cover_url ?? null,
      created_at: new Date().toISOString(),
    }
  },
}

export const mockAuthApi = {
  login: async (username: string, password: string): Promise<AuthToken> => {
    await delay()
    const account = mockAccounts[username]

    if (!account || account.password !== password) {
      throw new Error('Incorrect username or password')
    }

    const token = {
      access_token: `mock-token:${username}`,
      token_type: 'bearer',
    }

    setAccessToken(token.access_token)
    return token
  },

  me: async (): Promise<SessionUser> => {
    await delay(120)

    const token = getAccessToken()
    const username = token?.startsWith('mock-token:') ? token.replace('mock-token:', '') : 'testuser'
    const role = mockAccounts[username]?.role ?? 'gamer'

    return {
      sub: username,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
  },

  logout: () => {
    setAccessToken(null)
  },
}

export const mockActivitiesApi = {
  list: async (limit = 20, offset = 0): Promise<ActivityList> => {
    await delay()
    return paginate(mockActivities, limit, offset)
  },

  listByUser: async (userId: string, limit = 20, offset = 0): Promise<ActivityList> => {
    await delay()
    return paginate(
      mockActivities.filter((activity) => activity.user_id === userId),
      limit,
      offset,
    )
  },

  create: async (body: ActivityCreate): Promise<Activity> => {
    await delay()

    const game = mockGames.find((item) => item.id === body.game_id)
    if (!game) {
      throw new Error('Game not found')
    }

    const activity: Activity = {
      id: crypto.randomUUID(),
      user_id: body.user_id,
      action: body.action,
      duration_minutes: body.duration_minutes ?? null,
      created_at: new Date().toISOString(),
      game: {
        id: game.id,
        title: game.title,
        genre: game.genre,
        platform: game.platform,
        cover_url: game.cover_url,
      },
    }

    mockActivities = [activity, ...mockActivities]

    const consent = getConsentRecord(body.user_id)
    if (consent?.granted) {
      mockLogs = [
        {
          id: mockLogs.length + 1,
          user_id: body.user_id,
          game_id: body.game_id,
          action: body.action,
          message: `Someone just ${body.action} ${game.title}`,
          created_at: activity.created_at,
        },
        ...mockLogs,
      ]

      mockNotifications = [
        {
          id: crypto.randomUUID(),
          user_id: body.user_id,
          type: 'activity_notification',
          message: `We stored this update because activity tracking is enabled: ${game.title}.`,
          read: false,
          created_at: activity.created_at,
        },
        ...mockNotifications,
      ]
    }

    return activity
  },
}

export const mockNotificationsApi = {
  listByUser: async (userId: string, limit = 20, offset = 0): Promise<NotificationList> => {
    await delay()
    return paginate(
      mockNotifications.filter((notification) => notification.user_id === userId),
      limit,
      offset,
    )
  },
}

export const mockPrivacyApi = {
  getConsent: async (userId: string): Promise<ConsentRecord | null> => {
    await delay()
    return getConsentRecord(userId)
  },

  setConsent: async (userId: string, granted: boolean): Promise<ConsentRecord> => {
    await delay()

    const record = {
      user_id: userId,
      granted,
      updated_at: new Date().toISOString(),
    }

    consentStore.set(userId, record)
    return record
  },

  withdrawConsent: async (userId: string): Promise<ConsentRecord> => {
    await delay()
    const record = {
      user_id: userId,
      granted: false,
      updated_at: new Date().toISOString(),
    }

    consentStore.set(userId, record)
    return record
  },

  listLogs: async (userId: string): Promise<ActivityLogList> => {
    await delay()
    const items = mockLogs.filter((log) => log.user_id === userId)
    return { items, total: items.length }
  },

  deleteLogs: async (userId: string) => {
    await delay()
    const before = mockLogs.length
    mockLogs = mockLogs.filter((log) => log.user_id !== userId)
    return {
      user_id: userId,
      deleted_entries: before - mockLogs.length,
    }
  },
}

export const mockHealthApi = {
  get: async (): Promise<GatewayHealth> => {
    await delay(140)
    return {
      status: 'ok',
      service: 'gateway',
      services: {
        users: 'ok',
        games: 'ok',
        activities: 'ok',
        notifications: 'async',
        auth: 'ok',
        logging: 'ok',
      },
    }
  },
}
