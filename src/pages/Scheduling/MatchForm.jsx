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
import { DialogFooter } from '@/components/ui/dialog'
import { listTeams, toApiDateTime, toInputDateTime } from '@/services/schedulingService'

/**
 * MatchForm — create/edit match modal content.
 *
 * @param {Object} props
 * @param {Object|null} initialData - Match object (for edit) or null (for create)
 * @param {(payload: Object) => void} onSubmit - Called with the match payload
 * @param {() => void} onCancel - Close the dialog
 * @param {boolean} loading - Submitting state
 */
export default function MatchForm({ initialData = null, onSubmit, onCancel, loading = false }) {
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    home_team: initialData?.home_team ?? '',
    away_team: initialData?.away_team ?? '',
    match_date: toInputDateTime(initialData?.match_date) || '',
    venue: initialData?.venue || '',
    notes: initialData?.notes || '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [teams, setTeams] = useState([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true)
    try {
      const response = await listTeams({ page: 1, page_size: 200 })
      if (response?.success) {
        setTeams(response.data?.results || [])
      } else {
        setTeams([])
      }
    } catch {
      setTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // Home and away teams must be different — clear the other if they collide
      if (name === 'home_team' && value && value === prev.away_team) {
        next.away_team = ''
      }
      if (name === 'away_team' && value && value === prev.home_team) {
        next.home_team = ''
      }
      return next
    })
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFieldErrors({})

    // Client-side validation matching backend serializers
    const errors = {}
    if (!formData.home_team) {
      errors.home_team = 'Home team is required'
    }
    if (!formData.away_team) {
      errors.away_team = 'Away team is required'
    } else if (formData.home_team && formData.home_team === formData.away_team) {
      errors.away_team = 'Home and away teams must be different'
    }
    if (!formData.match_date) {
      errors.match_date = 'Match date and time is required'
    }
    if (!formData.venue.trim()) {
      errors.venue = 'Venue is required'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    const payload = {
      home_team: Number(formData.home_team),
      away_team: Number(formData.away_team),
      match_date: toApiDateTime(formData.match_date),
      venue: formData.venue.trim(),
      notes: formData.notes.trim() || '',
    }
    onSubmit(payload)
  }

  const teamOptions = (excludeId) =>
    teams.filter((t) => String(t.id) !== String(excludeId))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Home team */}
        <div className="space-y-2">
          <Label htmlFor="home_team" className="text-gray-300">
            Home Team
          </Label>
          <Select
            value={formData.home_team ? String(formData.home_team) : '__none__'}
            onValueChange={(value) => handleSelectChange('home_team', value === '__none__' ? '' : Number(value))}
          >
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue placeholder={teamsLoading ? 'Loading teams...' : 'Select home team'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select home team</SelectItem>
              {teamOptions(formData.away_team).map((team) => (
                <SelectItem key={team.id} value={String(team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.home_team && (
            <p className="text-xs text-red-400">{fieldErrors.home_team}</p>
          )}
        </div>

        {/* Away team */}
        <div className="space-y-2">
          <Label htmlFor="away_team" className="text-gray-300">
            Away Team
          </Label>
          <Select
            value={formData.away_team ? String(formData.away_team) : '__none__'}
            onValueChange={(value) => handleSelectChange('away_team', value === '__none__' ? '' : Number(value))}
          >
            <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full">
              <SelectValue placeholder={teamsLoading ? 'Loading teams...' : 'Select away team'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select away team</SelectItem>
              {teamOptions(formData.home_team).map((team) => (
                <SelectItem key={team.id} value={String(team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.away_team && (
            <p className="text-xs text-red-400">{fieldErrors.away_team}</p>
          )}
        </div>
      </div>


      {/* Match date */}
      <div className="space-y-2">
        <Label htmlFor="match_date" className="text-gray-300">
          Match Date &amp; Time
        </Label>
        <Input
          id="match_date"
          name="match_date"
          type="datetime-local"
          value={formData.match_date}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white h-10 [color-scheme:dark]"
        />
        {fieldErrors.match_date && (
          <p className="text-xs text-red-400">{fieldErrors.match_date}</p>
        )}
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <Label htmlFor="venue" className="text-gray-300">
          Venue
        </Label>
        <Input
          id="venue"
          name="venue"
          placeholder="e.g. Academy Main Stadium"
          value={formData.venue}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500"
        />
        {fieldErrors.venue && <p className="text-xs text-red-400">{fieldErrors.venue}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-gray-300">
          Notes
        </Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Optional notes"
          value={formData.notes}
          onChange={handleChange}
          className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
        />
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
            isEditing ? 'Update Match' : 'Create Match'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

