import React, { Suspense, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Billboard, Text, Float, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useBattleStore } from '../store/battleStore'

// Guard against failed avatar fetches (rate limits, bad CORS) — show fallback disc
class AvatarBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) this.setState({ failed: false })
  }
  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

function AvatarDisc({ url }) {
  const tex = useTexture(url)
  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])
  return (
    <mesh>
      <circleGeometry args={[0.42, 32]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function AvatarFace({ fighter }) {
  const fallback = (
    <mesh>
      <circleGeometry args={[0.42, 32]} />
      <meshBasicMaterial color="#21262d" />
    </mesh>
  )
  if (!fighter?.avatar_url) return fallback
  return (
    <AvatarBoundary key={fighter.avatar_url} url={fighter.avatar_url} fallback={fallback}>
      <Suspense fallback={fallback}>
        <AvatarDisc url={fighter.avatar_url} />
      </Suspense>
    </AvatarBoundary>
  )
}

function Nameplate({ fighter, side, accentColor, tpi }) {
  return (
    <Billboard position={[0, 2.62, 0]}>
      <Text
        fontSize={0.27}
        color={accentColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.018}
        outlineColor="#0c0d10"
      >
        {fighter ? `@${fighter.login}` : side === 'left' ? 'P1' : 'P2'}
      </Text>
      {fighter && (
        <Text
          position={[0, -0.34, 0]}
          fontSize={0.17}
          color="#8b949e"
          anchorX="center"
          anchorY="middle"
        >
          {`TPI ${tpi.toLocaleString()}`}
        </Text>
      )}
    </Billboard>
  )
}

function Developer({ side, handsY = 1.2 }) {
  // Avatar/nameplate data only — re-renders on fighter change, NOT on physics ticks
  const fighter = useBattleStore((s) => (side === 'left' ? s.p1 : s.p2))
  const baseX = side === 'left' ? -5.2 : 5.2

  const [{ rotZ, posX, bounceY, digY, squashY }, api] = useSpring(() => ({
    rotZ: 0,
    posX: baseX,
    bounceY: 0,
    digY: 0.04,
    squashY: 1,
    config: { mass: 1.2, tension: 170, friction: 20 },
  }))

  // Imperative spring targets from live physics — no 60fps React re-renders.
  // effort tracks yank intensity: contenders crouch (digY), compress
  // (squashY) and snap back via spring overshoot on every heave.
  useFrame(() => {
    const { ropeOffset, p1Strain, p2Strain, velocity, winner } = useBattleStore.getState()
    const strain = side === 'left' ? p1Strain : p2Strain
    const myLogin = (side === 'left'
      ? useBattleStore.getState().p1
      : useBattleStore.getState().p2
    )?.login
    const isWinner = !!(winner && myLogin && winner.login === myLogin)
    const isLoser = !!(winner && myLogin && winner.login !== myLogin)

    // Am I the one pulling right now? velocity sign vs my side.
    const dragging = side === 'left' ? velocity < -0.4 : velocity > 0.4
    const effort = isWinner || isLoser ? 0 : Math.min(1, Math.abs(velocity) / 7)

    let targetLean = 0
    if (isLoser) {
      targetLean = side === 'left' ? 0.55 : -0.55
    } else if (!isWinner) {
      if (ropeOffset < -5 && side === 'left') targetLean = -(0.35 + strain * 0.2)
      else if (ropeOffset > 5 && side === 'right') targetLean = 0.35 + strain * 0.2
      else if (ropeOffset < -5 && side === 'right') targetLean = 0.12 + strain * 0.1
      else if (ropeOffset > 5 && side === 'left') targetLean = -(0.12 + strain * 0.1)
      // Yank kick: extra snap away from center while actively dragging
      if (dragging) targetLean += (side === 'left' ? -1 : 1) * effort * 0.22
    }

    const maxShift = 3.8
    api.start({
      rotZ: targetLean,
      posX: baseX + (ropeOffset / 100) * maxShift * 0.55,
      bounceY: isWinner ? 1 : 0,
      digY: 0.04 - effort * 0.13,
      squashY: 1 - effort * 0.1,
    })
  })

  const accentColor = side === 'left' ? '#58a6ff' : '#f85149'
  void handsY

  return (
    <animated.group position-x={posX} position-y={digY} rotation-z={rotZ} scale-y={squashY}>
      {/* Legs */}
      <mesh position={[side === 'left' ? -0.12 : 0.12, 0.38, 0]}>
        <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
        <meshStandardMaterial color="#161b22" roughness={0.8} />
      </mesh>
      <mesh position={[side === 'left' ? 0.12 : -0.12, 0.34, 0]}>
        <capsuleGeometry args={[0.09, 0.48, 4, 8]} />
        <meshStandardMaterial color="#161b22" roughness={0.8} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.92, 0]}>
        <capsuleGeometry args={[0.22, 0.42, 4, 8]} />
        <meshStandardMaterial color="#1c2128" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* Accent stripe on torso */}
      <mesh position={[0, 0.92, 0.18]}>
        <boxGeometry args={[0.06, 0.42, 0.025]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>

      {/* Arm reaching toward rope */}
      <mesh
        position={[side === 'left' ? 0.28 : -0.28, 1.05, 0]}
        rotation={[0, 0, side === 'left' ? -0.6 : 0.6]}
      >
        <capsuleGeometry args={[0.075, 0.38, 4, 8]} />
        <meshStandardMaterial color="#161b22" roughness={0.8} />
      </mesh>

      {/* Grip glove */}
      <mesh position={[side === 'left' ? 0.44 : -0.44, 1.12, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Head / Avatar disc */}
      <animated.group position-y={bounceY}>
        <mesh position={[0, 1.52, 0]} castShadow>
          <sphereGeometry args={[0.36, 32, 32]} />
          <meshStandardMaterial color="#161b22" roughness={0.6} />
        </mesh>
        {/* Avatar face texture (drei-cached, suspense-loaded) */}
        <group position={[0, 1.52, 0.34]}>
          <AvatarFace fighter={fighter} />
        </group>
        {/* Accent ring */}
        <mesh position={[0, 1.52, 0]}>
          <torusGeometry args={[0.38, 0.025, 8, 32]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.6}
          />
        </mesh>
        <VictoryStar side={side} />
      </animated.group>

      {/* 3D nameplate floating above */}
      <Nameplate
        fighter={fighter}
        side={side}
        accentColor={accentColor}
        tpi={fighter?.stats.tugPower ?? 0}
      />

      {/* Platform glow ring under feet */}
      <FootRing accentColor={accentColor} side={side} />
    </animated.group>
  )
}

function VictoryStar({ side }) {
  const winner = useBattleStore((s) => s.winner)
  const me = useBattleStore((s) => (side === 'left' ? s.p1 : s.p2))
  const isWinner = !!(winner && me && winner.login === me.login)
  if (!isWinner) return null
  return (
    <Float speed={6} rotationIntensity={2} floatIntensity={3}>
      <mesh position={[0, 2.05, 0]}>
        <octahedronGeometry args={[0.18]} />
        <meshStandardMaterial color="#f0c060" emissive="#f0c060" emissiveIntensity={1.2} />
      </mesh>
    </Float>
  )
}

function FootRing({ accentColor, side }) {
  const ringRef = React.useRef()
  useFrame(() => {
    const { p1Strain, p2Strain } = useBattleStore.getState()
    const strain = side === 'left' ? p1Strain : p2Strain
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.25 + strain * 0.35
    }
  })
  return (
    <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.52, 32]} />
      <meshBasicMaterial color={accentColor} transparent opacity={0.25} depthWrite={false} />
    </mesh>
  )
}

export default function Developers() {
  return (
    <>
      <Developer side="left" />
      <Developer side="right" />
    </>
  )
}
