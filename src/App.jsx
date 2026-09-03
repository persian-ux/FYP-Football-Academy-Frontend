import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import Dashboard from './pages/Dashboard.jsx'
import PlayerDashboard from './pages/PlayerDashboard.jsx'
import CoachDashboard from './pages/coach/CoachDashboard.jsx'
import HubPage from './pages/HubPage.tsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminUsers from './pages/AdminUsers'
import FeesList from './pages/Fees/FeesList'
import SectionsList from './pages/Sections/SectionsList'
import AttendanceList from './pages/Attendance/AttendanceList'
import Matches from './pages/Scheduling/Matches'
import TeamsList from './pages/Scheduling/TeamsList'
import StudentReports from './pages/Reports/StudentReports'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'
import { restoreSession, setCredentials, clearTokensAndUser } from './redux/slices/authSlice'
import { useDemoAuth } from './hooks/useDemoAuth.ts'
import { getStoredSession } from './lib/auth'
import { isAdminUser, isPlayerUser, isCoachUser } from './lib/admin'

function AppRoutes() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const auth = useDemoAuth()

  // If not yet bootstrapped from sessionStorage, show loading
  // We check both demo auth ready and redux auth initialized
  if (!auth.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0f1419] text-white">
        <div className="rounded-3xl border border-border/70 bg-card/60 px-6 py-4 text-sm text-muted-foreground backdrop-blur-xl">
          Loading Sportsphere Hub...
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <HubPage
            session={
              isAuthenticated
                ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                : auth.session
            }
            onSignIn={(credentials) => {
              const session = auth.signIn(credentials)
              // Sync demo session into Redux so admin checks work
              dispatch(
                setCredentials({
                  user: {
                    email: session.email,
                    first_name: session.displayName,
                    is_staff: session.is_staff,
                    is_superuser: session.is_superuser,
                    role: session.role,
                  },
                  tokens: { access: 'demo-access-token', refresh: 'demo-refresh-token' },
                })
              )
              return session
            }}
            onSignOut={() => {
              sessionStorage.removeItem('auth_tokens')
              sessionStorage.removeItem('auth_user')
              dispatch(clearTokensAndUser())
              auth.signOut()
              window.location.href = '/'
            }}
          />
        }
      />

      {/* Auth pages - redirect to dashboard if already authenticated */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes — players get the player portal, coaches get the coach
          portal, everyone else keeps the admin dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {isPlayerUser(user) ? (
              <PlayerDashboard
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              />
            ) : isCoachUser(user) ? (
              <CoachDashboard
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              />
            ) : (
              <AdminLayout
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                isAdmin={isAdminUser(user)}
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              >
                <Dashboard
                  session={
                    isAuthenticated
                      ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                      : auth.session
                  }
                  isAdmin={isAdminUser(user)}
                  onLogout={() => {
                    sessionStorage.removeItem('auth_tokens')
                    sessionStorage.removeItem('auth_user')
                    dispatch(clearTokensAndUser())
                    auth.signOut()
                    window.location.href = '/'
                  }}
                />
              </AdminLayout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Admin-only routes */}
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout
              session={
                isAuthenticated
                  ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                  : auth.session
              }
              isAdmin={isAdminUser(user)}
              onLogout={() => {
                sessionStorage.removeItem('auth_tokens')
                sessionStorage.removeItem('auth_user')
                dispatch(clearTokensAndUser())
                auth.signOut()
                window.location.href = '/'
              }}
            >
              <AdminUsers />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Fee management — admin CRUD on student fees */}
      <Route
        path="/admin/fees"
        element={
          <AdminRoute>
            <AdminLayout
              session={
                isAuthenticated
                  ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                  : auth.session
              }
              isAdmin={isAdminUser(user)}
              onLogout={() => {
                sessionStorage.removeItem('auth_tokens')
                sessionStorage.removeItem('auth_user')
                dispatch(clearTokensAndUser())
                auth.signOut()
                window.location.href = '/'
              }}
            >
              <FeesList />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Sections — accessible to admins (full CRUD) and coaches (read-only) */}
      <Route
        path="/sections"
        element={
          <ProtectedRoute>
            <AdminLayout
              session={
                isAuthenticated
                  ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                  : auth.session
              }
              isAdmin={isAdminUser(user)}
              onLogout={() => {
                sessionStorage.removeItem('auth_tokens')
                sessionStorage.removeItem('auth_user')
                dispatch(clearTokensAndUser())
                auth.signOut()
                window.location.href = '/'
              }}
            >
              <SectionsList />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Attendance — coaches manage their squad via the coach portal, admins via this page */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            {isCoachUser(user) ? (
              <Navigate to="/dashboard?section=attendance" replace />
            ) : (
              <AdminLayout
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                isAdmin={isAdminUser(user)}
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              >
                <AttendanceList isAdmin={isAdminUser(user)} />
              </AdminLayout>
            )}
          </ProtectedRoute>
        }
      />

      {/* Scheduling — coaches schedule their matches via the coach portal, admins via this page */}
      <Route
        path="/scheduling"
        element={
          <ProtectedRoute>
            {isCoachUser(user) ? (
              <Navigate to="/dashboard?section=scheduling" replace />
            ) : (
              <AdminLayout
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                isAdmin={isAdminUser(user)}
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              >
                <Matches isAdmin={isAdminUser(user)} />
              </AdminLayout>
            )}
          </ProtectedRoute>
        }
      />

      {/* Scheduling — teams page (manage for admins, coaches manage via the coach portal) */}
      <Route
        path="/scheduling/teams"
        element={
          <ProtectedRoute>
            {isCoachUser(user) ? (
              <Navigate to="/dashboard?section=scheduling" replace />
            ) : (
              <AdminLayout
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                isAdmin={isAdminUser(user)}
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              >
                <TeamsList />
              </AdminLayout>
            )}
          </ProtectedRoute>
        }
      />
      {/* Student Reports — coaches create/manage their reports via the coach portal, admins via this page */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            {isCoachUser(user) ? (
              <Navigate to="/dashboard?section=reports" replace />
            ) : (
              <AdminLayout
                session={
                  isAuthenticated
                    ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                    : auth.session
                }
                isAdmin={isAdminUser(user)}
                onLogout={() => {
                  sessionStorage.removeItem('auth_tokens')
                  sessionStorage.removeItem('auth_user')
                  dispatch(clearTokensAndUser())
                  auth.signOut()
                  window.location.href = '/'
                }}
              >
                <StudentReports isAdmin={isAdminUser(user)} />
              </AdminLayout>
            )}
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const dispatch = useDispatch()

  // Bootstrap auth state from sessionStorage on mount.
  // Sessions now live in sessionStorage so closing the tab automatically logs the user out.
  useEffect(() => {
    // One-time cleanup of auth data persisted to localStorage by previous versions,
    // which no longer gets read and would otherwise stay around forever.
    localStorage.removeItem('auth_tokens')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('sportsphere-demo-session')

    const tokens = sessionStorage.getItem('auth_tokens')
    const user = sessionStorage.getItem('auth_user')

    if (tokens && user) {
      try {
        dispatch(
          restoreSession({
            tokens: JSON.parse(tokens),
            user: JSON.parse(user),
          })
        )
      } catch {
        // Ignore corrupted data
        sessionStorage.removeItem('auth_tokens')
        sessionStorage.removeItem('auth_user')
      }
    } else {
      // If no Redux auth but a demo session exists, restore it into Redux
      const demoSession = getStoredSession()
      if (demoSession) {
        dispatch(
          setCredentials({
            user: {
              email: demoSession.email,
              first_name: demoSession.displayName,
              is_staff: demoSession.is_staff,
              is_superuser: demoSession.is_superuser,
              role: demoSession.role,
            },
            tokens: { access: 'demo-access-token', refresh: 'demo-refresh-token' },
          })
        )
      }
    }
  }, [dispatch])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme="dark"
      />
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
