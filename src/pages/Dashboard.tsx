import { ArrowLeft, BadgeCheck, LogOut, ShieldCheck, Trophy, Users, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RippleButton } from '@/components/common/RippleButton'
import type { AuthSession } from '@/lib/auth'

type DashboardProps = {
  session: AuthSession
  onLogout: () => void
}

const dashboardHighlights = [
  { label: 'Attendance', value: '98%', icon: Users },
  { label: 'Progress', value: 'A+', icon: ShieldCheck },
  { label: 'Performance', value: 'Top 10%', icon: Trophy },
  { label: 'Readiness', value: 'Live', icon: Zap },
]

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#0f1419] px-4 py-8 text-white sm:px-6 lg:px-8">
      {/* TypeScript: RippleButton/Button/Card/Badge components are JS and can have strict prop typing issues. */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/60 px-6 py-4 backdrop-blur-xl">
          <div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">Protected dashboard</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {session.displayName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Signed in as {session.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border/70 text-white" onClick={() => navigate('/')}>
              <ArrowLeft className="size-4" />
              Back to Hub
            </Button>
            <RippleButton
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => {
                onLogout()
                navigate('/', { replace: true })
              }}
            >
              <LogOut className="size-4" />
              Logout
            </RippleButton>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dashboardHighlights.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.label} className="border-border/70 bg-card/60 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                    <Icon className="size-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-white">{item.value}</div>
                  <CardDescription className="mt-2 text-muted-foreground">
                    Demo metric for the protected view.
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Today&apos;s plan</CardTitle>
              <CardDescription>Mock dashboard content to prove route protection and logout flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Video analysis review at 4:00 PM</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Conditioning block on the main pitch</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Recovery and academy feedback session</div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Account status</CardTitle>
              <CardDescription>Your demo session is active and stored in localStorage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-accent">
                <BadgeCheck className="size-5" />
                <span>Authenticated via Sportsphere demo login</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">The dashboard route is protected and will redirect when signed out.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
