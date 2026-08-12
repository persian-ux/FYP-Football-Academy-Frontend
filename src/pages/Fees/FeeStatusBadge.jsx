import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Colored status badge for fee statuses.
 * paid → green, unpaid → red, overdue → orange, pending → yellow.
 *
 * @param {Object} props
 * @param {string} status - One of 'paid' | 'unpaid' | 'pending' | 'overdue'
 * @param {string} [className] - Extra classes to merge onto the badge
 */
const STATUS_META = {
  paid: {
    label: 'Paid',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  unpaid: {
    label: 'Unpaid',
    dot: 'bg-red-400',
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  overdue: {
    label: 'Overdue',
    dot: 'bg-orange-400',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
}

const FALLBACK_META = {
  label: 'N/A',
  dot: 'bg-gray-400',
  badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function FeeStatusBadge({ status, className }) {
  const meta = STATUS_META[status] || FALLBACK_META
  return (
    <Badge variant="secondary" className={cn(meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  )
}