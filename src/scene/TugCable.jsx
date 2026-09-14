import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { useBattleStore } from '../store/battleStore'

const ROPE_SEGMENTS = 20

export default function TugCable({ p1X = -5.2, p2X = 5.2, handsY = 1.2 }) {
  const isLow = useBattleStore((s) => s.graphics === 'low')
  const tubeRef = useRef()
  const matRef = useRef()
  const gripL = useRef()
  const gripR = useRef()
  const midRef = useRef()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const frame = useRef(0)
  // Traveling heave wave: fired from the pulling side on yank kicks,
  // sweeps down the rope and decays. pos in 0..1, -1 = idle.
  const heave = useRef({ pos: -1, dir: 1, amp: 0 })
  const lastAbsV = useRef(0)

  // Pre-allocated control points — mutated in place, zero per-frame allocation
  const points = useMemo(
    () => Array.from({ length: ROPE_SEGMENTS + 1 }, () => new THREE.Vector3()),
    []
  )
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])

  const initialTube = useMemo(() => {
    const pts = []
    for (let i = 0; i <= ROPE_SEGMENTS; i++) {
      const tt = i / ROPE_SEGMENTS
      pts.push(
        new THREE.Vector3(
          THREE.MathUtils.lerp(p1X + 0.4, p2X - 0.4, tt),
          handsY - 0.6 * Math.sin(tt * Math.PI),
          0
        )
      )
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.055, 8, false)
  }, [p1X, p2X, handsY])

  useFrame(({ clock }, delta) => {
    const mesh = tubeRef.current
    if (!mesh) return
    const { ropeOffset, tension, velocity, graphics } = useBattleStore.getState()
    const isLow = graphics === 'low'

    const t = clock.getElapsedTime()
    const maxShift = 3.8
    const ribbonX = (ropeOffset / 100) * maxShift

    // Detect yank kicks: sudden velocity jumps fire a wave from the puller.
    // velocity < 0 = rope rushing P1-ward, so the wave leaves tt=0 (P1's hands).
    const absV = Math.abs(velocity)
    const kick = absV - lastAbsV.current
    lastAbsV.current = absV
    const hv = heave.current
    if (kick > 1.1 && hv.amp < 0.15) {
      hv.dir = velocity < 0 ? 1 : -1
      hv.pos = velocity < 0 ? 0 : 1
      hv.amp = Math.min(0.55, 0.18 + kick * 0.06)
    }
    if (hv.pos >= 0) {
      hv.pos += hv.dir * delta * 1.9
      hv.amp = THREE.MathUtils.damp(hv.amp, 0, 2.6, delta)
      if (hv.pos < -0.1 || hv.pos > 1.1 || hv.amp < 0.015) {
        hv.pos = -1
        hv.amp = 0
      }
    }

    // Quadratic bezier: left end → sagging mid → right end.
    // Sag and sway are slow and uniform — no per-segment high-frequency
    // wobble (that reads as jitter, not physics).
    const maxSag = (1 - tension) * 1.1
    const sway = Math.sin(t * 1.5) * 0.015
    const midSagY = handsY - maxSag + sway

    for (let i = 0; i <= ROPE_SEGMENTS; i++) {
      const tt = i / ROPE_SEGMENTS
      const a = (1 - tt) * (1 - tt)
      const b = 2 * (1 - tt) * tt
      const c = tt * tt
      // Traveling heave bump: smooth gaussian pulse around the wavefront
      let waveY = 0
      let waveZ = 0
      if (hv.pos >= 0) {
        const d = (tt - hv.pos) / 0.2
        const bump = hv.amp * Math.exp(-d * d)
        waveY = bump * 0.8
        waveZ = bump * 0.3 * Math.sin(t * 6 + tt * 4)
      }
      points[i].set(
        a * (p1X + 0.4) + b * ribbonX + c * (p2X - 0.4),
        a * handsY + b * midSagY + c * handsY + waveY,
        waveZ
      )
    }
    curve.updateArcLengths()

    // Rebuild tube throttled: ~20fps high, ~10fps low to cut GC churn.
    // Radius stays constant — thickness pulsing with tension looked like shimmer.
    frame.current += 1
    const stride = isLow ? 6 : 3
    if (frame.current % stride === 0) {
      const radius = 0.055 + hv.amp * 0.02
      const next = new THREE.TubeGeometry(curve, isLow ? 12 : 20, radius, isLow ? 5 : 6, false)
      mesh.geometry.dispose()
      mesh.geometry = next
    }

    // Tension glow via emissive — kept subtle
    if (matRef.current) {
      matRef.current.emissiveIntensity = tension > 0.6 ? (tension - 0.6) * 1.5 : 0.08
    }
    // Grip handles ride the cable; trail anchor follows the whip point
    if (gripL.current) {
      curve.getPoint(0.1, tmp)
      gripL.current.position.copy(tmp)
    }
    if (gripR.current) {
      curve.getPoint(0.9, tmp)
      gripR.current.position.copy(tmp)
    }
    if (midRef.current) {
      curve.getPoint(0.5, tmp)
      midRef.current.position.copy(tmp)
    }
  })

  return (
    <group>
      {/* Main braided cable */}
      <mesh ref={tubeRef} geometry={initialTube} castShadow>
        <meshStandardMaterial
          ref={matRef}
          color="#9aa4b2"
          roughness={0.28}
          metalness={0.9}
          emissive="#f0c060"
          emissiveIntensity={0.12}
        />
      </mesh>
      {/* Grip handles that slide along the rope */}
      <mesh ref={gripL} castShadow>
        <torusGeometry args={[0.14, 0.05, 10, 20]} />
        <meshStandardMaterial
          color="#58a6ff"
          emissive="#58a6ff"
          emissiveIntensity={0.7}
          roughness={0.4}
        />
      </mesh>
      <mesh ref={gripR} castShadow>
        <torusGeometry args={[0.14, 0.05, 10, 20]} />
        <meshStandardMaterial
          color="#f85149"
          emissive="#f85149"
          emissiveIntensity={0.7}
          roughness={0.4}
        />
      </mesh>
      {/* Gold motion ribbon trailing the rope's whip point — off in LOW */}
      {!isLow && (
        <Trail
          width={0.55}
          length={2.2}
          color={new THREE.Color('#f0c060')}
          attenuation={(w) => w * w}
        >
          <mesh ref={midRef} visible={false}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#f0c060" />
          </mesh>
        </Trail>
      )}
    </group>
  )
}
