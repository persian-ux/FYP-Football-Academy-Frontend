import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  ClipboardCheck,
  CalendarDays,
  Activity,
  LayoutDashboard,
  Bell,
  LogOut,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  TrendingUp,
  Star,
  Trophy,
  ChevronRight,
  Flame,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getStudentsWithFeeStatus } from '@/services/feeService'
import { listAttendanceRecords } from '@/services/attendanceService'
import { listUpcomingMatches, formatDateTime } from '@/services/schedulingService'
import { listStudentReports, listAllPlayers } from '@/services/reportService'
import NotificationCenter from '@/components/NotificationCenter'
import NotificationBanners from '@/components/NotificationBanners'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a paginated backend envelope into a plain array. */
function toArray(value) {
  if (Array.isArray(value)) return value
  return value?.data?.results || value?.data || value?.results || []
}

/** Best-effort match for a row that references the current logged-in user. */
function matchesUser(row, user) {
  if (!row || !user) return false
  const email = String(user?.email || '').toLowerCase()
  const id = String(user?.id ?? '')
  if (email && String(row?.user_email || row?.email || '').toLowerCase() === email) return true
  if (id && (String(row?.user ?? '') === id || String(row?.user_id ?? '') === id)) return true
  return false
}

function shortDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function longDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function MiniStat({ label, value, icon: Icon, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-4 backdrop-blur-md">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="truncate text-lg font-bold leading-tight text-white">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  const meta = {
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    unpaid: 'bg-red-500/15 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    overdue: 'bg-red-600/20 text-red-400 border-red-600/40',
  }[s] || 'bg-gray-500/15 text-gray-300 border-gray-500/30'
  return (
    <Badge variant="secondary" className={cn('uppercase tracking-wide', meta)}>
      {s || '—'}
    </Badge>
  )
}

function AttendanceStatusBadge({ status }) {
  const meta = {
    present: { label: 'Present', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    absent: { label: 'Absent', dot: 'bg-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
    late: { label: 'Late', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    excused: { label: 'Excused', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  }[status] || { label: 'N/A', dot: 'bg-gray-400', badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }

  return (
    <Badge variant="secondary" className={cn(meta.badge)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  )
}

function PerfTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-gray-300">
          {entry.name}: <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Player Dashboard
// ---------------------------------------------------------------------------

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fees', label: 'My Fees', icon: Wallet },
  { id: 'attendance', label: 'My Attendance', icon: ClipboardCheck },
  { id: 'matches', label: 'My Schedule', icon: CalendarDays },
  { id: 'performance', label: 'My Performance', icon: Activity },
]
export default function PlayerDashboard({ session = null, onLogout = () => {} }) {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  // ---- Data state ----
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fee, setFee] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [matches, setMatches] = useState([])
  const [reports, setReports] = useState([])
  const [profileName, setProfileName] = useState('')

  const displayName =
    session?.displayName ||
    profileName ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.email ||
    'Academy Player'

  // ---- Fetch all player data ----
  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    let myFee = null
    let myAttendance = []
    let myMatches = []
    let myReports = []
    let myProfileName = ''

    // 1) Fee status
    try {
      const feesRes = await getStudentsWithFeeStatus()
      const rows = toArray(feesRes)
      myFee =
        rows.find((r) => matchesUser(r, user)) ||
        rows.find(
          (r) =>
            String(r?.email || r?.student_name || '').toLowerCase() ===
            String(user?.email || '').toLowerCase()
        ) ||
        null
    } catch (err) {
      console.warn('Player fee fetch failed:', err)
    }

    // 2) Attendance records
    try {
      const attRes = await listAttendanceRecords({ role: 'player', page_size: 100, ordering: '-date' })
      myAttendance = toArray(attRes).filter((r) => matchesUser(r, user)).slice(0, 30)
    } catch (err) {
      console.warn('Player attendance fetch failed:', err)
      // Fall back to the records endpoint if the first attempt denied access.
      try {
        const fallback = await listAttendanceRecords({ role: 'player', page_size: 200 })
        myAttendance = toArray(fallback).filter((r) => matchesUser(r, user)).slice(0, 30)
      } catch {
        /* ignore */
      }
    }

    // 3) Upcoming matches
    try {
      const matchesRes = await listUpcomingMatches({ page_size: 6 })
      myMatches = toArray(matchesRes)
    } catch (err) {
      console.warn('Player matches fetch failed:', err)
    }

    // 4) Performance reports
    try {
      const players = await listAllPlayers()
      const me = players.find(
        (p) =>
          String(p?.user?.id ?? '') === String(user?.id ?? '') ||
          String(p?.user_id ?? '') === String(user?.id ?? '') ||
          String(p?.user?.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
      )
      myProfileName = me?.full_name || me?.user?.full_name || ''
      const reportsRes = await listStudentReports({ player: me?.id, page_size: 100 })
      myReports = toArray(reportsRes)
    } catch (err) {
      console.warn('Player performance fetch failed:', err)
      try {
        const fallback = await listStudentReports({ search: user?.email, page_size: 100 })
        myReports = toArray(fallback)
      } catch {
        /* ignore */
      }
    }

    setFee(myFee)
    setAttendance(myAttendance)
    setMatches(myMatches)
    setReports(myReports)
    setProfileName(myProfileName)
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // ---- Derived metrics ----
  const feeStatus = String(fee?.fee_status || fee?.status || 'unpaid').toLowerCase()
  const feeAmount = fee?.amount ? `$${fee.amount}` : null
  const feeDueDate = fee?.due_date ? longDate(fee.due_date) : null

  const attendanceStats = useMemo(() => {
    const total = attendance.length
    if (total === 0) return { total, present: 0, rate: 0 }
    const present = attendance.filter(
      (r) => String(r.status).toLowerCase() === 'present' || String(r.status).toLowerCase() === 'late'
    ).length
    return { total, present, rate: Math.round((present / total) * 100) }
  }, [attendance])

  const perf = useMemo(() => {
    const count = reports.length
    const sum = (key) => reports.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
    const avgRating = count ? sum('rating') / count : 0
    const sorted = [...reports].sort(
      (a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0)
    )
    const bars = sorted
      .slice(0, 10)
      .reverse()
      .map((r) => ({
        name: shortDate(r.report_date),
        goals: Number(r.goals) || 0,
        assists: Number(r.assists) || 0,
      }))
    return {
      count,
      goals: sum('goals'),
      assists: sum('assists'),
      minutes: sum('minutes_played'),
      avgRating: Number(avgRating.toFixed(1)),
      bars,
      latest: sorted[0] || null,
    }
  }, [reports])

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleLogout = () => {
    onLogout()
    navigate('/', { replace: true })
  }

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
// ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0e14] text-white">
      {/* ============================ Sidebar ============================ */}
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
            <span className="text-sm font-bold text-white">FA</span>
          </div>
          <span className="font-bold text-white">Player Portal</span>
        </div>

        <Separator className="bg-border/40" />

        <nav className="flex-1 p-2">
          {NAV_SECTIONS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <Separator className="bg-border/40" />

        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-cyan-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-gray-400">{session?.email || user?.email}</p>
              </div>
            </div>
            <NotificationCenter />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-gray-400 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Logout</span>
          </Button>
        </div>
      </aside>
{/* ============================ Main ============================ */}
      <main id="overview" className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* ------------------------- Hero ------------------------- */}
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-emerald-950/40 via-card/70 to-cyan-950/30 p-6 backdrop-blur-2xl shadow-2xl">
            <div className="absolute -right-16 -top-16 size-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-emerald-400/40 bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-3 py-1">
                    <Flame className="mr-1 size-3 animate-pulse" />
                    Player Hub
                  </Badge>
                  <Badge variant="outline" className="border-border/60 text-muted-foreground text-xs">
                    Season 2026 Live
                  </Badge>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl text-white">
                  Welcome back,{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  Here is your academy overview — fees, attendance, schedule &amp; performance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <NotificationCenter />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDashboard}
                  disabled={loading}
                  className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* ------------------------- Alerts ------------------------- */}
          <NotificationBanners />

          {error && (
            <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* ------------------------- Mini stats ------------------------- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat
              label="Fee Status"
              value={fee ? feeStatus : '—'}
              icon={Wallet}
              accent="bg-emerald-500/10 text-emerald-400"
            />
            <MiniStat
              label="Attendance Rate"
              value={loading ? '…' : `${attendanceStats.rate}%`}
              icon={ClipboardCheck}
              accent="bg-blue-500/10 text-blue-400"
            />
            <MiniStat
              label="Upcoming Matches"
              value={loading ? '…' : matches.length}
              icon={CalendarDays}
              accent="bg-amber-500/10 text-amber-400"
            />
            <MiniStat
              label="Performance Reports"
              value={loading ? '…' : perf.count}
              icon={Activity}
              accent="bg-purple-500/10 text-purple-400"
            />
          </div>
{/* ------------------------- Fee / Attendance / Schedule cards ------------------------- */}
          <section id="fees" className="grid gap-6 scroll-mt-6 lg:grid-cols-3">
            <Card className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-emerald-400" /> My Fee Status
                </CardTitle>
                <CardDescription>Tuition payment status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
                ) : fee ? (
                  <>
                    <div
                      className={cn(
                        'rounded-2xl border p-4 text-center',
                        feeStatus === 'paid'
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-red-500/30 bg-red-500/10'
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {feeStatus === 'paid' ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        )}
                        <StatusBadge status={feeStatus} />
                      </div>
                      <p className="mt-3 text-3xl font-black text-white">{feeAmount || '—'}</p>
                      {feeDueDate && (
                        <p className="mt-1 text-xs text-gray-400">Due {feeDueDate}</p>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300">
                      {feeStatus === 'paid'
                        ? 'Your academy tuition is fully paid. Keep up the great commitment!'
                        : feeStatus === 'overdue'
                          ? 'Your fee is overdue. Please settle it as soon as possible to avoid restrictions.'
                          : 'Your fee is not fully settled yet. Kindly complete the payment soon.'}
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    <p>No fee record found for your account yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
<Card id="attendance" className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-xl scroll-mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardCheck className="h-5 w-5 text-blue-400" /> My Attendance
                </CardTitle>
                <CardDescription>Recent training &amp; match attendance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
                ) : attendance.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-white/5 p-3">
                      <span className="text-xs text-gray-400">Attendance rate</span>
                      <span className="text-sm font-bold text-white">{attendanceStats.rate}%</span>
                    </div>
                    <div className="flex h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                        style={{ width: `${attendanceStats.rate}%` }}
                      />
                    </div>
                    <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                      {attendance.slice(0, 8).map((rec, idx) => (
                        <div
                          key={rec.id || idx}
                          className="flex items-center justify-between rounded-xl border border-border/30 bg-white/[0.02] px-3 py-2"
                        >
                          <span className="text-xs text-gray-300">{formatDateTime(rec.date)}</span>
                          <AttendanceStatusBadge status={rec.status} />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    <p>No attendance records available for you yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
<Card id="matches" className="lg:col-span-1 border-border/40 bg-card/40 backdrop-blur-xl scroll-mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CalendarDays className="h-5 w-5 text-amber-400" /> Upcoming Matches
                </CardTitle>
                <CardDescription>Next scheduled fixtures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
                ) : matches.length > 0 ? (
                  matches.slice(0, 4).map((m) => {
                    const home = m.home_team_detail?.name || m.home_team_name || m.home_team || 'Home'
                    const away = m.away_team_detail?.name || m.away_team_name || m.away_team || 'Away'
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-border/40 bg-white/[0.02] p-3.5 transition-colors hover:border-amber-500/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {home} <span className="text-gray-500">vs</span> {away}
                          </p>
                          <Badge className="shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] uppercase">
                            {m.status || 'SCHEDULED'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDateTime(m.match_date)}
                          </span>
                          {m.venue && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {m.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    <p>No upcoming matches scheduled yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
{/* ------------------------- Performance + Quick actions ------------------------- */}
          <section className="grid gap-6 lg:grid-cols-3">
            <Card id="performance" className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-xl scroll-mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-purple-400" /> My Performance
                </CardTitle>
                <CardDescription>Match stats, goals &amp; coach ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loading ? (
                  <Skeleton className="h-40 w-full rounded-xl bg-white/5" />
                ) : perf.count > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-white">{perf.count}</p>
                        <p className="text-[11px] text-gray-500">Reports</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-white">{perf.goals}</p>
                        <p className="text-[11px] text-gray-500">Goals</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-white">{perf.assists}</p>
                        <p className="text-[11px] text-gray-500">Assists</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-white">{perf.minutes}</p>
                        <p className="text-[11px] text-gray-500">Minutes</p>
                      </div>
                      <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
                        <p className="text-lg font-semibold text-white">{perf.avgRating}</p>
                        <p className="text-[11px] text-gray-500">Avg Rating</p>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perf.bars} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<PerfTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                          <Bar dataKey="goals" name="Goals" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="assists" name="Assists" fill="#a855f7" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
{perf.latest && (
                      <div className="rounded-xl border border-border/40 bg-white/5 p-3.5">
                        <p className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-2">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400" /> Latest Report
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-gray-500" />
                            {longDate(perf.latest.report_date)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            Rating {perf.latest.rating ?? '—'}/10
                          </span>
                          {perf.latest.position && (
                            <span className="text-gray-400">Position: {perf.latest.position}</span>
                          )}
                        </div>
                        {perf.latest.coach_remarks && (
                          <p className="mt-2 text-xs text-gray-400 italic">
                            “{perf.latest.coach_remarks}”
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-500">
                    <TrendingUp className="h-8 w-8 text-gray-600" />
                    <p className="text-sm">No performance reports found for you yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-400" /> Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => scrollToSection('fees')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                  >
                    View my fee details <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
<button
                    onClick={() => scrollToSection('attendance')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                  >
                    Check my attendance <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => scrollToSection('matches')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                  >
                    View my schedule <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => scrollToSection('performance')}
                    className="flex w-full items-center justify-between rounded-xl border border-border/40 bg-white/[0.02] px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-white/5"
                  >
                    See my performance <ChevronRight className="h-4 w-4 text-gray-500" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}