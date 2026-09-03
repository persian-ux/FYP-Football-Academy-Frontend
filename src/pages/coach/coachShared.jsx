import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/** Today's date as 'YYYY-MM-DD' in local time. */
export function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format a date string for display. */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** User initials for avatars. */
export function getInitials(name) {
  return (
    (name || '')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
}

/** Stat card used across the coach dashboard (matches the admin design). */
export function CoachStatCard({ title, value, icon: Icon, loading, color = 'emerald', subtitle, onClick }) {
  const themes = {
    emerald: {
      gradient: 'from-emerald-500/15 via-emerald-600/5 to-transparent border-emerald-500/30 text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    },
    blue: {
      gradient: 'from-blue-500/15 via-blue-600/5 to-transparent border-blue-500/30 text-blue-400',
      iconBg: 'bg-blue-500/20 text-blue-400',
    },
    amber: {
      gradient: 'from-amber-500/15 via-amber-600/5 to-transparent border-amber-500/30 text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400',
    },
    purple: {
      gradient: 'from-purple-500/15 via-purple-600/5 to-transparent border-purple-500/30 text-purple-400',
      iconBg: 'bg-purple-500/20 text-purple-400',
    },
  }
  const theme = themes[color] || themes.emerald

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden border bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1',
        theme.gradient,
        onClick && 'cursor-pointer'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className={cn('rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110', theme.iconBg)}>
            <Icon className="size-5" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-20 bg-white/5" />
        ) : (
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
        )}
        {subtitle && !loading && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

/** Section page header. */
export function SectionHeader({ title, description, icon: Icon, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Empty state placeholder. */
export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center">
      {Icon && <Icon className="mx-auto mb-3 h-8 w-8 text-gray-600" />}
      <p className="text-sm font-medium text-gray-300">{title}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Error state with retry. */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-400" />
      <p className="text-sm text-rose-200">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

/** Table skeleton rows for loading states. */
export function TableSkeleton({ rows = 5, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/5" />
      ))}
    </div>
  )
}
