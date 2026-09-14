# GitTug — 1v1 GitHub Tug of War Arena

1v1 GitHub developer tug-of-war powered by **real GitHub data** in an immersive **3D arena**.

Pick any two GitHub usernames. GitTug fetches their real stats (commits, PRs, issues, followers, repos), converts contribution history into 3D voxel cities, and simulates a cinematic tug-of-war battle with physics rope, live commentary, and sound.

Built with **React + React Three Fiber + Three.js + Vite**.

---

## Features

- **Real GitHub fighters** — live data via GitHub REST API (`repos`, `followers`, events for commits/PRs/issues)
- **3D voxel districts** — GPU-batched `InstancedMesh` contribution cities (L0–L4 greens) that extrude/pulse as a side pulls harder
- **Physical tug cable** — animated `CatmullRomCurve3` / `TubeGeometry` rope with sag, vibration, and high-tension glow
- **3D contenders** — avatar-textured developers with spring lean, strain, and foot dust particles
- **Two battle modes:**
  - `Auto Sim` — cinematic rounds driven by real stats
  - `Manual Tug` — P1 mash `[A]` / P2 mash `[L]` or on-screen buttons
- **Battle engine** — round-based tug physics (`ropeOffset`, `tension`, `velocity`, strain), win detection
- **Live commentator** — terminal-style ticker with tone-aware messages
- **Procedural audio** — WebAudio engine (pulls, creaks, crowd, victory) with mute toggle, no assets needed
- **HUD + Victory modal** — displacement gauge, tension meter, round tracker, stat comparison, confetti
- **Presets, swap, random matchup** — e.g. `torvalds vs yyx990803`

## Tech Stack

```
React 18 + Vite 5
@react-three/fiber + @react-three/drei — declarative Three.js scene
@react-spring/three — spring animations
zustand — global battle store
three.js — 3D rendering
```

No backend. No API keys. GitHub unauthenticated API only (60 req/hr).

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# clone
git clone https://github.com/<your-username>/git-tug.git
cd git-tug

# install
npm install

# dev (http://localhost:5173/)
npm run dev

# production build
npm run build

# preview production build
npm run preview
```

## How to Play

1. `npm run dev` and open the app.
2. Enter two GitHub usernames (or pick a preset / Random).
3. Choose mode in the header:
   - **Auto Sim** — watch the cinematic battle.
   - **Manual Tug** — mash `A` (P1 blue, left) vs `L` (P2 red, right).
4. Press **Start Battle / VS**.
5. Winner is decided by cumulative pull power from real stats across rounds. Rematch or start a new match from the victory modal.

### Power Formula (simplified)

Each fighter's pull power per round is derived from:

- commits, pull requests, issues, code reviews
- followers, public repos
- recent contribution streak / voxel city height

See `src/engine/tugEngine.js` and `src/api/github.js`.

## Project Structure

```
src/
├── main.jsx              # React entry
├── App.jsx               # Root layout, Canvas + overlay, engine wiring
├── store/battleStore.js  # Zustand store (fighters, physics, mode, UI)
├── api/github.js         # GitHub REST fetch + fighter normalization + presets
├── engine/
│   ├── tugEngine.js      # Round/physics simulation, auto + mash modes
│   ├── audio.js          # WebAudio procedural SFX
│   └── commentator.js    # Battle narration
├── scene/
│   ├── Arena.jsx         # Lighting, fog, camera, composition
│   ├── VoxelDistrict.jsx # Instanced contribution cities
│   ├── TugCable.jsx      # Animated rope
│   ├── Developer.jsx     # 3D contenders
│   ├── CenterBeacon.jsx  # Gold displacement marker
│   └── ParticleSystem.jsx# Pull dust + confetti
├── ui/
│   ├── Layout.jsx / Header.jsx / HUD.jsx
│   ├── FighterCard.jsx / BattleControls.jsx
│   ├── TerminalTicker.jsx / MashOverlay.jsx
│   ├── VictoryModal.jsx / MetricsGuide.jsx
└── style.css             # Theme + layout
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview `dist/` locally |

## Deployment

Any static host works (Vercel, Netlify, GitHub Pages, Cloudflare Pages):

```bash
npm run build
# deploy dist/
```

Vite base path is `/` by default. For GitHub Pages project sites, set `base: '/<repo>/'` in `vite.config.js`.

## GitHub API Notes

- Uses `https://api.github.com/users/:username`, `/repos`, `/events/public` — no token required.
- Rate limit: 60 req/hr per IP unauthenticated. If you hit it, wait or add a token in `src/api/github.js`.
- Avatars are loaded as `CanvasTexture` for the 3D developers.

## Contributing

PRs welcome:

```bash
git checkout -b feat/my-feature
npm run dev
npm run build  # must pass with 0 errors
```

## License

MIT — do what you want, give credit.

---

Built for fun. Who wins: Torvalds or you?
