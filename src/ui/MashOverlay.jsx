import React from 'react'
import { useBattleStore } from '../store/battleStore'

export default function MashOverlay({ onMash }) {
  const mode = useBattleStore((s) => s.mode)
  const battleState = useBattleStore((s) => s.battleState)

  if (mode !== 'mash') return null
  // Show during idle too so players see controls, highlight during battle
  const active = battleState === 'BATTLING'

  return (
    <div className="mash-controls-overlay" style={{ display: 'flex', opacity: active ? 1 : 0.55 }}>
      <div className="mash-side mash-p1">
        <button
          className="mash-tactile-btn"
          onPointerDown={() => onMash(1)}
          title="P1 mash (A)"
        >
          <span className="mash-hint">PRESS [A]</span>
          <span className="mash-action">P1 TUG</span>
        </button>
      </div>
      <div className="mash-side mash-p2">
        <button
          className="mash-tactile-btn"
          onPointerDown={() => onMash(2)}
          title="P2 mash (L)"
        >
          <span className="mash-hint">PRESS [L]</span>
          <span className="mash-action">P2 TUG</span>
        </button>
      </div>
    </div>
  )
}
