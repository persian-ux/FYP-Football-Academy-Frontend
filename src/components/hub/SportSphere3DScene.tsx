import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { sportsphereBus, PREFERS_REDUCED_MOTION } from '@/lib/sportsphere'

// --------------- procedural texture generators ---------------
function makeCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function drawSoccer(ctx: CanvasRenderingContext2D) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, w, h)
  const pent = (cx: number, cy: number, r: number, rot = 0) => {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot)
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const a = i * 2 * Math.PI / 5 - Math.PI / 2
      const px = r * Math.cos(a), py = r * Math.sin(a)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath(); ctx.fillStyle = '#16161e'; ctx.fill(); ctx.restore()
  }
  pent(w / 2, h / 2, 35); pent(w * 0.18, h * 0.2, 16, 0.3); pent(w * 0.82, h * 0.2, 16, -0.3)
  pent(w * 0.2, h * 0.74, 16, -0.2); pent(w * 0.8, h * 0.74, 16, 0.2)
  ctx.strokeStyle = '#16161e'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(w / 2 - 10, h / 2 - 20); ctx.lineTo(w * 0.22, h * 0.22)
  ctx.moveTo(w / 2 - 10, h / 2 - 20); ctx.lineTo(w * 0.78, h * 0.22); ctx.stroke()
}

function drawBasket(ctx: CanvasRenderingContext2D) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  const g = ctx.createRadialGradient(w * 0.32, h * 0.28, 0, w / 2, h / 2, w / 2)
  g.addColorStop(0, '#ffdba5'); g.addColorStop(0.3, '#ff8c2e'); g.addColorStop(0.65, '#d95b12'); g.addColorStop(1, '#a63e05')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(80,20,0,0.7)'; ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(w * 0.28, h * 0.5, w * 0.24, h * 0.14, 0.15, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(w * 0.72, h * 0.5, w * 0.24, h * 0.14, -0.15, 0, Math.PI * 2); ctx.stroke()
}

function drawFootball(ctx: CanvasRenderingContext2D) {
  const w = ctx.canvas.width, h = ctx.canvas.height
  ctx.fillStyle = '#6b3820'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#8b5e3c'; ctx.fillRect(0, h * 0.16, w, h * 0.22); ctx.fillRect(0, h * 0.62, w, h * 0.22)
  ctx.strokeStyle = '#c8a888'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke()
  ctx.strokeStyle = '#f0e0d0'; ctx.lineWidth = 1.5
  for (let i = 0; i < 7; i++) { const y = h * 0.42 + i * (h * 0.025); ctx.beginPath(); ctx.moveTo(w * 0.38, y); ctx.lineTo(w * 0.62, y); ctx.stroke() }
}

function makeGlowTexture(): THREE.CanvasTexture {
  return makeCanvas(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(200,230,255,0.8)'); g.addColorStop(1, 'rgba(100,150,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
  })
}

export default function SportSphere3DScene() {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (PREFERS_REDUCED_MOTION) return
    const webglOK = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))) } catch { return false } })()
    if (!webglOK) return
    if (window.matchMedia('(max-width: 767px)').matches) return

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    const canvas = renderer.domElement
    canvas.className = 'ss-webgl-canvas'
    host.appendChild(canvas)

    // --- SCENE / CAMERA ---
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 120)
    camera.position.set(0, 7, 26)
    camera.lookAt(0, 2.5, 0)

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0x1a2535, 0.6))
    scene.add(new THREE.HemisphereLight(0x4466aa, 0x080808, 0.4))
    const glowTex = makeGlowTexture()
    const towers: [number, number, number][] = [[-16, 6, -11], [16, 6, -11], [-16, 6, 9], [16, 6, 9]]
    towers.forEach(([x, y, z], i) => {
      const color = i % 2 === 0 ? 0x66ddff : 0xffd36b
      const pl = new THREE.PointLight(color, 0.8, 36, 0)
      pl.position.set(x, y + 1.5, z); scene.add(pl)
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.45 }))
      spr.scale.set(2.8, 2.8, 1); spr.position.set(x, y + 1.8, z); scene.add(spr)
      const str = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.12 }))
      str.scale.set(0.8, 4.5, 1); str.position.set(x, y + 1.6, z - 0.4); scene.add(str)
    })

    // --- FIELD ---
    const fieldMat = new THREE.MeshStandardMaterial({ color: 0x0b3d21, roughness: 0.7, metalness: 0.1, emissive: 0x082d16, emissiveIntensity: 0.35 })
    const field = new THREE.Mesh(new THREE.PlaneGeometry(38, 24), fieldMat)
    field.rotation.x = -Math.PI / 2; field.position.y = -0.05; scene.add(field)

    const grid = new THREE.GridHelper(38, 22, 0x22ff88, 0x0b4d1f)
    grid.position.y = 0.01; scene.add(grid)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
    )
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring)

    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.012)

    // --- CROWD POINTS ---
    const n = 2400
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3)
    const baseP = new Float32Array(n * 3), angleA = new Float32Array(n)
    const pal = [[1,1,1],[0.2,0.55,0.9],[1,0.6,0.2],[0.85,0.2,0.3],[1,0.84,0],[0.15,1,0.55]]
    for (let i = 0; i < n; i++) {
      const t = i % 4
      const a = -Math.PI + (i / n) * Math.PI * 2 * 0.88 + Math.random() * 0.15
      const r = 12 + t * 1.7 + Math.random() * 0.9
      const i3 = i * 3
      pos[i3] = Math.cos(a) * r; pos[i3 + 1] = 0.4 + t * 0.9 + Math.random() * 0.25; pos[i3 + 2] = Math.sin(a) * r
      baseP[i3] = pos[i3]; baseP[i3 + 1] = pos[i3 + 1]; baseP[i3 + 2] = pos[i3 + 2]
      angleA[i] = a
      const c = pal[Math.floor(Math.random() * 6)]
      col[i3] = c[0]; col[i3 + 1] = c[1]; col[i3 + 2] = c[2]
    }
    const cGeom = new THREE.BufferGeometry()
    cGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    cGeom.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const points = new THREE.Points(cGeom, new THREE.PointsMaterial({
      size: 0.15, vertexColors: true, transparent: true, opacity: 0.9,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }))
    scene.add(points)

    // --- BALLS ---
    const bMat = { roughness: 0.45, metalness: 0.12 }
    const sTex = makeCanvas(512, 512, drawSoccer)
    const bTex = makeCanvas(512, 512, drawBasket)
    const fTex = makeCanvas(512, 512, drawFootball)

    const bDefs = [
      { tex: sTex, sc: 0.92, ox: 4.0, oz: 1.8, sx: 0.003, sy: 0.006, sz: 0.002, fsp: 0.65, ph: 0 },
      { tex: bTex, sc: 0.82, ox: -5.5, oz: -2.8, sx: 0.001, sy: 0.008, sz: 0.003, fsp: 0.9, ph: 2 },
      { tex: fTex, sc: 0.7, ox: 0.5, oz: 4.2, sx: 0.004, sy: 0.002, sz: 0.006, fsp: 0.5, ph: 4 },
    ]
    const balls: THREE.Mesh[] = []
    bDefs.forEach((d) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshStandardMaterial({ map: d.tex, ...bMat }))
      mesh.scale.set(d.sc, d.sc, d.sc)
      mesh.position.set(d.ox, 3.4, d.oz)
      scene.add(mesh)
      balls.push(mesh)
    })

    // --- INPUT ---
    const pointer = { x: 0, y: 0 }
    const onPointer = (e: MouseEvent | Touch) => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = (e.clientY / window.innerHeight) * 2 - 1 }
    window.addEventListener('mousemove', onPointer)

    // --- CROWD WAVE ---
    let waveActive = false, waveT = 0
    const onWave = () => { waveActive = true; waveT = 0 }
    sportsphereBus.addEventListener('ss:wave', onWave)

    // --- ANIMATION ---
    const clock = new THREE.Clock()
    function animate() {
      const dt = clock.getDelta()
      const t = clock.elapsedTime
      // camera
      camera.position.x += (pointer.x * 2.6 - camera.position.x) * 0.025
      camera.position.y += (7.2 + pointer.y * 0.8 - camera.position.y) * 0.025
      camera.lookAt(0, 2.5, Math.sin(t * 0.03) * 0.4)

      // crowd wave
      if (waveActive) { waveT += dt; if (waveT > 5) { waveActive = false; waveT = 0 } }
      const pa = cGeom.attributes.position as THREE.BufferAttribute; const arr = pa.array as Float32Array
      for (let i = 0; i < n; i++) {
        const i3 = i * 3
        let yo = Math.sin(t * 1.2 + angleA[i] * 4) * 0.03 // shimmer
        if (waveActive) yo += Math.sin(angleA[i] * 2.5 + waveT * 3) * 0.35 * Math.max(0, 1 - waveT / 5)
        arr[i3 + 1] = baseP[i3 + 1] + yo
      }
      pa.needsUpdate = true

      // balls
      balls.forEach((mesh, i) => {
        const d = bDefs[i]
        mesh.rotation.x += d.sx; mesh.rotation.y += d.sy; mesh.rotation.z += d.sz
        mesh.position.x = d.ox + Math.cos(t * 0.15 + d.ph * 0.8) * 0.5
        mesh.position.y = 3.4 + Math.sin(t * d.fsp + d.ph) * 0.8
        mesh.position.z = d.oz + Math.sin(t * 0.1 + d.ph) * 0.4
      })

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    let raf = requestAnimationFrame(animate)

    // --- RESIZE ---
    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight) }
    window.addEventListener('resize', onResize)

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onPointer)
      window.removeEventListener('resize', onResize)
      sportsphereBus.removeEventListener('ss:wave', onWave)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite || obj instanceof THREE.Points) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material?.dispose()
        }
      })
      renderer.dispose()
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
  }, [])

  return <div ref={hostRef} className="ss-3d-scene" aria-hidden="true" />
}