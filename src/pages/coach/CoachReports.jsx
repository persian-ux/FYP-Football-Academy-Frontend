import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

import StudentReportForm from '@/pages/Reports/StudentReportForm'
import StudentReportDetail from '@/pages/Reports/StudentReportDetail'
import {
  listStudentReports,
  createStudentReport,
  updateStudentReport,
  deleteStudentReport,
  listMatchesForReports,
} from '@/services/reportService'
import {
  extractApiError,
  envelopeError,
  extractFieldErrors,
  playerName as getPlayerName,
} from '@/services/coachService'
import { SectionHeader, EmptyState, ErrorState, TableSkeleton, formatDate } from './coachShared'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

/** Display date for a report (backend uses created_at / report_date). */
function reportDate(report) {
  return report?.report_date || report?.created_at || report?.date
}

function reportMatchLabel(report) {
  const details = report?.match_details
  const home = details?.home_team_details?.name || details?.home_team_name || report?.home_team_name
  const away = details?.away_team_details?.name || details?.away_team_name || report?.away_team_name
  if (!home && !away) return '—'
  return `${home || 'Home'} vs ${away || 'Away'}`
}

/** Coach-only student report management (assigned players, scoped by the backend). */
export default function CoachReports({ players = [], onDataChanged = () => {} }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [playerFilter, setPlayerFilter] = useState('__all')
  const [matchFilter, setMatchFilter] = useState('__all')
  const [matches, setMatches] = useState([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editReport, setEditReport] = useState(null)
  const [viewReport, setViewReport] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverErrors, setServerErrors] = useState({})

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // ------------------------- Data loading -------------------------
  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (playerFilter !== '__all') params.player = playerFilter
      if (matchFilter !== '__all') params.match = matchFilter
      const response = await listStudentReports(params)
      if (response?.success) {
        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : []
        setReports(results)
        setCount(response.data?.count ?? results.length)
      } else {
        setError(envelopeError(response, 'Failed to load student reports'))
      }
    } catch (err) {
      setError(extractApiError(err, 'Failed to load student reports'))
    } finally {
      setLoading(false)
    }
  }, [page, playerFilter, matchFilter])

  const loadMatches = useCallback(async () => {
    try {
      const response = await listMatchesForReports({ page: 1, page_size: 200 })
      if (response?.success) {
        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : []
        setMatches(results)
      }
    } catch {
      // Non-critical — the match dropdown just stays empty.
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  // ------------------------- Handlers -------------------------
  const handleCreate = async (payload) => {
    setSubmitting(true)
    setServerErrors({})
    try {
      const response = await createStudentReport(payload)
      if (response?.success) {
        toast.success(response?.message || 'Report created')
        setCreateOpen(false)
        loadReports()
        onDataChanged()
      } else {
        setServerErrors(extractFieldErrors(response))
        toast.error(envelopeError(response, 'Failed to create report'))
      }
    } catch (err) {
      setServerErrors(extractFieldErrors(err))
      toast.error(extractApiError(err, 'Failed to create report'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!editReport) return
    setSubmitting(true)
    setServerErrors({})
    try {
      const response = await updateStudentReport(editReport.id, payload)
      if (response?.success) {
        toast.success(response?.message || 'Report updated')
        setEditReport(null)
        loadReports()
        onDataChanged()
      } else {
        setServerErrors(extractFieldErrors(response))
        toast.error(envelopeError(response, 'Failed to update report'))
      }
    } catch (err) {
      setServerErrors(extractFieldErrors(err))
      toast.error(extractApiError(err, 'Failed to update report'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteStudentReport(deleteTarget.id)
      if (response?.success) {
        toast.success(response?.message || 'Report deleted')
        setDeleteTarget(null)
        loadReports()
        onDataChanged()
      } else {
        toast.error(envelopeError(response, 'Failed to delete report'))
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete report'))
    }
  }

  const displayName = (report) => {
    if (report?.student_details?.full_name) return report.student_details.full_name
    if (report?.student_details?.email) return report.student_details.email
    const local = players.find((p) => String(p.id) === String(report?.player))
    return local ? getPlayerName(local) : `Student #${report?.player ?? '?'}`
  }

  // ------------------------- Render -------------------------
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        title="Student Reports"
        description="Create and manage performance reports for your assigned players"
        icon={ClipboardList}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={loadReports}
              disabled={loading}
              className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setServerErrors({})
                setCreateOpen(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Report
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-gray-300">Player</Label>
          <Select
            value={playerFilter}
            onValueChange={(value) => {
              setPage(1)
              setPlayerFilter(value)
            }}
          >
            <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All My Players</SelectItem>
              {players.map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {getPlayerName(player)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-gray-300">Match</Label>
          <Select
            value={matchFilter}
            onValueChange={(value) => {
              setPage(1)
              setMatchFilter(value)
            }}
          >
            <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All Matches</SelectItem>
              {matches.map((match) => (
                <SelectItem key={match.id} value={String(match.id)}>
                  {match.home_team_details?.name || 'Home'} vs {match.away_team_details?.name || 'Away'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadReports} />}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No reports found"
          description="Create a performance report for one of your assigned players."
          action={
            <Button
              size="sm"
              onClick={() => {
                setServerErrors({})
                setCreateOpen(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Report
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
                    <TableHead className="text-gray-400">Student</TableHead>
                    <TableHead className="text-gray-400">Match</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Position</TableHead>
                    <TableHead className="text-gray-400">Rating</TableHead>
                    <TableHead className="text-gray-400">Summary</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="border-border/40">
                      <TableCell className="text-sm font-medium text-white">
                        {displayName(report)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-gray-300">
                        {reportMatchLabel(report)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-300">
                        {formatDate(reportDate(report))}
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">{report.position || '—'}</TableCell>
                      <TableCell>
                        {report.rating != null && report.rating !== '' ? (
                          <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">
                            <Star className="mr-1 h-3 w-3" />
                            {report.rating}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-sm text-gray-400">
                        {report.summary || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`View report for ${displayName(report)}`}
                            onClick={() => setViewReport(report)}
                            className="border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit report for ${displayName(report)}`}
                            onClick={() => {
                              setServerErrors({})
                              setEditReport(report)
                            }}
                            className="border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Delete report for ${displayName(report)}`}
                            onClick={() =>
                              setDeleteTarget({ id: report.id, name: displayName(report) })
                            }
                            className="border-border/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-border/40 bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{displayName(report)}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {reportMatchLabel(report)} · {formatDate(reportDate(report))}
                    </p>
                  </div>
                  {report.rating != null && report.rating !== '' && (
                    <Badge className="shrink-0 border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <Star className="mr-1 h-3 w-3" />
                      {report.rating}
                    </Badge>
                  )}
                </div>
                {report.summary && (
                  <p className="mt-2 line-clamp-2 text-xs text-gray-400">{report.summary}</p>
                )}
                <div className="mt-3 flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`View report for ${displayName(report)}`}
                    onClick={() => setViewReport(report)}
                    className="border-border/50 text-gray-300"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Edit report for ${displayName(report)}`}
                    onClick={() => {
                      setServerErrors({})
                      setEditReport(report)
                    }}
                    className="border-border/50 text-gray-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Delete report for ${displayName(report)}`}
                    onClick={() => setDeleteTarget({ id: report.id, name: displayName(report) })}
                    className="border-border/50 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages} · {count} report(s)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-border/50 text-gray-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-border/50 text-gray-300"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create report */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-[#11161d] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Student Report</DialogTitle>
            <DialogDescription className="text-gray-400">
              Record a performance report for one of your assigned players.
            </DialogDescription>
          </DialogHeader>
          <StudentReportForm
            players={players}
            matches={matches}
            serverErrors={serverErrors}
            onResetServerErrors={() => setServerErrors({})}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit report */}
      <Dialog open={!!editReport} onOpenChange={(open) => !open && setEditReport(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-[#11161d] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the report for {editReport ? displayName(editReport) : ''}.
            </DialogDescription>
          </DialogHeader>
          <StudentReportForm
            initialData={editReport}
            players={players}
            matches={matches}
            serverErrors={serverErrors}
            onResetServerErrors={() => setServerErrors({})}
            onSubmit={handleUpdate}
            onCancel={() => setEditReport(null)}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* View report */}
      <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-[#11161d] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              {viewReport ? displayName(viewReport) : ''} · {formatDate(reportDate(viewReport))}
            </DialogDescription>
          </DialogHeader>
          {viewReport && <StudentReportDetail report={viewReport} />}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border/50 bg-[#11161d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently remove the report for {deleteTarget?.name}. This action cannot
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
                handleDelete()
              }}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}





