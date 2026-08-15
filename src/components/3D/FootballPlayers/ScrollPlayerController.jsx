import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { damp3 } from 'maath/easing'
import * as THREE from 'three'
import { useScrollSection } from '../../../hooks/useScrollProgress'

// Camera keyframes per scroll section.
const CAMERAS = [
  { pos: [0, 18, 6], look: [0, 0, 0] }, // bird's eye over empty stadium
  { pos: [0, 10, 18], look: [0, 0, 0] }, // side-elevated, formations
  { pos: [-2, 4, 16], look: [2, 0, 0] }, // ground-level kickoff
  { pos: [4, 3, 14], look: [8, 1, 0] }, // follows the attack
  { pos: [7, 5, 12], look: [9.3, 0.6, 0] }, // goal close-up
  { pos: [0, 26, 26], look: [0, 0.5, 0] }, // wide outro pull-back
]

const ScrollPlayerController = () => {
  const { camera } = useThree()
  const section = useScrollSection()

  const targetPos = useRef(new THREE.Vector3(...CAMERAS[0].pos))
  const targetLook = useRef(new THREE.Vector3(...CAMERAS[0].look))
  const currentLook = useRef(new THREE.Vector3(...CAMERAS[0].look))

  useEffect(() => {
    const cam = CAMERAS[section] || CAMERAS[0]
    targetPos.current.set(cam.pos[0], cam.pos[1], cam.pos[2])
    targetLook.current.set(cam.look[0], cam.look[1], cam.look[2])
  }, [section])

  useFrame(({ clock }, delta) => {
    // faster camera when the ball is travelling
    const speed = (section === 2 || section === 3) ? 0.25 : 0.16
    damp3(camera.position, targetPos.current, speed, delta)
    damp3(currentLook.current, targetLook.current, 0.28, delta)
    camera.lookAt(currentLook.current)

    // Goal celebration shake
    if (section === 4) {
      const t = clock.getElapsedTime()
      camera.position.x += Math.sin(t * 55) * 0.06
      camera.position.y += Math.cos(t * 61) * 0.05
    }
  })

  return null
}

export default ScrollPlayerController