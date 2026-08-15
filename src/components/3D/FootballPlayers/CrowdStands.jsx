import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollSection } from '../../../hooks/useScrollProgress'

const CrowdStands = ({ count = 2000 }) => {
  const crowdRef = useRef()
  const section = useScrollSection()

  const [positions, colors, baseY] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const baseY = new Float32Array(count)

    const teamColors = [
      new THREE.Color('#00d4ff'),
      new THREE.Color('#ff6b35'),
      new THREE.Color('#ffd700'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#ff0000'),
    ]

    for (let i = 0; i < count; i++) {
      const side = Math.floor(i / (count / 4))
      const i3 = i * 3
      let x, y, z
      if (side === 0) {
        x = (Math.random() - 0.5) * 22
        y = 2 + Math.random() * 4
        z = -8 - Math.random() * 3
      } else if (side === 1) {
        x = (Math.random() - 0.5) * 22
        y = 2 + Math.random() * 4
        z = 8 + Math.random() * 3
      } else if (side === 2) {
        x = -12 - Math.random() * 3
        y = 2 + Math.random() * 4
        z = (Math.random() - 0.5) * 14
      } else {
        x = 12 + Math.random() * 3
        y = 2 + Math.random() * 4
        z = (Math.random() - 0.5) * 14
      }
      positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z
      baseY[i] = y
      const c = teamColors[Math.floor(Math.random() * teamColors.length)]
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b
    }
    return [positions, colors, baseY]
  }, [count])

  useFrame(({ clock }) => {
    if (!crowdRef.current) return
    const t = clock.getElapsedTime()
    const posArray = crowdRef.current.geometry.attributes.position.array

    const waveTime = t % 10
    const isWaving = waveTime < 3.2
    const celebrating = section === 4

    for (let i = 0; i < count; i++) {
      const x = posArray[i * 3]
      const by = baseY[i]
      let y = by
      if (celebrating) {
        y = by + Math.abs(Math.sin(t * 5 + i * 0.1)) * 0.9
      } else if (isWaving) {
        const waveOffset = (x + 11) / 22
        const wave = Math.max(0, Math.sin((waveTime * 2 - waveOffset * 2.5) * Math.PI))
        y = by + wave * 0.6
      } else {
        y = by + Math.sin(t * 2 + i) * 0.1
      }
      posArray[i * 3 + 1] = y
    }
    crowdRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={crowdRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.72}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default CrowdStands