import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import Dashboard from './pages/Dashboard.tsx'
import HubPage from './pages/HubPage.tsx'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingScreen from './components/LoadingScreen'
import { restoreSession } from './redux/slices/authSlice'
import { useDemoAuth } from './hooks/useDemoAuth.ts'

function AppRoutes() {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const auth = useDemoAuth()

  // If not yet bootstrapped from localStorage, show loading
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
            onSignIn={auth.signIn}
            onSignOut={() => {
              localStorage.removeItem('auth_tokens')
              localStorage.removeItem('auth_user')
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

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard
              session={
                isAuthenticated
                  ? { email: user?.email || '', displayName: user?.first_name || user?.email || 'User' }
                  : auth.session
              }
              onLogout={() => {
                localStorage.removeItem('auth_tokens')
                localStorage.removeItem('auth_user')
                auth.signOut()
                window.location.href = '/'
              }}
            />
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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  const dispatch = useDispatch()

  // Bootstrap auth state from localStorage on mount
  useEffect(() => {
    const tokens = localStorage.getItem('auth_tokens')
    const user = localStorage.getItem('auth_user')

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
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_user')
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
