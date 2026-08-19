import { useEffect, useState } from 'react'
import { CalendarClock, CalendarX2, Loader2, Plus, Trash2, Trophy, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { toApiDateTime, toInputDateTime } from '@/services/schedulingService'

const ACTION_META = {
  reschedule: {
    title: 'Reschedule Match',
    icon: CalendarClock,
    accent: 'text-blue-400',
    description: 'Change the date/time and optionally the venue of this match.',
  },
  postpone: {
    title: 'Postpone Match',
    icon: CalendarX2,
    accent: 'text-amber-400',
    description: 'Mark this match as postponed, optionally with a new date and reason.',
  },
  cancel: {
    title: 'Cancel Match',
    icon: XCircle,
    accent: 'text-red-400',
    description: 'Mark this match as cancelled. This cannot be undone.',
  },
  complete: {
    title: 'Complete Match',
    icon: Trophy,
    accent: 'text-emerald-400',
    description: 'Enter the final score and optionally record goal events. The winner is calculated automatically.',
  },
}

const DEFAULT_EVENT = { team: '', minute: '', scorer_name: '', assist_name: '' }

function getMatchLabel(match) {
  if (!match) return ''
  return `${match.home_team_details?.name || 'Home'} vs ${match.away_team_details?.name || 'Away'}`
}

/**
 * MatchActionDialog — dialog for the match action flows.
 *
 * @param {Object} props
 * @param {boolean} open - Whether the dialog is open
 * @param {Object|null} match - The match being acted on
 * @param {'reschedule'|'postpone'|'cancel'|'complete'} action - Which flow
 * @param {boolean} submitting - Submitting state (prevents duplicate submits)
 * @param {() => void} onClose - Close the dialog
 * @param {(action: string, payload: Object) => void} onSubmit - Submit handler
 */
export default function MatchActionDialog({
  open,
  match = null,
  action = 'reschedule',
  submitting = false,
  onClose,
  onSubmit,
}) {
  const meta = ACTION_META[action] || ACTION_META.reschedule
  const Icon = meta.icon

  // ------------------------- Form state -------------------------
  const [newDate, setNewDate] = useState('')
  const [newVenue, setNewVenue] = useState('')
  const [notes, setNotes] = useState('')
  const [homeScore, setHomeScore] = useState('0')
  const [awayScore, setAwayScore] = useState('0')
  const [durationMinutes, setDurationMinutes] = useState('90')
  const [events, setEvents] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  // Reset form whenever the dialog opens for a (new) match
  useEffect(() => {
    if (open) {
      setNewDate(toInputDateTime(match?.match_date) || '')
      setNewVenue(match?.venue || '')
      setNotes('')
      setHomeScore(String(match?.result?.home_score ?? 0))
      setAwayScore(String(match?.result?.away_score ?? 0))
      setDurationMinutes(String(match?.result?.duration_minutes ?? 90))
      setEvents([])
      setFieldErrors({})
    }
  }, [open, match])

  const handleEventChange = (index, field, value) => {
    setEvents((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    )
  }

  const addEvent = () => {
    setEvents((prev) => [...prev, { ...DEFAULT_EVENT }])
  }

  const removeEvent = (index) => {
    setEvents((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    setFieldErrors({})
    const errors = {}

    if (action === 'reschedule') {
      if (!newDate) errors.new_date = 'New date and time is required'
    }

    if (action === 'complete') {
      const home = Number(homeScore)
      const away = Number(awayScore)
      const duration = Number(durationMinutes)
      if (homeScore === '' || Number.isNaN(home) || home < 0 || !Number.isInteger(home)) {
        errors.home_score = 'Home score must be an integer ≥ 0'
      }
      if (awayScore === '' || Number.isNaN(away) || away < 0 || !Number.isInteger(away)) {
        errors.away_score = 'Away score must be an integer ≥ 0'
      }
      if (durationMinutes === '' || Number.isNaN(duration) || duration < 1 || duration > 300) {
        errors.duration_minutes = 'Duration must be between 1 and 300 minutes'
      }
      events.forEach((ev, i) => {
        if (!ev.team) errors[`event_${i}_team`] = 'Select a team'
        const minute = Number(ev.minute)
        if (ev.minute === '' || Number.isNaN(minute) || minute < 1 || minute > 120 || !Number.isInteger(minute)) {
          errors[`event_${i}_minute`] = 'Minute must be between 1 and 120'
        }
      })
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    let payload = {}
    if (action === 'reschedule') {
      payload = { new_date: toApiDateTime(newDate) }
      if (newVenue.trim()) payload.new_venue = newVenue.trim()
    } else if (action === 'postpone') {
      payload = {}
      if (newDate) payload.new_date = toApiDateTime(newDate)
      if (notes.trim()) payload.notes = notes.trim()
    } else if (action === 'cancel') {
      payload = {}
      if (notes.trim()) payload.notes = notes.trim()
    } else if (action === 'complete') {
      payload = {
        home_score: Number(homeScore),
        away_score: Number(awayScore),
        duration_minutes: Number(durationMinutes),
        events: events.map((ev) => ({
          event_type: 'goal',
          team: Number(ev.team),
          minute: Number(ev.minute),
          scorer_name: ev.scorer_name.trim() || '',
          assist_name: ev.assist_name.trim() || '',
        })),
      }
    }
    onSubmit(action, payload)
  }

  const isReschedule = action === 'reschedule'
  const isPostpone = action === 'postpone'
  const isCancel = action === 'cancel'
  const isComplete = action === 'complete'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg bg-popover border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Icon className={`w-5 h-5 ${meta.accent}`} />
            {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        {match && (
          <div className="rounded-lg border border-border/50 bg-white/5 px-3 py-2 text-sm text-gray-300">
            {getMatchLabel(match)}
            <span className="text-gray-500"> — {match.venue || 'No venue'}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Reschedule: new date + venue */}
          {(isReschedule || isPostpone) && (
            <div className="space-y-2">
              <Label htmlFor="action_date" className="text-gray-300">
                {isReschedule ? 'New Date & Time' : 'New Date & Time (optional)'}
              </Label>
              <Input
                id="action_date"
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-white/5 border-border/50 text-white h-10 [color-scheme:dark]"
              />
              {fieldErrors.new_date && (
                <p className="text-xs text-red-400">{fieldErrors.new_date}</p>
              )}
            </div>
          )}

          {isReschedule && (
            <div className="space-y-2">
              <Label htmlFor="new_venue" className="text-gray-300">
                New Venue (optional)
              </Label>
              <Input
                id="new_venue"
                placeholder="e.g. Alternate Training Ground"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                className="bg-white/5 border-border/50 text-white placeholder:text-gray-500"
              />
            </div>
          )}

          {/* Postpone / Cancel: notes */}
          {(isPostpone || isCancel) && (
            <div className="space-y-2">
              <Label htmlFor="action_notes" className="text-gray-300">
                {isPostpone ? 'Postponement reason (optional)' : 'Cancellation reason (optional)'}
              </Label>
              <Textarea
                id="action_notes"
                placeholder={isPostpone ? 'e.g. Weather conditions' : 'e.g. Team unavailable'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white/5 border-border/50 text-white placeholder:text-gray-500 min-h-20"
              />
            </div>
          )}


          {/* Complete: scores + duration */}
          {isComplete && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home_score" className="text-gray-300">
                    {match?.home_team_details?.name || 'Home'} Score
                  </Label>
                  <Input
                    id="home_score"
                    type="number"
                    min="0"
                    step="1"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="bg-white/5 border-border/50 text-white h-10 [color-scheme:dark]"
                  />
                  {fieldErrors.home_score && (
                    <p className="text-xs text-red-400">{fieldErrors.home_score}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away_score" className="text-gray-300">
                    {match?.away_team_details?.name || 'Away'} Score
                  </Label>
                  <Input
                    id="away_score"
                    type="number"
                    min="0"
                    step="1"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="bg-white/5 border-border/50 text-white h-10 [color-scheme:dark]"
                  />
                  {fieldErrors.away_score && (
                    <p className="text-xs text-red-400">{fieldErrors.away_score}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-gray-300">
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="bg-white/5 border-border/50 text-white h-10 w-40 [color-scheme:dark]"
                />
                {fieldErrors.duration_minutes && (
                  <p className="text-xs text-red-400">{fieldErrors.duration_minutes}</p>
                )}
              </div>
            </>
          )}


          {/* Complete: goal events */}
          {isComplete && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Goal Events (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addEvent} className="border-border/50 text-gray-300">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No goal events recorded. You can add them after entering the score.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={i} className="rounded-lg border border-border/50 bg-white/5 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Goal {i + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-gray-400 hover:text-red-400"
                          onClick={() => removeEvent(i)}
                          aria-label="Remove goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Select
                            value={ev.team ? String(ev.team) : '__none__'}
                            onValueChange={(v) => handleEventChange(i, 'team', v === '__none__' ? '' : Number(v))}
                          >
                            <SelectTrigger className="bg-white/5 border-border/50 text-white h-9 w-full">
                              <SelectValue placeholder="Team" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Team</SelectItem>
                              {match?.home_team && (
                                <SelectItem value={String(match.home_team)}>
                                  {match.home_team_details?.name || 'Home'}
                                </SelectItem>
                              )}
                              {match?.away_team && (
                                <SelectItem value={String(match.away_team)}>
                                  {match.away_team_details?.name || 'Away'}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {fieldErrors[`event_${i}_team`] && (
                            <p className="text-xs text-red-400">{fieldErrors[`event_${i}_team`]}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="1"
                            max="120"
                            step="1"
                            placeholder="Minute"
                            value={ev.minute}
                            onChange={(e) => handleEventChange(i, 'minute', e.target.value)}
                            className="bg-white/5 border-border/50 text-white h-9 [color-scheme:dark]"
                          />
                          {fieldErrors[`event_${i}_minute`] && (
                            <p className="text-xs text-red-400">{fieldErrors[`event_${i}_minute`]}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Scorer name"
                          value={ev.scorer_name}
                          onChange={(e) => handleEventChange(i, 'scorer_name', e.target.value)}
                          className="bg-white/5 border-border/50 text-white h-9 placeholder:text-gray-500"
                        />
                        <Input
                          placeholder="Assist name"
                          value={ev.assist_name}
                          onChange={(e) => handleEventChange(i, 'assist_name', e.target.value)}
                          className="bg-white/5 border-border/50 text-white h-9 placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            className={
              isCancel
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
            }
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isComplete ? 'Saving Result...' : 'Saving...'}
              </span>
            ) : (
              meta.title
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

