import { useState } from 'react'
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
import { DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Integer (0+) performance stats shown as a grid of number inputs.
const STAT_FIELDS = [
  { name: 'goals', label: 'Goals' },
  { name: 'assists', label: 'Assists' },
  { name: 'minutes_played', label: 'Minutes Played' },
  { name: 'fouls', label: 'Fouls' },
  { name: 'yellow_cards', label: 'Yellow Cards' },
  { name: 'red_cards', label: 'Red Cards' },
  { name: 'shots', label: 'Shots' },
  { name: 'passes_completed', label: 'Passes Completed' },
  { name: 'tackles', label: 'Tackles' },
  { name: 'saves', label: 'Saves' },
]

function toString(value) {
  return value === null || value === undefined ? '' : String(value)
}

/** Pull the first human-readable string out of a DRF field error array/object. */
function errorText(error) {
  if (error == null) return null
  if (Array.isArray(error)) return error[0]
  if (typeof error === 'object') return Object.values(error)[0]
  return String(error)
}

/**
 * StudentReportForm — create/edit student performance report modal content.
 *
 * @param {Object} props
 * @param {Object|null} initialData - Report object for edit, or null for create.
 * @param {Array} players - All player options (from /api/v1/players/).
 * @param {Array} matches - All match options (from /api/v1/scheduling/matches/).
 * @param {Object} [serverErrors] - Field-level errors returned by the API.
 * @param {(field: string) => void} [onClearServerError] - Clear one server field error.
 * @param {() => void} [onResetServerErrors] - Clear all server field errors.
 * @param {(payload: Object) => void} onSubmit - Receives the report payload.
 * @param {() => void} onCancel - Close the dialog.
 * @param {boolean} [loading] - Submitting state.
 */
export default function StudentReportForm({
  initialData = null,
  players = [],
  matches = [],
  serverErrors = {},
  onClearServerError = () => {},
  onResetServerErrors = () => {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  const isEditing = !!initialData

  const buildEmpty = () => ({
    player: initialData?.player ? String(initialData.player) : '',
    match: initialData?.match ? String(initialData.match) : '',
    position: initialData?.position || '',
    goals: toString(initialData?.goals),
    assists: toString(initialData?.assists),
    minutes_played: toString(initialData?.minutes_played),
    fouls: toString(initialData?.fouls),
    yellow_cards: toString(initialData?.yellow_cards),
    red_cards: toString(initialData?.red_cards),
    shots: toString(initialData?.shots),
    passes_completed: toString(initialData?.passes_completed),
    tackles: toString(initialData?.tackles),
    saves: toString(initialData?.saves),
    rating: toString(initialData?.rating),
    summary: initialData?.summary || '',
    coach_remarks: initialData?.coach_remarks || '',
  })

  const [formData, setFormData] = useState(buildEmpty)
  const [fieldErrors, setFieldErrors] = useState({})
  const mergedField = { ...serverErrors, ...fieldErrors }
  const fieldError = (name) => errorText(mergedField[name])

  const getPlayerLabel = (player) => {
    const user = player.user
    const name = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    return name || user?.email || player.full_name || `Player #${player.id}`
  }

  const getMatchLabel = (match) => {
    const home = match.home_team_details?.name || match.home_team_name || 'Home'
    const away = match.away_team_details?.name || match.away_team_name || 'Away'
    const suffix = match.match_date
      ? ` · ${new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : ''
    return `${home} vs ${away}${suffix}`
  }
const clearServer = (name) => {
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    onClearServerError(name)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    // Non-negative integer guard — only for the numeric stat fields.
    const isIntField = STAT_FIELDS.some((f) => f.name === name)
    if (isIntField && value && !/^\d+$/.test(String(value))) return
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearServer(name)
  }

  const handleRatingChange = (e) => {
    const { value } = e.target
    if (value && !/^\d*(\.\d{0,2})?$/.test(value)) return
    setFormData((prev) => ({ ...prev, rating: value }))
    clearServer('rating')
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    clearServer(name)
  }

  const handleReset = () => {
    setFormData(buildEmpty())
    setFieldErrors({})
    onResetServerErrors()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onResetServerErrors()

    const errors = {}
    if (!formData.player) errors.player = 'Please select a student'
    if (formData.rating) {
      const rating = Number(formData.rating)
      if (Number.isNaN(rating)) errors.rating = 'Enter a valid rating'
      else if (rating < 0 || rating > 10) errors.rating = 'Rating must be between 0 and 10'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const toInt = (name) => {
      const raw = formData[name]
      return raw === '' ? 0 : Number(raw)
    }

    const payload = {
      player: Number(formData.player),
      match: formData.match ? Number(formData.match) : null,
      position: formData.position.trim() || null,
      goals: toInt('goals'),
      assists: toInt('assists'),
      minutes_played: toInt('minutes_played'),
      fouls: toInt('fouls'),
      yellow_cards: toInt('yellow_cards'),
      red_cards: toInt('red_cards'),
      shots: toInt('shots'),
      passes_completed: toInt('passes_completed'),
      tackles: toInt('tackles'),
      saves: toInt('saves'),
      rating: formData.rating.trim() === '' ? null : formData.rating.trim(),
      summary: formData.summary.trim() || null,
      coach_remarks: formData.coach_remarks.trim() || null,
    }
    onSubmit(payload)
  }
return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student (required) */}
      <div className="space-y-2">
        <Label htmlFor="player" className="text-gray-300">
          Student <span className="text-red-400">*</span>
        </Label>
        <Select value={formData.player} onValueChange={(v) => handleSelectChange('player', v)}>
          <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
            <SelectValue placeholder={players.length ? 'Select a student' : 'Loading students...'} />
          </SelectTrigger>
          <SelectContent>
            {players.length === 0 ? (
              <SelectItem value="__none__" disabled>
                No students available
              </SelectItem>
            ) : (
              players.map((player) => (
                <SelectItem key={player.id} value={String(player.id)}>
                  {getPlayerLabel(player)}
                  {player.academy_group ? ` (${player.academy_group})` : ''}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {fieldError('player') && <p className="text-xs text-red-400">{fieldError('player')}</p>}
      </div>

      {/* Match (optional) */}
      <div className="space-y-2">
        <Label htmlFor="match" className="text-gray-300">
          Match
        </Label>
        <Select
          value={formData.match === '' || formData.match === null ? '__none__' : formData.match}
          onValueChange={(v) => handleSelectChange('match', v === '__none__' ? '' : v)}
        >
          <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
            <SelectValue placeholder="Select a match (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No match</SelectItem>
{matches.map((match) => (
              <SelectItem key={match.id} value={String(match.id)}>
                {getMatchLabel(match)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError('match') && <p className="text-xs text-red-400">{fieldError('match')}</p>}
      </div>
{/* Position */}
      <div className="space-y-2">
        <Label htmlFor="position" className="text-gray-300">
          Position
        </Label>
        <Input
          id="position"
          name="position"
          type="text"
          placeholder="e.g. Forward, Defender, Goalkeeper"
          value={formData.position}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10"
        />
        {fieldError('position') && <p className="text-xs text-red-400">{fieldError('position')}</p>}
      </div>

      {/* Performance stats */}
      <div className="border border-border/40 bg-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-400 font-medium mb-3">Match Performance Stats</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAT_FIELDS.map((field) => {
            const err = fieldError(field.name)
            return (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-gray-300">
                  {field.label}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={cn(
                    'bg-white/5 border-border/50 text-white h-10',
                    err && 'border-red-500/50'
                  )}
                />
                {err && <p className="text-xs text-red-400">{err}</p>}
              </div>
            )
          })}
          {/* Rating (0-10 decimal) */}
          <div className="space-y-1.5">
            <Label htmlFor="rating" className="text-gray-300">
              Rating (0–10)
            </Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              inputMode="decimal"
              min="0"
              max="10"
              step="0.1"
              placeholder="e.g. 8.5"
              value={formData.rating}
              onChange={handleRatingChange}
              className={cn(
                'bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10',
                fieldError('rating') && 'border-red-500/50'
              )}
            />
            {fieldError('rating') && (
              <p className="text-xs text-red-400">{fieldError('rating')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary" className="text-gray-300">
          Summary
        </Label>
        <Textarea
          id="summary"
          name="summary"
          placeholder="Summarize the student's performance (optional)"
          value={formData.summary}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
        />
        {fieldError('summary') && <p className="text-xs text-red-400">{fieldError('summary')}</p>}
      </div>

      {/* Coach Remarks */}
      <div className="space-y-2">
        <Label htmlFor="coach_remarks" className="text-gray-300">
          Coach Remarks
        </Label>
        <Textarea
          id="coach_remarks"
          name="coach_remarks"
          placeholder="Coach notes and remarks (optional)"
          value={formData.coach_remarks}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
        />
        {fieldError('coach_remarks') && (
          <p className="text-xs text-red-400">{fieldError('coach_remarks')}</p>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
          Reset
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
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
            isEditing ? 'Update Report' : 'Create Report'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}