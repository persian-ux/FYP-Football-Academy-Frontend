import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  ContactShadows,
  Float,
  Html,
  Line,
  OrbitControls,
  PointMaterial,
  Points,
  RoundedBox,
} from '@react-three/drei'
import { BarChart3, Radar } from 'lucide-react'

// ── Colour palette ────────────────────────────────────────────────
const GOALS_COLOR = '#3b82f6'
const ASSISTS_COLOR = '#a855f7'
const RADAR_COLOR = '#22d3ee'

// ── Radar prism proportions ───────────────────────────────────────
const BASE_R = 1.42
const MAX_H = 2.3
const HUB_H = 0.95

/**
 * Builds a translucent THREE.BufferGeometry "crown" for the radar.
 * Each metric lifts a vertex from the base ring up to a height that
 * matches its 0-100 value, then the geometry fills the roof, outer wall
 * and floor so the whole profile reads as a real 3D solid.
 */
function buildRadarGeometry(radar) {
  const positions = []
  const n = radar.length
  const pts = radar.map((m, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const h = (Math.min(100, Math.max(0, m.value)) / 100) * MAX_H
    return { x: Math.cos(a) * BASE_R, z: Math.sin(a) * BASE_R, h }
  })
  const tri = (A, B, C) =>
    positions.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2])

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const p = pts[i]
    const q = pts[j]
    const B1 = [p.x, 0, p.z]
    const B2 = [q.x, 0, q.z]
    const T1 = [p.x, p.h, p.z]
    const T2 = [q.x, q.h, q.z]
    const hub = [0, HUB_H, 0]
    const floor = [0, 0, 0]
    // outer wall (two triangles share the split face)
    tri(T1, T2, B1)
    tri(T1, T2, B2)
    // umbrella top and floor triangles
    tri(hub, T1, T2)
    tri(floor, B1, B2)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  const indices = new Uint16Array(positions.length / 3)
  for (let k = 0; k < indices.length; k++) indices[k] = k
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  geo.computeVertexNormals()
  return geo
}

/** Shared helpers for a metric's polygon points. */
function useRadarPoints(radar) {
  return useMemo(
    () =>
      radar.map((m, i) => {
        const a = (i / radar.length) * Math.PI * 2 - Math.PI / 2
        const h = (Math.min(100, Math.max(0, m.value)) / 100) * MAX_H
        return { x: Math.cos(a) * BASE_R, z: Math.sin(a) * BASE_R, h }
      }),
    [radar]
  )
}

function RadarPrism3D({ radar }) {
  const pts = useRadarPoints(radar)
  const geo = useMemo(() => buildRadarGeometry(radar), [radar])

  const pointPositions = pts.flatMap((p) => [p.x, p.h, p.z])
  const baseRing = useMemo(() => {
    const ring = pts.map((p) => [p.x, 0, p.z])
    ring.push(ring[0])
    return ring
  }, [pts])
  const topRing = useMemo(() => {
    const ring = pts.map((p) => [p.x, p.h, p.z])
    ring.push(ring[0])
    return ring
  }, [pts])

  return (
    <group position={[0, 0.15, 0]}>
      {/* Glass podium */}
      <RoundedBox args={[3.6, 0.18, 3.6]} radius={0.14} smoothness={4}>
        <meshStandardMaterial
          color="#0a0f1e"
          metalness={0.75}
          roughness={0.4}
          emissive="#0d2145"
          emissiveIntensity={0.4}
        />
      </RoundedBox>

      {/* ground + silhouette rings */}
      <Line points={baseRing} color={RADAR_COLOR} lineWidth={0.022} transparent opacity={0.55} />
      <Line points={topRing} color={RADAR_COLOR} lineWidth={0.03} transparent opacity={0.95} />

      {/* rising spokes */}
      {pts.map((p, i) => (
        <Line
          key={i}
          points={[[p.x, 0.02, p.z], [p.x, p.h, p.z]]}
          color={RADAR_COLOR}
          lineWidth={0.015}
          transparent
          opacity={0.35}
        />
      ))}

      {/* translucent crown */}
      <mesh>
        <primitive object={geo} attach="geometry" />
        <meshStandardMaterial
          color={RADAR_COLOR}
          transparent
          opacity={0.26}
          side={THREE.DoubleSide}
          roughness={0.5}
          metalness={0.25}
          emissive={RADAR_COLOR}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* glowing metric vertices */}
      <Points positions={pointPositions}>
        <PointMaterial size={0.13} color="#7df3ff" transparent depthWrite={false} />
      </Points>

      {/* metric labels */}
      {radar.map((m, i) => {
        const p = pts[i]
        return (
          <Html
            key={m.metric}
            position={[p.x * 0.85, p.h + 0.34, p.z * 0.85]}
            center
            sprite
            distanceFactor={11}
            pointerEvents="none"
            wrapperClass="ppc-radar-label"
          >
            <div
              style={{
                fontFamily: 'Geist Variable',
                fontSize: 12,
                fontWeight: 600,
                color: '#e5f6ff',
                whiteSpace: 'nowrap',
                textShadow: '0 0 8px rgba(34,211,238,0.7)',
              }}
            >
              {m.label} <span style={{ color: '#7df3ff' }}>{m.avg}</span>
            </div>
          </Html>
        )
      })}
    </group>
  )
}

/** A single glow-tipped bar that springs toward its target height. */
function BarColumn3D({ value, max, color, stagger = 0, offsetX = 0 }) {
  const stemRef = useRef()
  const capRef = useRef()
  const labelRef = useRef()
  const labelDom = useRef()
  const grow = useRef(0)
  const hoverTarget = useRef(0)
  const hover = useRef(0)

  useFrame(({ clock }, delta) => {
    if (!stemRef.current || !capRef.current || !labelRef.current) return
    const target = max > 0 ? Math.max(0, (value / max) * 2.6) : 0
    grow.current = THREE.MathUtils.damp(grow.current, target, 9, delta)
    hover.current = THREE.MathUtils.damp(hover.current, hoverTarget.current, 16, delta)
    const g = Math.max(0.001, grow.current)
    stemRef.current.scale.y = g
    stemRef.current.position.y = g / 2
    capRef.current.position.y = g
    labelRef.current.position.y = g + 0.12
    const t = clock.getElapsedTime()
    stemRef.current.material.emissiveIntensity =
      0.5 + Math.sin(t * 2 + stagger) * 0.25 + hover.current * 0.9
    if (labelDom.current) {
      labelDom.current.style.opacity = g > 0.06 ? 1 : 0
    }
  })

  return (
    <group position={[offsetX, 0, 0]}>
      <mesh
        ref={stemRef}
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
        onPointerOver={() => (hoverTarget.current = 1)}
        onPointerOut={() => (hoverTarget.current = 0)}
      >
        <cylinderGeometry args={[0.09, 0.115, 1, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <mesh ref={capRef}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1} />
      </mesh>

      {/* numeric value floating above each column */}
      <group ref={labelRef}>
        <Html
          position={[0, 0.12, 0]}
          center
          sprite
          distanceFactor={9}
          pointerEvents="none"
          wrapperClass="ppc-bar-value"
        >
          <span
            ref={labelDom}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color,
              textShadow: `0 0 6px ${color}, 0 0 10px ${color}`,
            }}
          >
            {value}
          </span>
        </Html>
      </group>
    </group>
  )
}

function BarPodium3D({ bars }) {
  const list = bars.slice(0, 8)
  if (list.length === 0) return null

  const max = Math.max(1, ...list.flatMap((b) => [b.goals, b.assists]))
  const count = list.length
  const spacing = 0.68
  const width = Math.max((count - 1) * spacing + 1.35, 2.4)

  return (
    <group position={[0, 0.1, 0]}>
      {/* platform */}
      <RoundedBox args={[width, 0.18, 2.6]} radius={0.12} smoothness={4} receiveShadow>
        <meshStandardMaterial
          color="#070a14"
          metalness={0.75}
          roughness={0.4}
          emissive="#0a1d38"
          emissiveIntensity={0.45}
        />
      </RoundedBox>

      {list.map((b, i) => {
        const x = (i - (count - 1) / 2) * spacing
        return (
                    <group key={b.reportId} position={[x, 0.18, 0.3]}>
            <BarColumn3D
              value={b.goals}
              max={max}
              color={GOALS_COLOR}
              offsetX={-0.15}
              stagger={i}
            />
            <BarColumn3D
              value={b.assists}
              max={max}
              color={ASSISTS_COLOR}
              offsetX={0.15}
              stagger={i + 0.5}
            />
            <Html
              position={[0, -0.22, 0]}
              center
              sprite
              distanceFactor={10}
              pointerEvents="none"
              wrapperClass="ppc-bar-label"
            >
              <span style={{ fontSize: 11, color: '#9fb4d8', whiteSpace: 'nowrap' }}>{b.name}</span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

/**
 * A single shared WebGL stage that renders an animated, draggable,
 * auto-orbit 3D chart. Two modes are available:
 *  - "radar": a raised translucent 3D radar prism of the player's profile
 *  - "bars": glowing, springing columns for goals & assists per report
 */
export default function PerformanceChart3D({ radar = [], bars = [], playerName = '' }) {
  const [mode, setMode] = useState('radar')
  const hasRadar = radar.length > 0
  const hasBars = bars.length > 0

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            disabled={!hasRadar}
            onClick={() => setMode('radar')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === 'radar'
                ? 'bg-blue-500/20 text-cyan-200'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radar className="h-3.5 w-3.5" />
            Profile
          </button>
          <button
            type="button"
            disabled={!hasBars}
            onClick={() => setMode('bars')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              mode === 'bars'
                ? 'bg-blue-500/20 text-cyan-200'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Breakdown
          </button>
        </div>
        {playerName && (
          <span className="text-xs text-gray-500">
            Showing <span className="font-medium text-white">{playerName}</span>
          </span>
        )}
      </div>

      {/* 3D stage */}
      <div className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(90%_120%_at_30%_20%,rgba(13,34,69,0.55),transparent_55%),radial-gradient(110%_120%_at_80%_85%,rgba(64,10,90,0.4),transparent_60%)]">
        <Canvas
          shadows
          dpr={1.5}
          camera={{ position: [0, 7.4, 10.6], fov: 46 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.34} color="#9fc4ff" />
          <directionalLight position={[6, 12, 5]} intensity={1.6} color="#cfe2ff" castShadow />
          <pointLight position={[0, 5, 0]} intensity={12} color="#4db8ff" distance={16} />
          <pointLight position={[-6, 3, -4]} intensity={8} color="#ff9a5c" distance={14} />

          <Suspense fallback={null}>
            <Float speed={1.8} rotationIntensity={0.22} floatIntensity={0.4}>
              {mode === 'radar'
                ? hasRadar && <RadarPrism3D radar={radar} />
                : hasBars && <BarPodium3D bars={bars} />}
            </Float>

            <OrbitControls
              target={[0, 0.9, 0]}
              enablePan={false}
              autoRotate
              autoRotateSpeed={1.1}
              minPolarAngle={Math.PI / 5}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={4}
              maxDistance={18}
            />

            <ContactShadows
              position={[0, 0.02, 0]}
              opacity={0.55}
              scale={10}
              blur={1.7}
              far={1.4}
              resolution={512}
              color="#000000"
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}


