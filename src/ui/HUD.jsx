import React from 'react'
import { useBattleStore } from '../store/battleStore'

export default function HUD() {
  const p1 = useBattleStore((s) => s.p1)
  const p2 = useBattleStore((s) => s.p2)
  const ropeOffset = useBattleStore((s) => s.ropeOffset)
  const tension = useBattleStore((s) => s.tension)
  const roundIndex = useBattleStore((s) => s.roundIndex)
  const roundName = useBattleStore((s) => s.roundName)
  const roundTotal = useBattleStore((s) => s.roundTotal)
  const battleState = useBattleStore((s) => s.battleState)

  const markerPos = Math.max(5, Math.min(95, 50 + ropeOffset / 2))
  const tensionPct = Math.round(tension * 100)

  const statusLabel =
    battleState === 'BATTLING'
      ? roundName
        ? `PHASE ${roundIndex + 1}/${roundTotal}: ${roundName.toUpperCase()}`
        : 'PULL IN PROGRESS'
      : battleState === 'COUNTDOWN'
        ? 'COUNTDOWN...'
        : battleState === 'FINISHED'
          ? 'MATCH CONCLUDED'
          : 'STANDBY'

  return (
    <div className="arena-hud">
      <div className="hud-player hud-p1">
        <div
          className="hud-avatar"
          style={p1 ? { backgroundImage: `url(${p1.avatar_url})` } : undefined}
        />
        <div className="hud-info">
          <span className="hud-username">{p1 ? p1.name || `@${p1.login}` : 'Challenger 1'}</span>
          <span className="hud-metric">
            {p1 ? `${p1.stats.commits.toLocaleString()} Commits` : 'Standby'}
          </span>
        </div>
      </div>

      <div className="hud-center">
        <span className="match-status-badge">{statusLabel}</span>
        <div className="cable-displacement-bar">
          <span className="zone-label zone-left">P1</span>
          <div className="displacement-track">
            <div className="center-target-line" />
            <div className="displacement-marker" style={{ left: `${markerPos}%` }} />
          </div>
          <span className="zone-label zone-right">P2</span>
        </div>
        <div className="tension-readout">
          <span>TENSION</span>
          <div className="tension-meter-bar">
            <div className="tension-meter-fill" style={{ width: `${tensionPct}%` }} />
          </div>
          <span className="tension-percent">{tensionPct}%</span>
        </div>
      </div>

      <div className="hud-player hud-p2">
        <div className="hud-info text-right">
          <span className="hud-username">{p2 ? p2.name || `@${p2.login}` : 'Challenger 2'}</span>
          <span className="hud-metric">
            {p2 ? `${p2.stats.commits.toLocaleString()} Commits` : 'Standby'}
          </span>
        </div>
        <div
          className="hud-avatar"
          style={p2 ? { backgroundImage: `url(${p2.avatar_url})` } : undefined}
        />
      </div>
    </div>
  )
}
