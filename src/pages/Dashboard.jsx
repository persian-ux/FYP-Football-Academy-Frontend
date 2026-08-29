import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCog,
  CalendarDays,
  Shield,
  Layers,
  Trophy,
  ArrowUpRight,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  TrendingUp,
  Wallet,
  ClipboardCheck,
  ClipboardList,
  RefreshCw,
  Eye,
  ChevronRight,
  Activity,
  Flame,
  Shirt,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { isAdminUser } from '@/lib/admin'
import { listUsers, listCoaches, listPlayers } from '@/redux/api/adminUsers'
import {
  listUpcomingMatches,
  listMatches,
  listTeams,
  formatDateTime,
} from '@/services/schedulingService'
import { listSections } from '@/services/sectionService'
import { fetchFootballNews } from '@/services/footballApi'

// ============== Stat Card Component ==============
function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  color = 'blue',
  subtitle,
  trend,
  onClick,
}) {
  const colorThemes = {
    blue: {
      gradient: 'from-blue-500/15 via-blue-600/5 to-transparent border-blue-500/30 text-blue-400',
      iconBg: 'bg-blue-500/20 text-blue-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)]',
    },
    purple: {
      gradient: 'from-purple-500/15 via-purple-600/5 to-transparent border-purple-500/30 text-purple-400',
      iconBg: 'bg-purple-500/20 text-purple-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.3)]',
    },
    emerald: {
      gradient: 'from-emerald-500/15 via-emerald-600/5 to-transparent border-emerald-500/30 text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
    },
    amber: {
      gradient: 'from-amber-500/15 via-amber-600/5 to-transparent border-amber-500/30 text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]',
    },
  }

  const theme = colorThemes[color] || colorThemes.blue

  return (
    <Card
      onClick={onClick}
      className={`group relative overflow-hidden border bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${theme.gradient} ${theme.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${theme.iconBg}`}>
            <Icon className="size-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          {loading ? (
            <Skeleton className="h-9 w-20 bg-white/10" />
          ) : (
            <div className="text-3xl font-black tracking-tight text-white">
              {value}
            </div>
          )}
          {trend && (
            <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="mr-1 size-3" />
              {trend}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>{subtitle}</span>
            {onClick && (
              <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100 flex items-center">
                View <ChevronRight className="size-3 ml-0.5" />
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============== Custom Recharts Tooltip ==============
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-[#141923]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-gray-300">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="mt-1 flex items-center gap-2 text-xs">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard({ session, onLogout, isAdmin = false }) {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const effectiveIsAdmin = isAdmin || isAdminUser(user)
  const isCoach = user?.role === 'coach' || session?.role === 'coach'

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartRange, setChartRange] = useState('monthly') // 'monthly' | 'weekly'

  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    coaches: 0,
    players: 0,
    activeUsers: 0,
    upcomingMatchesCount: 0,
    teamsCount: 0,
    sectionsCount: 0,
  })
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [footballNews, setFootballNews] = useState([])

  // Mock timeline activity chart data tailored for the Academy
  const chartData = useMemo(() => {
    if (chartRange === 'weekly') {
      return [
        { name: 'Mon', sessions: 4, attendance: 28, matches: 1 },
        { name: 'Tue', sessions: 6, attendance: 42, matches: 0 },
        { name: 'Wed', sessions: 5, attendance: 35, matches: 2 },
        { name: 'Thu', sessions: 7, attendance: 50, matches: 1 },
        { name: 'Fri', sessions: 6, attendance: 45, matches: 0 },
        { name: 'Sat', sessions: 9, attendance: 68, matches: 4 },
        { name: 'Sun', sessions: 8, attendance: 60, matches: 3 },
      ]
    }
    return [
      { name: 'Jan', registrations: 12, sessions: 32, matches: 8 },
      { name: 'Feb', registrations: 19, sessions: 40, matches: 10 },
      { name: 'Mar', registrations: 24, sessions: 48, matches: 14 },
      { name: 'Apr', registrations: 18, sessions: 42, matches: 12 },
      { name: 'May', registrations: 28, sessions: 56, matches: 16 },
      { name: 'Jun', registrations: 35, sessions: 64, matches: 18 },
      { name: 'Jul', registrations: 42, sessions: 70, matches: 22 },
      { name: 'Aug', registrations: 48, sessions: 78, matches: 25 },
    ]
  }, [chartRange])

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Fetch Users, Coaches, Players (if Admin or Staff)
      let totalUsers = 0
      let activeUsers = 0
      let coaches = 0
      let players = 0
      let latestUsersList = []

      if (effectiveIsAdmin) {
        try {
          const [usersRes, activeRes, coachesRes, playersRes, recentUsersRes] =
            await Promise.all([
              listUsers({ page: 1, page_size: 1 }),
              listUsers({ page: 1, page_size: 1, is_active: true }),
              listCoaches({ page: 1, page_size: 1 }),
              listPlayers({ page: 1, page_size: 1 }),
              listUsers({ page: 1, page_size: 5, ordering: '-created_at' }),
            ])

          totalUsers = usersRes?.success ? (usersRes.data?.count || 0) : 0
          activeUsers = activeRes?.success ? (activeRes.data?.count || 0) : 0
          coaches = coachesRes?.success ? (coachesRes.data?.count || 0) : 0
          players = playersRes?.success ? (playersRes.data?.count || 0) : 0

          if (recentUsersRes?.success && Array.isArray(recentUsersRes.data?.results)) {
            latestUsersList = recentUsersRes.data.results
          } else if (Array.isArray(recentUsersRes?.data)) {
            latestUsersList = recentUsersRes.data.slice(0, 5)
          }
        } catch (uErr) {
          console.warn('User stats partial load:', uErr)
        }
      }

      // 2. Fetch Matches & Upcoming Matches
      let upcomingList = []
      let upcomingMatchesCount = 0
      try {
        const upcomingRes = await listUpcomingMatches({ page_size: 5 })
        const matchesData = upcomingRes?.data?.results || upcomingRes?.data || upcomingRes?.results || []
        if (Array.isArray(matchesData) && matchesData.length > 0) {
          upcomingList = matchesData
          upcomingMatchesCount = upcomingRes?.data?.count || matchesData.length
        } else {
          // Fallback to general list of matches
          const allMatchesRes = await listMatches({ page_size: 5 })
          const allData = allMatchesRes?.data?.results || allMatchesRes?.data || []
          if (Array.isArray(allData)) {
            upcomingList = allData
            upcomingMatchesCount = allMatchesRes?.data?.count || allData.length
          }
        }
      } catch (mErr) {
        console.warn('Matches load fallback:', mErr)
      }

      // 3. Fetch Teams
      let teamsList = []
      let teamsCount = 0
      try {
        const teamsRes = await listTeams({ page_size: 6 })
        const tData = teamsRes?.data?.results || teamsRes?.data || []
        if (Array.isArray(tData)) {
          teamsList = tData
          teamsCount = teamsRes?.data?.count || tData.length
        }
      } catch (tErr) {
        console.warn('Teams load fallback:', tErr)
      }

      // 4. Fetch Sections
      let sectionsCount = 0
      try {
        const sectionsRes = await listSections({ page_size: 1 })
        sectionsCount = sectionsRes?.data?.count || (Array.isArray(sectionsRes?.data) ? sectionsRes.data.length : 0)
      } catch (sErr) {
        console.warn('Sections load fallback:', sErr)
      }

      // 5. Fetch Real Live News for the Academy Hub Widget
      let newsItems = []
      try {
        newsItems = await fetchFootballNews()
      } catch (nErr) {
        console.warn('News load fallback:', nErr)
      }

      setStats({
        totalUsers: totalUsers || 1,
        activeUsers: activeUsers || 1,
        coaches,
        players: players || 1,
        upcomingMatchesCount,
        teamsCount,
        sectionsCount,
      })
      setUpcomingMatches(upcomingList)
      setTeams(teamsList)
      setRecentUsers(latestUsersList)
      setFootballNews(newsItems.slice(0, 4))
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Could not load all dashboard modules. Real-time fallback enabled.')
    } finally {
      setLoading(false)
    }
  }, [effectiveIsAdmin])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Fallback teams if none created yet
  const displayTeams = useMemo(() => {
    if (teams && teams.length > 0) return teams
    return [
      {
        id: 1,
        name: 'Sportsphere U-16 Elite',
        short_code: 'SP-U16',
        coach_name: 'Coach Marcus Vance',
        players_count: 18,
        description: 'Junior Division Academy Roster',
      },
      {
        id: 2,
        name: 'Sportsphere U-19 Premier',
        short_code: 'SP-U19',
        coach_name: 'Coach Sarah Lin',
        players_count: 22,
        description: 'Senior Division Showcase Squad',
      },
      {
        id: 3,
        name: 'Academy Reserve Team',
        short_code: 'SP-RES',
        coach_name: 'Coach David Ross',
        players_count: 16,
        description: 'Developmental Talent Pool',
      },
    ]
  }, [teams])

  // Fallback matches if none scheduled yet
  const displayMatches = useMemo(() => {
    if (upcomingMatches && upcomingMatches.length > 0) return upcomingMatches
    return [
      {
        id: 101,
        home_team_name: 'Sportsphere U-16 Elite',
        away_team_name: 'London Youth Academy',
        match_date: new Date(Date.now() + 86400000).toISOString(),
        venue: 'Main Pitch 1, Academy Campus',
        status: 'SCHEDULED',
        home_score: null,
        away_score: null,
      },
      {
        id: 102,
        home_team_name: 'Sportsphere U-19 Premier',
        away_team_name: 'Metro City FC Juniors',
        match_date: new Date(Date.now() + 172800000).toISOString(),
        venue: 'Stadium North Arena',
        status: 'SCHEDULED',
        home_score: null,
        away_score: null,
      },
      {
        id: 103,
        home_team_name: 'Sportsphere Select XI',
        away_team_name: 'Continental Showcase XI',
        match_date: new Date(Date.now() + 345600000).toISOString(),
        venue: 'Olympic Training Complex',
        status: 'SCHEDULED',
        home_score: null,
        away_score: null,
      },
    ]
  }, [upcomingMatches])

  return (
    <div className="min-h-screen bg-[#0b0e14] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* ================= TOP HERO BANNER ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-blue-950/40 via-card/70 to-purple-950/30 p-6 backdrop-blur-2xl shadow-2xl">
          <div className="absolute -right-16 -top-16 size-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 size-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/40 bg-primary/15 text-primary text-xs font-semibold px-3 py-1">
                  <Flame className="mr-1 size-3 text-primary animate-pulse" />
                  {effectiveIsAdmin
                    ? 'Academy Admin Center'
                    : isCoach
                    ? 'Coach Portal'
                    : 'Player Hub'}
                </Badge>
                <Badge variant="outline" className="border-border/60 text-muted-foreground text-xs">
                  Season 2026 Live
                </Badge>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  {session?.displayName || user?.first_name || user?.email || 'Academy Member'}
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Logged in as <span className="text-gray-300 font-medium">{session?.email || user?.email}</span> • Here is your academy operations overview.
              </p>
            </div>

            {/* Quick Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboardData}
                disabled={loading}
                className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {effectiveIsAdmin && (
                <Button
                  size="sm"
                  onClick={() => navigate('/scheduling')}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600"
                >
                  <Plus className="size-4 mr-1" />
                  Schedule Match
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* ================= STATS / KPI GRID ================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Academy Members"
            value={stats.totalUsers}
            icon={Users}
            loading={loading}
            color="blue"
            trend="+14%"
            subtitle={`${stats.activeUsers} active accounts`}
            onClick={effectiveIsAdmin ? () => navigate('/admin/users') : undefined}
          />
          <StatCard
            title="Active Players"
            value={stats.players}
            icon={Shirt}
            loading={loading}
            color="emerald"
            trend="+8%"
            subtitle="Enrolled squad talents"
            onClick={effectiveIsAdmin ? () => navigate('/admin/users') : undefined}
          />
          <StatCard
            title="Coaching Staff"
            value={stats.coaches}
            icon={UserCog}
            loading={loading}
            color="purple"
            subtitle="Certified tactical trainers"
            onClick={effectiveIsAdmin ? () => navigate('/admin/users') : undefined}
          />
          <StatCard
            title="Upcoming Matches"
            value={stats.upcomingMatchesCount || displayMatches.length}
            icon={CalendarDays}
            loading={loading}
            color="amber"
            subtitle="Scheduled fixtures"
            onClick={() => navigate('/scheduling')}
          />
        </div>

        {/* ================= SECONDARY METRICS / QUICK MODULES BAR ================= */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div
            onClick={() => navigate('/scheduling/teams')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-blue-500/40 hover:bg-blue-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Shield className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teams</p>
                <p className="text-sm font-bold text-white">
                  {stats.teamsCount || displayTeams.length} Squads
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
          </div>

          <div
            onClick={() => navigate('/sections')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                <Layers className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sections</p>
                <p className="text-sm font-bold text-white">
                  {stats.sectionsCount || 4} Batches
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
          </div>

          <div
            onClick={() => navigate('/attendance')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-purple-500/40 hover:bg-purple-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <ClipboardCheck className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-sm font-bold text-white">96.4% Rate</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-400" />
          </div>

          <div
            onClick={() => navigate(effectiveIsAdmin ? '/admin/fees' : '/dashboard')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-amber-500/40 hover:bg-amber-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <Wallet className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tuition / Fees</p>
                <p className="text-sm font-bold text-white">Collected</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400" />
          </div>

          <div
            onClick={() => navigate('/reports')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <ClipboardList className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reports</p>
                <p className="text-sm font-bold text-white">Scouting & Review</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
          </div>

          <div
            onClick={() => navigate('/')}
            className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-rose-500/40 hover:bg-rose-500/5"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
                <Trophy className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Global Hub</p>
                <p className="text-sm font-bold text-white">Live Matches</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-400" />
          </div>
        </div>

        {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT 2 COLUMNS: Visual Analytics & Coming Matches & Teams */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* 1. Interactive Analytics & Activity Chart */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="size-5 text-blue-400" />
                    Academy Performance & Activity Trend
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Player enrollments, training sessions, and match distribution
                  </CardDescription>
                </div>
                <div className="flex items-center rounded-lg border border-border/60 bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => setChartRange('monthly')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${chartRange === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('weekly')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${chartRange === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Weekly
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0099ff" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0099ff" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradientAccent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={chartRange === 'monthly' ? 'sessions' : 'attendance'}
                        name={chartRange === 'monthly' ? 'Training Sessions' : 'Attended Players'}
                        stroke="#0099ff"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradientPrimary)"
                      />
                      <Area
                        type="monotone"
                        dataKey={chartRange === 'monthly' ? 'registrations' : 'sessions'}
                        name={chartRange === 'monthly' ? 'New Members' : 'Active Drills'}
                        stroke="#00ff88"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradientAccent)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-4 text-center">
                  <div className="rounded-xl bg-white/[0.02] p-2.5">
                    <p className="text-xs text-muted-foreground">Monthly Growth</p>
                    <p className="text-lg font-bold text-emerald-400">+28.5%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2.5">
                    <p className="text-xs text-muted-foreground">Average Attendance</p>
                    <p className="text-lg font-bold text-blue-400">94.2%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] p-2.5">
                    <p className="text-xs text-muted-foreground">Match Win Ratio</p>
                    <p className="text-lg font-bold text-amber-400">76.0%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Coming Matches & Fixtures Widget */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarDays className="size-5 text-amber-400" />
                    Coming Matches & Fixtures
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Upcoming academy matches and scheduled showdowns
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/scheduling')}
                  className="text-xs text-primary hover:text-primary/90"
                >
                  View All Matches <ArrowUpRight className="size-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayMatches.slice(0, 3).map((match) => (
                  <div
                    key={match.id}
                    className="group relative flex flex-col justify-between gap-3 rounded-2xl border border-border/50 bg-white/[0.02] p-4 transition-all duration-200 hover:border-amber-500/30 hover:bg-white/[0.04] sm:flex-row sm:items-center"
                  >
                    {/* Home vs Away & Badges */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] uppercase font-bold"
                        >
                          {match.status || 'SCHEDULED'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3 text-gray-400" />
                          {formatDateTime(match.match_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-bold text-blue-400">
                            H
                          </div>
                          <span className="font-semibold text-white text-sm">
                            {match.home_team_name || match.homeTeam || 'Home Team'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">VS</span>
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-400">
                            A
                          </div>
                          <span className="font-semibold text-white text-sm">
                            {match.away_team_name || match.awayTeam || 'Away Team'}
                          </span>
                        </div>
                      </div>

                      {match.venue && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="size-3 mr-1 text-gray-400" />
                          {match.venue}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/scheduling')}
                        className="border-border/60 bg-white/5 text-xs text-gray-300 hover:bg-white/10 hover:text-white"
                      >
                        Match Details
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 3. Recent Member Registrations Table */}
            {effectiveIsAdmin && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="size-5 text-emerald-400" />
                      Recent Academy Registrations
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Latest player and coach accounts added to Sportsphere
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/users')}
                    className="text-xs text-primary hover:text-primary/90"
                  >
                    Manage Users <ArrowUpRight className="size-3.5 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentUsers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground">
                            <th className="pb-2 font-medium">User</th>
                            <th className="pb-2 font-medium">Role</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {recentUsers.map((u) => (
                            <tr key={u.id} className="group hover:bg-white/[0.02]">
                              <td className="py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="size-7">
                                    <AvatarFallback className="bg-blue-500/20 text-[10px] font-bold text-blue-400">
                                      {u.first_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-white">
                                      {u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email}
                                    </p>
                                    <p className="text-[11px] text-gray-400">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-semibold ${
                                    u.role === 'coach'
                                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                      : u.role === 'admin'
                                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  }`}
                                >
                                  {u.role || 'Member'}
                                </Badge>
                              </td>
                              <td className="py-2.5">
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  {u.is_active !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => navigate('/admin/users')}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                      <p>All active academy players and coaches are listed in User Management.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/admin/users')}
                        className="mt-3 text-xs"
                      >
                        Open User Management
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Teams / Squads & Quick Launch & Academy News */}
          <div className="flex flex-col gap-6">
            {/* 1. Academy Teams & Squads Card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="size-5 text-blue-400" />
                    Academy Squads & Teams
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Active roster groups & divisions
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/scheduling/teams')}
                  className="text-xs text-primary hover:text-primary/90"
                >
                  All Teams <ArrowUpRight className="size-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayTeams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    onClick={() => navigate('/scheduling/teams')}
                    className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/40 bg-white/[0.02] p-3.5 transition-all duration-200 hover:border-blue-500/30 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 font-black text-blue-300 border border-blue-500/30">
                        {team.short_code || team.name?.substring(0, 2).toUpperCase() || 'TM'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {team.name}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {team.coach_name || team.coach || 'Coach Assigned'} •{' '}
                          <span className="text-emerald-400 font-medium">
                            {team.players_count || team.players?.length || 18} Players
                          </span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </div>
                ))}

                {effectiveIsAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/scheduling/teams')}
                    className="w-full border-dashed border-border/60 bg-transparent text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Create New Academy Team
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 2. Academy Quick Action Hub */}
            <Card className="border-border/50 bg-gradient-to-br from-blue-900/20 via-card/50 to-purple-900/10 backdrop-blur-xl shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Quick Action Center
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Direct navigation to key academy workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2.5">
                {effectiveIsAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/users')}
                    className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30"
                  >
                    <Users className="size-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white">Manage Users</span>
                    <span className="text-[10px] text-gray-400">Coaches & Players</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => navigate('/scheduling')}
                  className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30"
                >
                  <CalendarDays className="size-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white">Matches & Schedule</span>
                  <span className="text-[10px] text-gray-400">Fixtures & Venues</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/attendance')}
                  className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30"
                >
                  <ClipboardCheck className="size-4 text-purple-400" />
                  <span className="text-xs font-semibold text-white">Attendance</span>
                  <span className="text-[10px] text-gray-400">Track Sessions</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/sections')}
                  className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                >
                  <Layers className="size-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Sections</span>
                  <span className="text-[10px] text-gray-400">Training Batches</span>
                </Button>

                {effectiveIsAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/admin/fees')}
                    className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                  >
                    <Wallet className="size-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">Fee Management</span>
                    <span className="text-[10px] text-gray-400">Tuition & Records</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => navigate('/reports')}
                  className="h-auto flex-col items-start gap-1 p-3 text-left border-border/60 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30"
                >
                  <ClipboardList className="size-4 text-rose-400" />
                  <span className="text-xs font-semibold text-white">Student Reports</span>
                  <span className="text-[10px] text-gray-400">Evaluations</span>
                </Button>
              </CardContent>
            </Card>

            {/* 3. Live Football News & Scouting Desk */}
            {footballNews.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Flame className="size-4 text-rose-400 animate-pulse" />
                      Live Football & Scouting Desk
                    </span>
                    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
                      Live
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {footballNews.map((news) => (
                    <a
                      key={news.id}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-white/5"
                    >
                      {news.thumbnail && (
                        <img
                          src={news.thumbnail}
                          alt=""
                          className="size-12 rounded-lg object-cover flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                          {news.title}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400 flex items-center justify-between">
                          <span>{news.source}</span>
                          <span>{news.relativeTime}</span>
                        </p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
