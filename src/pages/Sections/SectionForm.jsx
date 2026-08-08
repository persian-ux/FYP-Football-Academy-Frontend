import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogFooter,
} from '@/components/ui/dialog'
import CoachSelect from '@/components/CoachSelect'
import PlayerSelect from '@/components/PlayerSelect'
import { listAcademies } from '@/services/sectionService'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

/**
 * SectionForm — create/edit section modal content.
 *
 * @param {Object} props
 * @param {Object|null} initialData - Section object (for edit) or null (for create)
 * @param {(payload: Object) => void} onSubmit - Called with the section payload
 * @param {() => void} onCancel - Close the dialog
 * @param {boolean} loading - Submitting state
 */
export default function SectionForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    academy: initialData?.academy ?? '',
    coach: initialData?.coach ?? null,
    players: initialData?.players || [],
    status: initialData?.status || 'active',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [academies, setAcademies] = useState([])
  const [academiesLoading, setAcademiesLoading] = useState(false)

  // Load academies for the dropdown
  const fetchAcademies = useCallback(async () => {
    setAcademiesLoading(true)
    try {
      const response = await listAcademies({ page: 1 })
      if (response.success) {
        setAcademies(response.data?.results || [])
      } else {
        setAcademies([])
      }
    } catch {
      setAcademies([])
    } finally {
      setAcademiesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAcademies()
  }, [fetchAcademies])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleCoachChange = (value) => {
    setFormData((prev) => ({ ...prev, coach: value }))
  }

  const handlePlayersChange = (value) => {
    setFormData((prev) => ({ ...prev, players: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Client-side validation
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'Section name is required'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || '',
      status: formData.status,
    }

    // academy: '' | number -> null or number
    payload.academy = formData.academy === '' || formData.academy === null ? null : Number(formData.academy)
    // coach: null or number
    payload.coach = formData.coach === '' || formData.coach === null || formData.coach === undefined
      ? null
      : Number(formData.coach)
    // players: array of numbers
    payload.players = (formData.players || []).map((p) => Number(p))

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-300">Section Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., U-15"
          value={formData.name}
          onChange={handleChange}
          className={cn(
            'bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10',
            fieldErrors.name && 'border-destructive'
          )}
        />
        {fieldErrors.name && (
          <p className="text-xs text-destructive">{fieldErrors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the section (optional)"
          value={formData.description}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
        />
      </div>

      {/* Academy */}
      <div className="space-y-2">
        <Label htmlFor="academy" className="text-gray-300">Academy</Label>
        <Select
          value={formData.academy === '' || formData.academy === null ? '__none__' : String(formData.academy)}
          onValueChange={(value) => handleSelectChange('academy', value === '__none__' ? '' : Number(value))}
        >
          <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
            <SelectValue placeholder={academiesLoading ? 'Loading academies...' : 'Select academy (optional)'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No Academy</SelectItem>
            {academies.map((academy) => (
              <SelectItem key={academy.id} value={String(academy.id)}>
                {academy.name}
                {academy.location ? ` — ${academy.location}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coach */}
      <div className="space-y-2">
        <Label htmlFor="coach" className="text-gray-300">Coach</Label>
        <CoachSelect
          value={formData.coach}
          onChange={handleCoachChange}
          disabled={loading}
          details={initialData?.coach_details || null}
        />
      </div>

      {/* Players */}
      <div className="space-y-2">
        <Label htmlFor="players" className="text-gray-300">Players</Label>
        <PlayerSelect
          value={formData.players}
          onChange={handlePlayersChange}
          disabled={loading}
          details={initialData?.players_details || []}
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-gray-300">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleSelectChange('status', value)}
        >
          <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
            <SelectValue placeholder="Select status" />
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
            isEditing ? 'Update Section' : 'Create Section'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}