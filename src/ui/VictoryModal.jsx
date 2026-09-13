import React, { useState } from 'react'
import { useBattleStore } from '../store/battleStore'

export default function VictoryModal({ onRematch, onNewMatch }) {
  const showVictory = useBattleStore((s) => s.showVictory)
  const winner = useBattleStore((s) => s.winner)
  const loser = useBattleStore((s) => s.loser)
  const p1 = useBattleStore((s) => s.p1)
  const p2 = useBattleStore((s) => s.p2)
  const [copied, setCopied] = useState(false)

  if (!showVictory || !winner || !loser || !p1 || !p2) return null

  const isP1Winner = winner.login === p1.login
  const commitDiff = Math.abs(winner.stats.commits - loser.stats.commits)

  const share = async () => {
    const text = `GitTug 1v1 Match Result:\n\nWinner: @${winner.login} (${winner.stats.commits.toLocaleString()} commits)\nRunner-Up: @${loser.login} (${loser.stats.commits.toLocaleString()} commits)\nMargin: ${commitDiff.toLocaleString()} commit volume differential.\n\nSimulated via GitTug 3D Arena.`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="victory-modal-overlay" onClick={onNewMatch}>
      <div className="modal-card animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-badge">🏆</div>
        <h2 className="victory-heading">MATCH CONCLUDED</h2>
        <p className="victory-subtext">Dominant cable displacement secured by @{winner.login}</p>

        <div className="winner-profile-showcase">
          <div className={`winner-avatar-frame ${isP1Winner ? 'blue-accent' : 'red-accent'}`}>
            <img src={winner.avatar_url} alt={winner.login} className="winner-avatar" />
          </div>
          <h3 className="winner-name">{winner.name || winner.login}</h3>
          <span className="winner-handle">@{winner.login}</span>
          <div className="winner-pill">TUG-OF-WAR CHAMPION</div>
        </div>

        <div className="stat-comparison-matrix">
          <div className="matrix-header">
            <span className="player-col left-p">@{p1.login}</span>
            <span className="metric-col">STATISTIC</span>
            <span className="player-col right-p">@{p2.login}</span>
          </div>
          {[
            { label: 'Commits', a: p1.stats.commits, b: p2.stats.commits },
            { label: 'Repositories', a: p1.stats.repos, b: p2.stats.repos },
            { label: 'Stargazers', a: p1.stats.stars, b: p2.stats.stars },
            { label: 'Push Velocity', a: `${p1.stats.velocity}%`, b: `${p2.stats.velocity}%`, rawA: p1.stats.velocity, rawB: p2.stats.velocity },
            { label: 'Composite TPI', a: p1.stats.tugPower, b: p2.stats.tugPower, bold: true },
          ].map((row) => {
            const rawA = row.rawA ?? row.a
            const rawB = row.rawB ?? row.b
            const winLeft = Number(String(rawA).replace(/[^0-9]/g, '')) >= Number(String(rawB).replace(/[^0-9]/g, ''))
            const fmt = (v) => (typeof v === 'number' ? v.toLocaleString() : v)
            return (
              <div key={row.label} className={`matrix-row ${winLeft ? 'win-left' : 'win-right'}`}>
                <span className="val-left">{fmt(row.a)}</span>
                <span className={`metric-label ${row.bold ? 'font-bold' : ''}`}>{row.label}</span>
                <span className="val-right">{fmt(row.b)}</span>
              </div>
            )
          })}
        </div>

        <div className="modal-actions">
          <button className="btn-modal-action btn-share" onClick={share}>
            <span>Copy Match Card</span>
          </button>
          <button className="btn-modal-action btn-primary" onClick={onRematch}>
            <span>Rematch</span>
          </button>
          <button className="btn-modal-action btn-secondary" onClick={onNewMatch}>
            <span>Change Contenders</span>
          </button>
        </div>
        {copied && <div className="share-toast">Match summary copied to clipboard.</div>}
      </div>
    </div>
  )
}
