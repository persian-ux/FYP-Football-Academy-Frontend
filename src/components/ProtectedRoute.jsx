import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

import LoadingScreen from './LoadingScreen'

/**
 * ProtectedRoute — redirects unauthenticated users to /login.
 * Optionally redirects authenticated users away from auth pages.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth)
  const location = useLocation()

  if (loading && !isAuthenticated) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * PublicOnlyRoute — redirects authenticated users to /dashboard.
 * Used for login / register / forgot-password pages.
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

