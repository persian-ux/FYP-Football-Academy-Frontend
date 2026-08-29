import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Wallet,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Info,
  Check,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications()

  const [filter, setFilter] = useState('all')

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'fee') return n.category === 'fee'
    if (filter === 'match') return n.category === 'match'
    if (filter === 'system') return n.category === 'system'
    return true
  })

  const getCategoryIcon = (category, severity) => {
    switch (category) {
      case 'fee':
        return severity === 'urgent' ? (
          <ShieldAlert className="h-4 w-4 text-red-400" />
        ) : severity === 'success' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Wallet className="h-4 w-4 text-amber-400" />
        )
      case 'match':
        return <CalendarDays className="h-4 w-4 text-blue-400" />
      default:
        return <Info className="h-4 w-4 text-purple-400" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#121820]/95 backdrop-blur-xl p-0 text-white shadow-2xl ring-1 ring-black/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <Bell className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-white">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs px-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 px-2"
            >
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 bg-black/20 p-1.5 px-3 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'fee', label: 'Fees' },
            { id: 'match', label: 'Matches' },
            { id: 'system', label: 'System' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 font-medium transition-all',
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 mb-2">
                <Bell className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-gray-300">No notifications found</p>
              <p className="text-[11px] text-gray-500">You are all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  'group relative flex gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/5',
                  !notif.isRead ? 'bg-blue-500/5' : 'opacity-80'
                )}
              >
                {/* Status Dot for Unread */}
                {!notif.isRead && (
                  <span className="absolute top-3.5 left-1.5 h-2 w-2 rounded-full bg-blue-500" />
                )}

                {/* Category Icon */}
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10',
                    notif.category === 'fee' && notif.severity === 'urgent'
                      ? 'bg-red-500/10 border-red-500/30'
                      : notif.category === 'fee' && notif.severity === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : notif.category === 'match'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-purple-500/10 border-purple-500/30'
                  )}
                >
                  {getCategoryIcon(notif.category, notif.severity)}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-1 pr-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white group-hover:text-blue-300">
                      {notif.title}
                    </span>
                    {notif.status && (
                      <Badge
                        className={cn(
                          'text-[10px] px-1.5 py-0 font-bold uppercase',
                          notif.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        )}
                      >
                        {notif.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-snug line-clamp-2">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
                    <span>Just now</span>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        className="inline-flex items-center text-blue-400 hover:underline gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View details <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearNotification(notif.id)
                  }}
                  className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-2.5 text-center bg-black/20">
          <Link
            to="/admin/fees"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Manage All Fees & Match Alerts →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
