import { useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardCheck,
  CalendarDays,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const COACH_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'scheduling', label: 'Teams & Matches', icon: CalendarDays },
  { id: 'reports', label: 'Student Reports', icon: ClipboardList },
]

const NAV_HREFS = Object.fromEntries(
  COACH_NAV_ITEMS.map((item) => [item.id, `/dashboard?section=${item.id}`])
)

/**
 * CoachLayout — coach-specific sidebar navigation shell.
 * Desktop: persistent collapsible sidebar (same design language as AdminLayout).
 * Mobile: sticky top bar with a slide-over drawer.
 */
export default function CoachLayout({ children, session, onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const section = searchParams.get('section') || 'overview'

  const displayName = session?.displayName || 'Coach'
  const displayEmail = session?.email || ''
  const initials = displayName?.charAt(0)?.toUpperCase() || 'C'

  const handleLogout = () => {
    setMobileOpen(false)
    if (onLogout) onLogout()
    navigate('/', { replace: true })
  }

  const navLinks = (showLabels) =>
    COACH_NAV_ITEMS.map((item) => (
      <NavLink
        key={item.id}
        to={NAV_HREFS[item.id]}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          section === item.id
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'text-gray-300 hover:bg-white/5 hover:text-white'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {showLabels && <span>{item.label}</span>}
      </NavLink>
    ))

  const footer = (showLabels) => (
    <>
      <Separator className="bg-border/40" />
      <div className="p-4">
        {showLabels ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-gray-400">{displayEmail}</p>
            </div>
          </div>
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-gray-400 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {showLabels && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1419] text-white">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-200 md:flex',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <span className="text-sm font-bold text-white">FA</span>
              </div>
              <span className="font-bold text-white">Coach Portal</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <Separator className="bg-border/40" />

        <nav className="flex-1 p-2">{navLinks(!collapsed)}</nav>
        {footer(!collapsed)}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border/40 bg-card/60 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <span className="text-sm font-bold text-white">FA</span>
          </div>
          <span className="font-bold text-white">Coach Portal</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-gray-300"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border/40 bg-[#0f1419]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <span className="text-sm font-bold text-white">FA</span>
                </div>
                <span className="font-bold text-white">Coach Portal</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-400"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator className="bg-border/40" />
            <nav className="flex-1 p-2">{navLinks(true)}</nav>
            {footer(true)}
          </aside>
        </div>
      )}

      {/* Main content — scrolls independently, offset for the mobile bar */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
    </div>
  )
}

