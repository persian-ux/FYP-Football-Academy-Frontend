import axiosInstance from './axios'

/**
 * List all users (coaches & players) with optional filters.
 * @param {Object} params - { role, is_active, search, ordering, page }
 */
export async function listUsers(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/accounts/admin/users/', { params })
  return data
}

/**
 * List only coaches (paginated).
 * @param {Object} params - { is_active, search, ordering, page }
 */
export async function listCoaches(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/accounts/admin/coaches/', { params })
  return data
}

/**
 * List only players (paginated).
 * @param {Object} params - { is_active, search, ordering, page }
 */
export async function listPlayers(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/accounts/admin/players/', { params })
  return data
}

/**
 * Create a new coach or player.
 * @param {Object} payload - { email, password, password2, first_name, last_name, phone, role, is_active }
 */
export async function createUser(payload) {
  const { data } = await axiosInstance.post('/api/v1/accounts/admin/users/create/', payload)
  return data
}

/**
 * Get a single user's details.
 * @param {number|string} id - User ID
 */
export async function getUser(id) {
  const { data } = await axiosInstance.get(`/api/v1/accounts/admin/users/${id}/`)
  return data
}

/**
 * Full update of a user.
 * @param {number|string} id - User ID
 * @param {Object} payload - Full user object
 */
export async function updateUser(id, payload) {
  const { data } = await axiosInstance.put(`/api/v1/accounts/admin/users/${id}/`, payload)
  return data
}

/**
 * Partial update of a user.
 * @param {number|string} id - User ID
 * @param {Object} payload - Partial user object
 */
export async function patchUser(id, payload) {
  const { data } = await axiosInstance.patch(`/api/v1/accounts/admin/users/${id}/`, payload)
  return data
}

/**
 * Delete a user.
 * @param {number|string} id - User ID
 */
export async function deleteUser(id) {
  const { data } = await axiosInstance.delete(`/api/v1/accounts/admin/users/${id}/`)
  return data
}

/**
 * Toggle active/inactive status.
 * @param {number|string} id - User ID
 * @param {boolean} isActive - New active status
 */
export async function toggleUserStatus(id, isActive) {
  const { data } = await axiosInstance.patch(`/api/v1/accounts/admin/users/${id}/status/`, {
    is_active: isActive,
  })
  return data
}