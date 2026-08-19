import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Colored status badge for match statuses.
 * scheduled → blue, postponed → amber, cancelled → red, completed → emerald.
 *
 * @param {Object} props
 * @param {string} status - One of 'scheduled' | 'postponed' | 'cancelled' | 'completed'
 * @param {string} [className] - Extra classes to merge onto the badge
 */
const STATUS_META = {
  scheduled: {
    label: 'Scheduled',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  postponed: {
    label: 'Postponed',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-red-400',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
}

const FALLBACK_META = {
  label: 'N/A',
  dot: 'bg-gray-400',
  badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function MatchStatusBadge({ status, className }) {
  const meta = STATUS_META[status] || FALLBACK_META
  return (
    <Badge variant="secondary" className={cn(meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  )
}

export const MATCH_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]
