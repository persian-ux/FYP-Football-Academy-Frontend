import { lazy, Suspense, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { HubFooter, HubHeader, HeroSection, FeaturesGrid, LiveUpdatesWidget, ProgramsSection, StatsSection, TestimonialsSection } from '@/components/hub/HubSections'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import type { AuthSession } from '@/lib/auth'
import { gsap } from '@/lib/sportsphere'

const SportSphere3DScene = lazy(() => import('@/components/hub/SportSphere3DScene'))
const SportSphereParticleCanvas = lazy(() => import('@/components/hub/SportSphereParticleCanvas'))

type HubPageProps = {
  session: AuthSession | null
  onSignIn: (credentials: any) => AuthSession
  onSignOut: () => void
}

const sectionOrder = ['hero', 'features', 'programs', 'stats', 'updates', 'testimonials', 'footer']

export default function HubPage({ session, onSignIn, onSignOut }: HubPageProps) {
  const navigate = useNavigate()
  const activeSection = useScrollSpy(sectionOrder)
  const mainRef = useRef<HTMLElement | null>(null)
  useRevealOnScroll(mainRef)

  // ScrollTrigger parallax on every section (deep dive as you scroll)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('#features, #programs, #stats, #updates, #testimonials, #footer').forEach((section) => {
        gsap.fromTo(
          section,
          { y: 0 },
          {
            y: -70,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          }
        )
      })
    }, mainRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    console.log('Hub page loaded', { session })
  }, [session])

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleProtectedAction = () => {
    if (session) {
      navigate('/dashboard')
      return
    }
    navigate('/login')
  }

  const handleSubscribe = (email: string) => {
    console.log('Newsletter stored for', email)
  }

  return (
    <main ref={mainRef} className="relative min-h-screen overflow-hidden bg-[#0f1419] text-white">
      {/* Full-screen 3D + cinematic background layers */}
      <Suspense fallback={null}>
        <SportSphere3DScene />
        <SportSphereParticleCanvas />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <HubHeader
        activeSection={activeSection}
        session={session}
        onNavigateSection={scrollToSection}
        onJoinNow={handleProtectedAction}
        onExplorePrograms={() => scrollToSection('programs')}
        onOpenLogin={() => navigate('/login')}
        onLogout={() => {
          onSignOut()
          navigate('/')
        }}
      />

      <HeroSection onExplorePrograms={() => scrollToSection('programs')} onJoinNow={handleProtectedAction} />
      <FeaturesGrid />
      <ProgramsSection onJoinNow={handleProtectedAction} />
      <StatsSection />
      <LiveUpdatesWidget />
      <TestimonialsSection />
      <HubFooter onSubscribe={handleSubscribe} />
    </main>
  )
}
