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
const TRIM_L4 = new THREE.Color('#ffd97a')
const TRIM_L3 = new THREE.Color('#8be9b0')
const _scratchColor = new THREE.Color()

// Deterministic PRNG so each fighter always builds their own city
function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function District({ originX, side }) {
  const instancesRef = useRef()
  const trimsRef = useRef()
  const lightRef = useRef()
  const antennaRef = useRef()
  const antennaTipRef = useRef()
  const curbRef = useRef()
  const glow = useRef(0)
  const lastG = useRef(-1)
  const lastCityKey = useRef('')
  const tick = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const accent = side === 'left' ? '#58a6ff' : '#f85149'
  // Only re-renders when fighters change (rare) — per-frame physics uses getState()
  const fighter = useBattleStore((s) => (side === 'left' ? s.p1 : s.p2))

  // Data-driven city: levels weighted by real activity, heights scaled by
  // Tug Power, layout seeded by login so it is stable across renders.
  const cityKey = fighter
    ? `${fighter.login}|${fighter.stats.commits}|${fighter.stats.tugPower}|${fighter.stats.velocity}|${fighter.stats.streak}`
    : 'none'
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const city = useMemo(() => {
    const rand = mulberry32(hashSeed(`${side}:${cityKey}`))
    const st = fighter?.stats
    const activity = st
      ? Math.min(1, st.commits / 18000) * 0.5 +
        Math.min(1, st.velocity / 100) * 0.3 +
        Math.min(1, st.streak / 365) * 0.2
      : 0.45
    const sizeScale = st ? 0.75 + Math.min(1, (st.tugPower || 0) / 22000) * 0.5 : 0.9

    const pL0 = 0.16 * (1 - activity * 0.6)
    const pL4 = 0.08 + 0.24 * activity
    const pL3 = 0.16 + 0.2 * activity
    const pL2 = 0.26

    const blocks = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const roll = rand()
        let level
        if (roll < pL0) level = 0
        else if (roll < pL0 + pL4) level = 4
        else if (roll < pL0 + pL4 + pL3) level = 3
        else if (roll < pL0 + pL4 + pL3 + pL2) level = 2
        else level = 1
        let base
        if (level === 0) base = 0.1
        else if (level === 1) base = 0.3 + rand() * 0.15
        else if (level === 2) base = 0.6 + rand() * 0.2
        else if (level === 3) base = 0.95 + rand() * 0.25
        else base = 1.35 + rand() * 0.35
        base *= sizeScale
        const color = new THREE.Color(CONTRIB_COLORS[level])
        color.offsetHSL(0, (rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05)
        const x = originX + (c - COLS / 2) * (TILE_W + GAP)
        const z = (r - ROWS / 2) * (TILE_H + GAP)
        blocks.push({ id: `${r}-${c}`, x, z, col: c, level, base, color })
      }
    }
    // Fighter plaza: elliptical courtyard around the contender's rope lane
    // (devs slide ±2.1 along x while pulling) so avatars never sink into towers.
    const plazaBlocks = blocks.filter((b) => {
      const ex = (b.x - originX) / 2.7
      const ez = b.z / 1.6
      return ex * ex + ez * ez >= 1
    })
    const trims = plazaBlocks
      .filter((b) => b.level >= 3)
      .map((b) => ({ b, trimColor: (b.level === 4 ? TRIM_L4 : TRIM_L3).clone() }))
    let tallest = plazaBlocks[0]
    for (const b of plazaBlocks) if (b.base > tallest.base) tallest = b
    const xs = plazaBlocks.map((b) => b.x)
    const innerX =
      side === 'left'
        ? Math.max(...xs) + TILE_W / 2 + 0.07
        : Math.min(...xs) - TILE_W / 2 - 0.07
    return { blocks: plazaBlocks, trims, tallest, innerX }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originX, side, cityKey])
  const { blocks, trims, tallest, innerX } = city

  useFrame((state, delta) => {
    const { ropeOffset, graphics } = useBattleStore.getState()
    const isLow = graphics === 'low'
    tick.current += 1
    if (isLow && tick.current % 4 !== 0) return
    const t = state.clock.elapsedTime
    const activated = side === 'left' ? ropeOffset < -8 : ropeOffset > 8
    glow.current = THREE.MathUtils.damp(glow.current, activated ? 1 : 0, 6, delta * (isLow ? 4 : 1))
    const g = glow.current

    // Tower geometry is fully static — written once per city.
    // Pull feedback is tint + light only, so nothing ever bounces.
    const cityChanged = cityKey !== lastCityKey.current
    if (cityChanged) lastCityKey.current = cityKey

    const inst = instancesRef.current
    if (inst && cityChanged) {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        dummy.position.set(b.x, b.base / 2, b.z)
        dummy.scale.set(1, b.base, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        inst.setMatrixAt(i, dummy.matrix)
        inst.setColorAt(i, _scratchColor.copy(b.color))
      }
      inst.instanceMatrix.needsUpdate = true
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true
      lastG.current = g
    }
    const trimInst = trimsRef.current
    if (trimInst && cityChanged) {
      for (let i = 0; i < trims.length; i++) {
        const { b } = trims[i]
        dummy.position.set(b.x, b.base + 0.035, b.z)
        dummy.scale.set(1, 1, 1)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        trimInst.setMatrixAt(i, dummy.matrix)
      }
      trimInst.instanceMatrix.needsUpdate = true
    }
    // Gold wash while pulling — color only, zero motion
    if (!cityChanged && !isLow && Math.abs(g - lastG.current) > 0.004) {
      lastG.current = g
      if (inst) {
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i]
          inst.setColorAt(i, _scratchColor.copy(b.color).lerp(GOLD, Math.min(1, g * 0.3)))
        }
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true
      }
    }
    // Antenna sits on the roofline, tip blinks
    if (cityChanged && antennaRef.current) {
      antennaRef.current.position.set(tallest.x, tallest.base + 0.25, tallest.z)
    }
    if (antennaTipRef.current) {
      antennaTipRef.current.material.opacity = isLow ? 0.7 : 0.55 + 0.45 * Math.sin(t * 4)
    }
    // Inner curb ignites on the pulling side
    if (curbRef.current) {
      curbRef.current.material.opacity = 0.22 + g * 0.55
    }
    if (lightRef.current) {
      lightRef.current.intensity = isLow ? 3 + g * 8 : 3 + g * 14
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
        <meshStandardMaterial roughness={0.55} metalness={0.35} />
        {blocks.map((b) => (
          <Instance
            key={b.id}
            position={[b.x, b.base / 2, b.z]}
            scale={[1, b.base, 1]}
            color={CONTRIB_COLORS[b.level]}
          />
        ))}
      </Instances>

      {/* Rooftop glow slabs on L3/L4 towers — unlit so they pop at night */}
      {trims.length > 0 && (
        <Instances ref={trimsRef} limit={trims.length} frustumCulled={false}>
          <boxGeometry args={[TILE_W * 0.68, 0.07, TILE_H * 0.68]} />
          <meshBasicMaterial toneMapped={false} />
          {trims.map(({ b, trimColor }) => (
            <Instance
              key={`trim-${b.id}`}
              position={[b.x, b.base + 0.035, b.z]}
              color={trimColor}
            />
          ))}
        </Instances>
      )}

      {/* District Platform Base */}
      <mesh position={[originX, -0.08, 0]} receiveShadow>
        <boxGeometry args={[COLS * (TILE_W + GAP) + 0.4, 0.12, ROWS * (TILE_H + GAP) + 0.4]} />
        <meshStandardMaterial color="#0d1117" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Fighter plaza floor + accent boundary — stacked with clear
          depth separation so the layers never z-fight and flicker */}
      <mesh position={[originX, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.75, 1.65, 1]}>
        <circleGeometry args={[1.0, 48]} />
        <meshStandardMaterial color="#10141b" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh position={[originX, 0.024, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.75, 1.65, 1]}>
        <ringGeometry args={[0.96, 1.0, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {/* Accent edge line */}
      <mesh position={[originX, 0, 0]}>
        <boxGeometry args={[COLS * (TILE_W + GAP) + 0.4, 0.025, ROWS * (TILE_H + GAP) + 0.4]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* Inner curb — ignites on the rope side while pulling */}
      <mesh ref={curbRef} position={[innerX, 0.02, 0]}>
        <boxGeometry args={[0.09, 0.06, ROWS * (TILE_H + GAP) + 0.4]} />
        <meshBasicMaterial color={accent} transparent opacity={0.25} depthWrite={false} />
      </mesh>

      {/* Tallest-tower antenna */}
      <group ref={antennaRef} position={[tallest.x, tallest.base + 0.25, tallest.z]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color="#30363d" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh ref={antennaTipRef} position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#f85149" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>

      {/* Warm wash over the active district */}
      <pointLight
        ref={lightRef}
        position={[originX, 2.4, 0]}
        color={accent}
        intensity={3}
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
