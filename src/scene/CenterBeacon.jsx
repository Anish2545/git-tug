import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Billboard, Float, Sparkles, Text } from '@react-three/drei'
import { useBattleStore } from '../store/battleStore'

export default function CenterBeacon() {
  const crystalRef = useRef()
  const matRef = useRef()
  const labelRef = useRef()
  const lastLabel = useRef('')

  const [{ beaconX }, api] = useSpring(() => ({
    beaconX: 0,
    config: { mass: 1, tension: 220, friction: 26 },
  }))

  useFrame(({ clock }) => {
    const { ropeOffset, tension, velocity } = useBattleStore.getState()
    const t = clock.getElapsedTime()
    const maxShift = 3.8

    api.start({ beaconX: (ropeOffset / 100) * maxShift })

    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * (1.6 + Math.abs(velocity) * 0.25)
      // Squash-and-stretch along the direction of travel: elongates as it flies
      const stretch = Math.min(0.55, Math.abs(velocity) * 0.07)
      const s = 1 + tension * 0.25 + Math.sin(t * 5) * 0.04 * tension
      crystalRef.current.scale.set(s * (1 + stretch), s * (1 - stretch * 0.55), s)
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.9 + tension * 0.8
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
      {/* Floating gold crystal with soft hover */}
      <Float speed={3.2} rotationIntensity={0.4} floatIntensity={1.6}>
        <mesh ref={crystalRef} position={[0, 0.75, 0.9]} castShadow>
          <octahedronGeometry args={[0.22]} />
          <meshStandardMaterial
            ref={matRef}
            color="#f0c060"
            emissive="#f0c060"
            emissiveIntensity={0.9}
            roughness={0.25}
            metalness={0.6}
          />
        </mesh>
      </Float>

      {/* Gold ember sparkles around the beacon */}
      <Sparkles
        count={45}
        scale={[2.4, 1.6, 2.4]}
        position={[0, 0.8, 0.9]}
        size={4}
        speed={0.5}
        opacity={0.7}
        color="#f0c060"
      />

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
      {/* Center line post */}
      <mesh position={[0, 0.3, 0.9]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshBasicMaterial color="#f0c060" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Warm point light burst, brighter under tension */}
      <BeaconLight />
    </animated.group>
  )
}

function BeaconLight() {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    const { tension, velocity } = useBattleStore.getState()
    if (lightRef.current) {
      // Steady tension glow + high-frequency flicker scaled by rush speed
      const t = clock.getElapsedTime()
      lightRef.current.intensity =
        6 + tension * 14 + Math.abs(velocity) * 1.6 + Math.sin(t * 30) * Math.abs(velocity) * 0.5
    }
  })
  return (
    <pointLight ref={lightRef} position={[0, 1.2, 0.9]} color="#f0c060" intensity={6} distance={7} decay={2} />
  )
}
