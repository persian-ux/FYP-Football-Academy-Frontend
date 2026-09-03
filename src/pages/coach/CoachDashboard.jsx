import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  Users,
  ClipboardCheck,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  MapPin,
  Star,
  Flame,
  Shield,
  ArrowRight,
  UserCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { clearTokensAndUser } from '@/redux/slices/authSlice'
import CoachLayout from '@/components/layout/CoachLayout'
import AttendanceStatusBadge from '@/pages/Attendance/AttendanceStatusBadge'
import MatchStatusBadge from '@/pages/Scheduling/MatchStatusBadge'
import CoachAttendance from './CoachAttendance'
import CoachScheduling from './CoachScheduling'
import CoachReports from './CoachReports'
import { CoachStatCard, EmptyState, todayString, formatDate, getInitials } from './coachShared'
import { listAllMyPlayers, playerName } from '@/services/coachService'
import { getAttendanceRoster } from '@/services/attendanceService'
import { listUpcomingMatches, listTeams, formatDateTime } from '@/services/schedulingService'
import { listStudentReports } from '@/services/reportService'

/**
 * CoachDashboard — the coach portal.
 * Section-based navigation (deep-linkable via ?section=) covering overview,
 * attendance, teams & matches, and student reports. All data comes from the
 * same backend endpoints the admin dashboard uses, so mutations are
 * immediately visible on both sides.
 */
export default function CoachDashboard({ session, onLogout }) {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()

  const section = searchParams.get('section') || 'overview'
  const [players, setPlayers] = useState([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roster, setRoster] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [teams, setTeams] = useState([])
  const [reports, setReports] = useState([])

  const displayName =
    session?.displayName || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Coach'

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true)
    const list = await listAllMyPlayers({ page_size: 200 })
    setPlayers(list)
    setPlayersLoading(false)
  }, [])

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    // Each block fails independently so one broken module never blanks the page.
    try {
      const response = await getAttendanceRoster(todayString())
      setRoster(Array.isArray(response?.data?.roster) ? response.data.roster : [])
    } catch {
      setRoster([])
    }
    try {
      const response = await listUpcomingMatches({ page_size: 5 })
      const list = Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
          ? response.data
          : []
      setUpcoming(list)
    } catch {
      setUpcoming([])
    }
    try {
      const response = await listTeams({ page_size: 10 })
      const list = Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
          ? response.data
          : []
      setTeams(list)
    } catch {
      setTeams([])
    }
    try {
      const response = await listStudentReports({ page_size: 5 })
      const list = Array.isArray(response?.data?.results)
        ? response.data.results
        : Array.isArray(response?.data)
          ? response.data
          : []
      setReports(list)
    } catch {
      setReports([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  useEffect(() => {
    if (section === 'overview') loadOverview()
  }, [section, loadOverview, refreshKey])

  // ------------------------- Derived overview metrics -------------------------
  const rosterStats = useMemo(() => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, total: roster.length }
    roster.forEach((row) => {
      if (row.status && row.status in stats) stats[row.status] += 1
    })
    return stats
  }, [roster])

  const markedCount = rosterStats.present + rosterStats.absent + rosterStats.late + rosterStats.excused

  const recentReports = useMemo(() => reports.slice(0, 5), [reports])

  const reportStudentName = (report) => {
    if (report?.student_details?.full_name) return report.student_details.full_name
    if (report?.student_details?.email) return report.student_details.email
    const local = players.find((p) => String(p.id) === String(report?.player))
    return local ? playerName(local) : `Student #${report?.player ?? '?'}`
  }

  const handleLogout = () => {
    sessionStorage.removeItem('auth_tokens')
    sessionStorage.removeItem('auth_user')
    dispatch(clearTokensAndUser())
    if (onLogout) onLogout()
  }

  const go = (target) => setSearchParams({ section: target })

  // ------------------------- Section content -------------------------
  const renderSection = () => {
    if (section === 'attendance') {
      return (
        <CoachAttendance user={user} players={players} onDataChanged={bumpRefresh} />
      )
    }
    if (section === 'scheduling') {
      return <CoachScheduling onDataChanged={bumpRefresh} />
    }
    if (section === 'reports') {
      return <CoachReports players={players} onDataChanged={bumpRefresh} />
    }
    return renderOverview()
  }

  const renderOverview = () => (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-r from-emerald-950/40 via-card/70 to-teal-950/30 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Flame className="mr-1 size-3 animate-pulse" />
                Coach Portal
              </Badge>
              <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
                Season 2026 Live
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {formatDate(todayString())} · Here is your squad&apos;s day at a glance.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={loading}
            className="w-fit border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CoachStatCard
          title="Assigned Players"
          value={players.length}
          icon={Users}
          loading={playersLoading}
          color="blue"
          subtitle="Your current squad"
          onClick={() => go('reports')}
        />
        <CoachStatCard
          title="Today's Attendance"
          value={markedCount === 0 ? '—' : `${rosterStats.present}/${markedCount}`}
          icon={ClipboardCheck}
          loading={loading}
          color="emerald"
          subtitle={`${rosterStats.present} present · ${markedCount} marked`}
          onClick={() => go('attendance')}
        />
        <CoachStatCard
          title="Upcoming Matches"
          value={upcoming.length}
          icon={CalendarDays}
          loading={loading}
          color="amber"
          subtitle="Next fixtures"
          onClick={() => go('scheduling')}
        />
        <CoachStatCard
          title="Recent Reports"
          value={reports.length}
          icon={ClipboardList}
          loading={loading}
          color="purple"
          subtitle="Latest performance notes"
          onClick={() => go('reports')}
        />
      </div>

      {/* Today's roster + upcoming matches */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm text-white">Today&apos;s Roster</CardTitle>
              <CardDescription>Attendance for {formatDate(todayString())}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go('attendance')}
              className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/5" />
              ))
            ) : roster.length === 0 ? (
              <EmptyState
                title="No players on today's roster"
                description="Assigned players appear here automatically."
              />
            ) : (
              roster.slice(0, 6).map((row) => (
                <div
                  key={row.user_id}
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-emerald-500/20 text-[10px] text-emerald-300">
                        {getInitials(row.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">{row.name}</p>
                      <p className="truncate text-[10px] text-gray-500">{row.email || ''}</p>
                    </div>
                  </div>
                  {row.status ? (
                    <AttendanceStatusBadge status={row.status} />
                  ) : (
                    <span className="text-[10px] text-gray-500">Not marked</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm text-white">Upcoming Matches</CardTitle>
              <CardDescription>Fixtures involving your teams</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go('scheduling')}
              className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              Schedule <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/5" />
              ))
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming matches"
                description="Matches you schedule for your teams appear here."
              />
            ) : (
              upcoming.slice(0, 5).map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {match.home_team_details?.name || 'Home'} vs {match.away_team_details?.name || 'Away'}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">
                      <MapPin className="mr-1 inline h-2.5 w-2.5" />
                      {match.venue || 'No venue'} · {formatDateTime(match.match_date)}
                    </p>
                  </div>
                  <MatchStatusBadge status={match.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reports + teams */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm text-white">Recent Reports</CardTitle>
              <CardDescription>Latest player performance notes</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go('reports')}
              className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              All Reports <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/5" />
              ))
            ) : recentReports.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Create your first player performance report."
              />
            ) : (
              recentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {reportStudentName(report)}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">
                      {formatDate(report?.report_date || report?.created_at || report?.date)}
                    </p>
                  </div>
                  {report.rating != null && report.rating !== '' ? (
                    <Badge className="shrink-0 border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <Star className="mr-1 h-3 w-3" />
                      {report.rating}
                    </Badge>
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-gray-600" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm text-white">My Teams</CardTitle>
              <CardDescription>Teams assigned to you</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go('scheduling')}
              className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
            >
              Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl bg-white/5" />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No teams assigned yet"
                description="Admins assign teams to you — they will show up here."
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {teams.slice(0, 6).map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/30 bg-white/[0.02] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">{team.name}</p>
                      <p className="truncate text-[10px] text-gray-500">
                        {team.description || 'Academy squad'}
                      </p>
                    </div>
                    {team.short_code && (
                      <Badge className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        {team.short_code}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <CoachLayout
      session={{
        email: session?.email || user?.email || '',
        displayName,
      }}
      onLogout={handleLogout}
    >
      {renderSection()}
    </CoachLayout>
  )
}



