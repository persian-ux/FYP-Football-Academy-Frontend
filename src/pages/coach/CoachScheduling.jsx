import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  CalendarDays,
  CalendarClock,
  CalendarX2,
  Info,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import MatchForm from '@/pages/Scheduling/MatchForm'
import MatchActionDialog from '@/pages/Scheduling/MatchActionModals'
import MatchStatusBadge, { MATCH_STATUS_OPTIONS } from '@/pages/Scheduling/MatchStatusBadge'
import {
  listTeams,
  patchTeam,
  listMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  rescheduleMatch,
  postponeMatch,
  cancelMatch,
  completeMatch,
  formatDateTime,
} from '@/services/schedulingService'
import { extractApiError, envelopeError } from '@/services/coachService'
import { SectionHeader, EmptyState, ErrorState, TableSkeleton } from './coachShared'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

/** Actions dropdown for a match row. Lifecycle actions only for live matches. */
function MatchActionsMenu({ match, onEdit, onAction, onDelete }) {
  const actionable = ['scheduled', 'postponed'].includes(String(match.status || '').toLowerCase())
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Match actions"
          className="border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-border/50 bg-[#11161d] text-white">
        {actionable && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {actionable && (
          <>
            <DropdownMenuItem onClick={() => onAction('reschedule')}>
              <CalendarClock className="mr-2 h-4 w-4" /> Reschedule
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('postpone')}>
              <CalendarX2 className="mr-2 h-4 w-4" /> Postpone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('cancel')}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel Match
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('complete')}>
              <Trophy className="mr-2 h-4 w-4" /> Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300">
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


/** Team actions are coach-managed; creation/deletion stay admin-only. */
export default function CoachScheduling({ onDataChanged = () => {} }) {
  const [activeTab, setActiveTab] = useState('matches')

  // ------------------------- Teams -------------------------
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [teamsError, setTeamsError] = useState('')
  const [editTeam, setEditTeam] = useState(null) // team being edited
  const [teamForm, setTeamForm] = useState({ name: '', short_code: '', description: '' })
  const [teamErrors, setTeamErrors] = useState({})
  const [savingTeam, setSavingTeam] = useState(false)

  // ------------------------- Matches -------------------------
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [matchPage, setMatchPage] = useState(1)
  const [teamFilter, setTeamFilter] = useState('__all')
  const [statusFilter, setStatusFilter] = useState('__all')
  const [dateFilter, setDateFilter] = useState('')

  // Match dialogs
  const [matchDialogOpen, setMatchDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null) // null => create
  const [submittingMatch, setSubmittingMatch] = useState(false)
  const [, setMatchFormErrors] = useState({})

  const [actionDialog, setActionDialog] = useState({ open: false, action: 'reschedule', match: null })
  const [submittingAction, setSubmittingAction] = useState(false)

  const [deleteMatchTarget, setDeleteMatchTarget] = useState(null)
  const [deletingMatch, setDeletingMatch] = useState(false)

  const totalPages = Math.max(1, Math.ceil(matchCount / PAGE_SIZE))

  // ------------------------- Data loading -------------------------
  const loadTeams = useCallback(async () => {
    setTeamsLoading(true)
    setTeamsError('')
    try {
      const response = await listTeams({ page: 1, page_size: 200 })
      if (response?.success) {
        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : []
        setTeams(results)
      } else {
        setTeamsError(envelopeError(response, 'Failed to load teams'))
      }
    } catch (err) {
      setTeamsError(extractApiError(err, 'Failed to load teams'))
    } finally {
      setTeamsLoading(false)
    }
  }, [])

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true)
    setMatchesError('')
    try {
      const params = { page: matchPage, page_size: PAGE_SIZE }
      if (teamFilter !== '__all') params.team = teamFilter
      if (statusFilter !== '__all') params.status = statusFilter
      if (dateFilter) params.date = dateFilter
      const response = await listMatches(params)
      if (response?.success) {
        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : []
        setMatches(results)
        setMatchCount(response.data?.count ?? results.length)
      } else {
        setMatchesError(envelopeError(response, 'Failed to load matches'))
      }
    } catch (err) {
      setMatchesError(extractApiError(err, 'Failed to load matches'))
    } finally {
      setMatchesLoading(false)
    }
  }, [matchPage, teamFilter, statusFilter, dateFilter])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const refreshAll = useCallback(() => {
    loadTeams()
    loadMatches()
    onDataChanged()
  }, [loadTeams, loadMatches, onDataChanged])

  // ------------------------- Handlers: teams -------------------------
  const openTeamEdit = (team) => {
    setEditTeam(team)
    setTeamForm({
      name: team.name || '',
      short_code: team.short_code || '',
      description: team.description || '',
    })
    setTeamErrors({})
  }

  const handleTeamSave = async () => {
    if (!editTeam) return
    const errors = {}
    if (!teamForm.name.trim()) errors.name = 'Team name is required'
    setTeamErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSavingTeam(true)
    try {
      const response = await patchTeam(editTeam.id, {
        name: teamForm.name.trim(),
        short_code: teamForm.short_code.trim() || null,
        description: teamForm.description.trim() || null,
        coach: editTeam.coach,
      })
      if (response?.success) {
        toast.success(response?.message || 'Team updated')
        setEditTeam(null)
        refreshAll()
      } else {
        setTeamErrors(response?.errors || {})
        toast.error(envelopeError(response, 'Failed to update team'))
      }
    } catch (err) {
      setTeamErrors(err?.response?.data?.errors || {})
      toast.error(extractApiError(err, 'Failed to update team'))
    } finally {
      setSavingTeam(false)
    }
  }

  // ------------------------- Handlers: matches -------------------------
  const openMatchCreate = () => {
    setEditingMatch(null)
    setMatchFormErrors({})
    setMatchDialogOpen(true)
  }

  const openMatchEdit = (match) => {
    setEditingMatch(match)
    setMatchFormErrors({})
    setMatchDialogOpen(true)
  }

  const handleMatchSubmit = async (payload) => {
    setSubmittingMatch(true)
    setMatchFormErrors({})
    try {
      const response = editingMatch
        ? await updateMatch(editingMatch.id, payload)
        : await createMatch(payload)
      if (response?.success) {
        toast.success(response?.message || (editingMatch ? 'Match updated' : 'Match created'))
        setMatchDialogOpen(false)
        refreshAll()
      } else {
        setMatchFormErrors(response?.errors || {})
        toast.error(envelopeError(response, editingMatch ? 'Failed to update match' : 'Failed to create match'))
      }
    } catch (err) {
      setMatchFormErrors(err?.response?.data?.errors || {})
      toast.error(extractApiError(err, editingMatch ? 'Failed to update match' : 'Failed to create match'))
    } finally {
      setSubmittingMatch(false)
    }
  }

  const handleActionSubmit = async (action, payload) => {
    const match = actionDialog.match
    if (!match) return
    setSubmittingAction(true)
    try {
      const fn =
        action === 'reschedule'
          ? rescheduleMatch
          : action === 'postpone'
            ? postponeMatch
            : action === 'cancel'
              ? cancelMatch
              : completeMatch
      const response = await fn(match.id, payload)
      if (response?.success) {
        toast.success(response?.message || `Match ${action}d successfully`)
        setActionDialog({ open: false, action: 'reschedule', match: null })
        refreshAll()
      } else {
        toast.error(envelopeError(response, `Failed to ${action} match`))
      }
    } catch (err) {
      toast.error(extractApiError(err, `Failed to ${action} match`))
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleMatchDelete = async () => {
    if (!deleteMatchTarget) return
    setDeletingMatch(true)
    try {
      const response = await deleteMatch(deleteMatchTarget.id)
      if (response?.success) {
        toast.success(response?.message || 'Match deleted')
        setDeleteMatchTarget(null)
        refreshAll()
      } else {
        toast.error(envelopeError(response, 'Failed to delete match'))
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete match'))
    } finally {
      setDeletingMatch(false)
    }
  }

  const matchLabel = (match) =>
    `${match.home_team_details?.name || match.home_team_name || 'Home'} vs ${
      match.away_team_details?.name || match.away_team_name || 'Away'
    }`

  const canAct = (match) => ['scheduled', 'postponed'].includes(String(match.status || '').toLowerCase())

  // ------------------------- Render -------------------------
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        title="Teams & Matches"
        description="Manage your assigned teams and schedule matches for them"
        icon={CalendarDays}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={teamsLoading || matchesLoading}
              className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw
                className={cn('mr-2 h-4 w-4', (teamsLoading || matchesLoading) && 'animate-spin')}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openMatchCreate}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" />
              Schedule Match
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="matches" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Shield className="h-4 w-4" />
            My Teams
          </TabsTrigger>
        </TabsList>

        {/* ============================= MATCHES ============================= */}
        <TabsContent value="matches" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Team</Label>
              <Select
                value={teamFilter}
                onValueChange={(value) => {
                  setMatchPage(1)
                  setTeamFilter(value)
                }}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All My Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setMatchPage(1)
                  setStatusFilter(value)
                }}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value || '__all'} value={s.value || '__all'}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="match-date-filter" className="text-gray-300">
                Date
              </Label>
              <Input
                id="match-date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setMatchPage(1)
                  setDateFilter(e.target.value)
                }}
                className="h-10 w-full border-border/50 bg-white/5 text-white [color-scheme:dark] sm:w-44"
              />
            </div>
          </div>

          {matchesError && <ErrorState message={matchesError} onRetry={loadMatches} />}

          {matchesLoading ? (
            <TableSkeleton rows={4} />
          ) : matches.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No matches found"
              description="Schedule a match for one of your assigned teams to get started."
              action={
                <Button
                  size="sm"
                  onClick={openMatchCreate}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Schedule Match
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden border-border/40 bg-card/40 backdrop-blur-xl md:block">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-gray-400">Match</TableHead>
                        <TableHead className="text-gray-400">Date &amp; Time</TableHead>
                        <TableHead className="text-gray-400">Venue</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-right text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>

                      {matches.map((match) => (
                        <TableRow key={match.id} className="border-border/40">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {match.home_team_details?.name || 'Home'}
                              </span>
                              <span className="text-xs text-gray-500">vs</span>
                              <span className="text-sm font-medium text-white">
                                {match.away_team_details?.name || 'Away'}
                              </span>
                            </div>
                            {match.notes && (
                              <p className="mt-0.5 max-w-56 truncate text-xs text-gray-500">{match.notes}</p>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-gray-300">
                            {formatDateTime(match.match_date)}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-sm text-gray-300">
                            <MapPin className="mr-1 inline h-3.5 w-3.5 text-gray-500" />
                            {match.venue || '—'}
                          </TableCell>
                          <TableCell>
                            <MatchStatusBadge status={match.status} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-300">
                            {match.status === 'completed' || match.result
                              ? `${match.result?.home_score ?? match.home_score ?? 0} : ${
                                  match.result?.away_score ?? match.away_score ?? 0
                                }`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <MatchActionsMenu
                              match={match}
                              onEdit={() => openMatchEdit(match)}
                              onAction={(action) => setActionDialog({ open: true, action, match })}
                              onDelete={() =>
                                setDeleteMatchTarget({ id: match.id, name: matchLabel(match) })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile cards */}
              <div className="flex flex-col gap-2 md:hidden">
                {matches.map((match) => (
                  <div key={match.id} className="rounded-xl border border-border/40 bg-white/[0.02] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {match.home_team_details?.name || 'Home'} vs {match.away_team_details?.name || 'Away'}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {match.venue || 'No venue'} · {formatDateTime(match.match_date)}
                        </p>
                      </div>
                      <MatchStatusBadge status={match.status} />
                    </div>
                    {(match.status === 'completed' || match.result) && (
                      <p className="mt-2 text-xs text-gray-400">
                        Final score:{' '}
                        <span className="font-semibold text-white">
                          {match.result?.home_score ?? match.home_score ?? 0} :{' '}
                          {match.result?.away_score ?? match.away_score ?? 0}
                        </span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {canAct(match) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMatchEdit(match)}
                          className="border-border/50 text-gray-300"
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                      )}
                      <MatchActionsMenu
                        match={match}
                        onEdit={() => openMatchEdit(match)}
                        onAction={(action) => setActionDialog({ open: true, action, match })}
                        onDelete={() => setDeleteMatchTarget({ id: match.id, name: matchLabel(match) })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {matchPage} of {totalPages} · {matchCount} match(es)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={matchPage <= 1 || matchesLoading}
                  onClick={() => setMatchPage((p) => Math.max(1, p - 1))}
                  className="border-border/50 text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={matchPage >= totalPages || matchesLoading}
                  onClick={() => setMatchPage((p) => Math.min(totalPages, p + 1))}
                  className="border-border/50 text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ============================= TEAMS ============================= */}
        <TabsContent value="teams" className="mt-4 flex flex-col gap-4">
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-sm text-blue-200">
              Team creation and deletion are handled by academy admins. You can update the details
              of teams assigned to you.
            </AlertDescription>
          </Alert>

          {teamsError && <ErrorState message={teamsError} onRetry={loadTeams} />}

          {teamsLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No teams assigned to you yet"
              description="Once an admin assigns teams to you, they will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="border-border/40 bg-card/40 backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{team.name}</p>
                        <p className="text-xs text-gray-500">
                          Coach: {team.coach_name || team.coach_details?.full_name || '—'}
                        </p>
                      </div>
                      {team.short_code && (
                        <Badge className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          {team.short_code}
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 min-h-8 text-xs text-gray-400">
                      {team.description || 'No description'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTeamEdit(team)}
                      className="mt-auto w-full border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Team
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================= DIALOGS ============================= */}
      {/* Edit team */}
      <Dialog open={!!editTeam} onOpenChange={(open) => !open && setEditTeam(null)}>
        <DialogContent className="border-border/50 bg-[#11161d] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details of {editTeam?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name" className="text-gray-300">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="team-name"
                value={teamForm.name}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. U15 Team"
                className="h-10 border-border/50 bg-white/5 text-white placeholder:text-gray-500"
              />
              {teamErrors.name && <p className="text-xs text-red-400">{teamErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-code" className="text-gray-300">
                Short Code
              </Label>
              <Input
                id="team-code"
                value={teamForm.short_code}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, short_code: e.target.value }))}
                placeholder="e.g. U15"
                className="h-10 border-border/50 bg-white/5 text-white placeholder:text-gray-500"
              />
              {teamErrors.short_code && (
                <p className="text-xs text-red-400">{teamErrors.short_code}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description" className="text-gray-300">
                Description
              </Label>
              <Textarea
                id="team-description"
                value={teamForm.description}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="e.g. Under 15 squad"
                className="min-h-20 border-border/50 bg-white/5 text-white placeholder:text-gray-500"
              />
              {teamErrors.description && (
                <p className="text-xs text-red-400">{teamErrors.description}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeam(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleTeamSave}
              disabled={savingTeam}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400"
            >
              {savingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / edit match */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-[#11161d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMatch ? 'Edit Match' : 'Schedule Match'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingMatch
                ? 'Update the details of this match.'
                : 'Create a new match between your assigned teams.'}
            </DialogDescription>
          </DialogHeader>
          <MatchForm
            initialData={editingMatch}
            loading={submittingMatch}
            onSubmit={handleMatchSubmit}
            onCancel={() => setMatchDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Match lifecycle actions */}
      <MatchActionDialog
        open={actionDialog.open}
        match={actionDialog.match}
        action={actionDialog.action}
        submitting={submittingAction}
        onClose={() => setActionDialog({ open: false, action: 'reschedule', match: null })}
        onSubmit={handleActionSubmit}
      />

      {/* Delete match confirmation */}
      <AlertDialog
        open={!!deleteMatchTarget}
        onOpenChange={(open) => !open && setDeleteMatchTarget(null)}
      >
        <AlertDialogContent className="border-border/50 bg-[#11161d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete match?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently remove the match {deleteMatchTarget?.name}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleMatchDelete()
              }}
              disabled={deletingMatch}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deletingMatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}









