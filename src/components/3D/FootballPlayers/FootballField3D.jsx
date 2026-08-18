import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// White goal frame + simple net.
const GoalPost = ({ position, rotation = [0, 0, 0] }) => {
  const netRef = useRef()

  useFrame(({ clock }) => {
    if (!netRef.current) return
    const t = clock.getElapsedTime()
    netRef.current.scale.z = 1 + Math.sin(t * 0.5) * 0.04
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Left post */}
      <mesh position={[-1, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Right post */}
      <mesh position={[1, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 2.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Net back + mesh */}
      <group ref={netRef}>
        <mesh position={[0, 1.2, -0.55]} rotation={[0, 0, 0]}>
          <boxGeometry args={[2.1, 2.4, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} wireframe />
        </mesh>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 1.2, -0.4]}>
            <boxGeometry args={[0.01, 2.3, 0.4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.1} wireframe />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const FIELD_LINES = [
  // center line
  [[0, 0, -6], [0, 0, 6]],
  // left penalty box
  [[-10, 0, -3], [-7, 0, -3]],
  [[-10, 0, 3], [-7, 0, 3]],
  [[-7, 0, -3], [-7, 0, 3]],
  // right penalty box
  [[10, 0, -3], [7, 0, -3]],
  [[10, 0, 3], [7, 0, 3]],
  [[7, 0, -3], [7, 0, 3]],
  // outer boundary
  [[-10, 0, -6], [10, 0, -6]],
  [[-10, 0, 6], [10, 0, 6]],
  [[-10, 0, -6], [-10, 0, 6]],
  [[10, 0, -6], [10, 0, 6]],
]

const FootballField3D = () => {
  const grassRef = useRef()

  useFrame(({ clock }) => {
    if (!grassRef.current) return
    grassRef.current.material.emissiveIntensity =
      0.04 + Math.sin(clock.getElapsedTime() * 0.5) * 0.02
  })

  return (
    <group>
      {/* Main pitch */}
      <mesh ref={grassRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 12, 40, 24]} />
        <meshStandardMaterial
          color="#0a3d0a"
          emissive="#0a3d0a"
          emissiveIntensity={0.04}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Mowing stripes */}
      {[...Array(10)].map((_, i) => (
        <mesh key={i} position={[-9 + i * 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.9, 11.98]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#0d4a0d' : '#0a3d0a'} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Field lines */}
      {FIELD_LINES.map((line, i) => (
        <Line key={i} points={line} color="#ffffff" lineWidth={1.5} transparent opacity={0.55} />
      ))}

      {/* Center circle + dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.9, 2, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      {/* Goals */}
      <GoalPost position={[-10, 0, 0]} />
      <GoalPost position={[10, 0, 0]} rotation={[0, Math.PI, 0]} />

      {/* Corner flags */}
      {[[-10, 0, -6], [-10, 0, 6], [10, 0, -6], [10, 0, 6]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}

      {/* Glow border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[9.9, 10.6, 64]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default FootballField3D