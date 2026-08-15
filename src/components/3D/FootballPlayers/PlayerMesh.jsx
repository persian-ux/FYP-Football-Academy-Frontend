import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { damp3 } from 'maath/easing'
import * as THREE from 'three'
import { ANIMATION_SPEEDS, MOVING_STATES, RUNNING_STATES, SPRINTING_STATES } from '../../../constants/animationStates'

// Player built from geometric shapes — no texture files needed.
// Smoothly glides toward its per-scroll-section target position.
const PlayerMesh = ({
  position = [0, 0, 0],
  teamColor = '#00d4ff',
  animationState = 'idle',
  playerRole = 'outfield',
  index = 0,
}) => {
  const groupRef = useRef()
  const bodyRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const headRef = useRef()
  const shadowRef = useRef()
  const desiredPos = useRef(new THREE.Vector3(...position))

  desiredPos.current.set(position[0], position[1], position[2])

  const scale = playerRole === 'goalkeeper' ? 1.35 : 1.0
  const offset = index * 0.5
  const moving = MOVING_STATES.includes(animationState)
  const sprinting = SPRINTING_STATES.includes(animationState)
  const running = RUNNING_STATES.includes(animationState)
  const animSpeed = useMemo(() => ANIMATION_SPEEDS, [])

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    const s = animSpeed[animationState] || 1

    // -- Smooth slide toward target + face travel direction --
    if (groupRef.current) {
      const prev = groupRef.current.position.clone()
      damp3(groupRef.current.position, desiredPos.current, 0.22, delta)
      const dx = groupRef.current.position.x - prev.x
      const dz = groupRef.current.position.z - prev.z
      if (Math.hypot(dx, dz) > 0.0005 && moving) {
        const targetYaw = Math.atan2(dx, -dz)
        let diff = targetYaw - groupRef.current.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        groupRef.current.rotation.y += diff * 0.15
      }
    }

    // Body bob while moving
    if (bodyRef.current) {
      if (running) {
        bodyRef.current.position.y = Math.abs(Math.sin((t + offset) * s)) * 0.05
      } else if (animationState === 'celebrate') {
        bodyRef.current.position.y = Math.abs(Math.sin((t + offset) * s)) * 0.15
      } else {
        bodyRef.current.position.y = 0
      }
    }

    // Legs
    if (leftLegRef.current && rightLegRef.current) {
      if (running) {
        const legSwing = Math.sin((t + offset) * s * 2) * 0.4
        leftLegRef.current.rotation.x = legSwing
        rightLegRef.current.rotation.x = -legSwing
        leftLegRef.current.rotation.z = 0
        rightLegRef.current.rotation.z = 0
      } else if (animationState === 'celebrate') {
        leftLegRef.current.rotation.z = Math.abs(Math.sin((t + offset) * 3)) * 0.3
        rightLegRef.current.rotation.z = -Math.abs(Math.sin((t + offset) * 3)) * 0.3
      } else if (animationState === 'blocking') {
        leftLegRef.current.rotation.x = -0.9
        rightLegRef.current.rotation.x = 0.6
      } else {
        leftLegRef.current.rotation.x *= 0.9
        rightLegRef.current.rotation.x *= 0.9
      }
    }

    // Arms
    if (leftArmRef.current && rightArmRef.current) {
      if (['attack', 'warmup', 'defend'].includes(animationState)) {
        const armSwing = Math.sin((t + offset) * s * 2) * 0.35
        leftArmRef.current.rotation.x = -armSwing
        rightArmRef.current.rotation.x = armSwing
      } else if (animationState === 'celebrate') {
        leftArmRef.current.rotation.z = Math.PI / 2 + Math.sin(t * 5) * 0.2
        rightArmRef.current.rotation.z = -Math.PI / 2 - Math.sin(t * 5) * 0.2
      } else if (animationState === 'shooting') {
        rightArmRef.current.rotation.x = -Math.PI / 3
        leftArmRef.current.rotation.x = Math.PI / 4
      } else {
        leftArmRef.current.rotation.x *= 0.9
        rightArmRef.current.rotation.x *= 0.9
      }
    }

    // Head
    if (headRef.current) {
      if (animationState === 'celebrate') {
        headRef.current.rotation.y = Math.sin(t * 3 + offset) * 0.5
      } else if (animationState === 'dejected') {
        headRef.current.rotation.x = 0.4
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.5 + offset) * 0.2
      }
    }

    // Shadow
    if (shadowRef.current) {
      const pulse = 1 + Math.abs(Math.sin((t + offset) * s)) * 0.1
      shadowRef.current.scale.set(pulse, pulse, pulse)
    }

    // Celebrate jump (otherwise keep damped glide)
    if (groupRef.current && animationState === 'celebrate') {
      groupRef.current.position.y = desiredPos.current.y + Math.abs(Math.sin((t + offset) * 4)) * 0.55
    }
  })

  const emissiveIntensity =
    animationState === 'celebrate' ? 0.5 : animationState === 'shooting' ? 0.3 : 0.1

  return (
    <group ref={groupRef} position={desiredPos.current} scale={scale}>
      {/* Shadow blob */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.9, 0]}
      >
        <circleGeometry args={[0.26, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* ── BODY ─────────────────────────────── */}
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 0.28, 0]}>
          <capsuleGeometry args={[0.17, 0.34, 4, 10]} />
          <meshStandardMaterial
            color={teamColor}
            emissive={teamColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>

        {/* Number badge */}
        <mesh position={[0, 0.3, 0.2]}>
          <circleGeometry args={[0.06, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.68, 0]}>
          <mesh>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial color="#f4a460" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? '#1a1a1a' : index % 3 === 1 ? '#8B4513' : '#ffd700'}
              roughness={1}
            />
          </mesh>
          <mesh position={[0.06, 0.02, 0.12]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[-0.06, 0.02, 0.12]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>

        {/* Left arm */}
        <group ref={leftArmRef} position={[0.2, 0.34, 0]} rotation={[0, 0, 0.2]}>
          <mesh position={[0, -0.14, 0]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
            <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={emissiveIntensity * 0.5} />
          </mesh>
          <mesh position={[0, -0.27, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#f4a460" />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[-0.3, 0.34, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0, -0.14, 0]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
            <meshStandardMaterial color={teamColor} emissive={teamColor} emissiveIntensity={emissiveIntensity * 0.5} />
          </mesh>
          <mesh position={[0, -0.27, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#f4a460" />
          </mesh>
        </group>
{/* Left leg */}
        <group ref={leftLegRef} position={[0.09, -0.05, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <capsuleGeometry args={[0.08, 0.1, 4, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
            <meshStandardMaterial color={teamColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.34, 0.05]}>
            <boxGeometry args={[0.11, 0.07, 0.18]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[-0.09, -0.05, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <capsuleGeometry args={[0.08, 0.1, 4, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.06, 0.2, 4, 6]} />
            <meshStandardMaterial color={teamColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.34, 0.05]}>
            <boxGeometry args={[0.11, 0.07, 0.18]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Glow aura on celebrate */}
      {animationState === 'celebrate' && (
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial
            color={teamColor}
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            emissive={teamColor}
            emissiveIntensity={1}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Speed trail for sprinting players */}
      {sprinting && (
        <mesh position={[-0.3, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <coneGeometry args={[0.14, 0.6, 8]} />
          <meshBasicMaterial color={teamColor} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

export default PlayerMesh