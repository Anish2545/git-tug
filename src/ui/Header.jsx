import React from 'react'
import { PRESET_MATCHUPS } from '../api/github'
import { useBattleStore } from '../store/battleStore'
import { sounds } from '../engine/audio'

export default function Header({ onSelectPreset, onToggleGuide, guideOpen }) {
  const mode = useBattleStore((s) => s.mode)
  const setMode = useBattleStore((s) => s.setMode)
  const graphics = useBattleStore((s) => s.graphics)
  const setGraphics = useBattleStore((s) => s.setGraphics)
  const setView = useBattleStore((s) => s.setView)
  const muted = useBattleStore((s) => s.muted)
  const toggleMute = useBattleStore((s) => s.toggleMute)

  const handleMode = (m) => {
    sounds.init()
    setMode(m)
  }

  const handleMute = () => {
    sounds.init()
    sounds.toggleMute()
    toggleMute()
    // reconcile: sounds is source of truth for gain, store for UI
    const isMuted = sounds.isMuted()
    if (isMuted !== useBattleStore.getState().muted) {
      toggleMute()
    }
  }

  return (
    <header className="arena-header">
      <div className="header-left">
        <div className="brand-container">
          <h1 className="brand-title" onClick={() => setView('landing')} style={{ cursor: 'pointer' }} title="Back to home">
            GIT<span className="brand-accent">TUG</span>
          </h1>
          <span className="status-indicator">
            <span className="live-dot" />
            3D ARENA LIVE
          </span>
        </div>
        <p className="brand-subtitle">1v1 GitHub tug-of-war · real commit data · R3F voxel arena</p>
      </div>

      <div className="preset-selector">
        <span className="preset-label">PRESETS</span>
        <div className="preset-chips">
          {PRESET_MATCHUPS.map((p) => (
            <button
              key={p.label}
              className="preset-chip"
              title={p.desc}
              onClick={() => onSelectPreset(p.p1, p.p2)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="header-controls">
        <button className="btn-tactile-tool" onClick={() => setView('landing')} title="Back to landing page">
          ← Home
        </button>
        <div className="mode-toggle-group" title="Graphics quality — LOW disables reflections, HDR, particles and shadows for slow devices">
          <button
            className={`mode-toggle-btn ${graphics === 'high' ? 'active' : ''}`}
            onClick={() => setGraphics('high')}
          >
            HIGH
          </button>
          <button
            className={`mode-toggle-btn ${graphics === 'low' ? 'active' : ''}`}
            onClick={() => setGraphics('low')}
          >
            LOW
          </button>
        </div>
        <div className="mode-toggle-group">
          <button
            className={`mode-toggle-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => handleMode('auto')}
          >
            AUTO SIM
          </button>
          <button
            className={`mode-toggle-btn ${mode === 'mash' ? 'active' : ''}`}
            onClick={() => handleMode('mash')}
          >
            MANUAL TUG
          </button>
        </div>
        <button className="btn-tactile icon-btn" onClick={onToggleGuide} title="How battle math works">
          <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>?</span>
        </button>
        <button className="btn-tactile icon-btn" onClick={handleMute} title="Toggle audio">
          {muted ? (
            <svg id="sound-icon-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
          ) : (
            <svg id="sound-icon-on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
          )}
        </button>
      </div>
    </header>
  )
}
