import { getStoredSession } from './auth'

/**
 * Check if a user has admin privileges.
 * Checks both the Redux user object and the demo session.
 *
 * @param {Object} user - The Redux auth user object
 * @returns {boolean} - True if the user is an admin
 */
export function isAdminUser(user) {
  if (
    user?.is_staff ||
    user?.is_superuser ||
    user?.is_admin ||
    user?.role === 'admin' ||
    user?.role === 'superadmin'
  ) {
    return true
  }

  // Fall back to demo session
  const demoSession = getStoredSession()
  return Boolean(
    demoSession?.is_staff ||
      demoSession?.is_superuser ||
      demoSession?.is_admin ||
      demoSession?.role === 'admin' ||
      demoSession?.role === 'superadmin'
  )
}
