import { useCallback, useEffect, useState } from 'react'
import { Loader2, Shield, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PlayerSelect from '@/components/PlayerSelect'
import { getSection, patchSection } from '@/services/sectionService'
import { cn } from '@/lib/utils'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * SectionDetail — shows all section info including the assigned players list.
 * Admins can add/remove players via the PlayerSelect multi-select.
 *
 * @param {Object} props
 * @param {number|string} sectionId - Section ID
 * @param {boolean} [canEdit] - Whether the current user can edit (admin)
 * @param {() => void} [onChanged] - Called after a successful update (to refresh the list)
 */
export default function SectionDetail({ sectionId, canEdit = false, onChanged }) {
  const [section, setSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [savingPlayers, setSavingPlayers] = useState(false)

  const loadSection = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getSection(sectionId)
      if (response.success) {
        setSection(response.data)
        setSelectedPlayers(response.data.players || [])
      } else {
        setError(response.message || 'Failed to load section details')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load section details')
    } finally {
      setLoading(false)
    }
  }, [sectionId])

  useEffect(() => {
    loadSection()
  }, [loadSection])

  const handleSavePlayers = async () => {
    if (!section) return
    setSavingPlayers(true)
    try {
      const response = await patchSection(section.id, { players: selectedPlayers })
      if (response.success) {
        toast.success(response.message || 'Players updated successfully!')
        setSection(response.data)
        setSelectedPlayers(response.data.players || [])
        if (onChanged) onChanged()
      } else {
        const errMsg = response.errors
          ? Object.values(response.errors).flat().join(', ')
          : response.message || 'Failed to update players'
        toast.error(errMsg)
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to update players'
      if (errData?.errors) {
        toast.error(Object.values(errData.errors).flat().join(', '))
      } else {
        toast.error(message)
      }
    } finally {
      setSavingPlayers(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-28 w-full bg-white/5" />
        <Skeleton className="h-20 w-full bg-white/5" />
        <Skeleton className="h-32 w-full bg-white/5" />
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

  if (!section) return null

  const coachName = section.coach_details
    ? `${section.coach_details.first_name || ''} ${section.coach_details.last_name || ''}`.trim() ||
      section.coach_details.full_name ||
      section.coach_details.email ||
      '—'
    : '—'

  const academyName = section.academy_details?.name || '—'
  const isActive = section.status === 'active'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white">{section.name}</h3>
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
          <p className="text-sm text-gray-400 mt-1">
            {section.description || 'No description'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <p>Created: {formatDate(section.created_at)}</p>
          {section.updated_at && (
            <p className="mt-0.5">Updated: {formatDateTime(section.updated_at)}</p>
          )}
        </div>
      </div>

      {/* Key info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/30 bg-white/5 p-3">
          <p className="text-xs text-gray-500 mb-1">Academy</p>
          <p className="text-sm text-white font-medium">{academyName}</p>
          {section.academy_details?.location && (
            <p className="text-xs text-gray-500 mt-0.5">{section.academy_details.location}</p>
          )}
        </div>
        <div className="rounded-lg border border-border/30 bg-white/5 p-3">
          <p className="text-xs text-gray-500 mb-1">Coach</p>
          <p className="text-sm text-white font-medium">{coachName}</p>
          {section.coach_details?.email && (
            <p className="text-xs text-gray-500 mt-0.5">{section.coach_details.email}</p>
          )}
        </div>
      </div>

      {/* Players management (admin only) */}
      {canEdit ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              Assigned Players ({section.player_count || section.players?.length || 0})
            </h4>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSavePlayers}
                disabled={savingPlayers}
                className="text-white border-border/50"
              >
                {savingPlayers ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Players'
                )}
              </Button>
            </div>
          </div>
          <PlayerSelect
            value={selectedPlayers}
            onChange={setSelectedPlayers}
            details={section.players_details || []}
          />
          {JSON.stringify([...selectedPlayers].sort()) !== JSON.stringify([...(section.players || [])].sort()) ? (
            <p className="text-xs text-amber-400">
              You have unsaved player changes. Click "Save Players" to apply.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-400" />
            Assigned Players ({section.player_count || section.players?.length || 0})
          </h4>
          {section.players_details?.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-left">
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Player</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(section.players_details || []).map((player) => (
                    <tr key={player.id} className="border-b border-border/20 last:border-0">
                      <td className="px-3 py-2 text-white">{player.full_name || `Player #${player.id}`}</td>
                      <td className="px-3 py-2">
                        <span className={cn('text-xs', player.status === 'active' ? 'text-emerald-400' : 'text-gray-500')}>
                          {player.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No players assigned to this section.</p>
          )}
        </div>
      )}

      {/* ID */}
      <div className="flex items-center justify-between py-2 border-t border-border/20">
        <div className="flex items-center gap-2 text-gray-400">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Section ID</span>
        </div>
        <span className="text-sm text-white">#{section.id}</span>
      </div>
    </div>
  )
}