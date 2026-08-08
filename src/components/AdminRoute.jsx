import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

import LoadingScreen from './LoadingScreen'
import { isAdminUser } from '@/lib/admin'

/**
 * AdminRoute — redirects non-admin users away from admin-only pages.
 * Authenticated users who are not admins are sent to /dashboard.
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const location = useLocation()

  if (loading && !isAuthenticated) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute