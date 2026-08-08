import { useCallback, useEffect, useMemo, useState } from 'react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  User,
} from 'lucide-react'
import SectionForm from './SectionForm'
import SectionDetail from './SectionDetail'
import { listSections, createSection, updateSection, deleteSection } from '@/services/sectionService'
import { isAdminUser } from '@/lib/admin'
import { useSelector } from 'react-redux'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 20

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getCoachName(section) {
  if (!section.coach_details) return '—'
  return (
    `${section.coach_details.first_name || ''} ${section.coach_details.last_name || ''}`.trim() ||
    section.coach_details.full_name ||
    section.coach_details.email ||
    '—'
  )
}

function getAcademyName(section) {
  return section.academy_details?.name || '—'
}

// ============== Card view for mobile ==============
function SectionCard({ section, isAdmin, onView, onEdit, onDelete }) {
  const isActive = section.status === 'active'
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-white font-semibold">{section.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {getAcademyName(section)}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            )}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">
          {section.description || 'No description'}
        </p>
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-xs text-gray-500">
            <p className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {getCoachName(section)}
            </p>
            <p className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {section.player_count || section.players?.length || 0} players
            </p>
          </div>
          {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="text-gray-400">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border/50">
                <DropdownMenuItem
                  onClick={() => onView(section.id)}
                  className="text-gray-300 focus:text-white focus:bg-white/10"
                >
                  <Eye className="w-4 h-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(section)}
                  className="text-gray-300 focus:text-white focus:bg-white/10"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(section.id)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400"
              onClick={() => onView(section.id)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============== Main SectionsList Page ==============
export default function SectionsList() {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = isAdminUser(user)

  // Data state
  const [sections, setSections] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState('table')

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch sections
  const fetchSections = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page: currentPage }
      if (statusFilter) params.status = statusFilter
      if (debouncedSearch) params.search = debouncedSearch

      const response = await listSections(params)
      if (response.success) {
        setSections(response.data?.results || [])
        const count = response.data?.count || 0
        setTotalCount(count)
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE))
      } else {
        setError(response.message || 'Failed to load sections')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  // Handlers
  const handleCreate = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createSection(payload)
      if (response.success) {
        toast.success(response.message || 'Section created successfully!')
        setCreateDialogOpen(false)
        fetchSections()
      } else {
        const errMsg = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : response.message || 'Failed to create section'
        toast.error(errMsg)
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to create section'
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(', '))
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (payload) => {
    if (!selectedSection) return
    setSubmitting(true)
    try {
      const response = await updateSection(selectedSection.id, payload)
      if (response.success) {
        toast.success(response.message || 'Section updated successfully!')
        setEditDialogOpen(false)
        setSelectedSection(null)
        fetchSections()
      } else {
        const errMsg = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : response.message || 'Failed to update section'
        toast.error(errMsg)
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to update section'
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(', '))
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSectionId) return
    setSubmitting(true)
    try {
      const response = await deleteSection(selectedSectionId)
      if (response.success) {
        toast.success(response.message || 'Section deleted successfully!')
        setDeleteDialogOpen(false)
        setSelectedSectionId(null)
        fetchSections()
      } else {
        toast.error(response.message || 'Failed to delete section')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDetailChanged = () => {
    fetchSections()
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Pagination numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5]
    }
    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }, [currentPage, totalPages])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="h-6 w-px bg-border/40" />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                Sections
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage academy sections, coaches, and players
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          )}
        </div>

        {/* Filter bar */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by name, description, or coach..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 pl-10 w-full"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full sm:w-40">
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
              <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-white/5 p-1">
                <Button
                  variant={viewMode === 'table' ? 'outline' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    viewMode === 'table'
                      ? 'border-blue-500/50 text-blue-400'
                      : 'text-gray-400'
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'outline' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    viewMode === 'cards'
                      ? 'border-blue-500/50 text-blue-400'
                      : 'text-gray-400'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
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
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">No sections found</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {debouncedSearch || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first section'}
                </p>
                {isAdmin && !debouncedSearch && !statusFilter && (
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </Button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-400">Section</TableHead>
                        <TableHead className="text-gray-400">Academy</TableHead>
                        <TableHead className="text-gray-400">Coach</TableHead>
                        <TableHead className="text-gray-400">Players</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Created</TableHead>
                        {isAdmin && (
                          <TableHead className="text-gray-400 text-right">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sections.map((section) => (
                        <TableRow
                          key={section.id}
                          className="hover:bg-white/5 cursor-pointer"
                          onClick={() => {
                            setSelectedSectionId(section.id)
                            setDetailDialogOpen(true)
                          }}
                        >
                          <TableCell className="text-white font-medium">{section.name}</TableCell>
                          <TableCell className="text-gray-400">{getAcademyName(section)}</TableCell>
                          <TableCell className="text-gray-400">{getCoachName(section)}</TableCell>
                          <TableCell className="text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-600" />
                              {section.player_count || section.players?.length || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                section.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              )}
                            >
                              {section.status || 'inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(section.created_at)}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="text-gray-400">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border/50">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSectionId(section.id)
                                      setDetailDialogOpen(true)
                                    }}
                                    className="text-gray-300 focus:text-white focus:bg-white/10"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSection(section)
                                      setEditDialogOpen(true)
                                    }}
                                    className="text-gray-300 focus:text-white focus:bg-white/10"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSectionId(section.id)
                                      setDeleteDialogOpen(true)
                                    }}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    isAdmin={isAdmin}
                    onView={(id) => {
                      setSelectedSectionId(id)
                      setDetailDialogOpen(true)
                    }}
                    onEdit={(s) => {
                      setSelectedSection(s)
                      setEditDialogOpen(true)
                    }}
                    onDelete={(id) => {
                      setSelectedSectionId(id)
                      setDeleteDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && sections.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
                <p className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} sections
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="text-gray-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'outline' : 'ghost'}
                      size="icon-sm"
                      onClick={() => goToPage(pageNum)}
                      className={
                        currentPage === pageNum
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
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="text-gray-400"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Section Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              Create New Section
            </DialogTitle>
            <DialogDescription>
              Add a new section to the academy and assign a coach and players.
            </DialogDescription>
          </DialogHeader>
          <SectionForm
            onSubmit={handleCreate}
            onCancel={() => setCreateDialogOpen(false)}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-400" />
              Edit Section
            </DialogTitle>
            <DialogDescription>
              Update section details, coach, and players.
            </DialogDescription>
          </DialogHeader>
          {selectedSection && (
            <SectionForm
              initialData={selectedSection}
              onSubmit={handleEdit}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedSection(null)
              }}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Section Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Section Details
            </DialogTitle>
          </DialogHeader>
          {selectedSectionId && (
            <SectionDetail
              sectionId={selectedSectionId}
              canEdit={isAdmin}
              onChanged={handleDetailChanged}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailDialogOpen(false)
                setSelectedSectionId(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-white">Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSectionId(null)}>
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