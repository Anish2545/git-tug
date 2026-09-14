import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Billboard, Float, Sparkles, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useBattleStore } from '../store/battleStore'

// Procedural coin face: dark disc + gold rim + white git-branch glyph.
// Keeps the center on-theme without shipping image assets.
function makeCoinTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#0d1117'
  g.fillRect(0, 0, 256, 256)
  // gold rim
  g.strokeStyle = '#f0c060'
  g.lineWidth = 10
  g.beginPath()
  g.arc(128, 128, 112, 0, Math.PI * 2)
  g.stroke()
  // branch stem
  g.strokeStyle = '#f0f6fc'
  g.lineWidth = 14
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(104, 52)
  g.lineTo(104, 204)
  g.stroke()
  // fork curve to the right node
  g.beginPath()
  g.moveTo(104, 128)
  g.lineTo(138, 128)
  g.quadraticCurveTo(160, 128, 160, 150)
  g.lineTo(160, 182)
  g.stroke()
  // ring nodes
  const node = (x, y, r) => {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = '#0d1117'
    g.fill()
    g.lineWidth = 13
    g.strokeStyle = '#f0f6fc'
    g.stroke()
  }
  node(104, 62, 20)
  node(160, 192, 18)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export default function CenterBeacon() {
  const coinSpin = useRef()
  const coinMat = useRef()
  const orbL = useRef()
  const orbR = useRef()
  const beam = useRef()
  const rings = useRef([])
  const ringMats = useRef([])
  const ringIdx = useRef(0)
  const labelRef = useRef()
  const lastLabel = useRef('')
  const lastAbsV = useRef(0)
  const lastKick = useRef(-9)
  const ringT = useRef([9, 9, 9])
  const tilt = useRef(0)
  const lastBeaconX = useRef(0)
  const isLow = useBattleStore((s) => s.graphics === 'low')

  const coinTex = useMemo(makeCoinTexture, [])
  useEffect(() => () => coinTex.dispose(), [coinTex])

  const [{ beaconX }, api] = useSpring(() => ({
    beaconX: 0,
    config: { mass: 1, tension: 220, friction: 26 },
  }))

  useFrame(({ clock }, delta) => {
    const { ropeOffset, tension, velocity, graphics } = useBattleStore.getState()
    const t = clock.getElapsedTime()
    const low = graphics === 'low'
    const absV = Math.abs(velocity)

    const targetX = (ropeOffset / 100) * 3.8
    if (Math.abs(targetX - lastBeaconX.current) > 0.01) {
      lastBeaconX.current = targetX
      api.start({ beaconX: targetX })
    }

    // Spinning coin: faster with rope rush, leans with displacement
    if (coinSpin.current) {
      coinSpin.current.rotation.y += delta * (1.2 + absV * 0.5)
      tilt.current = THREE.MathUtils.damp(tilt.current, (-ropeOffset / 100) * 0.35, 5, delta)
      coinSpin.current.rotation.z = tilt.current
      const s = 1 + tension * 0.12 + Math.sin(t * 3) * 0.02 * tension
      coinSpin.current.scale.setScalar(s)
    }
    if (coinMat.current) {
      coinMat.current.emissiveIntensity = 0.18 + tension * 0.3
    }

    // Branch orbs split apart as the rope displaces — a living git graph
    const spread = (Math.abs(ropeOffset) / 100) * 0.9
    const half = 0.55 + spread
    if (orbL.current) {
      orbL.current.position.x = -half
      orbL.current.scale.setScalar(1 + tension * 0.25)
    }
    if (orbR.current) {
      orbR.current.position.x = half
      orbR.current.scale.setScalar(1 + tension * 0.25)
    }
    if (beam.current) {
      beam.current.scale.x = half * 2
    }

    // Yank kicks fire an expanding shockwave ring (skipped in LOW)
    const kick = absV - lastAbsV.current
    lastAbsV.current = absV
    if (!low && kick > 1.5 && t - lastKick.current > 0.3) {
      lastKick.current = t
      ringT.current[ringIdx.current % 3] = 0
      ringIdx.current += 1
    }
    if (!low) {
      for (let i = 0; i < 3; i++) {
        const rt = ringT.current[i]
        const mesh = rings.current[i]
        const mat = ringMats.current[i]
        if (rt >= 1 || !mesh || !mat) {
          if (mesh) mesh.visible = false
          continue
        }
        ringT.current[i] = rt + delta * 1.3
        const k = Math.min(1, ringT.current[i])
        const sc = 0.5 + k * 3.2
        mesh.scale.set(sc, sc, sc)
        // Fade in fast, out slow — no hard pop on spawn
        const fadeIn = Math.min(1, k / 0.12)
        mat.opacity = 0.55 * (1 - k) * fadeIn
        mesh.visible = k < 1
      }
    }

    // Imperative troika text update — avoids a 60fps React re-render
    if (labelRef.current) {
      const str = ropeOffset === 0 ? 'CENTER' : `${ropeOffset > 0 ? '+' : ''}${Math.round(ropeOffset)}`
      if (str !== lastLabel.current) {
        lastLabel.current = str
        labelRef.current.text = str
      }
    }
  })

  return (
    <animated.group position-x={beaconX}>
      {/* Spinning git coin — single material + gold rim (no multi-material) */}
      <Float speed={2.4} rotationIntensity={0.25} floatIntensity={1.2}>
        <group ref={coinSpin} position={[0, 0.75, 0.9]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.07, 40]} />
            <meshStandardMaterial
              ref={coinMat}
              map={coinTex}
              roughness={0.35}
              metalness={0.5}
              emissive="#f0c060"
              emissiveIntensity={0.2}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[0.28, 0.035, 12, 48]} />
            <meshStandardMaterial
              color="#f0c060"
              metalness={0.85}
              roughness={0.3}
              emissive="#f0c060"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      </Float>

      {/* Branch-graph orbs + beam */}
      <mesh ref={orbL} position={[-0.55, 0.75, 0.9]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#58a6ff" emissive="#58a6ff" emissiveIntensity={0.7} />
      </mesh>
      <mesh ref={orbR} position={[0.55, 0.75, 0.9]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f85149" emissive="#f85149" emissiveIntensity={0.7} />
      </mesh>
      <mesh ref={beam} position={[0, 0.75, 0.84]}>
        <boxGeometry args={[1, 0.03, 0.03]} />
        <meshStandardMaterial color="#8b949e" emissive="#f0c060" emissiveIntensity={0.25} />
      </mesh>

      {/* Shockwave rings fired on yank kicks */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (rings.current[i] = el)}
          position={[0, 0.03, 0.9]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.42, 0.5, 40]} />
          <meshBasicMaterial
            ref={(el) => (ringMats.current[i] = el)}
            color="#f0c060"
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Gold ember sparkles around the beacon — off in LOW */}
      {!isLow && (
        <Sparkles
          count={28}
          scale={[2.4, 1.6, 2.4]}
          position={[0, 0.8, 0.9]}
          size={3}
          speed={0.35}
          opacity={0.45}
          color="#f0c060"
        />
      )}

      {/* Live displacement readout */}
      <Billboard position={[0, 1.75, 0.9]}>
        <Text
          ref={labelRef}
          fontSize={0.24}
          color="#f0c060"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.018}
          outlineColor="#0c0d10"
        >
          CENTER
        </Text>
      </Billboard>

      {/* Floor target ring */}
      <mesh position={[0, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.44, 32]} />
        <meshBasicMaterial color="#f0c060" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Warm point light burst, brighter under tension */}
      <BeaconLight />
    </animated.group>
  )
}

function BeaconLight() {
  const lightRef = useRef()
  useFrame(() => {
    const { tension, velocity } = useBattleStore.getState()
    if (lightRef.current) {
      // Steady tension glow, no high-frequency flicker
      lightRef.current.intensity =
        5 + tension * 8 + Math.abs(velocity) * 0.8
    }
  })
  return (
    <pointLight ref={lightRef} position={[0, 1.2, 0.9]} color="#f0c060" intensity={6} distance={7} decay={2} />
  )
}
