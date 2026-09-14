import React from 'react'
import { PRESET_MATCHUPS } from '../api/github'
import { useBattleStore } from '../store/battleStore'

const FEATURES = [
  { title: 'Real GitHub data', desc: 'Live commits, stars, repos and velocity. No mocks, no API key.' },
  { title: '3D voxel districts', desc: 'Contribution history rendered as GPU-batched voxel cities that pulse as you pull.' },
  { title: 'Physics rope', desc: 'Spring-damped cable with heave waves, tension glow and smooth camera follow.' },
  { title: 'Two battle modes', desc: 'Auto Sim cinematics, or Manual Tug — mash A vs L with friends.' },
  { title: 'Live commentary', desc: 'Terminal-style announcer narrates every round, surge and upset.' },
  { title: 'Low graphics mode', desc: 'One-click LOW mode: no reflections, HDR or particles. Smooth on slow devices.' },
]

const STEPS = [
  { n: '01', title: 'Pick two developers', desc: 'Any GitHub handles, or fire a preset rivalry in one click.' },
  { n: '02', title: 'Enter the arena', desc: 'Voxel cities build, the rope drops, countdown runs 3-2-1-PULL.' },
  { n: '03', title: 'Winner takes the cable', desc: '5 weighted rounds decide. Upsets happen — commits are only 35%.' },
]

export default function Landing({ onEnterArena, onBattlePreset }) {
  const graphics = useBattleStore((s) => s.graphics)
  const setGraphics = useBattleStore((s) => s.setGraphics)

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-brand" onClick={onEnterArena} role="button" tabIndex={0}>
          GIT<span className="brand-accent">TUG</span>
        </div>
        <div className="landing-nav-links">
          <a href="#how">How it works</a>
          <a href="#modes">Modes</a>
          <a href="#presets">Presets</a>
        </div>
        <div className="landing-nav-cta">
          <div className="mode-toggle-group" title="Graphics quality">
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
          <button className="btn-primary btn-modal-action" onClick={onEnterArena}>
            Enter Arena →
          </button>
        </div>
      </nav>

      <header className="landing-hero">
        <span className="landing-badge">
          <span className="live-dot" /> LIVE — REAL GITHUB DATA · 3D ARENA
        </span>
        <h1 className="landing-title">
          1v1 GitHub <span className="brand-accent">Tug&nbsp;of&nbsp;War</span> in 3D
        </h1>
        <p className="landing-sub">
          Pick any two developers. GitTug turns their commits, stars and velocity
          into voxel cities and settles it on a physics rope — live in your browser.
        </p>
        <div className="landing-cta-row">
          <button className="btn-battle-launch" onClick={onEnterArena}>
            <span className="launch-label">ENTER 3D ARENA</span>
            <span className="launch-sub">TORVALDS VS EVAN · READY IN 1 CLICK</span>
          </button>
          <a className="btn-tactile-tool" href="#how">
            How scoring works ↓
          </a>
        </div>
        <div className="landing-meta">
          <span>No signup</span>
          <span>·</span>
          <span>No API key</span>
          <span>·</span>
          <span>Manual A-vs-L mode</span>
          <span>·</span>
          <span>LOW gfx for slow devices</span>
        </div>
      </header>

      <section className="landing-section" id="presets">
        <div className="landing-section-head">
          <h2>Preset rivalries</h2>
          <p>One click loads both fighters and drops you in the arena.</p>
        </div>
        <div className="landing-presets">
          {PRESET_MATCHUPS.map((p) => (
            <div key={p.label} className="landing-preset-card">
              <span className="platform-tag">{p.label.toUpperCase()}</span>
              <p className="landing-preset-desc">{p.desc}</p>
              <p className="landing-preset-vs">
                <span>@{p.p1}</span>
                <em>vs</em>
                <span>@{p.p2}</span>
              </p>
              <button
                className="btn-tactile-tool"
                onClick={() => onBattlePreset(p.p1, p.p2)}
              >
                Battle this matchup →
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how">
        <div className="landing-section-head">
          <h2>How a match is decided</h2>
          <p>Not just commits. Five weighted rounds pull the rope.</p>
        </div>
        <div className="landing-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="landing-step">
              <span className="landing-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="landing-weights">
          {[
            ['Commits', '35'],
            ['Repos', '15'],
            ['Stars', '15'],
            ['Velocity', '15'],
            ['TugPower', '20'],
          ].map(([k, v]) => (
            <span key={k} className="mechanics-pill">
              {k} · {v}
            </span>
          ))}
        </div>
      </section>

      <section className="landing-section" id="modes">
        <div className="landing-section-head">
          <h2>Two ways to battle</h2>
        </div>
        <div className="landing-modes">
          <div className="landing-mode-card">
            <h3>AUTO SIM</h3>
            <p>Cinematic rounds driven by real stats. Sit back and watch the cable decide.</p>
            <button className="btn-tactile-tool" onClick={onEnterArena}>Watch a sim →</button>
          </div>
          <div className="landing-mode-card">
            <h3>MANUAL TUG</h3>
            <p>P1 mashes <b>A</b>, P2 mashes <b>L</b>. Commit history gives a small edge — fingers do the rest.</p>
            <button className="btn-tactile-tool" onClick={onEnterArena}>Mash it out →</button>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-head">
          <h2>Built for the arena</h2>
        </div>
        <div className="metrics-architecture-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="metric-arch-card">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>GITTUG — commits · stars · velocity → cable physics</span>
        <button className="btn-primary btn-modal-action" onClick={onEnterArena}>
          Enter Arena →
        </button>
      </footer>
    </div>
  )
}
