import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { listCoaches } from '@/redux/api/adminUsers'
import { cn } from '@/lib/utils'

/**
 * CoachSelect — dropdown to pick a coach user from the coaches list.
 * Fetches coaches from `/api/v1/accounts/admin/coaches/`.
 *
 * @param {Object} props
 * @param {number|string|null} value - Selected coach user ID
 * @param {(value: number|string|null) => void} onChange - Called with the coach ID or null
 * @param {boolean} [disabled] - Disable the control
 * @param {string} [placeholder] - Placeholder text
 * @param {Object} [details] - The coach_details object from the section response (for edit mode label)
 */
export default function CoachSelect({ value, onChange, disabled = false, placeholder = 'Select coach (optional)', details = null }) {
  const [open, setOpen] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCoaches = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: 1 }
      if (debouncedSearch) params.search = debouncedSearch
      const response = await listCoaches(params)
      if (response.success) {
        setCoaches(response.data?.results || [])
      } else {
        setCoaches([])
      }
    } catch {
      setCoaches([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (open) {
      fetchCoaches()
    }
  }, [open, fetchCoaches])

  const selectedCoach = coaches.find((c) => String(c.id) === String(value))
  const selectedLabel = selectedCoach
    ? `${selectedCoach.first_name || ''} ${selectedCoach.last_name || ''}`.trim() ||
      selectedCoach.email
    : details
      ? `${details.first_name || ''} ${details.last_name || ''}`.trim() || details.full_name || details.email || ''
      : ''

  return (
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
            !value && 'text-gray-500'
          )}
        >
          {value && selectedLabel ? selectedLabel : placeholder}
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
            placeholder="Search coaches..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="text-white"
          />
          <CommandList>
            <CommandEmpty className="text-gray-400">No coaches found.</CommandEmpty>
            <CommandGroup>
              {/* Clear selection option */}
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="text-gray-300 data-selected:bg-white/10 data-selected:text-white cursor-pointer"
              >
                <span className="text-gray-500">— None / No coach —</span>
              </CommandItem>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              ) : (
                coaches.map((coach) => {
                  const name = `${coach.first_name || ''} ${coach.last_name || ''}`.trim()
                  const label = name || coach.email
                  return (
                    <CommandItem
                      key={coach.id}
                      value={String(coach.id)}
                      onSelect={() => {
                        onChange(coach.id)
                        setOpen(false)
                      }}
                      className="text-gray-300 data-selected:bg-white/10 data-selected:text-white cursor-pointer"
                    >
                      <span>{label}</span>
                      <span className="ml-auto text-xs text-gray-500">{coach.email}</span>
                    </CommandItem>
                  )
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}