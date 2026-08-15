import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollSection } from '../../../hooks/useScrollProgress'

// Golden confetti fountain detonating from the goal area when the scroll
// reaches the celebration section.
const GoalCelebration = ({ position = [9, 0, 0] }) => {
  const particlesRef = useRef()
  const section = useScrollSection()
  const active = section === 4

  const COUNT = 220
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const vels = []
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 1.5
      pos[i * 3 + 1] = position[1] + Math.random() * 0.5
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 1.5
      vels.push({
        x: (Math.random() - 0.5) * 0.18,
        y: Math.random() * 0.24 + 0.06,
        z: (Math.random() - 0.5) * 0.18,
        life: Math.random(),
        decay: 0.01 + Math.random() * 0.012,
      })
    }
    return [pos, vels]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (!particlesRef.current || !active) return
    const posArray = particlesRef.current.geometry.attributes.position.array
    for (let i = 0; i < COUNT; i++) {
      const vel = velocities[i]
      vel.life -= vel.decay
      if (vel.life <= 0) {
        posArray[i * 3] = position[0] + (Math.random() - 0.5) * 1.5
        posArray[i * 3 + 1] = position[1] + Math.random() * 0.5
        posArray[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 1.5
        vel.x = (Math.random() - 0.5) * 0.18
        vel.y = Math.random() * 0.24 + 0.06
        vel.z = (Math.random() - 0.5) * 0.18
        vel.life = 1
      } else {
        posArray[i * 3] += vel.x
        posArray[i * 3 + 1] += vel.y
        posArray[i * 3 + 2] += vel.z
        vel.y -= 0.005
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      {active && (
        <>
          <points ref={particlesRef}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
              size={0.16}
              color="#ffd700"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
          <Sparkles count={60} scale={4} size={5} speed={1.2} color="#ffd700" position={position} />
        </>
      )}
    </group>
  )
}

export default GoalCelebration