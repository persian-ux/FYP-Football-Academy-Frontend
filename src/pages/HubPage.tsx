import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { HubFooter, HubHeader, HeroSection, FeaturesGrid, LoginDialog, LiveUpdatesWidget, ProgramsSection, StatsSection, TestimonialsSection } from '@/components/hub/HubSections'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import type { AuthSession, DemoCredentials } from '@/lib/auth'

type HubPageProps = {
  session: AuthSession | null
  onSignIn: (credentials: DemoCredentials) => AuthSession
  onSignOut: () => void
}

const sectionOrder = ['hero', 'features', 'programs', 'stats', 'updates', 'testimonials', 'footer']

export default function HubPage({ session, onSignIn, onSignOut }: HubPageProps) {
  const navigate = useNavigate()
  const activeSection = useScrollSpy(sectionOrder)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    console.log('Hub page loaded', { session })
  }, [session])

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId)
    if (!target) {
      return
    }

    console.log('Navigate to section', sectionId)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleProtectedAction = () => {
    if (session) {
      navigate('/dashboard')
      return
    }

    setLoginOpen(true)
  }

  const handleSignIn = (credentials: DemoCredentials) => {
    const nextSession = onSignIn(credentials)
    setLoginOpen(false)
    navigate('/dashboard')
    return nextSession
  }

  const handleSubscribe = (email: string) => {
    console.log('Newsletter stored for', email)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f1419] text-white">
      <div className="hub-page-ambient pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <HubHeader
        activeSection={activeSection}
        session={session}
        onNavigateSection={scrollToSection}
        onJoinNow={handleProtectedAction}
        onExplorePrograms={() => scrollToSection('programs')}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={() => {
          onSignOut()
          navigate('/')
        }}
      />

      <HeroSection
        session={session}
        onExplorePrograms={() => scrollToSection('programs')}
        onJoinNow={handleProtectedAction}
        onOpenLogin={() => setLoginOpen(true)}
      />
      <FeaturesGrid />
      <ProgramsSection onJoinNow={handleProtectedAction} />
      <StatsSection />
      <LiveUpdatesWidget />
      <TestimonialsSection />
      <HubFooter onSubscribe={handleSubscribe} />

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onSubmit={handleSignIn} />
    </main>
  )
}
