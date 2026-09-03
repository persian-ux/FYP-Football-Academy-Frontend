import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import AttendanceStatusBadge, { ATTENDANCE_STATUS_OPTIONS } from '@/pages/Attendance/AttendanceStatusBadge'
import {
  listAttendanceRecords,
  getAttendanceRoster,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  bulkMarkAttendance,
  toggleAttendance,
} from '@/services/attendanceService'
import {
  extractApiError,
  envelopeError,
  playerName,
  playerEmail,
  playerUserId,
} from '@/services/coachService'
import {
  SectionHeader,
  EmptyState,
  ErrorState,
  TableSkeleton,
  todayString,
  formatDate,
  getInitials,
} from './coachShared'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const STATUS_FILTERS = [
  { value: '__all', label: 'All Status' },
  ...ATTENDANCE_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
]

/** Best-effort display name for an attendance record row. */
function recordName(record) {
  return (
    record?.user_name ||
    record?.user_details?.full_name ||
    record?.user_details?.email ||
    record?.name ||
    `User #${record?.user ?? '?'}`
  )
}

/** Status select used in roster rows. */
function StatusSelect({ value, onChange }) {
  return (
    <Select
      value={value || '__none__'}
      onValueChange={(v) => onChange(v === '__none__' ? 'absent' : v)}
    >
      <SelectTrigger className="h-9 w-32 border-border/50 bg-white/5 text-white">
        <SelectValue placeholder="Mark..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" disabled>
          Not marked
        </SelectItem>
        {ATTENDANCE_STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Desktop table row for a roster member. */
function RosterTableRow({ row, status, toggling, onToggle, onStatusChange, onEdit, onDelete }) {
  return (
    <TableRow className="border-border/40">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-500/20 text-xs text-emerald-300">
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{row.name}</p>
            <p className="truncate text-xs text-gray-500">{row.email || '—'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn(
            'capitalize',
            row.role === 'coach'
              ? 'border-purple-500/20 bg-purple-500/10 text-purple-400'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          )}
        >
          {row.role || '—'}
        </Badge>
      </TableCell>
      <TableCell>
        {status ? (
          <AttendanceStatusBadge status={status} />
        ) : (
          <span className="text-xs text-gray-500">Not marked</span>
        )}
      </TableCell>
      <TableCell>
        <StatusSelect value={status} onChange={(v) => onStatusChange(row, v)} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={status === 'present' ? `Mark ${row.name} absent` : `Mark ${row.name} present`}
            disabled={toggling}
            onClick={() => onToggle(row)}
            className={cn(
              'border-border/50 text-base',
              status === 'present'
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            )}
          >
            {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : status === 'present' ? '✗' : '✓'}
          </Button>
          {row.attendance_id && (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Edit attendance for ${row.name}`}
                onClick={() => onEdit(row)}
                className="border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Delete attendance for ${row.name}`}
                onClick={() => onDelete(row)}
                className="border-border/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

/** Mobile card for a roster member. */
function RosterCard({ row, status, toggling, onToggle, onStatusChange, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-border/40 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-emerald-500/20 text-xs text-emerald-300">
              {getInitials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{row.name}</p>
            <p className="truncate text-xs text-gray-500">{row.email || '—'}</p>
          </div>
        </div>
        {status ? (
          <AttendanceStatusBadge status={status} />
        ) : (
          <span className="text-xs text-gray-500">Not marked</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusSelect value={status} onChange={(v) => onStatusChange(row, v)} />
        <Button
          variant="outline"
          size="sm"
          disabled={toggling}
          onClick={() => onToggle(row)}
          className={cn(
            'border-border/50',
            status === 'present'
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-emerald-400 hover:bg-emerald-500/10'
          )}
        >
          {toggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'present' ? (
            '✗ Absent'
          ) : (
            '✓ Present'
          )}
        </Button>
        {row.attendance_id && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Edit attendance for ${row.name}`}
              onClick={() => onEdit(row)}
              className="border-border/50 text-gray-300"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Delete attendance for ${row.name}`}
              onClick={() => onDelete(row)}
              className="border-border/50 text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * CoachAttendance — attendance management for the logged-in coach.
 * Coaches manage their own attendance plus their assigned players'
 * attendance. The backend scopes the roster/records automatically.
 */
export default function CoachAttendance({ players = [], onDataChanged = () => {} }) {
  const [activeTab, setActiveTab] = useState('daily')

  // Daily roster
  const [dailyDate, setDailyDate] = useState(todayString())
  const [roster, setRoster] = useState([])
  const [statusMap, setStatusMap] = useState({}) // saved statuses keyed by user id
  const [pendingMap, setPendingMap] = useState({}) // unsaved local edits
  const [dailyStatusFilter, setDailyStatusFilter] = useState('__all')
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterError, setRosterError] = useState('')
  const [savingBulk, setSavingBulk] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  // History
  const [records, setRecords] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [historyDate, setHistoryDate] = useState('')
  const [historyStatus, setHistoryStatus] = useState('__all')

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ user: '', date: todayString(), status: 'present' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState(null) // { id, name, status }
  const [editStatus, setEditStatus] = useState('present')
  const [editError, setEditError] = useState('')
  const [editing, setEditing] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null) // { id, name }
  const [deleting, setDeleting] = useState(false)

  // ------------------------- Data loading -------------------------
  const loadRoster = useCallback(
    async (date) => {
      if (!date) return
      setRosterLoading(true)
      setRosterError('')
      let endpointRows = []
      let primaryError = ''

      try {
        const response = await getAttendanceRoster(date)
        if (response?.success) {
          endpointRows = Array.isArray(response.data?.roster) ? response.data.roster : []
        } else {
          primaryError = envelopeError(response, 'Failed to load attendance roster')
        }
      } catch (err) {
        primaryError = extractApiError(err, 'Failed to load attendance roster')
      }

      // The backend roster endpoint already scopes coaches to their assigned
      // players (own record + assigned players). Here we surface only the
      // students — the coach's own row is deliberately left out so the coach
      // marks attendance for their players, not for themselves.
      const byUser = new Map()
      endpointRows.forEach((row) => {
        const key = row?.user_id != null ? String(row.user_id) : null
        const isCoachRow = String(row.role || '').toLowerCase() === 'coach'
        if (key != null && !isCoachRow) byUser.set(key, row)
      })
      // Fallback merge: assigned players that did not come back in the roster
      // (e.g. newly assigned). `players` is coach-scoped by the backend.
      players.forEach((player) => {
        const userId = playerUserId(player)
        if (userId == null) return
        const key = String(userId)
        if (byUser.has(key)) return
        byUser.set(key, {
          user_id: userId,
          name: playerName(player),
          email: playerEmail(player),
          role: 'player',
          status: null,
          attendance_id: null,
        })
      })

      const list = Array.from(byUser.values())
      setRoster(list)
      const saved = {}
      list.forEach((row) => {
        if (row.status) saved[row.user_id] = row.status
      })
      setStatusMap(saved)
      setPendingMap({})

      if (list.length === 0 && primaryError) setRosterError(primaryError)
      setRosterLoading(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players]
  )

  const loadRecords = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const params = { page, page_size: PAGE_SIZE }
      // The records endpoint is scoped for coaches, but we only want student
      // records here (the coach manages players, not their own attendance).
      params.role = 'player'
      if (historyDate) params.date = historyDate
      if (historyStatus !== '__all') params.status = historyStatus
      const response = await listAttendanceRecords(params)
      if (response?.success) {
        const results = Array.isArray(response.data?.results)
          ? response.data.results
          : Array.isArray(response.data)
            ? response.data
            : []
        setRecords(results)
        setCount(response.data?.count ?? results.length)
      } else {
        setHistoryError(envelopeError(response, 'Failed to load attendance records'))
      }
    } catch (err) {
      setHistoryError(extractApiError(err, 'Failed to load attendance records'))
    } finally {
      setHistoryLoading(false)
    }
  }, [page, historyDate, historyStatus])

  useEffect(() => {
    loadRoster(dailyDate)
  }, [loadRoster, dailyDate])

  useEffect(() => {
    if (activeTab === 'history') loadRecords()
  }, [activeTab, loadRecords])

  const refreshAll = useCallback(() => {
    loadRoster(dailyDate)
    if (activeTab === 'history') loadRecords()
    onDataChanged()
  }, [dailyDate, activeTab, loadRoster, loadRecords, onDataChanged])

  // ------------------------- Derived -------------------------
  const rowStatus = (row) => pendingMap[row.user_id] ?? statusMap[row.user_id] ?? null

  const filteredRoster = useMemo(() => {
    if (dailyStatusFilter === '__all') return roster
    return roster.filter((row) => rowStatus(row) === dailyStatusFilter)
  }, [roster, dailyStatusFilter, statusMap, pendingMap])

  const rosterStats = useMemo(() => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 }
    roster.forEach((row) => {
      const status = rowStatus(row)
      if (status && status in stats) stats[status] += 1
      else stats.unmarked += 1
    })
    return stats
  }, [roster, statusMap, pendingMap])

  const pendingCount = Object.keys(pendingMap).length
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // ------------------------- Mutations -------------------------
  const handleToggle = async (row) => {
    const current = rowStatus(row) || 'absent'
    const next = current === 'present' ? 'absent' : 'present'
    setTogglingId(row.user_id)
    try {
      const response = await toggleAttendance(row.user_id, dailyDate)
      if (response?.success) {
        toast.success(`${row.name} marked ${next}`)
        refreshAll()
      } else {
        toast.error(envelopeError(response, 'Failed to update attendance'))
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to update attendance'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleBulkSave = async () => {
    if (pendingCount === 0) {
      toast.info('No pending changes to save.')
      return
    }
    setSavingBulk(true)
    try {
      const bulkRecords = Object.entries(pendingMap).map(([uid, status]) => ({
        user: uid,
        status,
      }))
      const response = await bulkMarkAttendance(dailyDate, bulkRecords)
      if (response?.success) {
        toast.success(response?.message || `Saved attendance for ${bulkRecords.length} member(s)`)
        refreshAll()
      } else {
        toast.error(envelopeError(response, 'Failed to save attendance'))
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to save attendance'))
    } finally {
      setSavingBulk(false)
    }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!createForm.user) return setCreateError('Please select a member.')
    if (!createForm.date) return setCreateError('Please pick a date.')
    const duplicate = roster.find(
      (row) => String(row.user_id) === String(createForm.user) && row.attendance_id
    )
    if (duplicate && createForm.date === dailyDate) {
      setCreateError('A record already exists for this member on this date. Edit it instead.')
      return
    }
    setCreating(true)
    try {
      const response = await createAttendanceRecord({
        user: Number(createForm.user),
        date: createForm.date,
        status: createForm.status,
      })
      if (response?.success) {
        toast.success(response?.message || 'Attendance record created')
        setCreateOpen(false)
        setCreateForm({ user: '', date: dailyDate, status: 'present' })
        refreshAll()
      } else {
        setCreateError(envelopeError(response, 'Failed to create attendance record'))
      }
    } catch (err) {
      setCreateError(extractApiError(err, 'Failed to create attendance record'))
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (row) => {
    if (!row.attendance_id) return
    setEditTarget({ id: row.attendance_id, name: row.name, status: row.status || 'present' })
    setEditStatus(row.status || 'present')
    setEditError('')
  }

  const openEditRecord = (record) => {
    setEditTarget({
      id: record.id,
      name: recordName(record),
      status: record.status || 'present',
    })
    setEditStatus(record.status || 'present')
    setEditError('')
  }

  const handleEdit = async () => {
    if (!editTarget) return
    setEditError('')
    setEditing(true)
    try {
      const response = await updateAttendanceRecord(editTarget.id, { status: editStatus })
      if (response?.success) {
        toast.success(response?.message || 'Attendance record updated')
        setEditTarget(null)
        refreshAll()
      } else {
        setEditError(envelopeError(response, 'Failed to update attendance record'))
      }
    } catch (err) {
      setEditError(extractApiError(err, 'Failed to update attendance record'))
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await deleteAttendanceRecord(deleteTarget.id)
      if (response?.success) {
        toast.success(response?.message || 'Attendance record deleted')
        setDeleteTarget(null)
        refreshAll()
      } else {
        toast.error(envelopeError(response, 'Failed to delete attendance record'))
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete attendance record'))
    } finally {
      setDeleting(false)
    }
  }

  // ------------------------- Render -------------------------
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        title="Attendance"
        description="Mark daily attendance for your assigned players"
        icon={ClipboardCheck}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRoster(dailyDate)}
              disabled={rosterLoading}
              className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', rosterLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateForm({ user: '', date: dailyDate, status: 'present' })
                setCreateError('')
                setCreateOpen(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Record
            </Button>
          </>
        }
      />

      {rosterError && (
        <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
          <AlertDescription className="text-sm">{rosterError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5">
          <TabsTrigger value="daily" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Daily Sheet
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ============================= DAILY ============================= */}
        <TabsContent value="daily" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="daily-date" className="text-gray-300">
                Date
              </Label>
              <Input
                id="daily-date"
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="h-10 w-full border-border/50 bg-white/5 text-white [color-scheme:dark] sm:w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Status filter</Label>
              <Select value={dailyStatusFilter} onValueChange={setDailyStatusFilter}>
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Status</SelectItem>
                  {ATTENDANCE_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 items-center justify-start gap-2 sm:justify-end">
              <div className="mr-2 hidden flex-wrap items-center gap-1.5 lg:flex">
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  {rosterStats.present} present
                </Badge>
                <Badge className="border-red-500/20 bg-red-500/10 text-red-400">
                  {rosterStats.absent} absent
                </Badge>
                <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-400">
                  {rosterStats.late} late
                </Badge>
                <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-400">
                  {rosterStats.excused} excused
                </Badge>
              </div>
              <Button
                onClick={handleBulkSave}
                disabled={savingBulk || pendingCount === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400"
              >
                {savingBulk ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save All{pendingCount > 0 ? ` (${pendingCount})` : ''}
              </Button>
            </div>
          </div>

          {rosterLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredRoster.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No roster members for this date"
              description="Your assigned players appear here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden border-border/40 bg-card/40 backdrop-blur-xl md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-gray-400">Member</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Change</TableHead>
                        <TableHead className="text-right text-gray-400">Quick Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoster.map((row) => (
                        <RosterTableRow
                          key={row.user_id}
                          row={row}
                          status={rowStatus(row)}
                          toggling={togglingId === row.user_id}
                          onToggle={handleToggle}
                          onStatusChange={(r, v) =>
                            setPendingMap((prev) => ({ ...prev, [r.user_id]: v }))
                          }
                          onEdit={openEdit}
                          onDelete={(r) => setDeleteTarget({ id: r.attendance_id, name: r.name })}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Mobile cards */}
              <div className="flex flex-col gap-2 md:hidden">
                {filteredRoster.map((row) => (
                  <RosterCard
                    key={row.user_id}
                    row={row}
                    status={rowStatus(row)}
                    toggling={togglingId === row.user_id}
                    onToggle={handleToggle}
                    onStatusChange={(r, v) =>
                      setPendingMap((prev) => ({ ...prev, [r.user_id]: v }))
                    }
                    onEdit={openEdit}
                    onDelete={(r) => setDeleteTarget({ id: r.attendance_id, name: r.name })}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ============================= HISTORY ============================= */}
        <TabsContent value="history" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="history-date" className="text-gray-300">
                Date
              </Label>
              <Input
                id="history-date"
                type="date"
                value={historyDate}
                onChange={(e) => {
                  setPage(1)
                  setHistoryDate(e.target.value)
                }}
                className="h-10 w-full border-border/50 bg-white/5 text-white [color-scheme:dark] sm:w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300">Status</Label>
              <Select
                value={historyStatus}
                onValueChange={(value) => {
                  setPage(1)
                  setHistoryStatus(value)
                }}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 items-center justify-start sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecords}
                disabled={historyLoading}
                className="border-border/70 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', historyLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>

          {historyError && <ErrorState message={historyError} onRetry={loadRecords} />}

          {historyLoading ? (
            <TableSkeleton rows={5} />
          ) : records.length === 0 ? (
            <EmptyState
              icon={History}
              title="No attendance records found"
              description="Try changing the filters or mark attendance in the Daily Sheet."
            />
          ) : (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-gray-400">Member</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-right text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>

                    {records.map((record) => (
                      <TableRow key={record.id} className="border-border/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-emerald-500/20 text-xs text-emerald-300">
                                {getInitials(recordName(record))}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-white">{recordName(record)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-300">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <AttendanceStatusBadge status={record.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Edit record for ${recordName(record)}`}
                              onClick={() => openEditRecord(record)}
                              className="border-border/50 text-gray-300 hover:bg-white/10 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={`Delete record for ${recordName(record)}`}
                              onClick={() => setDeleteTarget({ id: record.id, name: recordName(record) })}
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {count} record(s)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || historyLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-border/50 text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || historyLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="border-border/50 text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================= DIALOGS ============================= */}
      {/* Create record */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border/50 bg-[#11161d] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Attendance Record</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a single record for one of your assigned players.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createError && (
              <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
                <AlertDescription className="text-sm">{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="create-user" className="text-gray-300">
                Member <span className="text-red-400">*</span>
              </Label>
              <Select
                value={createForm.user}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, user: value }))}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white">
                  <SelectValue placeholder={roster.length ? 'Select a member' : 'Loading members...'} />
                </SelectTrigger>
                <SelectContent>
                  {roster.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No members available
                    </SelectItem>
                  ) : (
                    roster.map((row) => (
                      <SelectItem key={row.user_id} value={String(row.user_id)}>
                        {row.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-date" className="text-gray-300">
                Date <span className="text-red-400">*</span>
              </Label>
              <Input
                id="create-date"
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, date: e.target.value }))}
                className="h-10 border-border/50 bg-white/5 text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400"
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit record */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="border-border/50 bg-[#11161d] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the status for {editTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editError && (
              <Alert variant="destructive" className="border-rose-500/30 bg-rose-500/10">
                <AlertDescription className="text-sm">{editError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label className="text-gray-300">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editing}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400"
            >
              {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border/50 bg-[#11161d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attendance record?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently remove the attendance record for {deleteTarget?.name}. This
              action cannot be undone.
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
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}






