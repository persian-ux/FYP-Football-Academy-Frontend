import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react'
import {
  listUsers,
  createUser,
  getUser,
  patchUser,
  deleteUser,
  toggleUserStatus,
} from '@/redux/api/adminUsers'

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'coach', label: 'Coach' },
  { value: 'player', label: 'Player' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const ITEMS_PER_PAGE = 20

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ============== User Form (shared between Create & Edit) ==============
function UserForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    email: initialData?.email || '',
    password: '',
    password2: '',
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    phone: initialData?.phone || '',
    role: initialData?.role || 'coach',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const isEditing = !!initialData

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Validation
    const errors = {}
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.first_name.trim()) errors.first_name = 'First name is required'
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required'
    if (!formData.role) errors.role = 'Role is required'

    if (!isEditing) {
      if (!formData.password) errors.password = 'Password is required'
      else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
      if (!formData.password2) errors.password2 = 'Please confirm password'
      else if (formData.password !== formData.password2) errors.password2 = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      email: formData.email.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      is_active: formData.is_active,
    }

    if (!isEditing) {
      payload.password = formData.password
      payload.password2 = formData.password2
    } else if (formData.password) {
      payload.password = formData.password
      payload.password2 = formData.password2
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-gray-300">First Name *</Label>
          <Input
            id="first_name"
            name="first_name"
            placeholder="John"
            value={formData.first_name}
            onChange={handleChange}
            className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
              fieldErrors.first_name ? 'border-destructive' : ''
            }`}
          />
          {fieldErrors.first_name && (
            <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-gray-300">Last Name *</Label>
          <Input
            id="last_name"
            name="last_name"
            placeholder="Doe"
            value={formData.last_name}
            onChange={handleChange}
            className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
              fieldErrors.last_name ? 'border-destructive' : ''
            }`}
          />
          {fieldErrors.last_name && (
            <p className="text-xs text-destructive">{fieldErrors.last_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-300">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleChange}
          className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
            fieldErrors.email ? 'border-destructive' : ''
          }`}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-300">Phone</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="+1234567890"
          value={formData.phone}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role" className="text-gray-300">Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange('role', value)}
          >
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="player">Player</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.role && (
            <p className="text-xs text-destructive">{fieldErrors.role}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="is_active" className="text-gray-300">Status</Label>
          <div className="flex items-center gap-3 h-10">
            <Switch
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
            <span className="text-sm text-gray-400">
              {formData.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">
            {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={isEditing ? 'Leave blank to keep' : '••••••••'}
            value={formData.password}
            onChange={handleChange}
            className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
              fieldErrors.password ? 'border-destructive' : ''
            }`}
          />
          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password2" className="text-gray-300">Confirm Password *</Label>
          <Input
            id="password2"
            name="password2"
            type="password"
            placeholder="••••••••"
            value={formData.password2}
            onChange={handleChange}
            className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
              fieldErrors.password2 ? 'border-destructive' : ''
            }`}
          />
          {fieldErrors.password2 && (
            <p className="text-xs text-destructive">{fieldErrors.password2}</p>
          )}
        </div>
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            isEditing ? 'Update User' : 'Create User'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ============== User Detail View ==============
function UserDetailView({ userId, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getUser(userId)
        if (response.success) {
          setUser(response.data)
        } else {
          setError(response.message || 'Failed to load user details')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user details')
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-32 w-full bg-white/5" />
        <Skeleton className="h-24 w-full bg-white/5" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!user) return null

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
  const initials = getInitials(displayName)

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <Avatar className="w-16 h-16 ring-2 ring-blue-500/30">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white">{displayName}</h3>
          <p className="text-sm text-gray-400">{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              <Shield className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>
            <Badge
              variant="secondary"
              className={`${
                user.is_active
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-destructive/10 text-destructive border-destructive/20'
              }`}
            >
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border/20">
          <div className="flex items-center gap-2 text-gray-400">
            <Mail className="w-4 h-4" />
            <span className="text-sm">Email</span>
          </div>
          <span className="text-sm text-white">{user.email}</span>
        </div>
        {user.first_name && (
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span className="text-sm">First Name</span>
            </div>
            <span className="text-sm text-white">{user.first_name}</span>
          </div>
        )}
        {user.last_name && (
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span className="text-sm">Last Name</span>
            </div>
            <span className="text-sm text-white">{user.last_name}</span>
          </div>
        )}
        {user.phone && (
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <div className="flex items-center gap-2 text-gray-400">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Phone</span>
            </div>
            <span className="text-sm text-white">{user.phone}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2 border-b border-border/20">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Role</span>
          </div>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize">
            {user.role}
          </Badge>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border/20">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Joined</span>
          </div>
          <span className="text-sm text-white">{formatDate(user.date_joined)}</span>
        </div>
        {user.last_login && (
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Last Login</span>
            </div>
            <span className="text-sm text-white">{formatDate(user.last_login)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

// ============== Main AdminUsers Page ==============
export default function AdminUsers() {
  // State
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page: currentPage }
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.is_active = statusFilter === 'true'
      if (debouncedSearch) params.search = debouncedSearch

      const response = await listUsers(params)
      if (response.success) {
        setUsers(response.data.results || [])
        setTotalCount(response.data.count || 0)
        setTotalPages(Math.ceil((response.data.count || 0) / ITEMS_PER_PAGE))
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [currentPage, roleFilter, statusFilter, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Handlers
  const handleCreateUser = async (payload) => {
    setSubmitting(true)
    try {
      const response = await createUser(payload)
      if (response.success) {
        toast.success(response.message || 'User created successfully!')
        setCreateDialogOpen(false)
        fetchUsers()
      } else {
        if (response.errors) {
          toast.error(Object.values(response.errors).flat().join(', ') || response.message)
        } else {
          toast.error(response.message || 'Failed to create user')
        }
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to create user'
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(', '))
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (payload) => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const response = await patchUser(selectedUser.id, payload)
      if (response.success) {
        toast.success(response.message || 'User updated successfully!')
        setEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        if (response.errors) {
          toast.error(Object.values(response.errors).flat().join(', ') || response.message)
        } else {
          toast.error(response.message || 'Failed to update user')
        }
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to update user'
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(', '))
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (user) => {
    const newStatus = !user.is_active
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
    )
    try {
      const response = await toggleUserStatus(user.id, newStatus)
      if (!response.success) {
        // Revert on failure
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: !newStatus } : u))
        )
        toast.error(response.message || 'Failed to update status')
      } else {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`)
      }
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !newStatus } : u))
      )
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserId) return
    setSubmitting(true)
    try {
      const response = await deleteUser(selectedUserId)
      if (response.success) {
        toast.success(response.message || 'User deleted successfully!')
        setDeleteDialogOpen(false)
        setSelectedUserId(null)
        fetchUsers()
      } else {
        toast.error(response.message || 'Failed to delete user')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (user) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const openDetailDialog = (userId) => {
    setSelectedUserId(userId)
    setDetailDialogOpen(true)
  }

  const openDeleteDialog = (userId) => {
    setSelectedUserId(userId)
    setDeleteDialogOpen(true)
  }

  // Pagination
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

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
                User Management
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage coaches and players
              </p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 pl-10 w-full"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full sm:w-36">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full sm:w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
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

        {/* Users Table */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-white/5" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-1">No users found</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {debouncedSearch || roleFilter || statusFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first user'}
                </p>
                {!debouncedSearch && !roleFilter && !statusFilter && (
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-400">User</TableHead>
                        <TableHead className="text-gray-400">Email</TableHead>
                        <TableHead className="text-gray-400">Phone</TableHead>
                        <TableHead className="text-gray-400">Role</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Joined</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                        const initials = getInitials(displayName)
                        return (
                          <TableRow key={user.id} className="hover:bg-white/5">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white font-medium truncate max-w-[150px]">
                                  {displayName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">{user.email}</TableCell>
                            <TableCell className="text-gray-400">{user.phone || '—'}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-blue-500/10 text-blue-400 border-blue-500/20 capitalize"
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.is_active}
                                  onCheckedChange={() => handleToggleStatus(user)}
                                  size="sm"
                                />
                                <span className={`text-xs ${user.is_active ? 'text-emerald-400' : 'text-gray-500'}`}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400 text-sm">
                              {formatDate(user.date_joined)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="text-gray-400">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border/50">
                                  <DropdownMenuItem
                                    onClick={() => openDetailDialog(user.id)}
                                    className="text-gray-300 focus:text-white focus:bg-white/10"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(user)}
                                    className="text-gray-300 focus:text-white focus:bg-white/10"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(user.id)}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/20">
                    <p className="text-sm text-gray-400">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} users
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
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
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
                        )
                      })}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new coach or player to the academy.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => setCreateDialogOpen(false)}
            loading={submitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-400" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user details. Leave password blank to keep current.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              initialData={selectedUser}
              onSubmit={handleEditUser}
              onCancel={() => {
                setEditDialogOpen(false)
                setSelectedUser(null)
              }}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-md bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <UserDetailView
              userId={selectedUserId}
              onClose={() => {
                setDetailDialogOpen(false)
                setSelectedUserId(null)
              }}
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
            <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedUserId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteUser}
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