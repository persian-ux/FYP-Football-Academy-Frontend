import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
]

/**
 * Parse a 'YYYY-MM-DD' string into a local Date (avoids the UTC midnight
 * off-by-one shift from `new Date('YYYY-MM-DD')`).
 * @param {string} value
 * @returns {Date | undefined}
 */
function parseDateString(value) {
  if (!value) return undefined
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

/**
 * Format a Date as a 'YYYY-MM-DD' string to match the fee API contract.
 * @param {Date} date
 * @returns {string}
 */
function toDateString(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Validate an amount string: positive number with up to 2 decimal places.
 * @param {string} value
 * @returns {boolean}
 */
function isValidAmount(value) {
  if (!value || !value.trim()) return false
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return false
  return Number(trimmed) > 0
}

/**
 * FeeForm — create/edit fee modal content.
 *
 * @param {Object} props
 * @param {Object|null} initialData - StudentFeeRow for edit, or a preset
 *   `{ player_id, student_name }` when creating for a specific student.
 * @param {Array} students - All StudentFeeRow options used for the create
 *   student selector (students that already have a fee are excluded).
 * @param {(payload: Object) => void} onSubmit - Receives the fee payload.
 *   Create: `{ player, amount, status, due_date }` · Edit: `{ amount, status, due_date }`
 * @param {() => void} onCancel - Close the dialog
 * @param {boolean} loading - Submitting state
 */
export default function FeeForm({ initialData = null, students = [], onSubmit, onCancel, loading = false }) {
  const isEditing = !!initialData?.fee_id
  const [dueDateOpen, setDueDateOpen] = useState(false)

  const [formData, setFormData] = useState({
    player: initialData?.player_id ? String(initialData.player_id) : '',
    amount: initialData?.amount || '',
    status: initialData?.status || 'unpaid',
    due_date: initialData?.due_date || '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  // Students without a fee can have a new fee created for them.
  // Rows without a player_id have no Player profile yet, so exclude them.
  const createOptions = useMemo(
    () => students.filter((student) => !student.fee_id && student.player_id),
    [students]
  )

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Client-side validation
    const errors = {}
    if (!isEditing && !formData.player) {
      errors.player = 'Please select a student'
    }
    if (!isValidAmount(formData.amount)) {
      errors.amount = 'Enter a valid amount, e.g. 250.00'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      amount: formData.amount.trim(),
      status: formData.status,
      due_date: formData.due_date || null,
    }
    if (!isEditing) {
      payload.player = Number(formData.player)
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditing ? (
        <p className="text-xs text-gray-400">
          Updating fee for{' '}
          <span className="font-medium text-white">{initialData?.student_name || `Student #${initialData?.player_id}`}</span>
        </p>
      ) : (
        /* Student selector — create mode only */
        <div className="space-y-2">
          <Label htmlFor="player" className="text-gray-300">Student</Label>
          <Select value={formData.player} onValueChange={(value) => handleSelectChange('player', value)}>
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue
                placeholder={
                  createOptions.length
                    ? 'Select a student'
                    : 'All students already have a fee'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {createOptions.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No students available
                </SelectItem>
              ) : (
                createOptions.map((student) => (
                  <SelectItem key={student.id} value={String(student.player_id)}>
                    {student.student_name}
                    {student.academy_group ? ` (${student.academy_group})` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {fieldErrors.player && (
            <p className="text-xs text-red-400">{fieldErrors.player}</p>
          )}
        </div>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-gray-300">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={formData.amount}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10"
        />
        {fieldErrors.amount && (
          <p className="text-xs text-red-400">{fieldErrors.amount}</p>
        )}
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-gray-300">Status</Label>
        <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
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

      {/* Due date */}
      <div className="space-y-2">
        <Label htmlFor="due_date" className="text-gray-300">Due Date</Label>
        <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id="due_date"
              className="h-10 w-full justify-start gap-2 border-border/50 bg-white/5 font-normal text-white hover:bg-white/10 hover:text-white"
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-gray-500" />
              {formData.due_date ? (
                <span className="text-white">{format(parseDateString(formData.due_date), 'MMM d, yyyy')}</span>
              ) : (
                <span className="text-gray-500">Select a date</span>
              )}
              {formData.due_date && (
                <span
                  role="button"
                  tabIndex={0}
                  title="Clear date"
                  className="ml-auto flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChange({ target: { name: 'due_date', value: '' } })
                    setDueDateOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      handleChange({ target: { name: 'due_date', value: '' } })
                      setDueDateOpen(false)
                    }
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto border-border/50 bg-popover p-0">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              startMonth={new Date(2000, 0, 1)}
              endMonth={new Date(2050, 11, 31)}
              selected={parseDateString(formData.due_date)}
              onSelect={(date) => {
                handleChange({ target: { name: 'due_date', value: toDateString(date) } })
                setDueDateOpen(false)
              }}
            />
            <div className="flex items-center justify-between gap-2 border-t border-border/40 p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  handleChange({ target: { name: 'due_date', value: '' } })
                  setDueDateOpen(false)
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-white/10 hover:text-white"
                onClick={() => setDueDateOpen(false)}
              >
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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
            isEditing ? 'Update Fee' : 'Create Fee'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}