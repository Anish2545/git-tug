import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  Grid,
  Stars,
  Sparkles,
  ContactShadows,
  PerspectiveCamera,
  MeshReflectorMaterial,
  Preload,
} from '@react-three/drei'
import * as THREE from 'three'
import VoxelDistrict from './VoxelDistrict'
import TugCable from './TugCable'
import Developers from './Developer'
import CenterBeacon from './CenterBeacon'
import ParticleSystem from './ParticleSystem'
import { useBattleStore } from '../store/battleStore'

// Camera follows the rope: target drifts with displacement, FOV punches
// wider on yank surges for impact, then settles back.
function CameraRig() {
  const controls = useThree((s) => s.controls)
  const punch = useRef(0)
  useFrame(({ camera }, delta) => {
    const { ropeOffset, velocity } = useBattleStore.getState()
    if (controls) {
      controls.target.x = THREE.MathUtils.damp(
        controls.target.x,
        (ropeOffset / 100) * 2.2,
        2.5,
        delta
      )
    }
    const surge = Math.min(1, Math.abs(velocity) / 8)
    punch.current = THREE.MathUtils.damp(punch.current, surge, 4, delta)
    if (camera && camera.isPerspectiveCamera) {
      const targetFov = 42 + punch.current * 5
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, delta)
        camera.updateProjectionMatrix()
      }
    }
  })
  return null
}

function ShakeGroup({ children }) {
  const group = useRef()
  const amp = useRef(0)
  useFrame((_, delta) => {
    const { velocity } = useBattleStore.getState()
    const target =
      Math.abs(velocity) > 2.5 ? Math.min(0.22, Math.abs(velocity) * 0.045) : 0
    amp.current = THREE.MathUtils.damp(amp.current, target, 8, delta)
    if (group.current) {
      group.current.position.set(
        (Math.random() - 0.5) * amp.current,
        0,
        (Math.random() - 0.5) * amp.current
      )
    }
  })
  return <group ref={group}>{children}</group>
}

export default function Arena() {
  const battleState = useBattleStore((s) => s.battleState)
  const idle = battleState === 'IDLE'

  return (
    <>
      <fog attach="fog" args={['#0c0d10', 14, 34]} />
      {/* No background color — transparent canvas lets the reactive CSS sky show through */}

      <PerspectiveCamera makeDefault position={[8.5, 7.5, 11]} fov={42} />

      {/* Lighting: ambient + blue-left / red-right spots + gold center */}
      <ambientLight intensity={0.55} />
      <spotLight
        position={[-9, 9, 6]}
        angle={0.5}
        penumbra={0.7}
        intensity={220}
        color="#58a6ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[9, 9, 6]}
        angle={0.5}
        penumbra={0.7}
        intensity={220}
        color="#f85149"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 4, 2]} color="#f0c060" intensity={18} distance={16} decay={2} />
      <directionalLight position={[0, 10, 4]} intensity={0.5} color="#f0f6fc" />

      {/* Reflective arena floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[26, 14]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={1024}
          mixBlur={1}
          mixStrength={12}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#111318"
          metalness={0.4}
          mirror={0.6}
        />
      </mesh>
      {/* Shader grid inlay above the mirror */}
      <Grid
        position={[0, -0.09, 0]}
        args={[26, 14]}
        cellSize={0.65}
        cellThickness={0.6}
        cellColor="#21262d"
        sectionSize={3.2}
        sectionThickness={1.1}
        sectionColor="#30363d"
        fadeDistance={30}
        fadeStrength={2.5}
        followCamera={false}
        infiniteGrid={false}
      />
      {/* Center dividing line */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.08, 0.02, 10]} />
        <meshStandardMaterial
          color="#f0c060"
          emissive="#f0c060"
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* Soft grounding shadows */}
      <ContactShadows position={[0, 0.02, 0]} opacity={0.65} scale={24} blur={2.4} far={4} resolution={512} color="#000000" />

      {/* Depth atmosphere */}
      <Stars radius={70} depth={25} count={2200} factor={3.5} saturation={0} fade speed={0.5} />
      <Sparkles
        count={90}
        scale={[18, 6, 10]}
        position={[0, 3, 0]}
        size={2.5}
        speed={0.25}
        opacity={0.5}
        color="#8b949e"
      />

      {/* Battle contents (camera shake applies here, not to the camera itself) */}
      <ShakeGroup>
        <VoxelDistrict />
        <TugCable p1X={-5.2} p2X={5.2} handsY={1.2} />
        <Developers />
        <CenterBeacon />
        <ParticleSystem />
      </ShakeGroup>

      <CameraRig />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        autoRotate={idle}
        autoRotateSpeed={0.5}
        minDistance={8}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.35}
        minPolarAngle={Math.PI / 5}
        target={[0, 0.8, 0]}
      />
      <Environment preset="city" />
      <Preload all />
    </>
  )
}
