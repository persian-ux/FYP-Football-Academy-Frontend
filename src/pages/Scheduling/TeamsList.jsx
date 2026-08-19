import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
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
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Loader2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import TeamForm from './TeamForm'
import { listTeams, createTeam, updateTeam, deleteTeam } from '@/services/schedulingService'
import { isAdminUser } from '@/lib/admin'
import { useSelector } from 'react-redux'

const ITEMS_PER_PAGE = 20

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getCoachName(team) {
  if (!team.coach_details) return '—'
  return (
    `${team.coach_details.first_name || ''} ${team.coach_details.last_name || ''}`.trim() ||
    team.coach_details.full_name ||
    team.coach_details.email ||
    '—'
  )
}

function TeamCard({ team, onEdit, onDelete }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-white font-semibold">{team.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {team.short_code ? (
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5 mr-2">
                  {team.short_code}
                </span>
              ) : null}
              Coach: {getCoachName(team)}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-gray-400 hover:text-blue-400"
              onClick={() => onEdit(team)}
              aria-label="Edit team"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-gray-400 hover:text-red-400"
              onClick={() => onDelete(team)}
              aria-label="Delete team"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {team.description ? (
          <p className="text-sm text-gray-400 line-clamp-2">{team.description}</p>
        ) : (
          <p className="text-sm text-gray-600 italic">No description</p>
        )}
        <p className="text-xs text-gray-500 mt-2">Created {formatDate(team.created_at)}</p>
      </CardContent>
    </Card>
  )
}

export default function TeamsList() {
  const user = useSelector((state) => state.auth.user)
  const isAdmin = isAdminUser(user)

  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTeamRow, setDeleteTeamRow] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadTeams = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, page_size: ITEMS_PER_PAGE }
      if (debouncedSearch) params.search = debouncedSearch
      const response = await listTeams(params)
      if (response?.success) {
        setTeams(response.data?.results || [])
        setCount(response.data?.count ?? 0)
      } else {
        setError(response?.message || 'Failed to load teams')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  const totalPages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE))

  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createTeam(payload)
      if (response?.success) {
        toast.success(response.message || 'Team created successfully.')
        setCreateDialogOpen(false)
        setPage(1)
        await loadTeams()
      } else {
        const firstError = response?.errors
          ? Object.values(response.errors).flat()[0]
          : null
        toast.error(firstError || response?.message || 'Failed to create team')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(firstError || data?.message || 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    setSubmitting(true)
    try {
      const response = await updateTeam(selectedTeam.id, payload)
      if (response?.success) {
        toast.success(response.message || 'Team updated successfully.')
        setEditDialogOpen(false)
        setSelectedTeam(null)
        await loadTeams()
      } else {
        const firstError = response?.errors
          ? Object.values(response.errors).flat()[0]
          : null
        toast.error(firstError || response?.message || 'Failed to update team')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(firstError || data?.message || 'Failed to update team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTeamRow) return
    setSubmitting(true)
    try {
      const response = await deleteTeam(deleteTeamRow.id)
      if (response?.success) {
        toast.success(response.message || 'Team deleted successfully.')
        setDeleteDialogOpen(false)
        setDeleteTeamRow(null)
        await loadTeams()
      } else {
        toast.error(response?.message || 'Failed to delete team')
      }
    } catch (err) {
      const data = err.response?.data
      const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null
      toast.error(firstError || data?.message || 'Failed to delete team')
    } finally {
      setSubmitting(false)
    }
  }

  const renderTable = (
    <Table>
      <TableHeader>
        <TableRow className="border-border/40 hover:bg-transparent">
          <TableHead className="text-gray-400">Team</TableHead>
          <TableHead className="text-gray-400">Short Code</TableHead>
          <TableHead className="text-gray-400">Coach</TableHead>
          <TableHead className="text-gray-400 hidden md:table-cell">Description</TableHead>
          <TableHead className="text-gray-400">Created</TableHead>
          {isAdmin && <TableHead className="text-gray-400 text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-gray-500">
              {searchQuery ? 'No teams match your search.' : 'No teams created yet.'}
            </TableCell>
          </TableRow>
        ) : (
          teams.map((team) => (
            <TableRow key={team.id} className="border-border/40">
              <TableCell className="font-medium text-white">{team.name}</TableCell>
              <TableCell>
                {team.short_code ? (
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5 text-xs">
                    {team.short_code}
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </TableCell>
              <TableCell className="text-gray-300">{getCoachName(team)}</TableCell>
              <TableCell className="text-gray-400 hidden md:table-cell max-w-[240px] truncate">
                {team.description || '—'}
              </TableCell>
              <TableCell className="text-gray-400">{formatDate(team.created_at)}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-400 hover:text-blue-400"
                      onClick={() => {
                        setSelectedTeam(team)
                        setEditDialogOpen(true)
                      }}
                      aria-label="Edit team"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => {
                        setDeleteTeamRow(team)
                        setDeleteDialogOpen(true)
                      }}
                      aria-label="Delete team"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              Teams
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage academy teams that participate in scheduled matches.
            </p>
          </div>
          {isAdmin && (
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search teams by name, code, coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-border/50 text-white placeholder:text-gray-500"
          />
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Table (desktop) */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl hidden md:block">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : (
              renderTable
            )}
          </CardContent>
        </Card>

        {/* Cards (mobile) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full bg-white/5" />
          ) : (
            teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={(t) => {
                  if (!isAdmin) return
                  setSelectedTeam(t)
                  setEditDialogOpen(true)
                }}
                onDelete={(t) => {
                  if (!isAdmin) return
                  setDeleteTeamRow(t)
                  setDeleteDialogOpen(true)
                }}
              />
            ))
          )}
          {!loading && teams.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No teams match your search.' : 'No teams created yet.'}
            </p>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing page {page} of {totalPages} ({count} team{count === 1 ? '' : 's'})
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

        {/* Create Team Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-popover border-border/50">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Add Team
              </DialogTitle>
              <DialogDescription>
                Create a new team. The coach must have the coach role.
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              onSubmit={handleCreate}
              onCancel={() => setCreateDialogOpen(false)}
              loading={submitting}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg bg-popover border-border/50">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />
                Edit Team
              </DialogTitle>
              <DialogDescription>
                Update team details and coach assignment.
              </DialogDescription>
            </DialogHeader>
            {selectedTeam && (
              <TeamForm
                initialData={selectedTeam}
                onSubmit={handleEdit}
                onCancel={() => {
                  setEditDialogOpen(false)
                  setSelectedTeam(null)
                }}
                loading={submitting}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <AlertTriangle className="text-destructive" />
              </AlertDialogMedia>
              <AlertDialogTitle className="text-white">Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <span className="text-white font-medium">{deleteTeamRow?.name}</span>?
                Teams that are part of matches cannot be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTeamRow(null)}>
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
      </div>
    </div>
  )
}

