import { useState, type ChangeEvent, type ComponentProps } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BellRing,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Globe2,
  GraduationCap,
  LayoutGrid,
  Mail,
  Menu,
  MessageCircleMore,
  MicVocal,
  MoonStar,
  Newspaper,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  type NavItem,
} from '@/data/hubContent'
import { GlowCard } from '@/components/common/GlowCard'
import { RippleButton } from '@/components/common/RippleButton'
import { SectionHeading } from '@/components/common/SectionHeading'
import SportSphereHero from './SportSphereHero'

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
  onOpenLogin: () => void
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
    <section id={id} className={cn('relative z-10 scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8 lg:py-20', className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  )
}

function SectionCard({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <GlowCard className={cn('border-border/70 bg-card/70', className)} {...props}>
      {children}
    </GlowCard>
  )
}

function formatNavLabel(item: NavItem) {
  return item.label
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-[#0f1419]/90 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigateSection('hero')}
          className="flex items-center gap-3 text-left"
          aria-label="Scroll to hero section"
        >
          <span className="grid size-10 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_25px_rgba(0,153,255,0.25)]">
            <svg
              viewBox="0 0 48 48"
              className="size-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              {/* Outer spinning ring */}
              <circle cx="24" cy="24" r="20" className="animate-spin" stroke="currentColor" strokeWidth="3" strokeDasharray="90 35" strokeLinecap="round" />
              {/* Inner counter-spinning ring */}
              <circle cx="24" cy="24" r="12" className="animate-spin-reverse" stroke="currentColor" strokeWidth="3" strokeDasharray="50 25" strokeLinecap="round" />
              {/* Center accent dot */}
              <circle cx="24" cy="24" r="3" fill="currentColor" className="text-accent" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-black tracking-tight text-white">Sportsphere</span>
            <span className="block text-xs uppercase tracking-[0.28em] text-muted-foreground">Academy Hub</span>
          </span>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          {hubNavItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateSection(item.id)}
                className={cn(
                  'relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out',
                  isActive ? 'text-white' : 'text-muted-foreground hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-linear-to-r from-primary via-secondary to-accent transition-transform duration-300',
                    isActive && 'scale-x-100'
                  )}
                />
                {formatNavLabel(item)}
              </button>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <RippleButton
            variant="outline"
            className="border-border/70 bg-card/40 text-white hover:bg-white/5"
            onClick={onExplorePrograms}
          >
            Explore Programs
          </RippleButton>
          {session ? (
            <>
              <RippleButton className="bg-accent text-[#0f1419] hover:bg-accent/90" onClick={onJoinNow}>
                Join Now
              </RippleButton>
              <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <RippleButton className="bg-primary text-white hover:bg-primary/90" onClick={onOpenLogin}>
              Sign In
            </RippleButton>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <RippleButton
            variant="outline"
            className="hidden border-border/70 bg-card/40 text-white sm:inline-flex"
            onClick={onExplorePrograms}
          >
            Explore
          </RippleButton>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-border/70 bg-card/40 text-white">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l-border bg-[#0f1419] text-white">
              <SheetHeader className="border-b border-border/50 pb-4">
                <SheetTitle className="flex items-center gap-3 text-left text-white">
                  <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <svg
                      viewBox="0 0 48 48"
                      className="size-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                    >
                      <circle cx="24" cy="24" r="20" className="animate-spin" stroke="currentColor" strokeWidth="3" strokeDasharray="90 35" strokeLinecap="round" />
                      <circle cx="24" cy="24" r="12" className="animate-spin-reverse" stroke="currentColor" strokeWidth="3" strokeDasharray="50 25" strokeLinecap="round" />
                      <circle cx="24" cy="24" r="3" fill="currentColor" className="text-accent" />
                    </svg>
                  </span>
                  Sportsphere Hub
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-2 p-4">
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

              <div className="border-t border-border/50 p-4">
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="justify-start border-border/70 text-white" onClick={onExplorePrograms}>
                    Explore Programs
                  </Button>
                  {session ? (
                    <Button className="justify-start bg-accent text-[#0f1419] hover:bg-accent/90" onClick={onJoinNow}>
                      Join Dashboard
                    </Button>
                  ) : (
                    <Button className="justify-start bg-primary text-white hover:bg-primary/90" onClick={onOpenLogin}>
                      Sign In
                    </Button>
                  )}
                </div>
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
        eyebrow="Why Sportsphere"
        title="A sharper football academy experience"
        description="The hub centralizes coaching, training, and community updates into a modern experience that feels premium, fast, and easy to navigate."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featureItems.map((feature, index) => {
          const Icon = feature.icon
          return (
            <GlowCard key={feature.title} className="ss-reveal p-6" glowClassName="mix-blend-screen" data-reveal="card-flip" data-delay={`${index * 60}`}>
              <div className="flex h-full flex-col gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary shadow-[0_0_30px_rgba(0,153,255,0.12)]">
                  <Icon className="size-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </div>
                <div className="mt-auto pt-2 text-sm font-medium text-accent">
                  Learn the system
                  <ChevronRight className="ml-1 inline size-4" />
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
        eyebrow="Training Programs"
        title="Pick the academy track that matches the athlete"
        description="Each program card highlights age group, development focus, price, and a direct route to more details."
      />

      <div className="mt-12 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {programItems.map((program, index) => {
          const Icon = program.icon
          return (
            <SectionCard key={program.title} className="ss-reveal p-6" data-reveal="card-flip" data-delay={`${index * 60}`}>
              <div className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary shadow-[0_0_30px_rgba(0,153,255,0.12)]">
                    <Icon className="size-6" />
                  </div>
                  <Badge variant="secondary" className="border border-white/10 bg-white/5 text-white">
                    {program.badge}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white">{program.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{program.description}</p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Price</div>
                    <div className="text-lg font-bold text-white">{program.price}</div>
                  </div>
                  <RippleButton
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-white hover:bg-primary/20"
                    onClick={onJoinNow}
                  >
                    Learn More
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
      <div className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/50 p-6 backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Academy metrics"
            title="Numbers that reflect the training culture"
            description="These highlights give parents and athletes a quick view of the program's size, experience, and outcomes."
            className="items-start text-left"
          />
          <Button variant="link" className="p-0 text-accent hover:text-white">
            See annual report
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {statItems.map((stat, index) => {
            const Icon = stat.icon
            return (
              <GlowCard key={stat.label} className="ss-reveal p-6" glowClassName="mix-blend-screen" data-reveal="card-flip">
                <div className="flex h-full flex-col gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <div className="mt-auto space-y-1">
                    <div className="ss-stat-value text-4xl font-black tracking-tight" data-count-up={stat.value}>{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
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
        eyebrow="Live updates"
        title="Real-time football stories, fixture moments, and academy events"
        description="A live feed keeps the hub feeling current, so visitors can see what is happening now without leaving the page."
      />

      <div className="mt-12 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlowCard className="p-6 lg:p-8">
          <div className="flex items-center gap-3 text-accent">
            <Flame className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.28em]">Breaking news</span>
          </div>
          <h3 className="mt-4 text-3xl font-black text-white">FIFA World Cup 2026 Countdown</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            The next cycle of international football is building momentum. Use this widget to surface official updates,
            fixture changes, and academy announcements in one place.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {updateItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  data-reveal="fade-up"
                  className="ss-reveal rounded-2xl border border-border/60 bg-background/20 p-4 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.label}</div>
                        <div className="mt-1 text-lg font-bold text-white">{item.title}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/5 text-white">
                      {item.time}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </GlowCard>

        <GlowCard className="p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Upcoming matches</div>
              <h3 className="mt-2 text-2xl font-black text-white">Academy fixtures</h3>
            </div>
            <Badge className="border border-accent/30 bg-accent/10 text-accent">Live schedule</Badge>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ['U-16 vs Elite Select', 'Saturday, 6:30 PM', 'Main Pitch'],
              ['U-18 Showcase', 'Sunday, 8:00 PM', 'Stadium Court'],
              ['Coach Q&A Session', 'Wednesday, 7:00 PM', 'Academy Hall'],
            ].map(([title, time, venue], index) => (
              <div
                key={title}
                className="rounded-2xl border border-border/60 bg-background/20 p-4 transition-all duration-300 ease-in-out hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{venue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-accent">{time}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">{index === 0 ? 'Next up' : 'Scheduled'}</div>
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
        eyebrow="Testimonials"
        title="What students, parents, and coaches are saying"
        description="The carousel keeps quotes moving without overwhelming the page and creates a polished, modern experience."
      />

      <div className="mt-12">
        <Carousel opts={{ align: 'start', loop: true }} setApi={() => undefined} plugins={[]} className="w-full">
          <CarouselContent className="pl-4">
            {testimonialItems.map((testimonial) => {
              const Icon = testimonial.icon
              return (
                <CarouselItem key={testimonial.name} className="md:basis-1/2 xl:basis-1/3">
                  <GlowCard className="ss-reveal h-full p-6" data-reveal="card-flip">
                    <div className="flex h-full flex-col gap-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
                          <Icon className="size-5" />
                        </div>
                        <Badge variant="secondary" className="bg-white/5 text-white">
                          Success story
                        </Badge>
                      </div>
                      <p className="text-lg leading-8 text-white">“{testimonial.quote}”</p>
                      <div className="mt-auto border-t border-white/10 pt-4">
                        <div className="font-bold text-white">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </GlowCard>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className="border-border/70 bg-card/80 text-white hover:bg-white/5" />
          <CarouselNext className="border-border/70 bg-card/80 text-white hover:bg-white/5" />
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
        setMessage('Thanks for subscribing. We will send academy updates soon.')
        console.log('Newsletter submit', trimmedEmail)
        onSubscribe(trimmedEmail)
        setEmail('')
      }}
    >
      <Input
        type="email"
        value={email}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
        placeholder="Enter your email"
        className="h-11 border-border/60 bg-white/5 text-white placeholder:text-muted-foreground"
      />
      <RippleButton className="h-11 bg-accent text-[#0f1419] hover:bg-accent/90" type="submit">
        Subscribe
        <Send className="size-4" />
      </RippleButton>
      {error ? <p className="sm:col-span-2 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="sm:col-span-2 text-sm text-accent">{message}</p> : null}
    </form>
  )
}

export function HubFooter({ onSubscribe }: NewsletterFormProps) {
  return (
    <SectionShell id="footer" className="pb-10">
      <GlowCard className="overflow-hidden p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3 text-accent">
              <MoonStar className="size-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.28em]">Sportsphere Hub</span>
            </div>
            <h3 className="mt-4 text-3xl font-black text-white">Ready to join Sportsphere?</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Contact the academy team, review program links, or subscribe to weekly updates for training openings and
              event notices.
            </p>
            <NewsletterForm onSubscribe={onSubscribe} />
          </div>

          <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-2">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Contact</div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>hello@sportsphere.academy</li>
                <li>+1 (555) 021-4001</li>
                <li>Mon - Sat, 8:00 AM - 8:00 PM</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Quick links</div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {hubNavItems.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <a className="link-underline transition-colors hover:text-white" href={`#${item.id}`}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Social</div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <a className="link-underline transition-colors hover:text-white" href="https://instagram.com" target="_blank" rel="noreferrer noopener">
                    Instagram
                  </a>
                </li>
                <li>
                  <a className="link-underline transition-colors hover:text-white" href="https://x.com" target="_blank" rel="noreferrer noopener">
                    X / Twitter
                  </a>
                </li>
                <li>
                  <a className="link-underline transition-colors hover:text-white" href="https://youtube.com" target="_blank" rel="noreferrer noopener">
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white">Newsletter</div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">Get matchday news, academy openings, and training tips in your inbox.</p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Sportsphere Academy. All rights reserved.</span>
          <span>Built with Tailwind CSS v4, shadcn/ui, Redux Toolkit, and React Router.</span>
        </div>
      </GlowCard>
    </SectionShell>
  )
}

export function LoginDialog({ open, onOpenChange, onSubmit }: LoginDialogProps) {
  const [email, setEmail] = useState(demoCredentials.email)
  const [password, setPassword] = useState(demoCredentials.password)
  const [error, setError] = useState('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/70 bg-[#111827] text-white sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-black">Sign in to Sportsphere</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use the demo credentials to unlock the protected dashboard route.
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="login-email">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
              className="h-11 border-border/70 bg-white/5 text-white"
              placeholder="demo@sportsphere.academy"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="login-password">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
              className="h-11 border-border/70 bg-white/5 text-white"
              placeholder="Sportsphere123!"
            />
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 text-sm text-accent">
            Demo credentials: {demoCredentials.email} / {demoCredentials.password}
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <DialogFooter className="gap-3 border-border/60 bg-white/5 sm:justify-between">
            <Button variant="outline" type="button" className="border-border/70 text-white" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <RippleButton type="submit" className="bg-primary text-white hover:bg-primary/90">
              Access Dashboard
              <ArrowRight className="size-4" />
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
