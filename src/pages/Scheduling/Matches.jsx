import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  CalendarDays,
  CalendarClock,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tally3,
  Trash2,
  Trophy,
  XCircle,
  Shirt,
  MapPin,
  Clock3,
  AlertTriangle,
} from 'lucide-react'

import MatchForm from './MatchForm'
import MatchActionDialog from './MatchActionModals'
import MatchStatusBadge, { MATCH_STATUS_OPTIONS } from './MatchStatusBadge'
import {
  listTeams,
  listMatches,
  listUpcomingMatches,
  listTodayMatches,
  listResults,
  createMatch,
  updateMatch,
  deleteMatch,
  rescheduleMatch,
  postponeMatch,
  cancelMatch,
  completeMatch,
  formatDateTime,
} from '@/services/schedulingService'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 20

function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="truncate text-lg font-semibold leading-tight text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getWinnerInfo(match) {
  const result = match?.result
  if (!result) return null
  if (result.winner === 'home') return { text: 'Home Win', tone: 'text-blue-400' }
  if (result.winner === 'away') return { text: 'Away Win', tone: 'text-purple-400' }
  return { text: 'Draw', tone: 'text-gray-400' }
}

function MatchCard({ match, isAdmin, onView, onAction }) {
  const actions = getAvailableActions(match, isAdmin)
  const winner = getWinnerInfo(match)
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-white leading-tight">
              {match.home_team_details?.name || 'Home'} vs {match.away_team_details?.name || 'Away'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              <MapPin className="h-3 w-3 inline mr-1" />
              {match.venue || 'No venue'}
            </p>
          </div>
          <MatchStatusBadge status={match.status} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            <Clock3 className="h-3.5 w-3.5 inline mr-1" />
            {formatDateTime(match.match_date)}
          </span>
          {match.status === 'completed' && match.result && (
            <span className={cn('font-bold', winner?.tone)}>
              {match.result.home_score} - {match.result.away_score} ({winner?.text})
            </span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border/50 text-gray-300"
            onClick={() => onView(match)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          {actions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-border/50 text-gray-300"
              onClick={() => onAction(match, actions[0].action)}
            >
              {actions[0].icon}
              {actions[0].label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Which actions are allowed for a given match status (admin only).
function getAvailableActions(match, isAdmin) {
  if (!isAdmin) return []
  const status = match?.status
  const actions = []
  if (status === 'scheduled' || status === 'postponed') {
    actions.push({
      label: 'Reschedule',
      action: 'reschedule',
      icon: <CalendarClock className="h-4 w-4 mr-2" />,
      disabled: false,
    })
    actions.push({
      label: 'Postpone',
      action: 'postpone',
      icon: <CalendarX2 className="h-4 w-4 mr-2" />,
      disabled: false,
    })
    actions.push({
      label: 'Complete',
      action: 'complete',
      icon: <Trophy className="h-4 w-4 mr-2" />,
      disabled: false,
    })
    actions.push({
      label: 'Cancel',
      action: 'cancel',
      icon: <XCircle className="h-4 w-4 mr-2" />,
      disabled: false,
    })
  }
  return actions
}

export default function Matches({ isAdmin = false }) {
  // ------------------------- State -------------------------
  const [activeTab, setActiveTab] = useState('all')

  // Matches
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Teams (for filter + display)
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  // Dialogs
  const [submitting, setSubmitting] = useState(false)
  const [detailMatch, setDetailMatch] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteMatchRow, setDeleteMatchRow] = useState(null)

  // Action dialog

  const loadMatches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let response
      const params = { page, page_size: ITEMS_PER_PAGE }
      if (activeTab === 'all') {
        if (debouncedSearch) params.search = debouncedSearch
        if (statusFilter) params.status = statusFilter
        if (teamFilter) params.team = teamFilter
        if (dateFilter) params.date = dateFilter
        response = await listMatches(params)
      } else if (activeTab === 'upcoming') {
        response = await listUpcomingMatches(params)
      } else if (activeTab === 'today') {
        response = await listTodayMatches(params)
      } else if (activeTab === 'results') {
        response = await listResults(params)
      }
      if (response?.success) {
        setMatches(response.data?.results || [])
        setCount(response.data?.count ?? 0)
      } else {
        setMatches([])
        setCount(0)
        setError(response?.message || 'Failed to load matches')
      }
    } catch (err) {
      setMatches([])
      setCount(0)
      setError(err.response?.data?.message || 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, debouncedSearch, statusFilter, teamFilter, dateFilter])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])


  const openAction = (match, action) => {
    setActionMatch(match)
    setActionType(action)
    setActionOpen(true)
  }

  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createMatch(payload)
      if (response?.success) {
        toast.success(response.message || 'Match created successfully.')
        setCreateDialogOpen(false)
        await loadMatches()
      } else {
        const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null
        toast.error(firstError || response?.message || 'Failed to create match')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(firstError || data?.message || 'Failed to create match')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!selectedMatch) return
    setSubmitting(true)
    try {
      const response = await updateMatch(selectedMatch.id, payload)
      if (response?.success) {
        toast.success(response.message || 'Match updated successfully.')
        setEditDialogOpen(false)
        setSelectedMatch(null)
        await loadMatches()
      } else {
        const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null
        toast.error(firstError || response?.message || 'Failed to update match')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(firstError || data?.message || 'Failed to update match')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (action, payload) => {
    if (!actionMatch) return
    setSubmitting(true)
    try {
      const id = actionMatch.id
      let response
      if (action === 'reschedule') response = await rescheduleMatch(id, payload)
      else if (action === 'postpone') response = await postponeMatch(id, payload)
      else if (action === 'cancel') response = await cancelMatch(id, payload)
      else if (action === 'complete') response = await completeMatch(id, payload)

      if (response?.success) {
        toast.success(response.message || 'Match updated.')
        setActionOpen(false)
        setActionMatch(null)
        await loadMatches()
      } else {
        const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null
        toast.error(
          typeof firstError === 'string'
            ? firstError
            : JSON.stringify(firstError) || response?.message || 'Action failed'
        )
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(
        typeof firstError === 'string'
          ? firstError
          : (data?.message) || 'Action failed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteMatchRow) return
    setSubmitting(true)
    try {
      const response = await deleteMatch(deleteMatchRow.id)
      if (response?.success) {
        toast.success(response.message || 'Match deleted successfully.')
        setDeleteDialogOpen(false)
        setDeleteMatchRow(null)
        await loadMatches()
      } else {
        const firstError = response?.errors ? Object.values(response.errors).flat()[0] : null
        toast.error(typeof firstError === 'string' ? firstError : response?.message || 'Failed to delete match')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(typeof firstError === 'string' ? firstError : data?.message || 'Failed to delete match')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset to first page when tab or filters change
  useEffect(() => {
    setPage(1)
  }, [activeTab, statusFilter, teamFilter, dateFilter, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE))

  // Derived stats over the current tab's loaded matches
  const stats = useMemo(() => {
    const t = todayString()
    const s = { total: 0, scheduled: 0, completed: 0, today: 0 }
    matches.forEach((m) => {
      s.total += 1
      if (m.status === 'scheduled') s.scheduled += 1
      if (m.status === 'completed') s.completed += 1
      if (m.match_date && m.match_date.slice(0, 10) === t) s.today += 1
    })
    return s
  }, [matches])

  const [actionOpen, setActionOpen] = useState(false)
  const [actionMatch, setActionMatch] = useState(null)
  const [actionType, setActionType] = useState('reschedule')

  // Clean up unused isAdmin from any read path
  const canManage = isAdmin

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load teams once for the filter dropdown
  useEffect(() => {
    ;(async () => {
      setTeamsLoading(true)
      try {
        const response = await listTeams({ page: 1, page_size: 200 })
        if (response?.success) {
          setTeams(response.data?.results || [])
        } else {
          setTeams([])
        }
      } catch {
        setTeams([])
      } finally {
        setTeamsLoading(false)
      }
    })()
  }, [])

const filtersAreActive = activeTab === 'all'

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-400" />
              Match Scheduling
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Schedule matches, reschedule or cancel fixtures, and enter final results.
            </p>
          </div>
          {canManage && (
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Match
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Shirt} label="Total Matches" value={stats.total} accent="bg-blue-500/10 text-blue-400" />
          <StatCard icon={CalendarClock} label="Scheduled" value={stats.scheduled} accent="bg-sky-500/10 text-sky-400" />
          <StatCard icon={Trophy} label="Completed" value={stats.completed} accent="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={CalendarDays} label="Today" value={stats.today} accent="bg-amber-500/10 text-amber-400" />
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab}>
            {/* Filter panel — only meaningful for the All tab */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search matches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!filtersAreActive}
                  className="pl-9 bg-white/5 border-border/50 text-white placeholder:text-gray-500"
                />
              </div>
              <Select
                value={statusFilter || '__all__'}
                onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}
                disabled={!filtersAreActive}
              >
                <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={teamFilter ? String(teamFilter) : '__all__'}
                onValueChange={(v) => setTeamFilter(v === '__all__' ? '' : Number(v))}
                disabled={!filtersAreActive}
              >
                <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
                  <SelectValue placeholder={teamsLoading ? 'Loading teams...' : 'All Teams'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                disabled={!filtersAreActive}
                className="bg-white/5 border-border/50 text-white h-10 [color-scheme:dark]"
              />
            </div>
            {!filtersAreActive && (
              <p className="text-xs text-gray-500 mt-2">
                Filters apply to the All matches tab.
              </p>
            )}
            {/* Match table (desktop) */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl hidden md:block mt-4">
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full bg-white/5" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-gray-400">Match</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-gray-400">Date &amp; Time</TableHead>
                        <TableHead className="text-gray-400 hidden lg:table-cell">Venue</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        {canManage && (
                          <TableHead className="text-gray-400 text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={canManage ? 6 : 5}
                            className="h-28 text-center text-gray-500"
                          >
                            No matches found for this view.
                          </TableCell>
                        </TableRow>
                      ) : (
                        matches.map((match) => {
                          const winner = getWinnerInfo(match)
                          const actions = getAvailableActions(match, canManage)
                          return (
                            <TableRow key={match.id} className="border-border/40">
                              <TableCell>
                                <div className="text-sm font-medium text-white">
                                  {match.home_team_details?.name || 'Home'}
                                  <span className="text-gray-500 mx-1.5">vs</span>
                                  {match.away_team_details?.name || 'Away'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {match.status === 'completed' && match.result ? (
                                  <span className={cn('font-bold text-sm', winner?.tone)}>
                                    {match.result.home_score} - {match.result.away_score}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                <span className="flex items-center gap-1.5">
                                  <Clock3 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  {formatDateTime(match.match_date)}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-400 hidden lg:table-cell">
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  {match.venue || '—'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <MatchStatusBadge status={match.status} />
                              </TableCell>

                              {canManage && (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-white">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-popover border-border/50">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setDetailMatch(match)
                                          setDetailOpen(true)
                                        }}
                                        className="text-gray-300 cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View
                                      </DropdownMenuItem>
                                      {actions.length > 0 && <DropdownMenuSeparator className="bg-border/40" />}
                                      {actions.map((a) => (
                                        <DropdownMenuItem
                                          key={a.action}
                                          onClick={() => openAction(match, a.action)}
                                          className="text-gray-300 cursor-pointer"
                                        >
                                          {a.icon}
                                          {a.label}
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuSeparator className="bg-border/40" />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedMatch(match)
                                          setEditDialogOpen(true)
                                        }}
                                        className="text-gray-300 cursor-pointer"
                                      >
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setDeleteMatchRow(match)
                                          setDeleteDialogOpen(true)
                                        }}
                                        className="text-red-400 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Match cards (mobile) */}
            <div className="md:hidden mt-4 space-y-3">
              {loading ? (
                <Skeleton className="h-36 w-full bg-white/5" />
              ) : (
                matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isAdmin={canManage}
                    onView={(m) => {
                      setDetailMatch(m)
                      setDetailOpen(true)
                    }}
                    onAction={openAction}
                  />
                ))
              )}
              {!loading && matches.length === 0 && (
                <p className="text-center text-gray-500 py-8">No matches found for this view.</p>
              )}
            </div>



            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
                <span>
                  Page {page} of {totalPages} ({count} match{count === 1 ? '' : 'es'})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="border-border/50 text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="border-border/50 text-gray-300"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Match Dialog */}
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="sm:max-w-lg bg-popover border-border/50">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Schedule Match
                </DialogTitle>
                <DialogDescription>
                  Create a new scheduled match between two different teams.
                </DialogDescription>
              </DialogHeader>
              <MatchForm
                onSubmit={handleCreate}
                onCancel={() => setCreateDialogOpen(false)}
                loading={submitting}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Match Dialog */}
        {canManage && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-lg bg-popover border-border/50">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-400" />
                  Edit Match
                </DialogTitle>
                <DialogDescription>
                  Update match teams, date/time, venue, and notes.
                </DialogDescription>
              </DialogHeader>
              {selectedMatch && (
                <MatchForm
                  initialData={selectedMatch}
                  onSubmit={handleEdit}
                  onCancel={() => {
                    setEditDialogOpen(false)
                    setSelectedMatch(null)
                  }}
                  loading={submitting}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Match Action Dialog */}
        <MatchActionDialog
          open={actionOpen}
          match={actionMatch}
          action={actionType}
          submitting={submitting}
          onClose={() => {
            setActionOpen(false)
            setActionMatch(null)
          }}
          onSubmit={handleAction}
        />

        {/* Match Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg bg-popover border-border/50 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Match Details
              </DialogTitle>
            </DialogHeader>
            {detailMatch && (
              <div className="space-y-4">
                {/* Teams + status */}
                <div className="rounded-lg border border-border/50 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-base font-semibold text-white">
                      {detailMatch.home_team_details?.name || 'Home'}
                      <span className="text-gray-500 mx-2">vs</span>
                      {detailMatch.away_team_details?.name || 'Away'}
                    </div>
                    <MatchStatusBadge status={detailMatch.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-400">
                    <p>
                      <Clock3 className="h-3.5 w-3.5 inline mr-1.5 text-gray-500" />
                      {formatDateTime(detailMatch.match_date)}
                    </p>
                    <p>
                      <MapPin className="h-3.5 w-3.5 inline mr-1.5 text-gray-500" />
                      {detailMatch.venue || '—'}
                    </p>
                  </div>
                  {detailMatch.notes && (
                    <p className="mt-2 text-sm text-gray-400 border-t border-border/40 pt-2">
                      {detailMatch.notes}
                    </p>
                  )}
                </div>

                {/* Result */}
                {detailMatch.status === 'completed' && detailMatch.result && (
                  <div className="rounded-lg border border-border/50 bg-white/5 p-4">
                    <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                      <Tally3 className="h-4 w-4" />
                      Final Result
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-white">
                        {detailMatch.result.home_score}
                        <span className="text-gray-500 mx-2">-</span>
                        {detailMatch.result.away_score}
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
                        {detailMatch.result.winner_display || detailMatch.result.winner || 'Draw'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Duration: {detailMatch.result.duration_minutes} minutes
                    </p>
                  </div>
                )}

                {/* Events */}
                {detailMatch.events?.length > 0 && (
                  <div className="rounded-lg border border-border/50 bg-white/5 p-4">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-2">
                      <ListChecks className="h-4 w-4 text-gray-400" />
                      Goal Events ({detailMatch.events.length})
                    </h3>
                    <div className="space-y-2">
                      {detailMatch.events.map((ev) => {
                        const isHome = ev.team === detailMatch.home_team
                        return (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between rounded bg-white/5 px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-semibold text-white">
                                {ev.scorer_name || ev.scorer_details?.full_name || 'Unknown'}
                              </span>
                              <span className="text-gray-500">
                                {' '}
                                ({isHome ? detailMatch.home_team_details?.name : detailMatch.away_team_details?.name})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-300 font-medium">{ev.minute}'</span>
                              {ev.assist_name || ev.assist_details?.full_name ? (
                                <p className="text-xs text-gray-500">
                                  assist: {ev.assist_name || ev.assist_details?.full_name}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpen(false)
                  setDetailMatch(null)
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        {canManage && (
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <AlertTriangle className="text-destructive" />
                </AlertDialogMedia>
                <AlertDialogTitle className="text-white">Delete Match</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this match? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteMatchRow(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}

