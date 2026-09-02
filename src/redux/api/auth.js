import axiosInstance from './axios'

/**
 * Register a new user via the backend.
 * @param {Object} payload - { email, password, password2, first_name, last_name }
 */
export async function registerUser(payload) {
  const { data } = await axiosInstance.post('/api/auth/register/', payload)
  return data
}

/**
 * Log in with email and password.
 * @param {Object} payload - { email, password }
 */
export async function loginUser(payload) {
  const { data } = await axiosInstance.post('/api/auth/login/', payload)
  return data
}

/**
 * Log out the current user (invalidate refresh token).
 */
export async function logoutUser() {
  const tokens = sessionStorage.getItem('auth_tokens')
  let refreshToken = null
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens)
      refreshToken = parsed.refresh
    } catch {
      // ignore
    }
  }
  const { data } = await axiosInstance.post('/api/auth/logout/', {
    refresh: refreshToken,
  })
  return data
}

/**
 * Refresh tokens (used internally by axios interceptor, but exposed for manual use).
 * @param {string} refresh - The refresh token
 */
export async function refreshToken(refresh) {
  const { data } = await axiosInstance.post('/api/auth/refresh/', { refresh })
  return data
}

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchProfile() {
  const { data } = await axiosInstance.get('/api/auth/profile/')
  return data
}

/**
 * Change the current user's password.
 * @param {Object} payload - { old_password, new_password, confirm_new_password }
 */
export async function changePassword(payload) {
  const { data } = await axiosInstance.put('/api/auth/change-password/', payload)
  return data
}

/**
 * Request a password reset email.
 * @param {Object} payload - { email }
 */
export async function forgotPassword(payload) {
  const { data } = await axiosInstance.post('/api/auth/forgot-password/', payload)
  return data
}

/**
 * Reset password with token.
 * @param {Object} payload - { token, password, confirm_password }
 */
export async function resetPassword(payload) {
  const { data } = await axiosInstance.post('/api/auth/reset-password/', payload)
  return data
}

