import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { authApi, type SessionUser } from './api/auth'
import { getAccessToken } from './api/client'
import { usersApi, type User } from './api/users'
import DataPage from './pages/DataPage'
import DiscoverPage from './pages/DiscoverPage'
import PlayPage from './pages/PlayPage'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const PROFILE_STORAGE_KEY = 'gamehub.selected_profile'

const App = () => {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(getAccessToken()))
  const [authError, setAuthError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<User[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [profilesError, setProfilesError] = useState<string | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return window.localStorage.getItem(PROFILE_STORAGE_KEY)
  })

  useEffect(() => {
    if (!getAccessToken()) {
      setAuthLoading(false)
      return
    }

    authApi.me()
      .then((currentSession) => {
        setSession(currentSession)
        setAuthError(null)
      })
      .catch((error: Error) => {
        authApi.logout()
        setAuthError(error.message)
        setSession(null)
      })
      .finally(() => {
        setAuthLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!USE_MOCK && !session) {
      setProfiles([])
      return
    }

    let isCancelled = false
    setProfilesLoading(true)
    setProfilesError(null)

    usersApi.list()
      .then((response) => {
        if (isCancelled) {
          return
        }

        setProfiles(response.items)
        setSelectedProfileId((current) => current ?? response.items[0]?.id ?? null)
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setProfilesError(error.message)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setProfilesLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [session])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (selectedProfileId) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, selectedProfileId)
    } else {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    }
  }, [selectedProfileId])

  const handleLogin = async (username: string, password: string) => {
    setAuthLoading(true)
    setAuthError(null)

    try {
      await authApi.login(username, password)
      const currentSession = await authApi.me()
      setSession(currentSession)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in')
      setSession(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    setSession(null)
    setAuthError(null)
  }

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <p className="brand-kicker">GameHub</p>
          <div>
            <h1>Privacy-First Player Hub</h1>
            <p>Consent-aware play tracking for a modern player platform.</p>
          </div>
        </div>

        <nav className="main-nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
            Play
          </NavLink>
          <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
            Discover
          </NavLink>
          <NavLink to="/your-data" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
            Your Data
          </NavLink>
        </nav>

        <div className="header-meta">
          <span className="pill pill--muted">{USE_MOCK ? 'Mock mode' : 'Gateway mode'}</span>
          <span className="header-copy">
            {session ? `Signed in as ${session.sub}` : 'Browsing with tracking off by default'}
          </span>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <PlayPage
                authError={authError}
                authLoading={authLoading}
                isMock={USE_MOCK}
                onLogin={handleLogin}
                onLogout={handleLogout}
                profiles={profiles}
                profilesError={profilesError}
                profilesLoading={profilesLoading}
                selectedProfile={selectedProfile}
                selectedProfileId={selectedProfileId}
                session={session}
                setSelectedProfileId={setSelectedProfileId}
              />
            }
          />
          <Route path="/discover" element={<DiscoverPage isMock={USE_MOCK} profiles={profiles} session={session} />} />
          <Route path="/your-data" element={<DataPage isMock={USE_MOCK} selectedProfile={selectedProfile} session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
