import { useState, type ChangeEvent, type ComponentProps } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Flame,
  Menu,
  MoonStar,
  Send,
  ShieldCheck,
  Zap,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { demoCredentials, type AuthSession, type DemoCredentials } from '@/lib/auth'
import {
  featureItems,
  hubNavItems,
  programItems,
  statItems,
  testimonialItems,
  updateItems,
} from '@/data/hubContent'
import { GlowCard } from '@/components/common/GlowCard'
import { RippleButton } from '@/components/common/RippleButton'
import { SectionHeading } from '@/components/common/SectionHeading'
import SportSphereHero from './SportSphereHero'
import SpinningFootball from '../common/SpinningFootball'

type HubHeaderProps = {
  activeSection: string
  session: AuthSession | null
  onNavigateSection: (sectionId: string) => void
  onJoinNow: () => void
  onExplorePrograms: () => void
  onOpenLogin: () => void
  onLogout: () => void
}

type HeroSectionProps = {
  session: AuthSession | null
  onExplorePrograms: () => void
  onJoinNow: () => void
}

type LoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (credentials: DemoCredentials) => void
}

type NewsletterFormProps = {
  onSubscribe: (email: string) => void
}

type SectionShellProps = ComponentProps<'section'> & { id: string }

function SectionShell({ id, children, className }: SectionShellProps) {
  return (
    <section id={id} className={cn('relative z-20 scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24', className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  )
}

function SectionCard({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <GlowCard className={cn('border-white/10 bg-slate-900/60 backdrop-blur-xl', className)} {...props}>
      {children}
    </GlowCard>
  )
}

export function HubHeader({
  activeSection,
  session,
  onNavigateSection,
  onJoinNow,
  onExplorePrograms,
  onOpenLogin,
  onLogout,
}: HubHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#070b14]/75 px-4 py-3 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onNavigateSection('hero')}
          className="flex items-center gap-3 text-left group"
          aria-label="Scroll to hero section"
        >
          <div className="relative grid size-10 place-items-center rounded-full border border-cyan-500/40 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:border-cyan-400 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all">
            <SpinningFootball className="size-6.5" spinDuration="5s" />
          </div>
          <div className="leading-none">
            <span className="block text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              SPORT<span className="text-cyan-400">SPHERE</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mt-0.5">
              Football Academy
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-xl lg:flex">
          {hubNavItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateSection(item.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                )}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          <Button
            variant="ghost"
            className="text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            onClick={onExplorePrograms}
          >
            Programs
          </Button>

          {session ? (
            <>
              <RippleButton
                className="bg-cyan-500 text-slate-950 font-bold text-xs h-9 px-4 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                onClick={onJoinNow}
              >
                Dashboard
                <ArrowRight className="ml-1.5 size-3.5" />
              </RippleButton>
              <Button
                variant="ghost"
                className="text-xs font-semibold text-slate-400 hover:text-white"
                onClick={onLogout}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <RippleButton
              className="bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs h-9 px-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              onClick={onOpenLogin}
            >
              Sign In
            </RippleButton>
          )}
        </div>

        {/* Mobile Hamburger Sheet */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-white/15 bg-white/5 text-white">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-white/10 bg-[#070b14] text-white">
              <SheetHeader className="border-b border-white/10 pb-4">
                <SheetTitle className="flex items-center gap-2.5 text-left text-white">
                  <div className="grid size-8 place-items-center rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                    <SpinningFootball className="size-5" spinDuration="5s" />
                  </div>
                  Sportsphere Academy
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-1 py-4">
                {hubNavItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? 'secondary' : 'ghost'}
                    className="justify-start text-left text-white"
                    onClick={() => onNavigateSection(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                <Button variant="outline" className="border-white/15 text-white" onClick={onExplorePrograms}>
                  Explore Programs
                </Button>
                {session ? (
                  <Button className="bg-cyan-500 text-slate-950 font-bold" onClick={onJoinNow}>
                    Open Dashboard
                  </Button>
                ) : (
                  <Button className="bg-cyan-500 text-slate-950 font-bold" onClick={onOpenLogin}>
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function HeroSection({ onExplorePrograms, onJoinNow }: HeroSectionProps) {
  return <SportSphereHero onExplorePrograms={onExplorePrograms} onJoinNow={onJoinNow} />
}

export function FeaturesGrid() {
  return (
    <SectionShell id="features">
      <SectionHeading
        eyebrow="Pro Academy Architecture"
        title="Engineered for Professional Excellence"
        description="Comprehensive athlete tracking, high-frequency tactical analysis, and individual development plans built to FIFA & UEFA academy standards."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {featureItems.map((feature) => {
          const Icon = feature.icon
          return (
            <GlowCard
              key={feature.title}
              className="group p-6 border-white/10 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-1"
              glowClassName="mix-blend-screen"
            >
              <div className="flex h-full flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
                </div>
                <div className="mt-auto pt-3 flex items-center text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                  Learn curriculum
                  <ChevronRight className="ml-1 size-3.5" />
                </div>
              </div>
            </GlowCard>
          )
        })}
      </div>
    </SectionShell>
  )
}

export function ProgramsSection({ onJoinNow }: { onJoinNow: () => void }) {
  return (
    <SectionShell id="programs">
      <SectionHeading
        eyebrow="Elite Pathways"
        title="Curated Academy Training Tracks"
        description="Every training program provides age-calibrated physical conditioning, tactical intelligence, position specialization, and matchday testing."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {programItems.map((program) => {
          const Icon = program.icon
          return (
            <SectionCard
              key={program.title}
              className="group p-6 transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-1.5"
            >
              <div className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-13 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                    <Icon className="size-6" />
                  </div>
                  <Badge variant="outline" className="border-amber-400/40 bg-amber-400/10 text-amber-300 font-semibold text-xs px-3 py-1">
                    {program.badge}
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{program.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{program.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tuition</div>
                    <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
                      {program.price}
                    </div>
                  </div>
                  <RippleButton
                    className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-semibold text-xs px-4 h-10 transition-all"
                    onClick={onJoinNow}
                  >
                    Apply for Trial
                  </RippleButton>
                </div>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </SectionShell>
  )
}

export function StatsSection() {
  return (
    <SectionShell id="stats">
      <div className="grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-8 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] lg:p-10 shadow-2xl">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Academy Track Record"
            title="Measured Results at the Highest Level"
            description="Our academy metrics reflect systematic athlete development, consistent tournament podiums, and professional scout engagement."
            className="items-start text-left"
          />
          <div className="flex items-center gap-3 pt-2">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              UEFA Quality Verified
            </Badge>
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="mr-1.5 size-3.5" />
              FIFA Accredited
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {statItems.map((stat) => {
            const Icon = stat.icon
            return (
              <GlowCard key={stat.label} className="p-6 border-white/10 bg-slate-900/50" glowClassName="mix-blend-screen">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Icon className="size-5" />
                  </div>
                  <div className="mt-auto space-y-1">
                    <div className="ss-stat-value text-3xl sm:text-4xl font-black tracking-tight text-white" data-count-up={stat.value}>
                      {stat.value}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</div>
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}

export function LiveUpdatesWidget() {
  return (
    <SectionShell id="updates">
      <SectionHeading
        eyebrow="Live Match Center"
        title="Fixtures, Matchday Reports & Academy News"
        description="Stay connected with live tournament results, tactical briefings, and youth championship fixtures."
      />

      <div className="mt-12 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Main News Card */}
        <GlowCard className="p-6 lg:p-8 border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-cyan-400">
            <Flame className="size-4.5" />
            <span className="text-xs font-bold uppercase tracking-widest">Featured Tournament</span>
          </div>
          <h3 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
            International Youth Cup 2026 Qualifications
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-2xl">
            Sportsphere Academy U-17 & U-19 squads have qualified for the continental championship group stages.
            Review live match streaming schedule and squad rosters.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {updateItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-all duration-200 hover:border-cyan-500/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</div>
                        <div className="mt-0.5 text-base font-bold text-white">{item.title}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/15 text-slate-300 text-[11px]">
                      {item.time}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">{item.description}</p>
                </div>
              )
            })}
          </div>
        </GlowCard>

        {/* Matchday Schedule Card */}
        <GlowCard className="p-6 lg:p-8 border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Fixtures</div>
              <h3 className="mt-1 text-2xl font-black text-white">Upcoming Matchdays</h3>
            </div>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Active Cycle
            </Badge>
          </div>

          <div className="mt-6 space-y-3.5">
            {[
              { match: 'U-16 vs London Elite', time: 'Saturday, 18:30', venue: 'Main Pitch 1', tag: 'Next Match' },
              { match: 'U-18 vs Pro Pathway XI', time: 'Sunday, 20:00', venue: 'Stadium Arena', tag: 'Showcase' },
              { match: 'UEFA Scout Combine', time: 'Wednesday, 17:00', venue: 'Tactical Center', tag: 'Scout Day' },
            ].map((fixture) => (
              <div
                key={fixture.match}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition-all hover:border-cyan-500/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-white">{fixture.match}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{fixture.venue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-cyan-400 font-mono">{fixture.time}</div>
                    <div className="mt-0.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      {fixture.tag}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
    </SectionShell>
  )
}

export function TestimonialsSection() {
  return (
    <SectionShell id="testimonials">
      <SectionHeading
        eyebrow="Athlete & Parent Voices"
        title="What Our Academy Community Says"
        description="Read experiences from athletes who progressed from youth academy ranks to national squads and pro clubs."
      />

      <div className="mt-12">
        <Carousel opts={{ align: 'start', loop: true }} setApi={() => undefined} plugins={[]} className="w-full">
          <CarouselContent className="pl-4">
            {testimonialItems.map((testimonial) => {
              const Icon = testimonial.icon
              return (
                <CarouselItem key={testimonial.name} className="md:basis-1/2 xl:basis-1/3">
                  <GlowCard className="h-full p-6 border-white/10 bg-slate-900/60 backdrop-blur-xl">
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                          <Icon className="size-5" />
                        </div>
                        <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs">
                          Alumni Spotlight
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-300 italic">“{testimonial.quote}”</p>
                      <div className="mt-auto border-t border-white/10 pt-4">
                        <div className="font-bold text-white">{testimonial.name}</div>
                        <div className="text-xs text-slate-400">{testimonial.role}</div>
                      </div>
                    </div>
                  </GlowCard>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className="border-white/15 bg-slate-900/80 text-white hover:bg-white/10" />
          <CarouselNext className="border-white/15 bg-slate-900/80 text-white hover:bg-white/10" />
        </Carousel>
      </div>
    </SectionShell>
  )
}

export function NewsletterForm({ onSubscribe }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  return (
    <form
      className="mt-5 flex flex-col gap-3 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        const trimmedEmail = email.trim()

        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          setError('Enter a valid email address.')
          setMessage('')
          return
        }

        setError('')
        setMessage('Subscription confirmed. You will receive trial dates & academy news.')
        onSubscribe(trimmedEmail)
        setEmail('')
      }}
    >
      <Input
        type="email"
        value={email}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="h-11 border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 rounded-xl"
      />
      <RippleButton className="h-11 bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 rounded-xl" type="submit">
        Subscribe
        <Send className="ml-1.5 size-4" />
      </RippleButton>
      {error && <p className="sm:col-span-2 text-xs text-rose-400">{error}</p>}
      {message && <p className="sm:col-span-2 text-xs text-emerald-400">{message}</p>}
    </form>
  )
}

export function HubFooter({ onSubscribe }: NewsletterFormProps) {
  return (
    <SectionShell id="footer" className="pb-12">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/90 p-8 lg:p-12 backdrop-blur-2xl shadow-2xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2.5 text-cyan-400">
              <SpinningFootball className="size-5" spinDuration="5s" />
              <span className="text-xs font-bold uppercase tracking-widest">Sportsphere Academy</span>
            </div>
            <h3 className="mt-3 text-3xl font-black text-white tracking-tight">
              Begin Your Professional Pathway
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              Register for trial camps, connect with UEFA certified directors, and unlock your football potential with elite analytics.
            </p>
            <NewsletterForm onSubscribe={onSubscribe} />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white">Contact</div>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
                <li>director@sportsphere.academy</li>
                <li>+1 (555) 021-4001</li>
                <li>
                  <a
                    href="https://wa.me/15550214001?text=Hello%20Sportsphere%20Academy!%20I%20would%20like%20to%20get%20more%20information."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    Chat on WhatsApp
                  </a>
                </li>
                <li>Mon - Sat, 08:00 - 20:00</li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white">Quick Links</div>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
                {hubNavItems.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <a className="transition-colors hover:text-cyan-400" href={`#${item.id}`}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white">Accreditations</div>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
                <li>UEFA Pro Pathway</li>
                <li>FIFA Grassroots Certified</li>
                <li>Youth Performance Hub</li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Sportsphere Football Academy. All rights reserved.</span>
          <span>FIFA & UEFA Standard Athlete Intelligence Platform.</span>
        </div>
      </div>
    </SectionShell>
  )
}

export function LoginDialog({ open, onOpenChange, onSubmit }: LoginDialogProps) {
  const [email, setEmail] = useState(demoCredentials.email)
  const [password, setPassword] = useState(demoCredentials.password)
  const [error, setError] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/15 bg-slate-950 text-white sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black">Sign in to Sportsphere</DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Access academy athlete portals, coach diagnostics, and scheduling dashboards.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            try {
              onSubmit({ email, password })
              setError('')
              onOpenChange(false)
            } catch (submissionError) {
              const errorMessage = submissionError instanceof Error ? submissionError.message : 'Sign in failed.'
              setError(errorMessage)
            }
          }}
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="login-email">
              Email Address
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              className="h-11 border-white/15 bg-white/5 text-white rounded-xl"
              placeholder="demo@sportsphere.academy"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300" htmlFor="login-password">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className="h-11 border-white/15 bg-white/5 text-white rounded-xl"
              placeholder="••••••••"
            />
          </div>

          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300 font-mono">
            Demo: {demoCredentials.email} / {demoCredentials.password}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <DialogFooter className="gap-2 sm:justify-between pt-2">
            <Button variant="outline" type="button" className="border-white/15 text-white" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <RippleButton type="submit" className="bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400">
              Access Dashboard
              <ArrowRight className="ml-1.5 size-4" />
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
