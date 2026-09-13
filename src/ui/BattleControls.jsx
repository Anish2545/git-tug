import React from 'react'
import { useBattleStore } from '../store/battleStore'

export default function BattleControls({ onStart, onSwap, onRandom }) {
  const battleState = useBattleStore((s) => s.battleState)
  const p1 = useBattleStore((s) => s.p1)
  const p2 = useBattleStore((s) => s.p2)

  const battling = battleState === 'BATTLING'
  const countdown = battleState === 'COUNTDOWN'
  const disabled = battling || countdown || !p1 || !p2

  const label = battling
    ? 'PULL IN PROGRESS...'
    : countdown
      ? 'COUNTDOWN...'
      : 'PULL THE ROPE'

  return (
    <div className="center-match-action">
      <span className="versus-mark">VS</span>
      <button
        className={`btn-battle-launch ${battling ? 'battling' : ''}`}
        onClick={onStart}
        disabled={disabled}
      >
        <span className="launch-label">{label}</span>
        <span className="launch-sub">COMMIT-POWERED CABLE</span>
      </button>
      <div className="roster-tools">
        <button className="btn-tactile-tool" onClick={onSwap} title="Swap sides">
          ⇄ Swap
        </button>
        <button className="btn-tactile-tool" onClick={onRandom} title="Random matchup">
          ⚄ Random
        </button>
      </div>
      <span className="mechanics-pill">5 PHASES · AUTO / MASH</span>
    </div>
  )
}
