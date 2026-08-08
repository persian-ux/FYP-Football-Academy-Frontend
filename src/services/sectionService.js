import axiosInstance from '@/redux/api/axios'

/**
 * List all sections (paginated).
 * @param {Object} params - { search, status, ordering, page }
 */
export async function listSections(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/academy/sections/', { params })
  return data
}

/**
 * Create a new section.
 * @param {Object} payload - { name, description, academy, coach, players, status }
 */
export async function createSection(payload) {
  const { data } = await axiosInstance.post('/api/v1/academy/sections/', payload)
  return data
}

/**
 * Get section details.
 * @param {number|string} id - Section ID
 */
export async function getSection(id) {
  const { data } = await axiosInstance.get(`/api/v1/academy/sections/${id}/`)
  return data
}

/**
 * Full update of a section.
 * @param {number|string} id - Section ID
 * @param {Object} payload - Full section object
 */
export async function updateSection(id, payload) {
  const { data } = await axiosInstance.put(`/api/v1/academy/sections/${id}/`, payload)
  return data
}

/**
 * Partial update of a section.
 * @param {number|string} id - Section ID
 * @param {Object} payload - Partial section object
 */
export async function patchSection(id, payload) {
  const { data } = await axiosInstance.patch(`/api/v1/academy/sections/${id}/`, payload)
  return data
}

/**
 * Delete a section.
 * Backend returns HTTP 204 with an empty body, so we return a synthetic
 * success envelope so the caller can rely on `response.success`.
 * @param {number|string} id - Section ID
 */
export async function deleteSection(id) {
  const response = await axiosInstance.delete(`/api/v1/academy/sections/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Section deleted successfully.', data: {} }
  }
  return response.data
}

/**
 * List academies for dropdown.
 * @param {Object} params - { search, ordering, page }
 */
export async function listAcademies(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/academy/academies/', { params })
  return data
}

/**
 * List players from the players module (Player model, not User model).
 * The section's `players` field expects Player model IDs, so we must use
 * the `/api/v1/players/` endpoint rather than the accounts admin players endpoint.
 * @param {Object} params - { search, ordering, page }
 */
export async function listPlayersFromModule(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/players/', { params })
  return data
}
