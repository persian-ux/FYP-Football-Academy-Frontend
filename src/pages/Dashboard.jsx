import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ArrowLeft, LogOut, Users, UserCog } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RippleButton } from '@/components/common/RippleButton'
import { isAdminUser } from '@/lib/admin'
import { listUsers, listCoaches, listPlayers } from '@/redux/api/adminUsers'

// ============== Stats Card ==============
function StatCard({ title, value, icon: Icon, loading, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
  }
  const iconColor = {
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  }

  return (
    <Card
      className={`border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden ${colorClasses[color]}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-white/5" />
            ) : (
              <p className="text-3xl font-bold text-white">{value}</p>
            )}
          </div>
          <div className={`rounded-lg bg-white/5 p-3 ${iconColor[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard({ session, onLogout, isAdmin = false }) {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  // Check admin status from Redux user, prop, or demo session fallback
  const effectiveIsAdmin = isAdmin || isAdminUser(user)

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    coaches: 0,
    players: 0,
    activeUsers: 0,
  })
  const [statsLoading, setStatsLoading] = useState(effectiveIsAdmin)
  const [statsError, setStatsError] = useState('')

  // Fetch dashboard stats
  useEffect(() => {
    if (!effectiveIsAdmin) return

    const fetchStats = async () => {
      setStatsLoading(true)
      setStatsError('')
      try {
        // Fetch total users count
        const usersRes = await listUsers({ page: 1, page_size: 1 })
        const totalUsers = usersRes.success ? (usersRes.data?.count || 0) : 0

        // Fetch active users count
        const activeRes = await listUsers({ page: 1, page_size: 1, is_active: true })
        const activeUsers = activeRes.success ? (activeRes.data?.count || 0) : 0

        // Fetch coaches count
        const coachesRes = await listCoaches({ page: 1, page_size: 1 })
        const coaches = coachesRes.success ? (coachesRes.data?.count || 0) : 0

        // Fetch players count
        const playersRes = await listPlayers({ page: 1, page_size: 1 })
        const players = playersRes.success ? (playersRes.data?.count || 0) : 0

        setStats({
          totalUsers,
          coaches,
          players,
          activeUsers,
        })
      } catch (err) {
        setStatsError(err.response?.data?.message || 'Failed to load dashboard stats')
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [effectiveIsAdmin])

  return (
    <main className="min-h-screen bg-[#0f1419] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border/70 bg-card/60 px-6 py-4 backdrop-blur-xl">
          <div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">
              {effectiveIsAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Welcome back, {session.displayName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as {session.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-border/70 text-white"
              onClick={() => navigate('/')}
            >
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

        {/* Admin stats & panel - only visible to admin users */}
        {effectiveIsAdmin && (
          <>
            {/* Stats Error */}
            {statsError && (
              <Alert variant="destructive">
                <AlertDescription>{statsError}</AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={Users}
                loading={statsLoading}
                color="blue"
              />
              <StatCard
                title="Coaches"
                value={stats.coaches}
                icon={UserCog}
                loading={statsLoading}
                color="purple"
              />
              <StatCard
                title="Players"
                value={stats.players}
                icon={Users}
                loading={statsLoading}
                color="emerald"
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={Users}
                loading={statsLoading}
                color="amber"
              />
            </div>

            {/* Admin Panel */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-card/60 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <UserCog className="size-5 text-primary" />
                      Admin Panel
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Manage academy users, coaches, and players.
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-primary text-white hover:bg-primary/90"
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="size-4" />
                    Manage Users
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Create, edit, and manage coach and player accounts from the
                  admin dashboard.
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Non-admin placeholder */}
        {!effectiveIsAdmin && (
          <Card className="border-border/70 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="size-5 text-primary" />
                Welcome to your Dashboard
              </CardTitle>
              <CardDescription>
                Your account is active and ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                This is your personal dashboard. More features will be available
                soon.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
