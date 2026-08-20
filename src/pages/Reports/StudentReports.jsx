import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  ClipboardList,
  Star,
  AlertTriangle,
} from 'lucide-react'

import StudentReportForm from './StudentReportForm'
import StudentReportDetail from './StudentReportDetail'
import {
  listStudentReports,
  createStudentReport,
  updateStudentReport,
  deleteStudentReport,
  listAllPlayers,
  listMatchesForReports,
} from '@/services/reportService'

const ITEMS_PER_PAGE = 20

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function getStudentName(report) {
  if (report?.student_details?.full_name) return report.student_details.full_name
  return report?.student_details?.email || `Student #${report?.player ?? ''}`
}

function playerLabel(player) {
  const user = player.user
  if (player.full_name) return player.full_name
  const name = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
  return name || user?.email || `Player #${player.id}`
}

function matchLabel(match) {
  const home = match.home_team_details?.name || match.home_team_name || 'Home'
  const away = match.away_team_details?.name || match.away_team_name || 'Away'
  const suffix = match.match_date
    ? ` · ${new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : ''
  return `${home} vs ${away}${suffix}`
}

function extractError(err, fallback) {
  const status = err?.response?.status
  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) return 'The requested report was not found.'
  const errData = err?.response?.data
  if (errData?.errors) return Object.values(errData.errors).flat().join(', ')
  return errData?.message || err?.message || fallback
}

function envelopeError(response, fallback) {
  if (response?.errors && Object.keys(response.errors).length > 0) {
    return Object.values(response.errors).flat().join(', ')
  }
  return response?.message || fallback
}

export default function StudentReports({ isAdmin = false }) {
  // ------------------------- Data state -------------------------
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)

  // ------------------------- Filter / sort state -------------------------
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [playerFilter, setPlayerFilter] = useState('')
  const [matchFilter, setMatchFilter] = useState('')
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const ordering = sortField ? (sortDir === 'desc' ? `-${sortField}` : sortField) : ''

  // ------------------------- Dropdown options -------------------------
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(true)

  // ------------------------- Dialog state -------------------------
  const [submitting, setSubmitting] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const [formErrors, setFormErrors] = useState({})
// ------------------------- Debounce search -------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset to first page when filters / sort change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, playerFilter, matchFilter, ordering])

  // ------------------------- Load dropdown options -------------------------
  const loadOptions = useCallback(async () => {
    setOptionsLoading(true)
    try {
      const playerList = await listAllPlayers({ page: 1 })
      setPlayers(playerList || [])
    } catch {
      setPlayers([])
    }
    try {
      const mResp = await listMatchesForReports({ page: 1 })
      if (mResp?.success) setMatches(mResp.data?.results || [])
    } catch {
      setMatches([])
    }
    setOptionsLoading(false)
  }, [])

  useEffect(() => {
    loadOptions()
  }, [loadOptions])

  // ------------------------- Load reports -------------------------
  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page }
      if (debouncedSearch) params.search = debouncedSearch
      if (playerFilter) params.player = playerFilter
      if (matchFilter) params.match = matchFilter
      if (ordering) params.ordering = ordering

      const response = await listStudentReports(params)
      if (response?.success) {
        setReports(response.data?.results || [])
        setCount(response.data?.count ?? 0)
      } else {
        setReports([])
        setCount(0)
        setError(response?.message || 'Failed to load student reports')
      }
    } catch (err) {
      setReports([])
      setCount(0)
      setError(err.response?.data?.message || 'Failed to load student reports')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, playerFilter, matchFilter, ordering])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const totalPages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE))
  const canManage = isAdmin

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortField('')
      setSortDir('desc')
    }
  }

  const sortIndicator = (field) => {
    if (sortField !== field) return null
    return sortDir === 'desc'
      ? <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
      : <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
  }

  const clearFormErrors = useCallback(() => setFormErrors({}), [])
  const clearFormError = useCallback((name) => {
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }, [])

  // ------------------------- CRUD handlers -------------------------
  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createStudentReport(payload)
      if (response?.success) {
        toast.success(response.message || 'Student report created successfully.')
        setCreateDialogOpen(false)
        setSelectedRow(null)
        await loadReports()
      } else {
        setFormErrors(response?.errors || {})
        toast.error(envelopeError(response, 'Failed to create student report'))
      }
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      toast.error(extractError(err, 'Failed to create student report'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!selectedRow) return
    setSubmitting(true)
    try {
      const response = await updateStudentReport(selectedRow.id, payload)
      if (response?.success) {
        toast.success(response.message || 'Student report updated successfully.')
        setEditDialogOpen(false)
        setSelectedRow(null)
        await loadReports()
      } else {
        setFormErrors(response?.errors || {})
        toast.error(envelopeError(response, 'Failed to update student report'))
      }
    } catch (err) {
      setFormErrors(err.response?.data?.errors || {})
      toast.error(extractError(err, 'Failed to update student report'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteRow) return
    setSubmitting(true)
    try {
      const response = await deleteStudentReport(deleteRow.id)
      if (response?.success) {
        toast.success(response.message || 'Student report deleted successfully.')
        setDeleteDialogOpen(false)
        setDeleteRow(null)
        await loadReports()
      } else {
        toast.error(envelopeError(response, 'Failed to delete student report'))
      }
    } catch (err) {
      toast.error(extractError(err, 'Failed to delete student report'))
    } finally {
      setSubmitting(false)
    }
  }

  const openCreate = () => {
    setFormErrors({})
    setSelectedRow(null)
    setCreateDialogOpen(true)
  }

  const openEdit = (row) => {
    setFormErrors({})
    setSelectedRow(row)
    setEditDialogOpen(true)
  }

  const openDelete = (row) => {
    setDeleteRow(row)
    setDeleteDialogOpen(true)
  }

  const openDetail = (row) => {
    setDetailRow(row)
    setDetailDialogOpen(true)
  }
return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-6 w-px bg-border/40" />
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                <ClipboardList className="h-6 w-6 text-blue-400" />
                Student Reports
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Track student match performance, stats, and coach feedback
              </p>
            </div>
          </div>
          {canManage && (
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add New Report
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filter panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search student, position, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-border/50 text-white placeholder:text-gray-500"
            />
          </div>
          <Select
            value={playerFilter ? String(playerFilter) : '__all__'}
            onValueChange={(v) => setPlayerFilter(v === '__all__' ? '' : String(v))}
          >
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue placeholder={optionsLoading ? 'Loading students...' : 'Filter by Student'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Students</SelectItem>
              {players.map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {playerLabel(player)}
                  {player.academy_group ? ` (${player.academy_group})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={matchFilter ? String(matchFilter) : '__all__'}
            onValueChange={(v) => setMatchFilter(v === '__all__' ? '' : String(v))}
          >
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue placeholder={optionsLoading ? 'Loading matches...' : 'Filter by Match'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Matches</SelectItem>
              {matches.map((match) => (
                <SelectItem key={match.id} value={String(match.id)}>
                  {matchLabel(match)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                    <TableHead className="text-gray-400">Student</TableHead>
                    <TableHead className="text-gray-400 hidden lg:table-cell">Group</TableHead>
                    <TableHead className="text-gray-400 hidden xl:table-cell">Match</TableHead>
                    <TableHead className="text-gray-400">
                      <button
                        type="button"
                        onClick={() => toggleSort('report_date')}
                        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white uppercase text-xs"
                      >
                        Date {sortIndicator('report_date')}
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 hidden xl:table-cell">Position</TableHead>
                    <TableHead className="text-gray-400 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('goals')}
                        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white uppercase text-xs"
                      >
                        Goals {sortIndicator('goals')}
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden lg:table-cell">
                      <button
                        type="button"
                        onClick={() => toggleSort('assists')}
                        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white uppercase text-xs"
                      >
                        Assists {sortIndicator('assists')}
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden xl:table-cell">
                      <button
                        type="button"
                        onClick={() => toggleSort('minutes_played')}
                        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white uppercase text-xs"
                      >
                        Mins {sortIndicator('minutes_played')}
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right hidden 2xl:table-cell">Fouls</TableHead>
                    <TableHead className="text-gray-400 text-right hidden xl:table-cell">Yellow</TableHead>
                    <TableHead className="text-gray-400 text-right hidden xl:table-cell">Red</TableHead>
                    <TableHead className="text-gray-400 text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort('rating')}
                        className="inline-flex items-center gap-0.5 text-gray-400 hover:text-white uppercase text-xs"
                      >
                        Rating {sortIndicator('rating')}
                      </button>
                    </TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
<TableBody>
                  {reports.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={13} className="h-28 text-center text-gray-500">
                        No student reports found for this view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => {
                      const md = report.match_details
                      return (
                        <TableRow key={report.id} className="border-border/40">
                          <TableCell>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {getStudentName(report)}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {report.student_details?.email || `Report #${report.id}`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {report.student_details?.academy_group || (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {md ? (
                              <span className="text-sm text-gray-300">
                                {md.home_team_name || 'Home'} vs {md.away_team_name || 'Away'}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(report.report_date)}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {report.position || <span className="text-gray-600">—</span>}
                          </TableCell>
                          <TableCell className="text-right">{report.goals ?? 0}</TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            {report.assists ?? 0}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell">
                            {report.minutes_played ?? 0}
                          </TableCell>
                          <TableCell className="text-right hidden 2xl:table-cell">
                            {report.fouls ?? 0}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell">
                            {report.yellow_cards ?? 0}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell">
                            {report.red_cards ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {report.rating != null ? (
                              <Badge
                                variant="secondary"
                                className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20"
                              >
                                <Star className="h-3 w-3 text-yellow-400" />
                                {report.rating}
                              </Badge>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
{/* Actions */}
                          <TableCell className="text-right">
                            {canManage ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="text-gray-400 hover:text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-popover border-border/50">
                                  <DropdownMenuItem
                                    onClick={() => openDetail(report)}
                                    className="text-gray-300 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border/40" />
                                  <DropdownMenuItem
                                    onClick={() => openEdit(report)}
                                    className="text-gray-300 cursor-pointer"
                                  >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDelete(report)}
                                    className="text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => openDetail(report)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
{/* Mobile cards */}
        <div className="md:hidden mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-36 w-full bg-white/5" />
          ) : (
            reports.map((report) => {
              const md = report.match_details
              return (
                <Card key={report.id} className="border-border/40 bg-card/40 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{getStudentName(report)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {md
                            ? `${md.home_team_name || 'Home'} vs ${md.away_team_name || 'Away'}`
                            : 'No match linked'}
                          {report.position ? ` · ${report.position}` : ''}
                        </p>
                      </div>
                      {report.rating != null && (
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center gap-1 shrink-0 bg-blue-500/10 text-blue-400 border-blue-500/20"
                        >
                          <Star className="h-3 w-3 text-yellow-400" />
                          {report.rating}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-sm">
                      <span className="text-gray-400">{formatDate(report.report_date)}</span>
                      <span className="text-gray-400">
                        ⚽ {report.goals ?? 0} · 👟 {report.assists ?? 0} · min {report.minutes_played ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-border/50 text-gray-300"
                        onClick={() => openDetail(report)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-border/50 text-gray-300"
                            onClick={() => openEdit(report)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-destructive/40 text-red-400"
                            onClick={() => openDelete(report)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
          {!loading && reports.length === 0 && (
            <p className="text-center text-gray-500 py-8">No student reports found for this view.</p>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
            <span>
              Page {page} of {totalPages} ({count} report{count === 1 ? '' : 's'})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="border-border/50 text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="border-border/50 text-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
{/* Create Report Dialog */}
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="border-border/50 bg-popover sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Plus className="h-5 w-5 text-blue-400" />
                  Add Student Report
                </DialogTitle>
                <DialogDescription>
                  Record a student's match performance and coach feedback.
                </DialogDescription>
              </DialogHeader>
              <StudentReportForm
                players={players}
                matches={matches}
                serverErrors={formErrors}
                onClearServerError={clearFormError}
                onResetServerErrors={clearFormErrors}
                onSubmit={handleCreate}
                onCancel={() => {
                  setCreateDialogOpen(false)
                  setSelectedRow(null)
                }}
                loading={submitting}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Report Dialog */}
        {canManage && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="border-border/50 bg-popover sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Pencil className="h-5 w-5 text-blue-400" />
                  Edit Student Report
                </DialogTitle>
                <DialogDescription>
                  Update the student's match performance details.
                </DialogDescription>
              </DialogHeader>
              {selectedRow && (
                <StudentReportForm
                  initialData={selectedRow}
                  players={players}
                  matches={matches}
                  serverErrors={formErrors}
                  onClearServerError={clearFormError}
                  onResetServerErrors={clearFormErrors}
                  onSubmit={handleEdit}
                  onCancel={() => {
                    setEditDialogOpen(false)
                    setSelectedRow(null)
                  }}
                  loading={submitting}
                />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="border-border/50 bg-popover sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-blue-400" />
                Report Details
              </DialogTitle>
            </DialogHeader>
            {detailRow && <StudentReportDetail report={detailRow} />}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDetailDialogOpen(false)
                  setDetailRow(null)
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
                <AlertDialogTitle className="text-white">Delete Student Report</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this report
                  {deleteRow ? ` for ${getStudentName(deleteRow)}` : ''}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteRow(null)}>
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