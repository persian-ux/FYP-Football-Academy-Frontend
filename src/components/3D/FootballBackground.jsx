import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars, AdaptiveDpr } from '@react-three/drei'
import FootballScene from './FootballPlayers/FootballScene'
import { useDeviceCapability, deviceSupports3D } from '../../hooks/useDeviceCapability'
import './football-3d.css'

// Full-screen fixed background: a live football match that plays out as
// the visitor scrolls down the page.
const FootballBackground = () => {
  const { supportsWebGL, isMobile } = useDeviceCapability()
  const hostRef = useRef(null)

  // Let the (CSS) hero field/silhouette hand over to the real 3D pitch.
  useEffect(() => {
    if (deviceSupports3D()) {
      document.body.classList.add('has-football-bg')
    }
    return () => document.body.classList.remove('has-football-bg')
  }, [supportsWebGL, isMobile])

  if (!supportsWebGL || isMobile) {
    return <div className="football-css-fallback" aria-hidden="true" />
  }

  return (
    <div ref={hostRef} className="football-bg" aria-hidden="true">
      <Canvas
        dpr={isMobile ? 1 : [1, 1.8]}
        camera={{ position: [0, 18, 6], fov: 58 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <AdaptiveDpr pixelated={!isMobile} />
          <ambientLight intensity={0.35} color="#9fc4ff" />
          <directionalLight position={[6, 18, 4]} intensity={0.35} color="#cfe8ff" />
          {/* Night sky sparkle */}
          <Stars radius={90} depth={45} count={1200} factor={3.4} saturation={0} fade speed={0.6} />
          <FootballScene />
          <fog attach="fog" args={['#0a0a1a', 22, 70]} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default FootballBackground