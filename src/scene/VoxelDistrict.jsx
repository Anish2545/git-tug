import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useBattleStore } from '../store/battleStore'

// GitHub contribution palette – 5 levels
const CONTRIB_COLORS = [
  '#161b22', // L0 empty
  '#0e4429', // L1
  '#006d32', // L2
  '#26a641', // L3
  '#39d353', // L4
]

const ROWS = 6
const COLS = 8
const TILE_W = 0.9
const TILE_H = 0.9
const GAP = 0.08
const GOLD = new THREE.Color('#f0c060')
const _scratchColor = new THREE.Color()

function District({ originX, side }) {
  const instancesRef = useRef()
  const lightRef = useRef()
  const glow = useRef(0)
  // Shockwave ripple: fired on yank kicks, sweeps across the columns
  // from the rope side outward, then decays. t in seconds since firing.
  const ripple = useRef({ t: 99, strength: 0 })
  const lastAbsV = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const accent = side === 'left' ? '#58a6ff' : '#f85149'
  // Only re-renders when fighters change (rare) — per-frame physics uses getState()
  const fighter = useBattleStore((s) => (side === 'left' ? s.p1 : s.p2))

  const blocks = useMemo(() => {
    const arr = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const level = Math.random() < 0.18 ? 0 : Math.floor(Math.random() * 4) + 1
        const base = level === 0 ? 0.12 : 0.15 + level * 0.28 + Math.random() * 0.18
        const x = originX + (c - COLS / 2) * (TILE_W + GAP)
        const z = (r - ROWS / 2) * (TILE_H + GAP)
        arr.push({
          id: `${r}-${c}`,
          x,
          z,
          col: c,
          level,
          base,
          color: new THREE.Color(CONTRIB_COLORS[level]),
        })
      }
    }
    return arr
  }, [originX])

  useFrame((_, delta) => {
    const { ropeOffset, velocity } = useBattleStore.getState()
    const activated = side === 'left' ? ropeOffset < -8 : ropeOffset > 8
    glow.current = THREE.MathUtils.damp(glow.current, activated ? 1 : 0, 6, delta)

    // Yank kick in my direction fires a shockwave through my columns.
    // Columns are ordered outer→inner or inner→outer depending on side:
    // normalize so the wavefront always starts at the rope side.
    const absV = Math.abs(velocity)
    const pullingMe =
      (side === 'left' && velocity < -0.5) || (side === 'right' && velocity > 0.5)
    if (absV - lastAbsV.current > 1.5 && pullingMe) {
      ripple.current.t = 0
      ripple.current.strength = Math.min(1, 0.4 + (absV - lastAbsV.current) * 0.12)
    }
    lastAbsV.current = absV
    ripple.current.t += delta
    const rip = ripple.current
    const ripFront = rip.t * 1.6 // 0 → 1+ sweep across normalized columns

    const inst = instancesRef.current
    if (inst) {
      const g = glow.current
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        // Rope-side normalized coordinate: left district inner col is c=7,
        // right district inner col is c=0.
        const inner = side === 'left' ? (COLS - 1 - b.col) / (COLS - 1) : b.col / (COLS - 1)
        let wave = 0
        if (rip.t < 1.6 && rip.strength > 0.01) {
          const d = (inner - ripFront) / 0.22
          wave = rip.strength * Math.exp(-d * d) * Math.exp(-rip.t * 1.8)
        }
        const h = b.base * (1 + g * 0.45) + wave * 0.55
        dummy.position.set(b.x, h / 2, b.z)
        dummy.scale.set(1, h, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        inst.setMatrixAt(i, dummy.matrix)
        inst.setColorAt(
          i,
          _scratchColor.copy(b.color).lerp(GOLD, Math.min(1, g * 0.55 + wave * 0.8))
        )
      }
      inst.instanceMatrix.needsUpdate = true
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true
    }
    if (lightRef.current) {
      lightRef.current.intensity =
        4 + glow.current * 36 + (rip.t < 1.2 ? rip.strength * Math.exp(-rip.t * 2) * 30 : 0)
    }
  })

  return (
    <group>
      {/* Single GPU-batched draw call for all 48 voxels */}
      <Instances
        ref={instancesRef}
        limit={blocks.length}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <boxGeometry args={[TILE_W, 1, TILE_H]} />
        <meshStandardMaterial roughness={0.6} metalness={0.3} />
        {blocks.map((b) => (
          <Instance
            key={b.id}
            position={[b.x, b.base / 2, b.z]}
            scale={[1, b.base, 1]}
            color={CONTRIB_COLORS[b.level]}
          />
        ))}
      </Instances>

      {/* District Platform Base */}
      <mesh position={[originX, -0.08, 0]} receiveShadow>
        <boxGeometry args={[COLS * (TILE_W + GAP) + 0.4, 0.12, ROWS * (TILE_H + GAP) + 0.4]} />
        <meshStandardMaterial color="#0d1117" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Accent edge line */}
      <mesh position={[originX, 0, 0]}>
        <boxGeometry args={[COLS * (TILE_W + GAP) + 0.4, 0.025, ROWS * (TILE_H + GAP) + 0.4]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Warm wash over the active district */}
      <pointLight
        ref={lightRef}
        position={[originX, 2.4, 0]}
        color={accent}
        intensity={4}
        distance={10}
        decay={2}
      />

      {/* Floating 3D nameplate — always faces camera */}
      <Billboard position={[originX, 3.5, -1]}>
        <Text
          fontSize={0.34}
          color={accent}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#0c0d10"
        >
          {fighter ? `@${fighter.login}` : side === 'left' ? 'P1' : 'P2'}
        </Text>
        <Text
          position={[0, -0.42, 0]}
          fontSize={0.2}
          color="#8b949e"
          anchorX="center"
          anchorY="middle"
        >
          {fighter ? `${fighter.stats.commits.toLocaleString()} commits` : 'awaiting contender'}
        </Text>
      </Billboard>
    </group>
  )
}

export default function VoxelDistrict() {
  return (
    <>
      <District originX={-5.2} side="left" />
      <District originX={5.2} side="right" />
    </>
  )
}
