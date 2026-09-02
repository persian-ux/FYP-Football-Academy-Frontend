import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Settings,
  KeyRound,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { fetchProfile } from '@/redux/api/auth'

export default function Profile() {
  const { user, isAuthenticated } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadProfile = async () => {
      try {
        const response = await fetchProfile()
        if (response.success) {
          setProfile(response.data)
        } else {
          toast.error(response.message || 'Failed to load profile')
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load profile'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [isAuthenticated])

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
    : user?.email || 'User'

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = () => {
    sessionStorage.removeItem('auth_tokens')
    sessionStorage.removeItem('auth_user')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] p-6 lg:p-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="max-w-3xl mx-auto p-6 lg:p-12">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Profile Header */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl mb-6">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="w-20 h-20 ring-2 ring-blue-500/30">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                  {initials || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <p className="text-gray-400 mt-1">{profile?.email || user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <Shield className="w-3 h-3 mr-1" />
                    {profile?.role || 'Athlete'}
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'Recently'}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link to="/change-password">
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <KeyRound className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Update your account password</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/settings">
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Account Settings</p>
                  <p className="text-xs text-gray-400 mt-0.5">Manage your preferences</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Account Info */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border/20">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
                <span className="text-white">{profile?.email || user?.email || '—'}</span>
              </div>
              {profile?.first_name && (
                <div className="flex items-center justify-between py-3 border-b border-border/20">
                  <div className="flex items-center gap-3 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>First Name</span>
                  </div>
                  <span className="text-white">{profile.first_name}</span>
                </div>
              )}
              {profile?.last_name && (
                <div className="flex items-center justify-between py-3 border-b border-border/20">
                  <div className="flex items-center gap-3 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Last Name</span>
                  </div>
                  <span className="text-white">{profile.last_name}</span>
                </div>
              )}
              {profile?.role && (
                <div className="flex items-center justify-between py-3 border-b border-border/20">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span>Role</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {profile.role}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

