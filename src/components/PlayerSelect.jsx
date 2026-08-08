import { useCallback, useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { listPlayersFromModule } from '@/services/sectionService'
import { cn } from '@/lib/utils'

/**
 * PlayerSelect — multi-select picker for players with search.
 * Fetches players from `/api/v1/players/` (Player model, not User model).
 *
 * @param {Object} props
 * @param {Array<number|string>} value - Array of selected player IDs
 * @param {(value: Array<number|string>) => void} onChange - Called with the full array of player IDs
 * @param {boolean} [disabled] - Disable the control
 * @param {string} [placeholder] - Placeholder text
 * @param {Array<Object>} [details] - The players_details array from the section response (for edit mode labels)
 */
export default function PlayerSelect({ value = [], onChange, disabled = false, placeholder = 'Select players (optional)', details = [] }) {
  const [open, setOpen] = useState(false)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: 1 }
      if (debouncedSearch) params.search = debouncedSearch
      const response = await listPlayersFromModule(params)
      if (response.success) {
        setPlayers(response.data?.results || [])
      } else {
        setPlayers([])
      }
    } catch {
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (open) {
      fetchPlayers()
    }
  }, [open, fetchPlayers])

  const selectedSet = new Set(value.map((v) => String(v)))

  // Player model has a nested `user` object; players_details has `full_name`
  const getPlayerLabel = (player) => {
    if (player.full_name) return player.full_name
    const user = player.user
    if (user) {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
      return name || user.email || `Player #${player.id}`
    }
    const name = `${player.first_name || ''} ${player.last_name || ''}`.trim()
    return name || player.email || `Player #${player.id}`
  }

  const togglePlayer = (playerId) => {
    const strId = String(playerId)
    if (selectedSet.has(strId)) {
      onChange(value.filter((v) => String(v) !== strId))
    } else {
      onChange([...value, playerId])
    }
  }

  const selectedPlayers = players.filter((p) => selectedSet.has(String(p.id)))

  // Merge selected players with details for edit-mode label fallbacks
  const allSelected = [
    ...selectedPlayers,
    ...details.filter((d) => !selectedSet.has(String(d.id))),
  ].filter((p, index, arr) => arr.findIndex((x) => String(x.id) === String(p.id)) === index)

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-10 w-full justify-between bg-white/5 border-border/50 text-white font-normal hover:bg-white/5 hover:text-white',
              value.length === 0 && 'text-gray-500'
            )}
          >
            {value.length > 0 ? `${value.length} player${value.length > 1 ? 's' : ''} selected` : placeholder}
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-gray-500" />
            ) : (
              <span className="ml-2 text-gray-500">▾</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0 bg-popover border-border/50">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search players..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="text-white"
            />
            <CommandList>
              <CommandEmpty className="text-gray-400">No players found.</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                  </div>
                ) : (
                  players.map((player) => {
                    const isSelected = selectedSet.has(String(player.id))
                    const label = getPlayerLabel(player)
                    return (
                      <CommandItem
                        key={player.id}
                        value={String(player.id)}
                        onSelect={() => togglePlayer(player.id)}
                        className={cn(
                          'text-gray-300 data-selected:bg-white/10 data-selected:text-white cursor-pointer',
                          isSelected && 'bg-blue-500/10 text-blue-400'
                        )}
                      >
                        <span>{label}</span>
                        <span className="ml-auto text-xs text-gray-500">
                          {isSelected ? '✓ Selected' : ''}
                        </span>
                      </CommandItem>
                    )
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected players badges */}
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allSelected.map((player) => (
            <Badge
              key={player.id}
              variant="secondary"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 pr-1.5 gap-1"
            >
              {getPlayerLabel(player)}
              <button
                type="button"
                onClick={() => togglePlayer(player.id)}
                disabled={disabled}
                className="rounded-full hover:bg-white/10 p-0.5 transition-colors disabled:opacity-50"
                aria-label={`Remove ${getPlayerLabel(player)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
