import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function NotificationBanners() {
  const { notifications } = useNotifications()
  const [dismissed, setDismissed] = useState([])

  // Extract fee and match notifications
  const feeNotif = notifications.find(
    (n) => n.category === 'fee' && !dismissed.includes(n.id)
  )
  const matchNotif = notifications.find(
    (n) => n.category === 'match' && !dismissed.includes(n.id)
  )

  if (!feeNotif && !matchNotif) return null

  const handleDismiss = (id) => {
    setDismissed((prev) => [...prev, id])
  }

  return (
    <div className="space-y-3 mb-6">
      {/* 1. Fee Status Banner */}
      {feeNotif && (
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-lg transition-all duration-300',
            feeNotif.severity === 'urgent' || feeNotif.status === 'unpaid' || feeNotif.status === 'overdue'
              ? 'border-red-500/30 bg-gradient-to-r from-red-950/40 via-amber-950/20 to-card/60 text-red-200 shadow-red-950/20'
              : feeNotif.severity === 'warning'
                ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-card/60 text-amber-200'
                : 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-card/60 text-emerald-200'
          )}
        >
          {/* Subtle Ambient Glow */}
          <div
            className={cn(
              'absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl pointer-events-none',
              feeNotif.severity === 'urgent' || feeNotif.status === 'unpaid'
                ? 'bg-red-500/10'
                : 'bg-emerald-500/10'
            )}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  feeNotif.severity === 'urgent' || feeNotif.status === 'unpaid'
                    ? 'border-red-500/40 bg-red-500/20 text-red-400'
                    : feeNotif.severity === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/20 text-amber-400'
                      : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                )}
              >
                {feeNotif.severity === 'urgent' || feeNotif.status === 'unpaid' ? (
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                ) : feeNotif.severity === 'warning' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white tracking-wide">
                    {feeNotif.title}
                  </h4>
                  {feeNotif.status && (
                    <Badge
                      className={cn(
                        'text-xs font-extrabold uppercase px-2 py-0.5',
                        feeNotif.status === 'paid'
                          ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                          : 'bg-red-500/30 text-red-300 border-red-500/50'
                      )}
                    >
                      {feeNotif.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  {feeNotif.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Link to="/admin/fees">
                <Button
                  size="sm"
                  className={cn(
                    'h-8 text-xs font-semibold rounded-xl transition-all shadow-md',
                    feeNotif.status === 'unpaid' || feeNotif.status === 'overdue'
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/30'
                      : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                  )}
                >
                  <Wallet className="mr-1.5 h-3.5 w-3.5" />
                  {feeNotif.status === 'unpaid' || feeNotif.status === 'overdue'
                    ? 'Pay / View Fee Details'
                    : 'View Fee History'}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>

              <button
                onClick={() => handleDismiss(feeNotif.id)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Next Match Highlight Banner */}
      {matchNotif && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-card/60 p-4 backdrop-blur-xl shadow-lg shadow-blue-950/20">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/20 text-blue-400">
                <Flame className="h-5 w-5 text-blue-400 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white tracking-wide">
                    {matchNotif.title}
                  </h4>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] uppercase font-bold">
                    NEXT FIXTURE
                  </Badge>
                </div>
                <p className="text-xs text-blue-100/90 mt-1 leading-relaxed font-medium">
                  {matchNotif.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Link to="/scheduling">
                <Button
                  size="sm"
                  className="h-8 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/30"
                >
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  View Match Schedule
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>

              <button
                onClick={() => handleDismiss(matchNotif.id)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
