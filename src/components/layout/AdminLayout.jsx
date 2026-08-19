import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Layers,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CalendarDays,
  Shield,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'User Management', href: '/admin/users', icon: Users },
  { label: 'Fee Management', href: '/admin/fees', icon: Wallet },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { label: 'Sections', href: '/sections', icon: Layers },
  { label: 'Schedule Matches', href: '/scheduling', icon: CalendarDays },
  { label: 'Teams', href: '/scheduling/teams', icon: Shield },
]

/**
 * AdminLayout — provides a persistent sidebar with navigation sections.
 * Only renders the sidebar when the user is an admin; otherwise it
 * renders children without any chrome so non-admin pages are unaffected.
 */
export default function AdminLayout({ children, session, onLogout, isAdmin = false }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const displayName = session?.displayName || 'Admin'
  const displayEmail = session?.email || ''
  const initials = displayName?.charAt(0)?.toUpperCase() || 'A'

  // Non-admin users get a plain wrapper (no sidebar)
  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[#0f1419] text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-200',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <span className="text-sm font-bold text-white">FA</span>
              </div>
              <span className="font-bold text-white">Academy Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-white"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator className="bg-border/40" />

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.label}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <Separator className="bg-border/40" />

        {/* Footer */}
        <div className="p-4">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-gray-400 hover:text-white"
            onClick={() => {
              if (onLogout) onLogout()
              navigate('/', { replace: true })
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
