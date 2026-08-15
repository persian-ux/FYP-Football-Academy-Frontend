import { useEffect, useRef } from 'react'
import { PREFERS_REDUCED_MOTION, IS_MOBILE, TEAM_COLORS, getParticleCount, sportsphereBus } from '@/lib/sportsphere'

interface Particle {
  x: number; y: number; vx: number; vy: number; r: number; color: string
  life: number; maxLife: number; kind: 'float' | 'confetti' | 'trail' | 'burst'
  phase: number; rot: number; rotV: number; alpha: number
}

export default function SportSphereParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (PREFERS_REDUCED_MOTION) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = getParticleCount()
    const particles: Particle[] = []
    const mouse = { x: w / 2, y: h / 2 }

    // pre-render glow sprites per color for performance
    const spriteCache = new Map<string, HTMLCanvasElement>()
    const getSprite = (color: string, r: number): HTMLCanvasElement => {
      const key = color + r
      let s = spriteCache.get(key)
      if (!s) {
        s = document.createElement('canvas')
        const size = r * 6; s.width = size; s.height = size
        const sc = s.getContext('2d')!
        const g = sc.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
        g.addColorStop(0, color); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'transparent')
        sc.fillStyle = g; sc.fillRect(0, 0, size, size)
        spriteCache.set(key, s)
      }
      return s
    }

    // floating background particles (team colors)
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15,
        vy: -0.05 - Math.random() * 0.08, r: 1.5 + Math.random() * 2.5,
        color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
        life: 1, maxLife: 1, kind: 'float', phase: Math.random() * Math.PI * 2,
        rot: 0, rotV: 0, alpha: 0.3 + Math.random() * 0.4,
      })
    }

    let confettiTimer = 0
    let celebActive = false, celebFlash = 0

    const spawnBurst = () => {
      celebActive = true; celebFlash = 1
      const cx = w / 2, cy = h / 2
      for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 7
        particles.push({
          x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: 2 + Math.random() * 3, color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
          life: 0, maxLife: 1.2 + Math.random() * 0.6, kind: 'burst',
          phase: Math.random() * 6.28, rot: 0, rotV: 0, alpha: 1,
        })
      }
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 100, y: cy,
          vx: (Math.random() - 0.5) * 2.5, vy: -(1 + Math.random() * 3),
          r: 2 + Math.random() * 2, color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
          life: 0, maxLife: 3 + Math.random(), kind: 'confetti',
          phase: Math.random() * 6.28, rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.1, alpha: 1,
        })
      }
    }

    const onCelebrate = () => spawnBurst()
    sportsphereBus.addEventListener('ss:celebrate', onCelebrate)

    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2
        particles.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(a) * (1.5 + Math.random() * 3),
          vy: Math.sin(a) * (1.5 + Math.random() * 3) - 1,
          r: 1.5 + Math.random() * 2, color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
          life: 0, maxLife: 0.8 + Math.random() * 0.4, kind: 'burst',
          phase: 0, rot: 0, rotV: 0, alpha: 1,
        })
      }
    }
    window.addEventListener('click', onClick)

    // mouse cursor trail
    let lx = mouse.x, ly = mouse.y
    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY
      if (Math.hypot(mouse.x - lx, mouse.y - ly) < 8) return
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 4,
          y: mouse.y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2 - 0.2,
          r: 1.8 + Math.random() * 2, color: '#00d4ff',
          life: 0, maxLife: 0.5 + Math.random() * 0.3, kind: 'trail',
          phase: 0, rot: 0, rotV: 0, alpha: 0.7,
        })
      }
      lx = mouse.x; ly = mouse.y
    }
    window.addEventListener('mousemove', onMouse)

    // --- ANIMATION LOOP ---
    let last = performance.now()
    let raf = 0
    function loop(time: number) {
      const dt = Math.min(Math.max((time - last) / 1000, 0.001), 0.05)
      last = time
      ctx.clearRect(0, 0, w, h)

      // confetti spawn
      confettiTimer += dt
      if (confettiTimer > 0.045) {
        confettiTimer = 0
        const maxC = IS_MOBILE ? 25 : 90
        if (particles.filter((p) => p.kind === 'confetti').length < maxC) {
          particles.push({
            x: Math.random() * w, y: -6,
            vx: (Math.random() - 0.5) * 0.6, vy: 1.2 + Math.random() * 1.4,
            r: 1.6 + Math.random() * 2.5, color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
            life: 0, maxLife: 6 + Math.random() * 3, kind: 'confetti',
            phase: Math.random() * 6.28, rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.08, alpha: 0.9,
          })
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life += dt
        const lr = p.life / p.maxLife
        if (lr >= 1) { particles.splice(i, 1); continue }

        if (p.kind === 'float') {
          const sv = Math.sin(p.phase + time * 0.0008) * 0.15
          p.x += (p.vx + sv) * dt * 60; p.y += p.vy * dt * 60
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20
          if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20
          const ba = p.alpha * (0.4 + 0.6 * Math.sin(p.phase + time * 0.002))
          ctx.globalAlpha = ba * Math.min(1, lr * 3)
          const spr = getSprite(p.color, p.r)
          ctx.drawImage(spr, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6)
          continue
        }
        if (p.kind === 'confetti') {
          p.x += (p.vx + Math.sin(p.phase + time * 0.003) * 0.3) * dt * 60
          p.y += (p.vy + 0.4) * dt * 60; p.rot += p.rotV * dt * 60
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
          ctx.globalAlpha = Math.max(0, (1 - lr) * 0.85)
          ctx.fillStyle = p.color; ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8)
          ctx.restore(); continue
        }
        // burst & trail
        p.x += p.vx * dt * 60; p.y += p.vy * dt * 60
        if (p.kind === 'burst') { p.vy += 0.6 * dt * 60; p.vx *= Math.pow(0.98, dt * 60) } else { p.vx *= Math.pow(0.94, dt * 60); p.vy *= Math.pow(0.94, dt * 60) }
        ctx.globalAlpha = Math.max(0, (1 - lr) * p.alpha)
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - lr * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.fill()
      }

      // flash
      if (celebActive) {
        celebFlash -= dt * 3
        if (celebFlash > 0) {
          ctx.globalAlpha = Math.min(1, celebFlash * 0.5)
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
          ctx.globalAlpha = 1
        } else { celebActive = false }
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('click', onClick)
      sportsphereBus.removeEventListener('ss:celebrate', onCelebrate)
    }
  }, [])

  return <canvas ref={canvasRef} className="ss-2d-canvas" aria-hidden="true" />
}