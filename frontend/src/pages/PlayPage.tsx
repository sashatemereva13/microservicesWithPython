import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { activitiesApi, type Activity } from '../api/activities'
import { type SessionUser } from '../api/auth'
import { privacyApi, type ConsentRecord } from '../api/consent'
import { gamesApi, type Game } from '../api/games'
import { notificationsApi, type NotificationItem } from '../api/notifications'
import { type User } from '../api/users'

interface PlayPageProps {
  authError: string | null
  authLoading: boolean
  isMock: boolean
  onLogin: (username: string, password: string) => Promise<void>
  onLogout: () => void
  profiles: User[]
  profilesError: string | null
  profilesLoading: boolean
  selectedProfile: User | null
  selectedProfileId: string | null
  session: SessionUser | null
  setSelectedProfileId: (id: string) => void
}

const PlayPage = ({
  authError,
  authLoading,
  isMock,
  onLogin,
  onLogout,
  profiles,
  profilesError,
  profilesLoading,
  selectedProfile,
  selectedProfileId,
  session,
  setSelectedProfileId,
}: PlayPageProps) => {
  const [username, setUsername] = useState('testuser')
  const [password, setPassword] = useState('password')
  const [games, setGames] = useState<Game[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [consent, setConsent] = useState<ConsentRecord | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedGameId, setSelectedGameId] = useState('')
  const [action, setAction] = useState<Activity['action']>('played')
  const [durationMinutes, setDurationMinutes] = useState('90')

  const canUsePrivateApis = isMock || Boolean(session)

  useEffect(() => {
    if (!canUsePrivateApis) {
      setGames([])
      setActivities([])
      setNotifications([])
      setConsent(null)
      return
    }

    let isCancelled = false
    setLoadingFeed(true)
    setPageError(null)

    Promise.all([
      gamesApi.list(6, 0),
      activitiesApi.list(6, 0),
      selectedProfileId ? notificationsApi.listByUser(selectedProfileId, 4, 0) : Promise.resolve(null),
      selectedProfileId ? privacyApi.getConsent(selectedProfileId) : Promise.resolve(null),
    ])
      .then(([gamesResponse, activitiesResponse, notificationsResponse, consentResponse]) => {
        if (isCancelled) {
          return
        }

        setGames(gamesResponse.items)
        setActivities(activitiesResponse.items)
        setNotifications(notificationsResponse?.items ?? [])
        setConsent(consentResponse)
        setSelectedGameId((current) => current || gamesResponse.items[0]?.id || '')
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setPageError(error.message)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingFeed(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [canUsePrivateApis, isMock, selectedProfileId])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onLogin(username, password)
  }

  const handleSubmitActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedProfileId || !selectedGameId) {
      return
    }

    setSubmitting(true)
    setPageError(null)

    try {
      const created = await activitiesApi.create({
        user_id: selectedProfileId,
        game_id: selectedGameId,
        action,
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
      })

      setActivities((current) => [created, ...current].slice(0, 6))

      const latestNotifications = await notificationsApi.listByUser(selectedProfileId, 4, 0)
      setNotifications(latestNotifications.items)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to store activity')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <section className="hero-card hero-card--play">
        <div>
          <p className="eyebrow">Play without dark patterns</p>
          <h1>Track what matters. Skip what doesn’t.</h1>
          <p className="hero-copy">
            GameHub only stores optional play signals after consent. Browsing and discovering games stays useful even when you keep tracking off.
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-value">Optional</span>
            <span className="metric-label">Activity tracking</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">1 click</span>
            <span className="metric-label">Withdraw consent</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Readable</span>
            <span className="metric-label">Data explanations</span>
          </div>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Identity</p>
              <h2>Sign in and pick a profile</h2>
            </div>
            {session && (
              <button type="button" className="button button--ghost" onClick={onLogout}>
                Sign out
              </button>
            )}
          </div>

          {!session && !isMock ? (
            <form className="stack" onSubmit={handleLogin}>
              <p className="supporting-text">
                The current gateway requires authentication before it will serve users, games, activities, consent, or notifications.
              </p>
              <div className="inline-fields">
                <label className="field">
                  <span>Username</span>
                  <input value={username} onChange={(event) => setUsername(event.target.value)} />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              </div>
              <div className="inline-note">
                <span>Demo credentials:</span>
                <code>testuser / password</code>
                <code>admin / adminpass</code>
              </div>
              {authError && <p className="status-message status-message--error">{authError}</p>}
              <button type="submit" className="button" disabled={authLoading}>
                {authLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div className="stack">
              <div className="session-banner">
                <div>
                  <span className="session-label">Session</span>
                  <strong>{session?.sub ?? 'Mock preview mode'}</strong>
                </div>
                <span className="pill">
                  {session?.role ?? 'gamer'} access
                </span>
              </div>

              <label className="field">
                <span>Active player profile</span>
                <select
                  value={selectedProfileId ?? ''}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                  disabled={profilesLoading || profiles.length === 0}
                >
                  {profiles.length === 0 && <option value="">No profiles available</option>}
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username} · {profile.email}
                    </option>
                  ))}
                </select>
              </label>

              {profilesLoading && <p className="supporting-text">Loading player profiles…</p>}
              {profilesError && <p className="status-message status-message--error">{profilesError}</p>}
              {selectedProfile && (
                <div className="identity-card">
                  <strong>{selectedProfile.username}</strong>
                  <span>{selectedProfile.email}</span>
                  <span>{consent?.granted ? 'Tracking enabled' : 'Tracking off by default'}</span>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Consent-aware activity</p>
              <h2>Log a session</h2>
            </div>
            <span className={`pill ${consent?.granted ? 'pill--ok' : 'pill--muted'}`}>
              {consent?.granted ? 'Stored with consent' : 'Storage disabled'}
            </span>
          </div>

          <form className="stack" onSubmit={handleSubmitActivity}>
            <label className="field">
              <span>Game</span>
              <select
                value={selectedGameId}
                onChange={(event) => setSelectedGameId(event.target.value)}
                disabled={!canUsePrivateApis || games.length === 0}
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title} · {game.platform}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-fields">
              <label className="field">
                <span>Action</span>
                <select value={action} onChange={(event) => setAction(event.target.value as Activity['action'])}>
                  <option value="played">Played</option>
                  <option value="completed">Completed</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="wishlist_added">Wishlist added</option>
                </select>
              </label>

              <label className="field">
                <span>Minutes</span>
                <input
                  inputMode="numeric"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>

            {!consent?.granted && (
              <div className="notice notice--soft">
                <strong>No tracking yet.</strong>
                <span>
                  You can still browse and prepare entries, but GameHub will only retain activity once you opt in from the Your Data space.
                </span>
              </div>
            )}

            {pageError && <p className="status-message status-message--error">{pageError}</p>}
            <button
              type="submit"
              className="button"
              disabled={!canUsePrivateApis || !selectedProfileId || !selectedGameId || !consent?.granted || submitting}
            >
              {submitting ? 'Saving session…' : 'Save activity'}
            </button>
          </form>
        </section>
      </div>

      <div className="content-grid content-grid--wide">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent play</p>
              <h2>Global activity feed</h2>
            </div>
            <span className="panel-note">Notifications arrive asynchronously after writes.</span>
          </div>

          {loadingFeed ? (
            <p className="supporting-text">Loading the feed…</p>
          ) : activities.length === 0 ? (
            <p className="supporting-text">No activity has been recorded yet.</p>
          ) : (
            <div className="activity-list">
              {activities.map((entry) => (
                <article key={entry.id} className="activity-card">
                  <div className="activity-card__media">
                    {entry.game?.cover_url ? (
                      <img src={entry.game.cover_url} alt={entry.game.title} />
                    ) : (
                      <div className="cover-placeholder">No cover</div>
                    )}
                  </div>
                  <div className="activity-card__body">
                    <div className="activity-card__header">
                      <strong>{entry.game?.title ?? 'Game unavailable'}</strong>
                      <span>{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <p>
                      <span className="pill pill--subtle">{entry.action.replace('_', ' ')}</span>
                      {entry.duration_minutes ? ` ${entry.duration_minutes} minutes logged` : ' Lightweight signal only'}
                    </p>
                    <small>
                      Player ID: {entry.user_id}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2>Privacy-minded notifications</h2>
            </div>
            <span className="panel-note">Current backend is read-only here.</span>
          </div>

          {notifications.length === 0 ? (
            <p className="supporting-text">No notifications for the selected profile yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article key={notification.id} className="notification-card">
                  <span className={`notification-indicator ${notification.read ? 'notification-indicator--read' : ''}`} />
                  <div>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.created_at).toLocaleString()}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default PlayPage
