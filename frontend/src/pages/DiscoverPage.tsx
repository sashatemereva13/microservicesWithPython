import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { gamesApi, type Game } from '../api/games'
import { type SessionUser } from '../api/auth'
import { type User } from '../api/users'

interface DiscoverPageProps {
  isMock: boolean
  profiles: User[]
  session: SessionUser | null
}

const DiscoverPage = ({ isMock, profiles, session }: DiscoverPageProps) => {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [games, setGames] = useState<Game[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canBrowse = isMock || Boolean(session)
  const activeProfiles = profiles.filter((profile) => profile.is_active).slice(0, 4)
  const spotlightGame = games[0] ?? null
  const editorialMix = games.slice(1, 4)
  const genreShelves = Array.from(
    games.reduce((shelves, game) => {
      const shelf = shelves.get(game.genre) ?? []
      shelf.push(game)
      shelves.set(game.genre, shelf)
      return shelves
    }, new Map<string, Game[]>()),
  ).slice(0, 3)

  useEffect(() => {
    if (!canBrowse) {
      setGames([])
      setTotal(0)
      setError(null)
      return
    }

    let isCancelled = false
    setLoading(true)
    setError(null)

    const request = deferredSearch.trim()
      ? gamesApi.search(deferredSearch.trim(), 12, 0)
      : gamesApi.list(12, 0)

    request
      .then((response) => {
        if (isCancelled) {
          return
        }

        startTransition(() => {
          setGames(response.items)
          setTotal(response.total)
        })
      })
      .catch((requestError: Error) => {
        if (!isCancelled) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [canBrowse, deferredSearch])

  return (
    <div className="page-shell">
      <section className="hero-card hero-card--discover">
        <div>
          <p className="eyebrow">Discover the scene</p>
          <h1>Browse with taste, not tracking.</h1>
          <p className="hero-copy">
            This version leans more refined than loud: curated shelves, better hierarchy, and a calmer editorial rhythm that still feels contemporary.
          </p>
          <div className="trend-row">
            <span className="trend-chip">Editorial shelves</span>
            <span className="trend-chip">Sharper typography</span>
            <span className="trend-chip">Privacy-first by default</span>
          </div>
        </div>
        <div className="discover-scoreboard">
          <div className="score-card">
            <strong>{total}</strong>
            <span>Games in rotation</span>
          </div>
          <div className="score-card">
            <strong>{activeProfiles.length || profiles.length}</strong>
            <span>Visible players</span>
          </div>
          <div className="score-card">
            <strong>{isMock ? 'Open' : 'Signed-in'}</strong>
            <span>Browse mode</span>
          </div>
        </div>
      </section>

      <section className="discover-stage">
        <article className="spotlight-card">
          <div className="spotlight-card__label">Spotlight pick</div>
          {spotlightGame ? (
            <>
              <div className="spotlight-card__visual">
                {spotlightGame.cover_url ? (
                  <img src={spotlightGame.cover_url} alt={spotlightGame.title} />
                ) : (
                  <div className="cover-placeholder">No cover</div>
                )}
              </div>
              <div className="spotlight-card__body">
                <div className="spotlight-card__meta">
                  <span>{spotlightGame.genre}</span>
                  <span>{spotlightGame.platform}</span>
                  <span>{spotlightGame.release_year ?? 'Year unknown'}</span>
                </div>
                <h2>{spotlightGame.title}</h2>
                <p>
                  The spotlight leads with restraint: a strong cover, tight metadata, and enough atmosphere to make the catalogue feel selected rather than dumped on screen.
                </p>
              </div>
            </>
          ) : (
            <div className="spotlight-card__empty">
              <p>The spotlight warms up as soon as the catalogue loads.</p>
            </div>
          )}
        </article>

        <aside className="discover-rail">
          <section className="panel panel--accent">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Catalogue controls</p>
                <h2>Search with intent</h2>
              </div>
              <span className="panel-note">{total} results</span>
            </div>

            <label className="field">
              <span>Search by title</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try Hades, Hollow Knight, Stardew Valley…"
              />
            </label>

            {loading && <p className="supporting-text">Refreshing the catalogue…</p>}
            {error && <p className="status-message status-message--error">{error}</p>}
            {!canBrowse && (
              <p className="supporting-text">
                Sign in to browse live gateway data. The current gateway still enforces JWTs for catalogue routes.
              </p>
            )}
          </section>

          <section className="panel panel--contrast">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Privacy note</p>
                <h2>Browse first, opt in later</h2>
              </div>
            </div>

            <p className="supporting-text supporting-text--contrast">
              Discovery stays lightweight until the player explicitly chooses tracking. The interface can feel premium without becoming manipulative.
            </p>

            <div className="manifesto-list">
              <div>
                <strong>Visible control</strong>
                <span>Tracking is never implied by scrolling.</span>
              </div>
              <div>
                <strong>Sharper curation</strong>
                <span>Use shelves and spotlight instead of endless sameness.</span>
              </div>
              <div>
                <strong>Game culture tone</strong>
                <span>More personality, less enterprise blandness.</span>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <div className="content-grid">
        <section className="panel panel--editorial">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Now trending</p>
              <h2>Editorial mix</h2>
            </div>
            <span className="panel-note">Three fast recommendations</span>
          </div>

          <div className="editorial-grid">
            {editorialMix.map((game) => (
              <article key={game.id} className="game-card">
                <div className="game-card__cover">
                  {game.cover_url ? (
                    <img src={game.cover_url} alt={game.title} />
                  ) : (
                    <div className="cover-placeholder">No cover</div>
                  )}
                </div>
                <div className="game-card__content">
                  <span className="game-card__tag">{game.genre}</span>
                  <h3>{game.title}</h3>
                  <p>{game.platform} · {game.release_year ?? 'Unknown year'}</p>
                  <small>{game.release_year ?? 'Release year not shared'}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Crew radar</p>
              <h2>Visible profiles</h2>
            </div>
            <span className="panel-note">Only the useful stuff</span>
          </div>

          {activeProfiles.length === 0 ? (
            <p className="supporting-text">Profiles appear here after a successful session or in mock preview mode.</p>
          ) : (
            <div className="profile-list">
              {activeProfiles.map((profile) => (
                <article key={profile.id} className="profile-card">
                  <div className="profile-avatar">
                    {profile.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong>{profile.username}</strong>
                    <p>{profile.email}</p>
                    <small>{profile.is_active ? 'Active account' : 'Inactive account'}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel panel--shelves">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Shelves</p>
            <h2>Browse by mood, not just by database row</h2>
          </div>
          <span className="panel-note">Magazine-like grouping for 2025-2026 energy</span>
        </div>

        <div className="shelf-grid">
          {genreShelves.map(([genre, shelfGames], index) => (
            <article key={genre} className={`shelf-card shelf-card--${index % 3}`}>
              <div className="shelf-card__head">
                <span className="shelf-card__label">{genre}</span>
                <strong>{shelfGames.length} pick{shelfGames.length > 1 ? 's' : ''}</strong>
              </div>

              <div className="shelf-stack">
                {shelfGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="shelf-stack__item">
                    <span>{game.title}</span>
                    <small>{game.platform}</small>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="signal-banner">
        <div>
          <span className="signal-banner__label">Design direction</span>
          <strong>Refined game culture, with privacy cues that stay obvious.</strong>
        </div>
        <p>
          The goal is a stronger visual identity without noisy color clashes, novelty fonts, or dark patterns sneaking in with the extra polish.
        </p>
      </section>
    </div>
  )
}

export default DiscoverPage
