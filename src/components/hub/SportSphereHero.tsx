import { useEffect, useRef } from 'react'
import { ArrowRight, Calendar, ChevronDown, Shield, Sparkles, Trophy, Users, Zap } from 'lucide-react'
import { RippleButton } from '@/components/common/RippleButton'
import { heroHighlights } from '@/data/hubContent'
import { gsap, runCountUp, PREFERS_REDUCED_MOTION } from '@/lib/sportsphere'
import './sportsphere.css'

const TYPE_LINE = 'Elite UEFA-certified coaching · High-performance tactical analytics · A proven route to professional football.'

const HERO_STATS = [
  { value: '1840+', label: 'Matches Analyzed', icon: Zap },
  { value: '2300+', label: 'Active Athletes', icon: Users },
  { value: '96', label: 'Trophy Titles', icon: Trophy },
  { value: '100%', label: 'Pro Pathway Rate', icon: Shield },
]

type Props = {
  session?: any
  onExplorePrograms: () => void
  onJoinNow: () => void
}

export default function SportSphereHero({ onExplorePrograms, onJoinNow }: Props) {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const typeRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    if (PREFERS_REDUCED_MOTION) {
      if (typeRef.current) typeRef.current.textContent = TYPE_LINE
      gsap.set('.ss-hero-badge, .ss-hero-title, .ss-hero-desc, .ss-hero-actions, .ss-stat-card, .ss-fixture-pill', {
        opacity: 1,
        y: 0,
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
        if (idx < TYPE_LINE.length) {
          el.textContent += TYPE_LINE[idx]
          idx++
        } else if (typeTimer) {
          clearInterval(typeTimer)
        }
      }, 24)
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        '.ss-hero-badge',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6 },
        0.1
      )

      tl.fromTo(
        '.ss-hero-title',
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9 },
        0.3
      )

      tl.add(() => startTypewriter(), 0.7)

      tl.fromTo(
        '.ss-hero-actions',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7 },
        1.2
      )

      tl.fromTo(
        '.ss-stat-card',
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 },
        1.4
      )

      tl.add(() => {
        hero.querySelectorAll('.ss-stat-value[data-count-up]').forEach((el) => {
          runCountUp(el as HTMLElement, 1200)
        })
      }, 1.6)

      tl.fromTo(
        '.ss-fixture-pill',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        1.8
      )
    }, hero)

    return () => {
      ctx.revert()
      if (typeTimer) clearInterval(typeTimer)
    }
  }, [])

  return (
    <section id="hero" className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 pt-24 pb-16 text-center z-20 overflow-hidden" ref={heroRef}>
      {/* Live Matchday Broadcast Status Pill */}
      <div className="ss-hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-4 py-1.5 backdrop-blur-xl shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <span className="relative flex size-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Academy 2026/2027 Pro Scholarship Trials Open
        </span>
        <Sparkles className="size-3.5 text-amber-400 ml-1" />
      </div>

      {/* Main High-Impact Headline */}
      <h1 className="ss-hero-title max-w-5xl text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
        DEVELOPING TOMORROW'S{' '}
        <span className="block mt-1 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 via-sky-200 to-amber-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.3)]">
          FOOTBALL CHAMPIONS
        </span>
      </h1>

      {/* Sub-headline / Typewriter text */}
      <p className="ss-hero-desc mt-6 max-w-2xl text-base sm:text-lg text-slate-300 min-h-[3rem] font-medium leading-relaxed">
        <span ref={typeRef} />
        <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-400 animate-pulse" />
      </p>

      {/* High-Impact Action CTAs */}
      <div className="ss-hero-actions mt-8 flex flex-wrap items-center justify-center gap-4">
        <RippleButton
          className="h-12 px-7 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-all duration-300"
          onClick={onExplorePrograms}
        >
          Explore Elite Programs
          <ArrowRight className="ml-2 size-4" />
        </RippleButton>

        <RippleButton
          variant="outline"
          className="h-12 px-6 rounded-xl border-white/20 bg-white/5 font-semibold text-white backdrop-blur-xl hover:bg-white/10 transition-all duration-300"
          onClick={onJoinNow}
        >
          Book Academy Trial
        </RippleButton>
      </div>

      {/* Highlights Tag Cloud */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl">
        {heroHighlights.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md"
          >
            {item}
          </div>
        ))}
      </div>

      {/* Live Stats Counter Cards (Glassmorphism 2.0) */}
      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl w-full">
        {HERO_STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="ss-stat-card group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/80 p-4 text-center backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-1"
            >
              <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                <Icon className="size-4" />
              </div>
              <div
                className="ss-stat-value text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white via-slate-100 to-cyan-200"
                data-count-up={stat.value}
              >
                {stat.value}
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming Fixture Mini Banner */}
      <div className="ss-fixture-pill mt-8 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2 text-xs text-slate-300 backdrop-blur-md">
        <Calendar className="size-4 text-cyan-400" />
        <span className="font-semibold text-white">Next Matchday:</span>
        <span>Sportsphere U-19 vs Premier Select</span>
        <span className="text-cyan-400 font-mono font-bold">• Sat 18:00</span>
      </div>

      {/* Subtle Scroll Hint */}
      <div className="mt-10 flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400 opacity-70 animate-bounce">
        <span>Scroll to explore</span>
        <ChevronDown className="size-3.5" />
      </div>
    </section>
  )
}