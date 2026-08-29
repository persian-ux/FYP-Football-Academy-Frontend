import { useEffect, useRef } from 'react'
import { PREFERS_REDUCED_MOTION, IS_MOBILE } from '@/lib/sportsphere'

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseAlpha: number
  phase: number
  speed: number
  color: string
}

export default function StadiumAtmosphereCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || PREFERS_REDUCED_MOTION) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // Realistic floodlight atmospheric dust & mist motes (subtle cyan, gold, white)
    const MOTE_COLORS = ['#38bdf8', '#ffd700', '#ffffff', '#7dd3fc', '#fef08a']
    const count = IS_MOBILE ? 35 : 75
    const motes: Mote[] = []

    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.2, // Gentle upward floodlight heat drift
        radius: 1.0 + Math.random() * 2.2,
        baseAlpha: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: 0.001 + Math.random() * 0.002,
        color: MOTE_COLORS[Math.floor(Math.random() * MOTE_COLORS.length)],
      })
    }

    let mouseX = width / 2
    let mouseY = height / 2

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    let animationFrameId = 0
    let lastTime = performance.now()

    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      ctx.clearRect(0, 0, width, height)

      // Draw subtle drifting floodlight motes
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]

        // Drift with subtle sinusoidal wave
        const waveX = Math.sin(m.phase + time * m.speed) * 0.35
        m.x += (m.vx + waveX) * delta * 60
        m.y += m.vy * delta * 60

        // Wrap around boundaries
        if (m.x < -20) m.x = width + 20
        if (m.x > width + 20) m.x = -20
        if (m.y < -20) m.y = height + 20
        if (m.y > height + 20) m.y = -20

        // Parallax reaction to mouse
        const dx = (mouseX - m.x) * 0.0003
        const dy = (mouseY - m.y) * 0.0003
        const drawX = m.x + dx * 20
        const drawY = m.y + dy * 20

        const pulseAlpha = m.baseAlpha * (0.6 + 0.4 * Math.sin(m.phase + time * 0.0015))

        ctx.beginPath()
        ctx.arc(drawX, drawY, m.radius, 0, Math.PI * 2)
        ctx.fillStyle = m.color
        ctx.globalAlpha = Math.max(0, Math.min(1, pulseAlpha))
        ctx.shadowBlur = m.radius * 4
        ctx.shadowColor = m.color
        ctx.fill()
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1.0
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      aria-hidden="true"
    />
  )
}
