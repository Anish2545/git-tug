# GitTug 2.0 — React Three Fiber Migration Plan

Migrate from the current Vanilla JS + HTML5 Canvas implementation to a full **React + React Three Fiber (R3F)** architecture with a stunning 3D arena.

## What Changes, What Stays

| Layer | Before | After |
|---|---|---|
| Framework | Vanilla JS + Vite | React 19 + Vite |
| 3D Rendering | Manual HTML5 Canvas | React Three Fiber (Three.js declarative) |
| Physics Cable | Quadratic bezier | Catmull-Rom rope with animated segments |
| Arena Floor | 2D isometric illusion | True 3D extruded voxel grid instanced mesh |
| UI Components | Raw DOM innerHTML | React components (clean, composable) |
| Animations | requestAnimationFrame | useFrame / `@react-spring/three` |
| GitHub API | ✅ Keep as-is | ✅ Keep `src/api/github.js` |
| Audio Engine | ✅ Keep as-is | ✅ Keep `src/engine/audio.js` |
| Battle Physics | ✅ Keep as-is | ✅ Keep `src/engine/tugEngine.js` |
| Commentator | ✅ Keep as-is | ✅ Keep `src/engine/commentator.js` |

---

## New Tech Stack

```
@react-three/fiber     — Declarative Three.js in React
@react-three/drei      — Helpers: OrbitControls, Instances, Text, etc.
@react-spring/three    — Spring physics animations integrated with R3F
zustand                — Lightweight global state store for battle state
```

---

## New Architecture

```
src/
├── main.jsx                     # React entry point
├── App.jsx                      # Root layout, Canvas + HTML overlay
├── store/
│   └── battleStore.js           # Zustand store (fighters, physics, mode)
├── api/
│   └── github.js                ✅ Unchanged
├── engine/
│   ├── tugEngine.js             ✅ Unchanged
│   ├── audio.js                 ✅ Unchanged
│   └── commentator.js           ✅ Unchanged
├── scene/
│   ├── Arena.jsx                # Root R3F scene: lighting, fog, camera
│   ├── VoxelDistrict.jsx        # Instanced 3D contribution buildings (both sides)
│   ├── TugCable.jsx             # Animated Catmull-Rom rope with metallic material
│   ├── Developer.jsx            # 3D contender: avatar circle + body + platform
│   ├── CenterBeacon.jsx         # Animated gold displacement marker
│   └── ParticleSystem.jsx       # GPU particle system for pull dust + confetti
├── ui/
│   ├── Layout.jsx               # App shell + header
│   ├── Header.jsx               # Brand, presets, mode toggle, audio btn
│   ├── HUD.jsx                  # Top overlay: displacement gauge + tension meter
│   ├── FighterCard.jsx          # Input + stats card (left and right)
│   ├── BattleControls.jsx       # VS + battle launch button + utilities
│   ├── TerminalTicker.jsx       # Live commentary announcer bar
│   ├── MashOverlay.jsx          # Manual tug button overlay
│   ├── VictoryModal.jsx         # Post-match result modal
│   └── MetricsGuide.jsx         # Bottom 4-column architecture explainer
└── style.css                    # Minimal CSS variables + global resets only
```

---

## Key 3D Scene Features

### 1. `VoxelDistrict.jsx` — Instanced 3D City
- Two GitHub contribution city districts using **InstancedMesh** for GPU-batched rendering.
- Each voxel block is a `BoxGeometry` with a `MeshStandardMaterial` tinted by contribution level (L0–L4 greens).
- Buildings are **spring-animated** to extrude taller when their side pulls harder.
- Active district illuminates with warm gold **PointLight** burst.

### 2. `TugCable.jsx` — Physical Rope Simulation
- `CatmullRomCurve3` with 10 dynamic control points.
- Rendered as `TubeGeometry` with braided metallic material.
- Sag and vibration driven by spring physics (`ropeOffset`, `tension` from store).
- High-tension state triggers a `MeshBasicMaterial` emissive glow.

### 3. `Developer.jsx` — 3D Contenders
- Each player is a group: **Cylinder torso**, **Cylinder limbs**, **Circle avatar disc** (with `CanvasTexture` showing GitHub avatar image).
- Lean angle driven by `useSpring` for smooth commit-powered stance.
- Foot dust emitted as `Points` geometry during active pull.

### 4. `Arena.jsx` — Scene Composition
- `fog` for depth atmosphere matching GitHub dark palette.
- `Environment` preset with custom dark HDRI.
- **Isometric camera** via custom fixed `PerspectiveCamera` or `OrthographicCamera` that can be toggled.
- `AmbientLight` + two `SpotLight` (blue-left, red-right) + `PointLight` center golden.

---

## Verification Plan

### Dev Build
- `npm run build` — confirm 0 errors
- `npm run dev` — verify at `http://localhost:5173/`

### Manual Verification
- Load default preset (torvalds vs yyx990803) with live 3D voxel districts
- Start Auto Sim battle and verify R3F cable animation and building pulse
- Switch to Manual Tug mode and verify A/L key mash interaction
- Test Victory Modal post-match confetti and stat comparison
