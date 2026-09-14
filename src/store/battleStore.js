import { create } from 'zustand'

export const BATTLE_STATES = {
  IDLE: 'IDLE',
  COUNTDOWN: 'COUNTDOWN',
  BATTLING: 'BATTLING',
  FINISHED: 'FINISHED',
}

export const useBattleStore = create((set, get) => ({
  // Fighters
  p1: null,
  p2: null,
  setP1: (fighter) => set({ p1: fighter }),
  setP2: (fighter) => set({ p2: fighter }),

  // Battle state
  battleState: BATTLE_STATES.IDLE,
  setBattleState: (s) => set({ battleState: s }),

  // Mode
  mode: 'auto', // 'auto' | 'mash'
  setMode: (mode) => set({ mode }),

  // Navigation: 'landing' | 'arena' — landing is the marketing entry,
  // arena is the 3D battle page. Deep-link with #arena.
  view: typeof location !== 'undefined' && location.hash === '#arena' ? 'arena' : 'landing',
  setView: (view) => {
    try {
      if (view === 'arena') history.replaceState(null, '', '#arena')
      else history.replaceState(null, '', location.pathname)
    } catch {}
    set({ view })
  },

  // Graphics quality: 'high' | 'low' — low disables reflector, HDR,
  // stars/sparkles, shadows and throttles rope/voxel updates
  graphics: typeof localStorage !== 'undefined' ? (localStorage.getItem('gittug_graphics') || 'high') : 'high',
  setGraphics: (graphics) => {
    try { localStorage.setItem('gittug_graphics', graphics) } catch {}
    set({ graphics })
  },
  toggleGraphics: () => {
    const next = get().graphics === 'high' ? 'low' : 'high'
    try { localStorage.setItem('gittug_graphics', next) } catch {}
    set({ graphics: next })
  },

  // Physics (updated at 60fps by engine)
  ropeOffset: 0,       // -100 to +100
  tension: 0.3,        // 0 to 1
  velocity: 0,
  p1Strain: 0,
  p2Strain: 0,
  winner: null,
  loser: null,
  setPhysics: (data) => set(data),

  // Round info
  roundIndex: 0,
  roundName: '',
  roundTotal: 5,
  setRound: (index, name, total) => set({ roundIndex: index, roundName: name, roundTotal: total }),

  // Commentary
  commentaryText: 'Enter two GitHub handles below to initialize the 3D tug arena.',
  commentaryTone: 'info',
  setCommentary: (text, tone = 'info') => set({ commentaryText: text, commentaryTone: tone }),

  // Muted
  muted: localStorage.getItem('gittug_muted') === 'true',
  toggleMute: () => {
    const next = !get().muted
    localStorage.setItem('gittug_muted', String(next))
    set({ muted: next })
  },

  // Loading states
  loadingP1: false,
  loadingP2: false,
  setLoadingP1: (v) => set({ loadingP1: v }),
  setLoadingP2: (v) => set({ loadingP2: v }),

  // Error
  error: null,
  setError: (e) => set({ error: e }),
  clearError: () => set({ error: null }),

  // Show victory modal
  showVictory: false,
  setShowVictory: (v) => set({ showVictory: v }),
}))
