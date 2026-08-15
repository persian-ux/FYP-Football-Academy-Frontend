import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import PlayerMesh from './PlayerMesh'
import FootballBallPhysics from './FootballBallPhysics'
import FootballField3D from './FootballField3D'
import CrowdStands from './CrowdStands'
import GoalCelebration from './GoalCelebration'
import ScrollPlayerController from './ScrollPlayerController'
import { useScrollSection } from '../../../hooks/useScrollProgress'
import { TEAM_A_COLOR, TEAM_B_COLOR } from '../../../constants/playerPositions'

// ── PLAYER ROSTER + per-section positions / animation states ──
const PLAYERS_CONFIG = [
  // Team A (cyan, attacks left to right)
  {
    id: 'a_gk', role: 'goalkeeper', color: '#ffd700',
    positions: { 0: [-9, 0, 0], 1: [-9, 0, 0], 2: [-9, 0, 0], 3: [-9, 0, 0], 4: [-9, 0, 0], 5: [-9, 0, 0] },
    states: { 0: 'walkIn', 1: 'idle', 2: 'idle', 3: 'blocking', 4: 'celebrate', 5: 'walkOut' },
  },
  {
    id: 'a_def1', team: 'A', role: 'defender', color: TEAM_A_COLOR,
    positions: { 0: [-6, 0, -3], 1: [-6, 0, -3], 2: [-4, 0, -3], 3: [-2, 0, -4], 4: [-2, 0, -2], 5: [-6, 0, -3] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'attack', 3: 'defend', 4: 'celebrate', 5: 'walkOut' },
  },
  {
    id: 'a_mid1', team: 'A', role: 'midfielder', color: TEAM_A_COLOR,
    positions: { 0: [-3, 0, -2], 1: [-3, 0, -2], 2: [0, 0, -2], 3: [3, 0, -3], 4: [5, 0, -1], 5: [-3, 0, -2] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'attack', 3: 'attack', 4: 'celebrate', 5: 'walkOut' },
  },
  {
    id: 'a_mid2', team: 'A', role: 'midfielder', color: TEAM_A_COLOR,
    positions: { 0: [-3, 0, 0], 1: [-3, 0, 0], 2: [1, 0, 0], 3: [5, 0, 0], 4: [7, 0, 0], 5: [-3, 0, 0] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'attack', 3: 'shooting', 4: 'celebrate', 5: 'walkOut' },
  },
  {
    id: 'a_fwd1', team: 'A', role: 'forward', color: TEAM_A_COLOR,
    positions: { 0: [0, 0, 3], 1: [0, 0, 3], 2: [3, 0, 3], 3: [6, 0, 3], 4: [8, 0, 2], 5: [0, 0, 3] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'attack', 3: 'attack', 4: 'celebrate', 5: 'walkOut' },
  },
  {
    id: 'a_fwd2', team: 'A', role: 'forward', color: TEAM_A_COLOR,
    positions: { 0: [0, 0, -2], 1: [0, 0, -2], 2: [2, 0, -1], 3: [5, 0, -2], 4: [7, 0, 1], 5: [0, 0, -2] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'attack', 3: 'attack', 4: 'celebrate', 5: 'walkOut' },
  },

  // Team B (orange, defends right to left)
  {
    id: 'b_gk', team: 'B', role: 'goalkeeper', color: '#ff4500',
    positions: { 0: [9, 0, 0], 1: [9, 0, 0], 2: [9, 0, 0], 3: [9, 0, 1.2], 4: [9, 0, 0], 5: [9, 0, 0] },
    states: { 0: 'walkIn', 1: 'idle', 2: 'idle', 3: 'blocking', 4: 'dejected', 5: 'walkOut' },
  },
  {
    id: 'b_def1', team: 'B', role: 'defender', color: TEAM_B_COLOR,
    positions: { 0: [6, 0, -3], 1: [6, 0, -3], 2: [5, 0, -2], 3: [4, 0, -1], 4: [6, 0, -3], 5: [6, 0, -3] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'defend', 3: 'blocking', 4: 'dejected', 5: 'walkOut' },
  },
  {
    id: 'b_mid1', team: 'B', role: 'midfielder', color: TEAM_B_COLOR,
    positions: { 0: [3, 0, 0], 1: [3, 0, 0], 2: [2, 0, 0], 3: [1, 0, 2], 4: [3, 0, 0], 5: [3, 0, 0] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'defend', 3: 'defend', 4: 'dejected', 5: 'walkOut' },
  },
  {
    id: 'b_def2', team: 'B', role: 'defender', color: TEAM_B_COLOR,
    positions: { 0: [6, 0, 3], 1: [6, 0, 3], 2: [5, 0, 2], 3: [4, 0, 1], 4: [6, 0, 3], 5: [6, 0, 3] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'defend', 3: 'blocking', 4: 'dejected', 5: 'walkOut' },
  },
  {
    id: 'b_fwd1', team: 'B', role: 'forward', color: TEAM_B_COLOR,
    positions: { 0: [1, 0, -2], 1: [1, 0, -2], 2: [0, 0, -1], 3: [-1, 0, 0], 4: [3, 0, -2], 5: [1, 0, -2] },
    states: { 0: 'walkIn', 1: 'warmup', 2: 'defend', 3: 'defend', 4: 'dejected', 5: 'walkOut' },
  },
]

// ── Stadium floodlights that fade in from section 1 ──
const TOWER_POSITIONS = [
  [-13, 9, -9], [13, 9, -9], [-13, 9, 9], [13, 9, 9],
]

function StadiumLights() {
  const section = useScrollSection()
  const brightness = useRef(0)
  const target = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    const dir = section >= 1 ? 1 : -1
    brightness.current = Math.min(1, Math.max(0, brightness.current + dir * delta * 1.2))
  })

  return (
    <>
      <primitive object={target} position={[0, 0.5, 0]} />
      {TOWER_POSITIONS.map((pos, i) => (
        <spotLight
          key={i}
          position={[pos[0], pos[1] + 8, pos[2]]}
          target={target}
          angle={0.45}
          penumbra={0.55}
          intensity={brightness.current}
          distance={60}
          color={i % 2 === 0 ? '#bfe8ff' : '#ffe9bf'}
        />
      ))}
    </>
  )
}

// ── Champion trophy that rises for the outro ──
function Trophy() {
  const groupRef = useRef()
  const section = useScrollSection()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = section === 5 ? 0.8 : -0.7
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * delta * 6
    if (section === 5) groupRef.current.rotation.y += delta * 0.9
  })

  return (
    <group ref={groupRef} position={[0, -0.7, 0]}>
      <mesh position={[0, 0.55, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.25} emissive="#b8860b" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 0.22, 12]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.1, 0.7]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  )
}

const FootballScene = () => {
  const section = useScrollSection()
  const celebrating = section === 4

  return (
    <group>
      <ScrollPlayerController />
      <FootballField3D />
      <CrowdStands count={2000} />
      <StadiumLights />

      {PLAYERS_CONFIG.map((config, i) => {
        const position = config.positions[section] || config.positions[0]
        const state = config.states[section] || 'idle'
        return (
          <PlayerMesh
            key={config.id}
            position={position}
            teamColor={config.color}
            animationState={state}
            playerRole={config.role}
            index={i}
          />
        )
      })}

      <FootballBallPhysics />
      <GoalCelebration position={[9, 0, 0]} />
      <Trophy />

      {celebrating && (
        <>
          <Sparkles count={120} scale={20} size={6} speed={1.5} color="#ffd700" opacity={0.8} />
          <pointLight position={[9, 5, 0]} color="#ffd700" intensity={30} distance={26} />
        </>
      )}
    </group>
  )
}

export default FootballScene