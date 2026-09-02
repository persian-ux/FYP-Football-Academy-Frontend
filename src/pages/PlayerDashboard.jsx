import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Wallet,
  ClipboardCheck,
  CalendarDays,
  Activity,
  LayoutDashboard,
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
  ChevronLeft,
  Flame,
  User,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'fees', label: 'My Fees', icon: Wallet },
  { id: 'attendance', label: 'My Attendance', icon: ClipboardCheck },
  { id: 'matches', label: 'My Schedule', icon: CalendarDays },
  { id: 'performance', label: 'My Performance', icon: Activity },
]

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

/** Consistent header shell for every detail section. */
function SectionShell({ title, description, icon: Icon, accent, onBack, actions = null, children }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="mr-1 size-4" /> Overview
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}
// ---------------------------------------------------------------------------
// Overview — front page with all summaries
// ---------------------------------------------------------------------------

// ============== Admin-style Stat Card (mirrors Dashboard.jsx) ==============
function PlayerStatCard({ title, value, icon: Icon, loading, color = 'blue', subtitle, onClick }) {
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
            <div className="text-3xl font-black tracking-tight text-white">{value}</div>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{subtitle}</span>
            {onClick && (
              <span className="flex items-center text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                View <ChevronRight className="ml-0.5 size-3" />
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============== Custom Recharts Tooltip (admin style) ==============
function AdminChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-[#141923]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-gray-300">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-400">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

function OverviewView({
  displayName,
  email,
  loading,
  error,
  loadDashboard,
  fee,
  feeStatus,
  feeAmount,
  feeDueDate,
  attendanceStats,
  matches,
  perf,
  onNavigate,
  onOpenProfile,
}) {
  const [chartMetric, setChartMetric] = useState('stats')

  return (
    <div className="min-h-screen bg-[#0b0e14] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* ================= TOP HERO BANNER (admin style) ================= */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-blue-950/40 via-card/70 to-purple-950/30 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-72 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  <Flame className="mr-1 size-3 animate-pulse text-primary" />
                  Player Hub
                </Badge>
                <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
                  Season 2026 Live
                </Badge>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Logged in as <span className="font-medium text-gray-300">{email}</span> • Here is your personal academy overview.
              </p>
            </div>

            {/* Quick Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <NotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboard}
                disabled={loading}
                className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => onNavigate('matches')}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600"
              >
                <CalendarDays className="mr-1 size-4" />
                My Schedule
              </Button>
            </div>
          </div>
        </div>

      <NotificationBanners />

      {error && (
        <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* ================= STATS / KPI GRID (admin style) ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlayerStatCard
          title="Fee Status"
          value={fee ? feeStatus.toUpperCase() : '—'}
          icon={Wallet}
          loading={loading}
          color="emerald"
          subtitle={fee ? `${feeAmount || '—'} · due ${feeDueDate || '—'}` : 'No fee record yet'}
          onClick={() => onNavigate('fees')}
        />
        <PlayerStatCard
          title="Attendance Rate"
          value={`${attendanceStats.rate}%`}
          icon={ClipboardCheck}
          loading={loading}
          color="blue"
          subtitle={`${attendanceStats.present}/${attendanceStats.total} sessions attended`}
          onClick={() => onNavigate('attendance')}
        />
        <PlayerStatCard
          title="Avg Performance"
          value={perf.count ? `${perf.avgRating}/10` : '—'}
          icon={Activity}
          loading={loading}
          color="purple"
          subtitle={`${perf.count} coach report(s)`}
          onClick={() => onNavigate('performance')}
        />
        <PlayerStatCard
          title="Upcoming Matches"
          value={matches.length}
          icon={CalendarDays}
          loading={loading}
          color="amber"
          subtitle="Scheduled fixtures"
          onClick={() => onNavigate('matches')}
        />
      </div>

      {/* ================= QUICK MODULES BAR (admin style) ================= */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          onClick={() => onNavigate('fees')}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Wallet className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">My Fees</p>
              <p className="text-sm font-bold text-white">{fee ? feeStatus.toUpperCase() : '—'}</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-400" />
        </div>

        <div
          onClick={() => onNavigate('attendance')}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-purple-500/40 hover:bg-purple-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <ClipboardCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-sm font-bold text-white">{attendanceStats.rate}% Rate</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-400" />
        </div>

        <div
          onClick={() => onNavigate('matches')}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-amber-500/40 hover:bg-amber-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <CalendarDays className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Schedule</p>
              <p className="text-sm font-bold text-white">{matches.length} Fixtures</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-400" />
        </div>

        <div
          onClick={() => onNavigate('performance')}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-blue-500/40 hover:bg-blue-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Activity className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Performance</p>
              <p className="text-sm font-bold text-white">{perf.count ? `${perf.avgRating}/10` : '—'}</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-400" />
        </div>

        <div
          onClick={onOpenProfile}
          className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border/50 bg-card/40 p-3.5 backdrop-blur-md transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <User className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profile</p>
              <p className="text-sm font-bold text-white">My Account</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
        </div>
      </div>

      {/* ================= MAIN GRID — chart + right column ================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Performance Trend Chart (admin-style AreaChart) */}
        <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-xl lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
                <Activity className="size-4 text-purple-400" /> Performance Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Goals &amp; assists across your recent reports
              </CardDescription>
            </div>
            <div className="flex rounded-lg border border-border/60 bg-white/[0.02] p-0.5">
              {[
                { id: 'stats', label: 'Goals & Assists' },
                { id: 'rating', label: 'Rating' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setChartMetric(m.id)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    chartMetric === m.id
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {perf.bars.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No performance data yet — coach reports will appear here.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perf.bars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0099ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0099ff" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="pGradientAccent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3045" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<AdminChartTooltip />} />
                    {chartMetric === 'stats' ? (
                      <>
                        <Area
                          type="monotone"
                          dataKey="goals"
                          name="Goals"
                          stroke="#0099ff"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#pGradientPrimary)"
                        />
                        <Area
                          type="monotone"
                          dataKey="assists"
                          name="Assists"
                          stroke="#00ff88"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#pGradientAccent)"
                        />
                      </>
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="rating"
                        name="Rating"
                        stroke="#a855f7"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#pGradientAccent)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-4 text-center">
              <div className="rounded-xl bg-white/[0.02] p-2.5">
                <p className="text-xs text-muted-foreground">Total Goals</p>
                <p className="text-lg font-bold text-blue-400">{perf.goals}</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-2.5">
                <p className="text-xs text-muted-foreground">Total Assists</p>
                <p className="text-lg font-bold text-emerald-400">{perf.assists}</p>
              </div>
              <div className="rounded-xl bg-white/[0.02] p-2.5">
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-lg font-bold text-amber-400">{perf.count ? perf.avgRating : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Fixtures widget */}
        <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <CalendarDays className="size-4 text-amber-400" /> Upcoming Fixtures
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Next scheduled matches</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {loading ? (
              <Skeleton className="h-56 w-full rounded-xl bg-white/5" />
            ) : matches.length === 0 ? (
              <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border/50 text-sm text-muted-foreground">
                No upcoming matches
              </div>
            ) : (
              matches.slice(0, 4).map((m) => {
                const mh = m.home_team_detail?.name || m.home_team_name || m.home_team || 'Home'
                const ma = m.away_team_detail?.name || m.away_team_name || m.away_team || 'Away'
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border/40 bg-white/[0.02] p-3 transition-colors hover:border-amber-500/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {mh} <span className="text-gray-500">vs</span> {ma}
                      </p>
                      <Badge className="shrink-0 border-amber-500/30 bg-amber-500/10 text-[10px] uppercase text-amber-400">
                        {m.status || 'SCHEDULED'}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
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
            )}
            <button
              onClick={() => onNavigate('matches')}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-white/[0.02] py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              View full schedule <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>

      </div>

      {/* Right info cards — fee / attendance / latest report */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Wallet className="size-4 text-emerald-400" /> My Fee Status
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Tuition standing</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
            ) : fee ? (
              <>
                <div className="flex items-center gap-2">
                  {feeStatus === 'paid' ? (
                    <ShieldCheck className="size-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="size-4 text-red-400" />
                  )}
                  <StatusBadge status={feeStatus} />
                  <p className="text-xl font-black text-white">{feeAmount || '—'}</p>
                </div>
                {feeDueDate && <p className="text-xs text-gray-400">Due {feeDueDate}</p>}
                <p className="text-xs text-gray-500">
                  {feeStatus === 'paid'
                    ? 'Tuition fully paid — keep it up!'
                    : feeStatus === 'overdue'
                      ? 'Fee overdue — please settle soon.'
                      : 'Fee not fully settled yet.'}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No fee record found yet.</p>
            )}
            <button
              onClick={() => onNavigate('fees')}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-white/[0.02] py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              View fee details <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <ClipboardCheck className="size-4 text-blue-400" /> My Attendance
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">This season at a glance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
            ) : attendanceStats.total > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-black text-white">{attendanceStats.rate}%</p>
                  <p className="text-xs text-gray-400">
                    {attendanceStats.present}/{attendanceStats.total} sessions
                  </p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    style={{ width: `${attendanceStats.rate}%` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No attendance records yet.</p>
            )}
            <button
              onClick={() => onNavigate('attendance')}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-white/[0.02] py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              View attendance <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Activity className="size-4 text-purple-400" /> Latest Coach Report
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Most recent feedback</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
            ) : perf.latest ? (
              <>
                <div className="flex items-center gap-2">
                  <Star className="size-4 text-yellow-400" />
                  <p className="text-xl font-black text-white">{perf.latest.rating ?? '—'}/10</p>
                  <span className="text-xs text-gray-400">{shortDate(perf.latest.report_date)}</span>
                </div>
                {perf.latest.coach_remarks && (
                  <p className="line-clamp-2 text-xs italic text-gray-400">“{perf.latest.coach_remarks}”</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No reports yet.</p>
            )}
            <button
              onClick={() => onNavigate('performance')}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-white/[0.02] py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              View all reports <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
// ---------------------------------------------------------------------------
// Detail sections
// ---------------------------------------------------------------------------

function FeesView({ loading, fee, feeStatus, feeAmount, feeDueDate, onBack }) {
  return (
    <SectionShell
      title="My Fees"
      description="Tuition payment status & details"
      icon={Wallet}
      accent="bg-emerald-500/10 text-emerald-400"
      onBack={onBack}
    >
      {loading ? (
        <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
      ) : fee ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Payment Status</CardTitle>
              <CardDescription>Current tuition standing</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  'rounded-2xl border p-6 text-center',
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
                <p className="mt-3 text-4xl font-black text-white">{feeAmount || '—'}</p>
                {feeDueDate && <p className="mt-1 text-xs text-gray-400">Due {feeDueDate}</p>}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-300">
                {feeStatus === 'paid'
                  ? 'Your academy tuition is fully paid. Keep up the great commitment!'
                  : feeStatus === 'overdue'
                    ? 'Your fee is overdue. Please settle it as soon as possible to avoid restrictions.'
                    : 'Your fee is not fully settled yet. Kindly complete the payment soon.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Fee Details</CardTitle>
              <CardDescription>Information from the academy office</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Status', value: <StatusBadge status={feeStatus} /> },
                { label: 'Amount', value: feeAmount || '—' },
                { label: 'Due date', value: feeDueDate || '—' },
                { label: 'Student', value: fee.student_name || fee.full_name || fee.name || '—' },
                { label: 'Record ID', value: fee.id ?? '—' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className="text-sm font-medium text-white">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
          No fee record found for your account yet. Please contact the academy office.
        </div>
      )}
    </SectionShell>
  )
}

function AttendanceView({ loading, attendance, attendanceStats, onBack }) {
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0 }
    attendance.forEach((r) => {
      const s = String(r.status || '').toLowerCase()
      if (s in c) c[s] += 1
    })
    return c
  }, [attendance])

  return (
    <SectionShell
      title="My Attendance"
      description="Training & match attendance history"
      icon={ClipboardCheck}
      accent="bg-blue-500/10 text-blue-400"
      onBack={onBack}
    >
      {loading ? (
        <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
      ) : attendance.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Attendance Rate" value={`${attendanceStats.rate}%`} icon={TrendingUp} accent="bg-cyan-500/10 text-cyan-400" />
            <MiniStat label="Present" value={counts.present} icon={ClipboardCheck} accent="bg-emerald-500/10 text-emerald-400" />
            <MiniStat label="Late" value={counts.late} icon={Clock} accent="bg-amber-500/10 text-amber-400" />
            <MiniStat label="Absent" value={counts.absent} icon={AlertTriangle} accent="bg-red-500/10 text-red-400" />
          </div>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">Overall Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{attendanceStats.present} of {attendanceStats.total} sessions attended</span>
                <span className="font-bold text-white">{attendanceStats.rate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${attendanceStats.rate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">Session History</CardTitle>
              <CardDescription>{attendance.length} record(s)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {attendance.map((rec, idx) => (
                <div
                  key={rec.id || idx}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <span className="text-xs text-gray-300">{formatDateTime(rec.date)}</span>
                  <AttendanceStatusBadge status={rec.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
          No attendance records available for you yet.
        </div>
      )}
    </SectionShell>
  )
}

function ScheduleView({ loading, matches, onBack }) {
  const nextMatch = matches[0]
  const home = nextMatch?.home_team_detail?.name || nextMatch?.home_team_name || nextMatch?.home_team || 'Home'
  const away = nextMatch?.away_team_detail?.name || nextMatch?.away_team_name || nextMatch?.away_team || 'Away'

  return (
    <SectionShell
      title="My Schedule"
      description="Upcoming fixtures & match schedule"
      icon={CalendarDays}
      accent="bg-amber-500/10 text-amber-400"
      onBack={onBack}
    >
      {loading ? (
        <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
      ) : matches.length > 0 ? (
        <div className="flex flex-col gap-6">
          {/* Next match spotlight */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-card/70 to-card/70 p-6 backdrop-blur-xl">
            <div className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="relative z-10">
              <Badge className="border-amber-400/40 bg-amber-500/15 text-xs font-semibold text-amber-400">
                <Clock className="mr-1 size-3" /> Next Match
              </Badge>
              <p className="mt-3 text-2xl font-black text-white">
                {home} <span className="text-gray-500">vs</span> {away}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {formatDateTime(nextMatch.match_date)}
                </span>
                {nextMatch.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {nextMatch.venue}
                  </span>
                )}
                {nextMatch.status && (
                  <Badge variant="outline" className="border-border/60 text-[10px] uppercase">
                    {nextMatch.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* All fixtures */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">All Upcoming Fixtures</CardTitle>
              <CardDescription>{matches.length} match(es) scheduled</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2.5">
              {matches.map((m) => {
                const mh = m.home_team_detail?.name || m.home_team_name || m.home_team || 'Home'
                const ma = m.away_team_detail?.name || m.away_team_name || m.away_team || 'Away'
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-border/40 bg-white/[0.02] p-3.5 transition-colors hover:border-amber-500/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {mh} <span className="text-gray-500">vs</span> {ma}
                      </p>
                      <Badge className="shrink-0 border-amber-500/30 bg-amber-500/10 text-[10px] uppercase text-amber-400">
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
              })}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center text-sm text-muted-foreground">
          No upcoming matches scheduled yet.
        </div>
      )}
    </SectionShell>
  )
}

function PerformanceView({ loading, perf, reports, onBack }) {
  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0)),
    [reports]
  )

  return (
    <SectionShell
      title="My Performance"
      description="Match stats, goals & coach ratings"
      icon={Activity}
      accent="bg-purple-500/10 text-purple-400"
      onBack={onBack}
    >
      {loading ? (
        <Skeleton className="h-64 w-full rounded-3xl bg-white/5" />
      ) : perf.count > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MiniStat label="Reports" value={perf.count} icon={Activity} accent="bg-purple-500/10 text-purple-400" />
            <MiniStat label="Goals" value={perf.goals} icon={Trophy} accent="bg-emerald-500/10 text-emerald-400" />
            <MiniStat label="Assists" value={perf.assists} icon={Star} accent="bg-blue-500/10 text-blue-400" />
            <MiniStat label="Minutes" value={perf.minutes} icon={Clock} accent="bg-amber-500/10 text-amber-400" />
            <MiniStat label="Avg Rating" value={`${perf.avgRating}/10`} icon={TrendingUp} accent="bg-cyan-500/10 text-cyan-400" />
          </div>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">Goals & Assists Trend</CardTitle>
              <CardDescription>Last {perf.bars.length} report(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
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
            </CardContent>
          </Card>

          {perf.latest && (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-white">
                  <Trophy className="h-4 w-4 text-yellow-400" /> Latest Report
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
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
                  <p className="mt-1 text-xs italic text-gray-400">
                    “{perf.latest.coach_remarks}”
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white">All Reports</CardTitle>
              <CardDescription>{sortedReports.length} coach report(s)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {sortedReports.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <span className="text-xs text-gray-300">{longDate(r.report_date)}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Goals: <span className="text-white">{Number(r.goals) || 0}</span></span>
                    <span>Assists: <span className="text-white">{Number(r.assists) || 0}</span></span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-white">{r.rating ?? '—'}/10</span>
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/50 py-14 text-gray-500">
          <TrendingUp className="h-8 w-8 text-gray-600" />
          <p className="text-sm">No performance reports found for you yet.</p>
        </div>
      )}
    </SectionShell>
  )
}
// ---------------------------------------------------------------------------
// Player Dashboard — sidebar navigation + view switching
// ---------------------------------------------------------------------------

export default function PlayerDashboard({ session = null, onLogout = () => {} }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useSelector((state) => state.auth)

  const sectionParam = searchParams.get('section')
  const [activeSection, setActiveSection] = useState(() =>
    sectionParam && NAV_SECTIONS.some((s) => s.id === sectionParam) ? sectionParam : 'overview'
  )
  const [collapsed, setCollapsed] = useState(false)

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

  // ---- Deep-link support (e.g. /dashboard?section=fees) ----
  useEffect(() => {
    if (sectionParam && NAV_SECTIONS.some((s) => s.id === sectionParam)) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam])

  const handleNavigate = (id) => {
    setActiveSection(id)
    if (sectionParam) setSearchParams({}, { replace: true })
    document.querySelector('main')?.scrollTo({ top: 0 })
  }

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
      const matchesRes = await listUpcomingMatches({ page_size: 12 })
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
        rating: Number(r.rating) || 0,
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

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0e14] text-white">
      {/* ============================ Sidebar ============================ */}
      <aside
        className={cn(
          'flex h-full flex-col shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <span className="text-sm font-bold text-white">FA</span>
              </div>
              <span className="font-bold text-white">Player Hub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-white"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <Separator className="bg-border/40" />

        {/* Navigation — switches views */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_SECTIONS.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <Separator className="bg-border/40" />

        {/* Footer */}
        <div className="p-4">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
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
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <NotificationCenter />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-gray-400 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* ============================ Main ============================ */}
      <main className="flex-1 overflow-y-auto">
        {activeSection === 'overview' && (
          <OverviewView
            displayName={displayName}
            loading={loading}
            error={error}
            loadDashboard={loadDashboard}
            fee={fee}
            feeStatus={feeStatus}
            feeAmount={feeAmount}
            feeDueDate={feeDueDate}
            attendanceStats={attendanceStats}
            matches={matches}
            perf={perf}
            onNavigate={handleNavigate}
            onOpenProfile={() => navigate('/profile')}
          />
        )}
        {activeSection === 'fees' && (
          <FeesView
            loading={loading}
            fee={fee}
            feeStatus={feeStatus}
            feeAmount={feeAmount}
            feeDueDate={feeDueDate}
            onBack={() => handleNavigate('overview')}
          />
        )}
        {activeSection === 'attendance' && (
          <AttendanceView
            loading={loading}
            attendance={attendance}
            attendanceStats={attendanceStats}
            onBack={() => handleNavigate('overview')}
          />
        )}
        {activeSection === 'matches' && (
          <ScheduleView loading={loading} matches={matches} onBack={() => handleNavigate('overview')} />
        )}
        {activeSection === 'performance' && (
          <PerformanceView
            loading={loading}
            perf={perf}
            reports={reports}
            onBack={() => handleNavigate('overview')}
          />
        )}
      </main>
    </div>
  )
}