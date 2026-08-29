import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp3 } from 'maath/easing'
import * as THREE from 'three'
import { ANIMATION_SPEEDS, MOVING_STATES, RUNNING_STATES } from '../../../constants/animationStates'

// Broadcast-grade tactical athlete marker (EA Sports FC / UEFA Analytics style)
const PlayerMesh = ({
  position = [0, 0, 0],
  teamColor = '#00d4ff',
  animationState = 'idle',
  playerRole = 'outfield',
  index = 0,
}) => {
  const groupRef = useRef(null)
  const ringRef = useRef(null)
  const beaconRef = useRef(null)
  const desiredPos = useRef(new THREE.Vector3(...position))

  desiredPos.current.set(position[0], position[1], position[2])

  const moving = MOVING_STATES.includes(animationState)
  const running = RUNNING_STATES.includes(animationState)
  const offset = index * 0.4
  const animSpeed = useMemo(() => ANIMATION_SPEEDS, [])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const s = animSpeed[animationState] || 1

    if (groupRef.current) {
      const prev = groupRef.current.position.clone()
      damp3(groupRef.current.position, desiredPos.current, 0.2, delta)
      const dx = groupRef.current.position.x - prev.x
      const dz = groupRef.current.position.z - prev.z
      if (Math.hypot(dx, dz) > 0.0005 && moving) {
        const targetYaw = Math.atan2(dx, -dz)
        let diff = targetYaw - groupRef.current.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        groupRef.current.rotation.y += diff * 0.15
      }

      // Smooth athlete presence hover / bob
      const hoverY = running ? Math.sin((t + offset) * s * 3) * 0.08 + 0.1 : Math.sin((t + offset) * 1.5) * 0.03
      groupRef.current.position.y = desiredPos.current.y + hoverY
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (running ? 2 : 0.8)
    }

    if (beaconRef.current) {
      beaconRef.current.material.opacity = 0.5 + Math.sin((t + offset) * 2) * 0.25
    }
  })

  const isGK = playerRole === 'goalkeeper'
  const accentColor = isGK ? '#ffd700' : teamColor

  return (
    <group ref={groupRef} position={desiredPos.current}>
      {/* Tactical Holographic Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} ref={ringRef}>
        <ringGeometry args={[0.35, 0.45, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner Energy Pulse */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {/* Sleek Tactical Cylinder Pillar */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.85, 24]} />
        <meshStandardMaterial
          color="#0c1322"
          emissive={accentColor}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Jersey Number Core Light */}
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Directional Beacon Pointer */}
      <mesh position={[0, 0.45, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.24, 16]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
      </mesh>

      {/* Vertical Tactical Beam */}
      <mesh ref={beaconRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export default PlayerMesh