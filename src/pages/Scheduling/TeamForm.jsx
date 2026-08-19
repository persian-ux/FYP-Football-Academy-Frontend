import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import CoachSelect from '@/components/CoachSelect'

/**
 * TeamForm — create/edit team modal content.
 *
 * @param {Object} props
 * @param {Object|null} initialData - Team object (for edit) or null (for create)
 * @param {(payload: Object) => void} onSubmit - Called with the team payload
 * @param {() => void} onCancel - Close the dialog
 * @param {boolean} loading - Submitting state
 */
export default function TeamForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    short_code: initialData?.short_code || '',
    description: initialData?.description || '',
    coach: initialData?.coach ?? null,
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleCoachChange = (value) => {
    setFormData((prev) => ({ ...prev, coach: value }))
    if (fieldErrors.coach) {
      setFieldErrors((prev) => ({ ...prev, coach: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Client-side validation matching backend serializers
    const errors = {}
    if (!formData.name.trim()) {
      errors.name = 'Team name is required'
    }
    if (formData.short_code && formData.short_code.trim().length > 10) {
      errors.short_code = 'Short code must be 10 characters or less'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      name: formData.name.trim(),
      short_code: formData.short_code.trim() || null,
      description: formData.description.trim() || '',
    }
    if (formData.coach) {
      payload.coach = formData.coach
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-300">
          Team Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Under-15 Falcons"
          value={formData.name}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500"
        />
        {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
      </div>

      {/* Short code */}
      <div className="space-y-2">
        <Label htmlFor="short_code" className="text-gray-300">
          Short Code
        </Label>
        <Input
          id="short_code"
          name="short_code"
          placeholder="e.g. U15-FAL (optional)"
          maxLength={10}
          value={formData.short_code}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500"
        />
        {fieldErrors.short_code && <p className="text-xs text-red-400">{fieldErrors.short_code}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the team (optional)"
          value={formData.description}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
        />
      </div>

      {/* Coach */}
      <div className="space-y-2">
        <Label htmlFor="coach" className="text-gray-300">
          Coach
        </Label>
        <CoachSelect
          value={formData.coach}
          onChange={handleCoachChange}
          disabled={loading}
          details={initialData?.coach_details || null}
        />
        {fieldErrors.coach && <p className="text-xs text-red-400">{fieldErrors.coach}</p>}
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
            isEditing ? 'Update Team' : 'Create Team'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
