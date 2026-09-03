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

/**
 * Check if a user is a coach.
 * Coaches get the coach dashboard (assigned players, attendance, matches, reports).
 *
 * @param {Object} user - The Redux auth user object
 * @returns {boolean} - True if the user is a coach
 */
export function isCoachUser(user) {
  if (isAdminUser(user) || isPlayerUser(user)) return false
  const role = String(user?.role || '').toLowerCase()
  if (role === 'coach' || role === 'head_coach') return true
  // Fall back to demo session
  const demoSession = getStoredSession()
  const demoRole = String(demoSession?.role || '').toLowerCase()
  return demoRole === 'coach' || demoRole === 'head_coach'
}

/**
 * Check if a user is a player (student).
 * Players get their own player dashboard instead of the admin dashboard.
 *
 * @param {Object} user - The Redux auth user object
 * @returns {boolean} - True if the user is a player
 */
export function isPlayerUser(user) {
  const role = String(user?.role || '').toLowerCase()
  return role === 'player' || role === 'student'
}
