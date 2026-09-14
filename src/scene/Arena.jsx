import React from 'react'
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

// Camera follows the rope gently: target drifts with displacement.
// No FOV punch — reframing every frame made the whole scene swim.
function CameraRig() {
  const controls = useThree((s) => s.controls)
  useFrame(({ }, delta) => {
    const { ropeOffset } = useBattleStore.getState()
    if (controls) {
      controls.target.x = THREE.MathUtils.damp(
        controls.target.x,
        (ropeOffset / 100) * 1.4,
        1.2,
        delta
      )
    }
  })
  return null
}

// Shake disabled: moving the whole world while fighters counter-move
// read as jitter, not impact. Kept as a plain group (single place to
// re-enable if impact feel is ever wanted back).
function ShakeGroup({ children }) {
  return <group>{children}</group>
}

export default function Arena() {
  const isLow = useBattleStore((s) => s.graphics === 'low')
  return (
    <>
      <fog attach="fog" args={['#0c0d10', 14, 34]} />
      {/* No background color — transparent canvas lets the reactive CSS sky show through */}

      <PerspectiveCamera makeDefault position={[8.5, 7.5, 11]} fov={42} />

      {/* Lighting: ambient + blue-left / red-right spots + gold center */}
      <ambientLight intensity={isLow ? 0.85 : 0.65} />
      <spotLight
        position={[-9, 9, 6]}
        angle={0.5}
        penumbra={0.8}
        intensity={isLow ? 60 : 120}
        color="#58a6ff"
        castShadow={!isLow}
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[9, 9, 6]}
        angle={0.5}
        penumbra={0.8}
        intensity={isLow ? 60 : 120}
        color="#f85149"
        castShadow={!isLow}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 4, 2]} color="#f0c060" intensity={isLow ? 6 : 10} distance={16} decay={2} />
      <directionalLight position={[0, 10, 4]} intensity={0.5} color="#f0f6fc" />

      {/* Arena floor: reflective mirror on high, flat cheap material on low */}
      {isLow ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
          <planeGeometry args={[26, 14]} />
          <meshStandardMaterial color="#111318" roughness={0.95} metalness={0} />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
          <planeGeometry args={[26, 14]} />
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={1024}
            mixBlur={1}
            mixStrength={6}
            roughness={0.9}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#111318"
            metalness={0.4}
            mirror={0.35}
          />
        </mesh>
      )}
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
      {!isLow && <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={24} blur={2.4} far={4} resolution={512} color="#000000" />}

      {/* Depth atmosphere — disabled in LOW for slow GPUs */}
      {!isLow && <Stars radius={70} depth={25} count={1200} factor={2.5} saturation={0} fade speed={0.4} />}
      {!isLow && (
        <Sparkles
          count={50}
          scale={[18, 6, 10]}
          position={[0, 3, 0]}
          size={2}
          speed={0.2}
          opacity={0.3}
          color="#8b949e"
        />
      )}

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
        enableDamping={!isLow}
        autoRotate={false}
        minDistance={8}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.35}
        minPolarAngle={Math.PI / 5}
        target={[0, 0.8, 0]}
      />
      {!isLow && <Environment preset="city" />}
      {!isLow && <Preload all />}
    </>
  )
}
