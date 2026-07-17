import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Clock3,
  Globe2,
  GraduationCap,
  LineChart,
  MapPinned,
  Medal,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react'

export type NavItem = {
  id: string
  label: string
}

export type FeatureItem = {
  title: string
  description: string
  icon: LucideIcon
}

export type ProgramItem = {
  title: string
  description: string
  price: string
  badge: string
  icon: LucideIcon
}

export type StatItem = {
  value: string
  label: string
  icon: LucideIcon
}

export type UpdateItem = {
  label: string
  title: string
  description: string
  time: string
  icon: LucideIcon
}

export type TestimonialItem = {
  quote: string
  name: string
  role: string
  icon: LucideIcon
}

export const hubNavItems: NavItem[] = [
  { id: 'hero', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'programs', label: 'Programs' },
  { id: 'stats', label: 'Stats' },
  { id: 'updates', label: 'Updates' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'footer', label: 'Contact' },
]

export const heroHighlights = [
  'Elite development pathways',
  'Live academy intelligence',
  'Community, coaching, and performance tracking',
]

export const featureItems: FeatureItem[] = [
  {
    title: 'Professional Coaching',
    description: 'Learn from licensed coaches with elite training methods, game IQ drills, and weekly performance reviews.',
    icon: Medal,
  },
  {
    title: 'World-Class Facilities',
    description: 'Train on premium pitches, recovery suites, and data-backed training rooms designed for serious athletes.',
    icon: Building2,
  },
  {
    title: 'Elite Development',
    description: 'Structured pathways for technical growth, tactical awareness, strength, and match readiness.',
    icon: ShieldCheck,
  },
  {
    title: 'Global Network',
    description: 'Connected with scouts, partner academies, and tournaments to help players build a wider future.',
    icon: Globe2,
  },
]

export const programItems: ProgramItem[] = [
  {
    title: 'U-12 Academy',
    description: 'Foundation phase with ball mastery, movement literacy, and confidence building.',
    price: 'From $49/month',
    badge: 'Foundation',
    icon: GraduationCap,
  },
  {
    title: 'U-14 Academy',
    description: 'Sharper tactical understanding, technical repetition, and match-intelligent habits.',
    price: 'From $69/month',
    badge: 'Development',
    icon: Sparkles,
  },
  {
    title: 'U-16 Academy',
    description: 'High-performance training with speed work, position-specific drills, and resilience.',
    price: 'From $89/month',
    badge: 'Performance',
    icon: LineChart,
  },
  {
    title: 'U-18 Academy',
    description: 'Advanced preparation with tactical periodization, scouting feedback, and showcase matches.',
    price: 'From $109/month',
    badge: 'Advanced',
    icon: Trophy,
  },
  {
    title: 'Senior Elite',
    description: 'High-intensity elite group for graduates and players targeting academies, clubs, and pro trials.',
    price: 'From $149/month',
    badge: 'Elite',
    icon: UsersRound,
  },
]

export const statItems: StatItem[] = [
  { value: '500+', label: 'Student Athletes', icon: Users },
  { value: '50+', label: 'Ex-Pro Players', icon: Award },
  { value: '25+', label: 'Years Legacy', icon: Clock3 },
  { value: '95%', label: 'Success Rate', icon: BarChart3 },
]

export const updateItems: UpdateItem[] = [
  {
    label: 'World football',
    title: 'FIFA World Cup qualifiers heat up across Europe and South America',
    description: 'Live schedules, qualification pressure, and breakout performances are reshaping the road to the next tournament.',
    time: 'Live now',
    icon: CircleDot,
  },
  {
    label: 'Upcoming matches',
    title: 'Academy showcase fixture scheduled for Saturday evening',
    description: 'U-16 and U-18 squads will feature in a streamed matchday event for families, scouts, and alumni.',
    time: 'Tomorrow',
    icon: CalendarDays,
  },
  {
    label: 'Academy events',
    title: 'Open training clinic and coach Q&A announced for this month',
    description: 'Prospective players can join a live session focused on evaluation, placement, and program guidance.',
    time: 'This week',
    icon: MessageSquareQuote,
  },
]

export const testimonialItems: TestimonialItem[] = [
  {
    quote: 'The coaching structure here pushed my son to understand the game, not just play it.',
    name: 'Amina Rahman',
    role: 'Parent of U-14 player',
    icon: ChevronRight,
  },
  {
    quote: 'The academy gave me better habits, better fitness, and a real pathway to trials.',
    name: 'Daniel Mensah',
    role: 'U-18 graduate',
    icon: Trophy,
  },
  {
    quote: 'Our players improve faster when training is built around data, consistency, and accountability.',
    name: 'Coach Ibrahim',
    role: 'Head coach recommendation',
    icon: UsersRound,
  },
]
