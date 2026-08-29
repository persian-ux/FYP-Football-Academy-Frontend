import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  HubFooter,
  HubHeader,
  HeroSection,
  FeaturesGrid,
  LiveUpdatesWidget,
  ProgramsSection,
  StatsSection,
  TestimonialsSection,
} from '@/components/hub/HubSections'
import SceneErrorBoundary from '@/components/common/SceneErrorBoundary'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import type { AuthSession } from '@/lib/auth'
import { gsap } from '@/lib/sportsphere'

import WhatsAppFloatingButton from '@/components/hub/WhatsAppFloatingButton'

const CinematicVideoBackground = lazy(() => import('@/components/hub/CinematicVideoBackground'))
const StadiumAtmosphereCanvas = lazy(() => import('@/components/hub/StadiumAtmosphereCanvas'))
const FootballBackground = lazy(() => import('@/components/3D/FootballBackground'))

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
  const [show3DOverlay, setShow3DOverlay] = useState(false)

  useRevealOnScroll(mainRef)

  // Scroll parallax depth across sections
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils
        .toArray<HTMLElement>('#features, #programs, #stats, #updates, #testimonials, #footer')
        .forEach((section) => {
          gsap.fromTo(
            section,
            { y: 0 },
            {
              y: -50,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
              },
            }
          )
        })
    }, mainRef)

    return () => ctx.revert()
  }, [])

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
    console.log('Newsletter subscription recorded for:', email)
  }

  return (
    <main ref={mainRef} className="relative min-h-screen overflow-hidden bg-[#070b14] text-white selection:bg-cyan-500 selection:text-slate-950">
      {/* High-Definition Looping Video & Stadium Lighting Background */}
      <SceneErrorBoundary>
        <Suspense fallback={<div className="fixed inset-0 bg-[#070b14]" />}>
          <CinematicVideoBackground
            show3DOverlay={show3DOverlay}
            onToggle3DOverlay={() => setShow3DOverlay((prev) => !prev)}
          />
          <StadiumAtmosphereCanvas />
          {show3DOverlay && <FootballBackground visible={show3DOverlay} />}
        </Suspense>
      </SceneErrorBoundary>

      {/* Top subtle highlight line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/40 to-transparent z-40" />

      {/* Hub Navigation Bar */}
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

      {/* Sections */}
      <HeroSection
        session={session}
        onExplorePrograms={() => scrollToSection('programs')}
        onJoinNow={handleProtectedAction}
      />
      <FeaturesGrid />
      <ProgramsSection onJoinNow={handleProtectedAction} />
      <StatsSection />
      <LiveUpdatesWidget />
      <TestimonialsSection />
      <HubFooter onSubscribe={handleSubscribe} />

      {/* Floating WhatsApp Contact Button */}
      <WhatsAppFloatingButton />
    </main>
  )
}
