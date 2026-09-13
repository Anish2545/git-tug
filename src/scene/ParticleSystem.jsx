import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useBattleStore } from '../store/battleStore'

const DUST_COUNT = 220
const CONFETTI_COUNT = 350

const CONFETTI_COLORS = ['#f0c060', '#58a6ff', '#f85149', '#39d353', '#f0f6fc']

function useDustParticles() {
  return useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3)
    const speeds = new Float32Array(DUST_COUNT)
    for (let i = 0; i < DUST_COUNT; i++) {
      const leftSide = i < DUST_COUNT / 2
      positions[i * 3] = (leftSide ? -5.2 : 5.2) + (Math.random() - 0.5) * 2.2
      positions[i * 3 + 1] = Math.random() * 1.2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5
      speeds[i] = 0.4 + Math.random() * 1.2
    }
    return { positions, speeds }
  }, [])
}

function useConfettiParticles() {
  return useMemo(() => {
    const positions = new Float32Array(CONFETTI_COUNT * 3)
    const colors = new Float32Array(CONFETTI_COUNT * 3)
    const speeds = new Float32Array(CONFETTI_COUNT)
    const color = new THREE.Color()
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = Math.random() * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length])
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      speeds[i] = 0.8 + Math.random() * 1.8
    }
    return { positions, colors, speeds }
  }, [])
}

export default function ParticleSystem() {
  const dustRef = useRef()
  const confettiRef = useRef()
  const dust = useDustParticles()
  const confetti = useConfettiParticles()

  const dustGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(dust.positions.slice(), 3))
    return geo
  }, [dust])

  const confettiGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(confetti.positions.slice(), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(confetti.colors.slice(), 3))
    return geo
  }, [confetti])

  useFrame(({ clock }, delta) => {
    const st = useBattleStore.getState()
    const { tension, velocity, winner } = st
    const t = clock.getElapsedTime()

    // Pull dust: drifts upward, streams sideways with the rope's rush,
    // intensity follows tension + velocity
    if (dustRef.current) {
      const pos = dustRef.current.geometry.attributes.position
      const activity = 0.25 + tension * 1.6 + Math.min(1.5, Math.abs(velocity) * 0.25)
      // Dust gets dragged along with the pull direction, stronger on heaves
      const streamX = velocity * 0.35
      for (let i = 0; i < DUST_COUNT; i++) {
        let y = pos.getY(i) + delta * dust.speeds[i] * activity
        let x = pos.getX(i) + delta * streamX * dust.speeds[i]
        // wrap sideways so streams recycle across the arena
        if (x > 8.5) x = -8.5
        else if (x < -8.5) x = 8.5
        if (y > 1.6) {
          y = 0.02
          const leftSide = i < DUST_COUNT / 2
          x = (leftSide ? -5.2 : 5.2) + (Math.random() - 0.5) * 2.2
          pos.setZ(i, (Math.random() - 0.5) * 3.5)
        }
        pos.setY(i, y)
        // slight sideways shimmer on top of the stream
        pos.setX(i, x + Math.sin(t * 3 + i) * 0.0015 * activity)
      }
      pos.needsUpdate = true
      dustRef.current.material.opacity = 0.15 + tension * 0.55
      dustRef.current.visible = true
    }

    // Confetti: only after victory
    if (confettiRef.current) {
      confettiRef.current.visible = !!winner
      if (winner) {
        const pos = confettiRef.current.geometry.attributes.position
        for (let i = 0; i < CONFETTI_COUNT; i++) {
          let y = pos.getY(i) - delta * confetti.speeds[i]
          if (y < 0) {
            y = 6 + Math.random() * 2
            pos.setX(i, (Math.random() - 0.5) * 14)
          }
          pos.setY(i, y)
          pos.setX(i, pos.getX(i) + Math.sin(t * 2 + i * 1.7) * delta * 0.6)
        }
        pos.needsUpdate = true
      }
    }
  })

  return (
    <group>
      {/* GPU ambience: blue embers left, red embers right (static props, zero re-renders) */}
      <Sparkles
        count={70}
        scale={[7, 3.5, 5]}
        position={[-5.2, 1.6, 0]}
        size={3}
        speed={0.35}
        opacity={0.55}
        color="#58a6ff"
      />
      <Sparkles
        count={70}
        scale={[7, 3.5, 5]}
        position={[5.2, 1.6, 0]}
        size={3}
        speed={0.35}
        opacity={0.55}
        color="#f85149"
      />
      <points ref={dustRef} geometry={dustGeometry}>
        <pointsMaterial
          color="#8b949e"
          size={0.055}
          transparent
          opacity={0.35}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <points ref={confettiRef} geometry={confettiGeometry} visible={false}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
