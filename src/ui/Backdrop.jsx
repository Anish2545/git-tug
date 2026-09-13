import React, { useEffect, useRef } from 'react'
import { useBattleStore } from '../store/battleStore'

// Behind the 3D canvas (z 0): near-black base + faint battle-reactive glows.
// Driven via CSS variables in rAF — zero React re-renders at 60fps.
export function Backdrop() {
  const ref = useRef(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = ref.current
      if (el) {
        const { ropeOffset, tension, battleState } = useBattleStore.getState()
        const pull = Math.max(-1, Math.min(1, ropeOffset / 100))
        const active = battleState === 'BATTLING' ? 1 : 0.4
        el.style.setProperty('--p1', (Math.max(0, -pull) * active).toFixed(3))
        el.style.setProperty('--p2', (Math.max(0, pull) * active).toFixed(3))
        el.style.setProperty('--ten', (tension * active).toFixed(3))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className="backdrop" aria-hidden="true">
      <div className="backdrop-base" />
      <div className="backdrop-glow backdrop-glow-p1" />
      <div className="backdrop-glow backdrop-glow-p2" />
      <div className="backdrop-glow backdrop-glow-center" />
    </div>
  )
}

// Above the 3D canvas (z 2): thegitcity.com-style film — legibility scrim,
// CRT scanlines, grain, vignette. Static, pointer-events none.
export function FilmOverlay() {
  return (
    <div className="film-overlay" aria-hidden="true">
      <div className="film-scrim" />
      <div className="film-scanlines" />
      <div className="film-noise" />
      <div className="film-vignette" />
    </div>
  )
}

export default Backdrop
