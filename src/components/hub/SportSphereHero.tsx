import { useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RippleButton } from '@/components/common/RippleButton'
import { heroHighlights } from '@/data/hubContent'
import { gsap, runCountUp, sportsphereBus, PREFERS_REDUCED_MOTION } from '@/lib/sportsphere'
import './sportsphere.css'

const TYPE_LINE = 'Elite training · Live academy intelligence · A clearer route to high-performance football.'
const HERO_STATS = [
  { value: '1842+', label: 'Games Played' }, { value: '2300+', label: 'Active Players' },
  { value: '96', label: 'Titles Won' }, { value: '12', label: 'Live Matches' },
]

type Props = {
  session?: any; onExplorePrograms: () => void; onJoinNow: () => void; onOpenLogin: () => void
}

export default function SportSphereHero({ onExplorePrograms, onJoinNow }: Props) {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const typeRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    // Reduced motion: reveal everything instantly, skip the show.
    if (PREFERS_REDUCED_MOTION) {
      if (typeRef.current) typeRef.current.textContent = TYPE_LINE
      gsap.set('.ss-intro-overlay', { opacity: 0, visibility: 'hidden' })
      gsap.set('.ss-title-word, .ss-cta-anim, .ss-glass-card, .ss-scroll-hint, .ss-beam, .ss-beam-conic, .ss-field-materialize', {
        opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1,
      })
      return
    }

    let typeTimer: ReturnType<typeof setInterval> | null = null
    const startTypewriter = () => {
      const el = typeRef.current
      if (!el) return
      let idx = 0
      el.textContent = ''
      typeTimer = setInterval(() => {
        if (idx < TYPE_LINE.length) { el.textContent += TYPE_LINE[idx]; idx++ }
        else if (typeTimer) clearInterval(typeTimer)
      }, 28)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.to('.ss-intro-overlay', { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 0.05) // Phase 1

      tl.to('.ss-beam', { opacity: 1, scaleY: 1, duration: 0.85, stagger: 0.2, ease: 'power2.out' }, 0.35) // Phase 2
      tl.to('.ss-beam-conic', { opacity: 1, duration: 1.1 }, 0.55)

      tl.fromTo('.ss-field-materialize', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.1)' }, 0.65) // Phase 3

      tl.add(() => { sportsphereBus.dispatchEvent(new CustomEvent('ss:celebrate')) }, 1.7) // Phase 4
      tl.to('.ss-hero-inner, .ss-field-stage', { x: -6, duration: 0.05, repeat: 5, yoyo: true }, 1.72)
      tl.fromTo('.ss-flash-overlay', { opacity: 0 }, { opacity: 0.6, duration: 0.08, ease: 'power1.out' }, 1.72)
      tl.to('.ss-flash-overlay', { opacity: 0, duration: 0.25 }, 1.8)

      tl.fromTo(
        '.ss-title-word',
        { rotationY: -95, x: -45, opacity: 0, transformPerspective: 900 },
        { rotationY: 0, x: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.35)', stagger: 0.14 },
        1.75
      ) // Phase 5

      tl.add(() => startTypewriter(), 2.6) // Phase 6

      tl.fromTo('.ss-cta-anim', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 3.3) // Phase 7
      tl.fromTo('.ss-glass-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.1 }, 3.4)
      tl.add(() => { hero.querySelectorAll('.ss-stat-value[data-count-up]').forEach((el) => runCountUp(el as HTMLElement, 1000)) }, 3.55)
      tl.fromTo('.ss-scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 3.8) // Phase 8

      // Scroll parallax
      gsap.to('.ss-field-stage', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.2 } })
      gsap.to('.ss-beam-conic', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.5 } })
    }, hero)

    const waveInt = setInterval(() => sportsphereBus.dispatchEvent(new CustomEvent('ss:wave')), 10000)
    setTimeout(() => sportsphereBus.dispatchEvent(new CustomEvent('ss:wave')), 2500)

    return () => {
      ctx.revert()
      if (typeTimer) clearInterval(typeTimer)
      clearInterval(waveInt)
    }
  }, [])

  return (
<section id="hero" className="ss-hero" ref={heroRef}>
      <div className="ss-intro-overlay">
        <div className="ss-intro-logo">
          <div className="ss-intro-ball" />
          <div className="ss-intro-text">Moments of greatness</div>
        </div>
      </div>

      <div className="ss-flash-overlay" />

      {/* 3D CSS field */}
      <div className="ss-field-stage">
        <div className="ss-field-materialize">
          <div className="ss-field-3d" />
        </div>
      </div>

      {/* stadium silhouette */}
      <svg className="ss-stadium-svg" viewBox="0 0 1200 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          <linearGradient id="stadGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(10,15,40,0)" />
            <stop offset="30%" stopColor="rgba(10,15,40,0.35)" />
            <stop offset="100%" stopColor="rgba(5,8,20,0.7)" />
          </linearGradient>
        </defs>
        <path
          d="M0 220 L0 140 C 80 95 160 88 240 98 C 320 108 400 108 480 98 C 560 88 640 88 720 98 C 800 108 880 108 960 98 C 1040 88 1120 95 1200 140 L1200 220 Z"
          fill="url(#stadGrad)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5"
        />
        <rect x="20" y="70" width="4" height="80" fill="rgba(0,212,255,0.08)" />
        <rect x="1176" y="70" width="4" height="80" fill="rgba(0,212,255,0.08)" />
        <rect x="580" y="60" width="3" height="90" fill="rgba(255,215,0,0.06)" />
        <circle cx="22" cy="68" r="4" fill="rgba(0,212,255,0.2)" />
        <circle cx="1178" cy="68" r="4" fill="rgba(0,212,255,0.2)" />
      </svg>

      {/* beams */}
      <div className="ss-beams">
        <div className="ss-beam" style={{ left: '12%', transform: 'rotate(-4deg)' }} />
        <div className="ss-beam ss-beam-alt" style={{ left: '34%', transform: 'rotate(2deg)' }} />
        <div className="ss-beam ss-beam-center" style={{ left: '54%', transform: 'rotate(0deg)' }} />
        <div className="ss-beam ss-beam-alt" style={{ left: '74%', transform: 'rotate(-2deg)' }} />
        <div className="ss-beam-conic" />
      </div>

      {/* scanlines */}
      <div className="ss-scanlines" />

      {/* bokeh */}
      <div className="ss-glow-dot" style={{ top: '15%', left: '8%', width: 90, height: 90 }} />
      <div
        className="ss-glow-dot"
        style={{
          top: '40%', right: '12%', width: 60, height: 60,
          background: 'radial-gradient(circle, rgba(255,107,53,0.9), transparent 65%)',
          animationDelay: '-1.2s',
        }}
      />

      {/* floating balls */}
      <div className="ss-float-soccer ss-float-y" style={{ position: 'absolute', zIndex: 2, pointerEvents: 'none' }}>
        <div className="ss-spin-x"><div className="ss-spin-y"><div className="ss-spin-z ss-soccer" /></div></div>
      </div>
      <div className="ss-float-basket ss-float-y-fast" style={{ position: 'absolute', zIndex: 2, pointerEvents: 'none' }}>
        <div className="ss-spin-x-slow"><div className="ss-spin-y-fast"><div className="ss-spin-z ss-basketball" /></div></div>
      </div>
      <div className="ss-float-trophy ss-float-y-slow" style={{ position: 'absolute', zIndex: 2, pointerEvents: 'none', transformStyle: 'preserve-3d' }}>
        <div className="ss-spin-y" style={{ width: 70, height: 100 }}>
          <div className="ss-trophy-wrap">
            <div className="ss-trophy-cup" />
            <div className="ss-trophy-handle ss-trophy-handle--l" />
            <div className="ss-trophy-handle ss-trophy-handle--r" />
            <div className="ss-trophy-stem" />
            <div className="ss-trophy-base" />
            <div className="ss-trophy-spark" />
          </div>
        </div>
      </div>
{/* hero content */}
      <div className="ss-hero-inner">
        <Badge className="mb-4 border-primary/30 bg-primary/10 px-4 py-1.5 text-primary shadow-[0_0_30px_rgba(0,153,255,0.15)]">
          <Sparkles className="mr-2 size-3.5" />
          Welcome to Sportsphere Academy
        </Badge>

        <h1 className="ss-title-3d text-5xl font-black sm:text-6xl lg:text-7xl xl:text-8xl">
          <span className="ss-title-word">SPORTS</span>
          <span className="ss-title-word ss-title-word-accent" style={{ animationDelay: '0.12s' }}>PHERE</span>
        </h1>

        <p className="ss-type-line mt-4 max-w-3xl px-2">
          <span ref={typeRef} />
          <span className="ss-type-caret" />
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <div className="ss-cta-anim">
            <RippleButton className="ss-cta-3d bg-primary px-6 text-white" onClick={onExplorePrograms}>
              Explore Programs
              <ArrowRight className="size-4" />
            </RippleButton>
          </div>
          <div className="ss-cta-anim">
            <RippleButton variant="outline" className="ss-cta-ghost border-border/70 bg-card/40 px-6 text-white" onClick={onJoinNow}>
              Join Now
            </RippleButton>
          </div>
        </div>

        <div className="mt-6 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          {heroHighlights.map((item, index) => (
            <div key={item} className="ss-glass-card" style={{ animationDelay: `${index * 80}ms` }}>
              {item}
            </div>
          ))}
        </div>

        <div className="ss-hero-stats mt-10">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <div className="ss-stat-value" data-count-up={stat.value}>{stat.value}</div>
              <div className="ss-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* scroll indicator */}
      <div className="ss-scroll-hint">
        <span>Scroll</span>
        <ChevronDown className="size-4" />
      </div>
    </section>
  )
}