import { useEffect, useState } from 'react'
import { type SessionUser } from '../api/auth'
import { healthApi, type GatewayHealth } from '../api/health'
import { privacyApi, type ActivityLogEntry, type ConsentRecord } from '../api/consent'
import { type User } from '../api/users'

interface DataPageProps {
  isMock: boolean
  selectedProfile: User | null
  session: SessionUser | null
}

const DataPage = ({ isMock, selectedProfile, session }: DataPageProps) => {
  const [consent, setConsent] = useState<ConsentRecord | null>(null)
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [health, setHealth] = useState<GatewayHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'consent' | 'erase' | null>(null)

  const canUsePrivateApis = isMock || Boolean(session)

  useEffect(() => {
    let isCancelled = false
    setError(null)

    healthApi.get()
      .then((payload) => {
        if (!isCancelled) {
          setHealth(payload)
        }
      })
      .catch((healthError: Error) => {
        if (!isCancelled) {
          setError(healthError.message)
        }
      })

    if (!canUsePrivateApis || !selectedProfile) {
      setConsent(null)
      setLogs([])
      return () => {
        isCancelled = true
      }
    }

    setLoading(true)

    Promise.all([
      privacyApi.getConsent(selectedProfile.id),
      privacyApi.listLogs(selectedProfile.id),
    ])
      .then(([consentResponse, logsResponse]) => {
        if (isCancelled) {
          return
        }

        setConsent(consentResponse)
        setLogs(logsResponse.items)
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
  }, [canUsePrivateApis, selectedProfile])

  const toggleConsent = async () => {
    if (!selectedProfile) {
      return
    }

    setBusyAction('consent')
    setError(null)

    try {
      const nextConsent = consent?.granted
        ? await privacyApi.withdrawConsent(selectedProfile.id)
        : await privacyApi.setConsent(selectedProfile.id, true)

      setConsent(nextConsent)
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update consent')
    } finally {
      setBusyAction(null)
    }
  }

  const eraseLogs = async () => {
    if (!selectedProfile || !window.confirm('Erase all stored activity logs for this profile?')) {
      return
    }

    setBusyAction('erase')
    setError(null)

    try {
      await privacyApi.deleteLogs(selectedProfile.id)
      setLogs([])
    } catch (eraseError) {
      setError(eraseError instanceof Error ? eraseError.message : 'Unable to erase logs')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="page-shell">
      <section className="hero-card hero-card--data">
        <div>
          <p className="eyebrow">Your data</p>
          <h1>See the tradeoff before you opt in.</h1>
          <p className="hero-copy">
            Personalisation is optional. This space explains what GameHub keeps, what stays off by default, and how you can reverse that decision at any time.
          </p>
        </div>
        <div className="hero-rights">
          <div className="rights-chip">Informed</div>
          <div className="rights-chip">Access</div>
          <div className="rights-chip">Erasure</div>
          <div className="rights-chip">Portability-minded</div>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Controls</p>
              <h2>Consent and retention</h2>
            </div>
            <span className={`pill ${consent?.granted ? 'pill--ok' : 'pill--muted'}`}>
              {consent?.granted ? 'Tracking on' : 'Tracking off'}
            </span>
          </div>

          {!selectedProfile ? (
            <p className="supporting-text">
              Choose a player profile from Play to manage consent and deletion rights.
            </p>
          ) : (
            <div className="stack">
              <div className="data-summary">
                <strong>{selectedProfile.username}</strong>
                <span>{selectedProfile.email}</span>
                <small>
                  {consent?.granted
                    ? 'Activity logs can be written for this profile.'
                    : 'No optional play history should be stored for this profile.'}
                </small>
              </div>

              <div className="action-row">
                <button type="button" className="button" onClick={toggleConsent} disabled={busyAction === 'consent' || !canUsePrivateApis}>
                  {busyAction === 'consent'
                    ? 'Updating…'
                    : consent?.granted
                      ? 'Withdraw consent'
                      : 'Enable activity tracking'}
                </button>
                <button type="button" className="button button--ghost" onClick={eraseLogs} disabled={busyAction === 'erase' || !canUsePrivateApis}>
                  {busyAction === 'erase' ? 'Erasing…' : 'Erase stored logs'}
                </button>
              </div>

              <div className="notice notice--soft">
                <strong>What changes when consent is off?</strong>
                <span>
                  Browsing still works. New optional activity signals should no longer be retained by the logging service, and existing stored log entries can be removed here.
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Rights</p>
              <h2>Plain-language GDPR summary</h2>
            </div>
          </div>

          <div className="rights-grid">
            <article className="rights-card">
              <strong>Be informed</strong>
              <p>We explain the purpose, legal basis, storage behavior, and how to withdraw consent in plain language.</p>
            </article>
            <article className="rights-card">
              <strong>Access and review</strong>
              <p>You can inspect the activity log entries stored for the selected profile in this space.</p>
            </article>
            <article className="rights-card">
              <strong>Erase</strong>
              <p>You can trigger deletion of stored log entries directly from the interface.</p>
            </article>
            <article className="rights-card">
              <strong>Minimise by default</strong>
              <p>Discovery works with the least data possible, while optional tracking stays off until enabled.</p>
            </article>
          </div>
        </section>
      </div>

      <div className="content-grid content-grid--wide">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Stored activity</p>
              <h2>What the logging service currently has</h2>
            </div>
            <span className="panel-note">{logs.length} entries</span>
          </div>

          {loading ? (
            <p className="supporting-text">Loading your stored activity…</p>
          ) : logs.length === 0 ? (
            <p className="supporting-text">No stored activity logs for this profile right now.</p>
          ) : (
            <div className="log-list">
              {logs.map((log) => (
                <article key={log.id} className="log-card">
                  <div>
                    <strong>{log.action.replace('_', ' ')}</strong>
                    <p>{log.message ?? 'No message supplied'}</p>
                  </div>
                  <small>{new Date(log.created_at).toLocaleString()}</small>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">System transparency</p>
              <h2>Gateway health</h2>
            </div>
          </div>

          {health ? (
            <div className="health-card">
              <div className="health-headline">
                <strong>{health.service}</strong>
                <span className={`pill ${health.status === 'ok' ? 'pill--ok' : 'pill--muted'}`}>
                  {health.status}
                </span>
              </div>

              {health.services ? (
                <div className="health-grid">
                  {Object.entries(health.services).map(([serviceName, serviceStatus]) => (
                    <div key={serviceName} className="health-grid__item">
                      <span>{serviceName}</span>
                      <strong>{serviceStatus}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="supporting-text">
                  This gateway currently reports only its own status. The aggregate service panel is ready to expand when the backend exposes it.
                </p>
              )}
            </div>
          ) : (
            <p className="supporting-text">Waiting for gateway health details…</p>
          )}

          {error && <p className="status-message status-message--error">{error}</p>}
        </section>
      </div>
    </div>
  )
}

export default DataPage
