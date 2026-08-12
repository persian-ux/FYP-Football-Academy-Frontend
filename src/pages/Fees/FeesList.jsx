import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Wallet,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  Users,
  Mail,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  Clock3,
  CalendarDays,
} from 'lucide-react'

import FeeForm from './FeeForm'
import FeeStatusBadge from './FeeStatusBadge'
import {
  getStudentsWithFeeStatus,
  listAllStudents,
  createFeeRecord,
  updateFeeRecord,
  deleteFeeRecord,
  toggleFeeStatus,
} from '@/services/feeService'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 20

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatCurrency(value) {
  const num = Number(value)
  if (value === null || value === undefined || Number.isNaN(num)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

function getInitials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
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

export default function FeesList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toggleId, setToggleId] = useState(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load students with fee status on mount
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError('')
    let feeRows = []
    let primaryError = ''

    try {
      const response = await getStudentsWithFeeStatus()
      const list = response.data?.results || response.data
      feeRows = Array.isArray(list) ? list : []
      if (!response.success) {
        primaryError = response.message || 'Failed to load students'
      }
    } catch (err) {
      primaryError = err.response?.data?.message || 'Failed to load students'
    }

    // Merge every player-role user so the list always shows all students,
    // including those created through User Management that may not have a
    // Player profile / fee row yet. Rows from the fees endpoint take priority.
    const adminPlayers = await listAllStudents()
    const byUser = new Map(feeRows.map((row) => [row.user_id, row]))
    adminPlayers.forEach((user) => {
      if (byUser.has(user.id)) return
      byUser.set(user.id, {
        id: user.id,
        player_id: user.player_id ?? null,
        user_id: user.id,
        student_name:
          [user.first_name, user.last_name].filter(Boolean).join(' ') ||
          user.email ||
          `Student #${user.id}`,
        email: user.email || '',
        phone: user.phone || null,
        academy_group: null,
        assigned_sport: null,
        amount: '0.00',
        status: 'unpaid',
        fee_id: null,
        due_date: null,
      })
    })

    setStudents(Array.from(byUser.values()))
    setError(primaryError)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Summary stats (over all students)
  const stats = useMemo(() => {
    let collected = 0
    let paid = 0
    let unpaid = 0
    let pending = 0
    let overdue = 0
    students.forEach((s) => {
      if (s.status === 'paid') {
        paid += 1
        const amt = Number(s.amount)
        if (!Number.isNaN(amt)) collected += amt
      } else if (s.status === 'overdue') {
        overdue += 1
      } else if (s.status === 'pending') {
        pending += 1
      } else {
        unpaid += 1
      }
    })
    return { total: students.length, collected, paid, unpaid, pending, overdue }
  }, [students])

  // Search + status filtering (client-side)
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        (s.student_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.academy_group || '').toLowerCase().includes(q)
      const matchesStatus = !statusFilter || s.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [students, debouncedSearch, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [filtered, safePage]
  )

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, 5]
    }
    if (safePage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2]
  }, [safePage, totalPages])

  // Centralized error extraction matching backend envelope
  function extractError(err, fallback) {
    const errData = err?.response?.data
    if (errData?.errors) {
      return Object.values(errData.errors).flat().join(', ')
    }
    return errData?.message || err?.message || fallback
  }

  function envelopeError(response, fallback) {
    return response.errors
      ? Object.values(response.errors).flat().join(', ')
      : response.message || fallback
  }

    const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createFeeRecord(payload)
      if (response.success) {
        toast.success(response.message || 'Fee created successfully!')
        setCreateDialogOpen(false)
        setSelectedRow(null)
        await fetchStudents()
      } else {
        toast.error(envelopeError(response, 'Failed to create fee'))
      }
    } catch (err) {
      toast.error(extractError(err, 'Failed to create fee'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (payload) => {
    if (!selectedRow?.fee_id) return
    setSubmitting(true)
    try {
      const response = await updateFeeRecord(selectedRow.fee_id, payload)
      if (response.success) {
        toast.success(response.message || 'Fee updated successfully!')
        setEditDialogOpen(false)
        setSelectedRow(null)
        await fetchStudents()
      } else {
        toast.error(envelopeError(response, 'Failed to update fee'))
      }
    } catch (err) {
      toast.error(extractError(err, 'Failed to update fee'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (row) => {
    if (!row.fee_id) return
    const target = row.status === 'paid' ? 'unpaid' : 'paid'

    // Optimistic update for instant feedback
    setStudents((prev) =>
      prev.map((s) => (s.id === row.id ? { ...s, status: target } : s))
    )
    setToggleId(row.fee_id)
    try {
      const response = await toggleFeeStatus(row.fee_id, target)
      if (response.success) {
        toast.success(response.message || 'Fee status updated successfully!')
      } else {
        toast.error(envelopeError(response, 'Failed to update fee status'))
      }
      // Refresh to sync with the backend
      await fetchStudents()
    } catch (err) {
      toast.error(extractError(err, 'Failed to update fee status'))
      await fetchStudents()
    } finally {
      setToggleId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteRow?.fee_id) return
    setSubmitting(true)
    try {
      const response = await deleteFeeRecord(deleteRow.fee_id)
      if (response.success) {
        toast.success(response.message || 'Fee deleted successfully!')
        setDeleteDialogOpen(false)
        setDeleteRow(null)
        await fetchStudents()
      } else {
        toast.error(response.message || 'Failed to delete fee')
      }
    } catch (err) {
      toast.error(extractError(err, 'Failed to delete fee'))
    } finally {
      setSubmitting(false)
    }
  }

  const openCreate = () => {
    setSelectedRow(null)
    setCreateDialogOpen(true)
  }

  const openCreateForRow = (row) => {
    setSelectedRow({ player_id: row.player_id, student_name: row.student_name })
    setCreateDialogOpen(true)
  }

  const openEdit = (row) => {
    setSelectedRow(row)
    setEditDialogOpen(true)
  }

  const openDelete = (row) => {
    setDeleteRow(row)
    setDeleteDialogOpen(true)
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
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
                <Wallet className="h-6 w-6 text-blue-400" />
                Student Fees
              </h1>
              <p className="mt-0.5 text-sm text-gray-400">
                Manage fee records, track payments, and stay on top of dues
              </p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add Fee
          </Button>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats.total}
            accent="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={CircleDollarSign}
            label="Collected"
            value={formatCurrency(stats.collected)}
            accent="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={HandCoins}
            label="Pending Payments"
            value={stats.unpaid + stats.pending}
            accent="bg-yellow-500/10 text-yellow-400"
          />
          <StatCard
            icon={Clock3}
            label="Overdue"
            value={stats.overdue}
            accent="bg-orange-500/10 text-orange-400"
          />
        </div>

        {/* Filter bar */}
        <Card className="mb-6 border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by student name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full border-border/50 bg-white/5 pl-10 text-white placeholder:text-gray-500"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-10 w-full border-border/50 bg-white/5 text-white sm:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-sm text-gray-400">Loading fees...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Wallet className="mb-4 h-12 w-12 text-gray-600" />
                <h3 className="mb-1 text-lg font-medium text-white">
                  No fee records found
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  {debouncedSearch || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'No students have been assigned fees yet'}
                </p>
                {!debouncedSearch && !statusFilter && (
                  <Button
                    variant="outline"
                    className="border-border/50 text-white"
                    onClick={openCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Add a Fee
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-gray-400">Student</TableHead>
                          <TableHead className="text-gray-400">Group</TableHead>
                          <TableHead className="text-gray-400">Amount</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Due Date</TableHead>
                          <TableHead className="text-right text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.map((row) => (
                          <TableRow key={row.id} className="hover:bg-white/5">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-400">
                                  {getInitials(row.student_name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-white">
                                    {row.student_name || `Student #${row.player_id}`}
                                  </p>
                                  <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                                    <Mail className="h-3 w-3" />
                                    {row.email || '—'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {row.academy_group || '—'}
                            </TableCell>
                            <TableCell className="font-medium text-white">
                              {formatCurrency(row.amount)}
                            </TableCell>
                            <TableCell>
                              <FeeStatusBadge status={row.status} />
                            </TableCell>
                            <TableCell className="text-gray-400">
                              <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gray-600" />
                                {formatDate(row.due_date)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="text-gray-400 hover:text-white"
                                    disabled={!row.fee_id && !row.player_id}
                                    title="Actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="border-border/50 bg-popover"
                                >
                                  {row.fee_id ? (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => openEdit(row)}
                                        className="text-gray-300 focus:bg-white/10 focus:text-white"
                                      >
                                        <Pencil className="h-4 w-4" />
                                        Edit Fee
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleToggle(row)}
                                        disabled={toggleId === row.fee_id}
                                        className="text-gray-300 focus:bg-white/10 focus:text-white"
                                      >
                                        {toggleId === row.fee_id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : row.status === 'paid' ? (
                                          <XCircle className="h-4 w-4" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        {row.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDelete(row)}
                                        variant="destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Fee
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => openCreateForRow(row)}
                                      className="text-gray-300 focus:bg-white/10 focus:text-white"
                                    >
                                      <Plus className="h-4 w-4" />
                                      Add Fee
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/20 px-4 py-3">
                      <p className="text-sm text-gray-400">
                        Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}-
                        {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of{' '}
                        {filtered.length} students
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={safePage <= 1}
                          onClick={() => goToPage(safePage - 1)}
                          className="text-gray-400"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {pageNumbers.map((pageNum) => (
                          <Button
                            key={pageNum}
                            variant={safePage === pageNum ? 'outline' : 'ghost'}
                            size="icon-sm"
                            onClick={() => goToPage(pageNum)}
                            className={
                              safePage === pageNum
                                ? 'border-blue-500/50 text-blue-400'
                                : 'text-gray-400'
                            }
                          >
                            {pageNum}
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={safePage >= totalPages}
                          onClick={() => goToPage(safePage + 1)}
                          className="text-gray-400"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Fee Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="border-border/50 bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-blue-400" />
              Add Fee
            </DialogTitle>
            <DialogDescription>
              Create a new fee record for a student.
            </DialogDescription>
          </DialogHeader>
          <FeeForm
            initialData={selectedRow}
            students={students}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateDialogOpen(false)
              setSelectedRow(null)
            }}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Fee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-border/50 bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="h-5 w-5 text-blue-400" />
              Edit Fee
            </DialogTitle>
            <DialogDescription>
              Update the amount, status, or due date.
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <FeeForm
              initialData={selectedRow}
              students={students}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedRow(null)
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
            <AlertDialogTitle className="text-white">Delete Fee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee
              {deleteRow?.student_name ? ` for ${deleteRow.student_name}` : ''}?
              This action cannot be undone.
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
    </div>
  )
}