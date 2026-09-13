import React, { useEffect, useRef, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { fetchGitHubFighter, PRESET_MATCHUPS } from './api/github'
import { sounds } from './engine/audio'
import { TugEngine, BATTLE_STATES } from './engine/tugEngine'
import { Commentator } from './engine/commentator'
import { useBattleStore } from './store/battleStore'
import Arena from './scene/Arena'
import Layout from './ui/Layout'
import Header from './ui/Header'
import HUD from './ui/HUD'
import FighterCard from './ui/FighterCard'
import BattleControls from './ui/BattleControls'
import TerminalTicker from './ui/TerminalTicker'
import MashOverlay from './ui/MashOverlay'
import VictoryModal from './ui/VictoryModal'
import MetricsGuide from './ui/MetricsGuide'

export default function App() {
  const engineRef = useRef(null)
  const [showGuide, setShowGuide] = useState(false)

  // Instantiate engine once, bridge callbacks into zustand store
  useEffect(() => {
    const commentator = new Commentator(({ text, tone }) => {
      useBattleStore.getState().setCommentary(text, tone)
    })

    const engine = new TugEngine({
      commentator,
      onStateChange: (battleState) => {
        const st = useBattleStore.getState()
        st.setBattleState(battleState)
        if (battleState === BATTLE_STATES.FINISHED) {
          // let players enjoy final pull, then show modal + confetti
          setTimeout(() => {
            const cur = useBattleStore.getState()
            if (cur.battleState === BATTLE_STATES.FINISHED) {
              cur.setShowVictory(true)
            }
          }, 1400)
        } else {
          st.setShowVictory(false)
        }
      },
      onPhysicsUpdate: (physics) => {
        useBattleStore.getState().setPhysics({
          ropeOffset: physics.ropeOffset,
          tension: physics.tension,
          velocity: physics.velocity,
          p1Strain: physics.p1Strain,
          p2Strain: physics.p2Strain,
          ...(physics.winner ? { winner: physics.winner, loser: physics.loser } : {}),
        })
      },
      onRoundUpdate: ({ index, total, round }) => {
        useBattleStore.getState().setRound(index, round.name, total)
      },
    })

    engineRef.current = engine
    // sync initial mode + mute
    engine.setMode(useBattleStore.getState().mode)
    sounds.muted = useBattleStore.getState().muted

    // bootstrap default preset
    loadFighters('torvalds', 'yyx990803', engine)

    // keyboard mash: A = P1, L = P2
    const onKey = (e) => {
      const st = useBattleStore.getState()
      if (engine.state !== BATTLE_STATES.BATTLING || st.mode !== 'mash') return
      if (e.code === 'KeyA') engine.handleMash(1)
      else if (e.code === 'KeyL') engine.handleMash(2)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      engine.cancelLoops()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep engine mode in sync with store
  const mode = useBattleStore((s) => s.mode)
  useEffect(() => {
    engineRef.current?.setMode(mode)
    if (mode === 'auto') {
      useBattleStore.getState().setCommentary(
        'Mode: AUTO SIM — Cinematic rounds driven by real GitHub contribution data.'
      )
    } else {
      useBattleStore.getState().setCommentary(
        'Mode: MANUAL TUG — P1 press [A] / P2 press [L] to apply cable tension.'
      )
    }
  }, [mode])

  // hide side panels during manual tug so the fullscreen arena is playable
  useEffect(() => {
    document.body.classList.toggle('mash-mode', mode === 'mash')
    return () => document.body.classList.remove('mash-mode')
  }, [mode])

  // keep audio mute in sync with store
  const muted = useBattleStore((s) => s.muted)
  useEffect(() => {
    sounds.muted = muted
    if (sounds.masterGain && sounds.ctx) {
      sounds.masterGain.gain.value = muted ? 0 : 0.7
    }
  }, [muted])

  // keep engine fighters in sync when both loaded
  const p1 = useBattleStore((s) => s.p1)
  const p2 = useBattleStore((s) => s.p2)
  useEffect(() => {
    if (p1 && p2 && engineRef.current) {
      engineRef.current.setFighters(p1, p2)
    }
  }, [p1, p2])

  async function loadFighters(u1, u2, engine = engineRef.current) {
    const st = useBattleStore.getState()
    engine?.reset()
    st.setShowVictory(false)
    st.setPhysics({ winner: null, loser: null, ropeOffset: 0, tension: 0.3, velocity: 0, p1Strain: 0, p2Strain: 0 })
    await Promise.all([loadFighter('p1', u1), loadFighter('p2', u2)])
  }

  async function loadFighter(side, username) {
    const st = useBattleStore.getState()
    try {
      if (side === 'p1') st.setLoadingP1(true)
      else st.setLoadingP2(true)
      st.setCommentary(`Scanning GitHub for @${username}...`)
      const fighter = await fetchGitHubFighter(username)
      if (side === 'p1') {
        useBattleStore.getState().setP1(fighter)
      } else {
        useBattleStore.getState().setP2(fighter)
      }
      const cur = useBattleStore.getState()
      if (cur.p1 && cur.p2) {
        cur.setCommentary(
          `Ready! @${cur.p1.login} (${cur.p1.stats.commits.toLocaleString()} commits) vs @${cur.p2.login} (${cur.p2.stats.commits.toLocaleString()} commits)`
        )
      }
    } catch (err) {
      useBattleStore.getState().setCommentary(`⚠️ ${err.message || 'Failed to load fighter'}`)
    } finally {
      if (side === 'p1') useBattleStore.getState().setLoadingP1(false)
      else useBattleStore.getState().setLoadingP2(false)
    }
  }

  const handleStart = () => {
    const st = useBattleStore.getState()
    if (!st.p1 || !st.p2) {
      st.setCommentary('Select two valid fighters first!')
      return
    }
    sounds.init()
    engineRef.current?.startBattle()
  }

  const handleSwap = () => {
    const st = useBattleStore.getState()
    if (st.p1 && st.p2) loadFighters(st.p2.login, st.p1.login)
  }

  const handleRandom = () => {
    const preset = PRESET_MATCHUPS[Math.floor(Math.random() * PRESET_MATCHUPS.length)]
    loadFighters(preset.p1, preset.p2)
  }

  const handleMash = (player) => {
    sounds.init()
    engineRef.current?.handleMash(player)
  }

  const handleRematch = () => {
    useBattleStore.getState().setShowVictory(false)
    engineRef.current?.reset()
    engineRef.current?.startBattle()
  }

  const handleNewMatch = () => {
    useBattleStore.getState().setShowVictory(false)
    engineRef.current?.reset()
  }

  return (
    <Layout>
      {/* Fullscreen 3D world — transparent bg so the reactive CSS sky shows through */}
      <div className="canvas-fixed">
        <Canvas
          shadows="soft"
          dpr={[1, 2]}
          camera={{ position: [8.5, 7.5, 11], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Arena />
          </Suspense>
        </Canvas>
      </div>

      <Header
        onSelectPreset={(a, b) => loadFighters(a, b)}
        onToggleGuide={() => setShowGuide((v) => !v)}
        guideOpen={showGuide}
      />
      <HUD />

      {/* Floating contender panels over the 3D districts */}
      <div className="side-panels">
        <div className="side-panel side-left">
          <FighterCard side="p1" onSearch={(u) => loadFighter('p1', u)} />
        </div>
        <div className="side-panel side-right">
          <FighterCard side="p2" onSearch={(u) => loadFighter('p2', u)} />
        </div>
      </div>

      {/* Bottom command dock */}
      <div className="bottom-dock">
        <BattleControls onStart={handleStart} onSwap={handleSwap} onRandom={handleRandom} />
        <TerminalTicker />
      </div>

      {showGuide && (
        <div className="guide-drawer">
          <MetricsGuide />
        </div>
      )}

      <MashOverlay onMash={handleMash} />
      <VictoryModal onRematch={handleRematch} onNewMatch={handleNewMatch} />
    </Layout>
  )
}
