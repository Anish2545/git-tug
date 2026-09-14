import React, { useState } from 'react'
import { useBattleStore } from '../store/battleStore'

export default function FighterCard({ side, onSearch }) {
  const isP1 = side === 'p1'
  const fighter = useBattleStore((s) => (isP1 ? s.p1 : s.p2))
  const loading = useBattleStore((s) => (isP1 ? s.loadingP1 : s.loadingP2))
  const [draft, setDraft] = useState('')

  const cornerTitle = isP1 ? 'BLUE PLATFORM' : 'RED PLATFORM'
  const cornerClass = isP1 ? 'corner-blue' : 'corner-red'

  const stats = fighter?.stats || { commits: 0, repos: 0, stars: 0, velocity: 0, tugPower: 0 }
  const avatarUrl = fighter?.avatar_url || ''
  const displayName = fighter?.name || (isP1 ? 'Challenger 1' : 'Challenger 2')
  const login = fighter?.login || ''
  const bio = fighter?.bio || 'Enter public GitHub username to summon contender...'

  const submit = (e) => {
    e.preventDefault()
    const q = draft.trim() || login
    if (q && onSearch) onSearch(q)
    setDraft('')
  }

  return (
    <div className={`fighter-card ${cornerClass}`}>
      <div className="card-meta-bar">
        <span className="platform-tag">{cornerTitle}</span>
        {fighter ? (
          fighter.isSimulated ? (
            <span className="tag-simulated">ESTIMATED METRICS</span>
          ) : (
            <span className="tag-live">VERIFIED API</span>
          )
        ) : (
          <span className="tag-simulated">{loading ? 'SCANNING...' : 'STANDBY'}</span>
        )}
      </div>

      <div className="fighter-profile-row">
        <div className="profile-avatar-frame">
          {avatarUrl ? (
            <img src={avatarUrl} alt={login} className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-fallback">
              {(login || (isP1 ? 'P1' : 'P2')).slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-meta">
          <h3 className="profile-display-name">{displayName}</h3>
          <span className="profile-handle">{login ? `@${login}` : 'Standby'}</span>
        </div>
      </div>

      <p className="profile-bio-text">{bio}</p>

      <form className="handle-input-form" onSubmit={submit}>
        <div className="handle-input-group">
          <span className="handle-prefix">github.com/</span>
          <input
            type="text"
            className="handle-input"
            placeholder={login || 'username'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" className="handle-submit-btn" title="Inspect Developer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      </form>

      <div className="metrics-grid">
        <div className="metric-tile tile-primary" title="Primary Cable Pull Force — Round 1, 35% weight">
          <div className="metric-numbers">
            <span className="metric-number-val">{stats.commits.toLocaleString()}</span>
            <span className="metric-number-label">Commits · 35%</span>
          </div>
        </div>
        <div className="metric-tile" title="Repository Structural Weight">
          <div className="metric-numbers">
            <span className="metric-number-val">{stats.repos.toLocaleString()}</span>
            <span className="metric-number-label">Repositories</span>
          </div>
        </div>
        <div className="metric-tile" title="Total Stargazer Pull">
          <div className="metric-numbers">
            <span className="metric-number-val">{stats.stars.toLocaleString()}</span>
            <span className="metric-number-label">Stargazers</span>
          </div>
        </div>
        <div className="metric-tile" title="Recent Push Cadence">
          <div className="metric-numbers">
            <span className="metric-number-val">{stats.velocity}%</span>
            <span className="metric-number-label">Push Cadence</span>
          </div>
        </div>
      </div>

      <div className="tpi-container">
        <div className="tpi-meta">
          <span className="tpi-title">TUG POWER INDEX</span>
          <span className="tpi-val">{stats.tugPower.toLocaleString()}</span>
        </div>
        <div className="tpi-track">
          <div
            className="tpi-fill"
            style={{ width: `${Math.min(100, (stats.tugPower / 25000) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
