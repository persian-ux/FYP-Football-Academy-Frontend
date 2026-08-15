import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { getScrollProgress } from '../../../hooks/useScrollProgress'

// Ball path per section with smooth blending between sections.
const BALL_PATH = [
  [0, 0.3, 0], // 0 hero
  [0, 0.3, 0], // 1 center
  [3, 0.3, 0], // 2 kickoff
  [7, 1.8, 1], // 3 in the air
  [9.5, 0.3, 0], // 4 in the goal
  [0, 0.3, 0], // 5 outro
]

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

function lerpVec(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

const FootballBallPhysics = () => {
  const ballRef = useRef()
  const glowRef = useRef()
  const shadowRef = useRef()

  const spinSpeeds = useMemo(() => [0.5, 0.5, 3, 5, 1.5, 0.2], [])

  useFrame(({ clock }, delta) => {
    if (!ballRef.current) return
    const t = clock.getElapsedTime()
    const progress = getScrollProgress()

    // Blend between the two surrounding sections using the clamped global progress.
    let fromIdx = 0
    let toIdx = 0
    let localT = 0
    if (progress < 0.1) { fromIdx = 0; toIdx = 1; localT = progress / 0.1 }
    else if (progress < 0.3) { fromIdx = 1; toIdx = 2; localT = (progress - 0.1) / 0.2 }
    else if (progress < 0.5) { fromIdx = 2; toIdx = 3; localT = (progress - 0.3) / 0.2 }
    else if (progress < 0.7) { fromIdx = 3; toIdx = 4; localT = (progress - 0.5) / 0.2 }
    else if (progress < 0.85) { fromIdx = 4; toIdx = 5; localT = (progress - 0.7) / 0.15 }
    else { fromIdx = 5; toIdx = 5; localT = 1 }

    let pos = lerpVec(BALL_PATH[fromIdx], BALL_PATH[toIdx], smoothstep(localT))

    // Dribble wiggle during the attack sequence
    if (progress >= 0.5 && progress < 0.7) {
      const wig = Math.sin(t * 6) * 0.4
      pos = [pos[0], pos[1], wig]
    }

    ballRef.current.position.set(pos[0], pos[1], pos[2])
    const ballPos = ballRef.current.position

    // Spin picks up as the ball travels
    const spinIdx = progress < 0.1 ? 0 : progress < 0.3 ? 1 : progress < 0.5 ? 2 : progress < 0.7 ? 3 : progress < 0.85 ? 4 : 5
    const spinSpeed = spinSpeeds[spinIdx]
    ballRef.current.rotation.x += delta * spinSpeed
    ballRef.current.rotation.z += delta * spinSpeed * 0.7

    // Glow pulse — turns gold as the ball crosses into the goal
    if (glowRef.current) {
      const inGoal = progress >= 0.7
      const goalGlow = inGoal ? 3 : 1
      glowRef.current.material.color.set(inGoal ? '#ffd700' : '#00d4ff')
      glowRef.current.material.emissive.set(inGoal ? '#ffd700' : '#00d4ff')
      glowRef.current.material.emissiveIntensity = goalGlow + Math.sin(t * 3) * 0.5
      glowRef.current.material.opacity = 0.2 + Math.sin(t * 2) * 0.1
      glowRef.current.position.copy(ballPos)
    }

    // Ground shadow shrinks as ball rises
    if (shadowRef.current) {
      const scaleVal = Math.max(0.12, 0.42 - ballPos.y * 0.14)
      shadowRef.current.scale.setScalar(scaleVal)
      shadowRef.current.material.opacity = Math.max(0.1, (1 - ballPos.y * 0.25) * 0.5)
    }
  })

  return (
    <group>
      {/* Trail */}
      <Trail width={0.3} length={6} color={'#00d4ff'} attenuation={(t) => t * t}>
        <group ref={ballRef}>
          {/* Ball */}
          <mesh>
            <sphereGeometry args={[0.25, 24, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Black pentagon pattern */}
          {[...Array(6)].map((_, i) => {
            const phi = Math.acos(-1 + (2 * i) / 6)
            const theta = Math.sqrt(6 * Math.PI) * phi
            return (
              <mesh
                key={i}
                position={[
                  Math.sin(phi) * Math.cos(theta) * 0.26,
                  Math.sin(phi) * Math.sin(theta) * 0.26,
                  Math.cos(phi) * 0.26,
                ]}
              >
                <circleGeometry args={[0.06, 5]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </mesh>
            )
          })}
        </group>
      </Trail>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={1}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ground shadow */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default FootballBallPhysics