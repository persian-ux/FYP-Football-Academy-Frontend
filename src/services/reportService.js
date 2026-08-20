import axiosInstance from '@/redux/api/axios'

const REPORTS_BASE = '/api/v1/reports/students'
const MATCHES_BASE = '/api/v1/scheduling/matches'
const PLAYERS_BASE = '/api/v1/players'

/**
 * List all student reports (paginated).
 * @param {Object} params - { player, match, search, ordering, page }
 */
export async function listStudentReports(params = {}) {
  const { data } = await axiosInstance.get(`${REPORTS_BASE}/`, { params })
  return data
}

/**
 * Get a single student report.
 * @param {number|string} id - Report ID
 */
export async function getStudentReport(id) {
  const { data } = await axiosInstance.get(`${REPORTS_BASE}/${id}/`)
  return data
}

/**
 * Create a new student report (admin only).
 * @param {object} payload - { player, match?, position?, goals?, ... }
 */
export async function createStudentReport(payload) {
  const { data } = await axiosInstance.post(`${REPORTS_BASE}/`, payload)
  return data
}

/**
 * Partial update of a student report (admin only).
 * @param {number|string} id - Report ID
 * @param {object} payload - Only the changed fields
 */
export async function updateStudentReport(id, payload) {
  const { data } = await axiosInstance.patch(`${REPORTS_BASE}/${id}/`, payload)
  return data
}

/**
 * Delete a student report (admin only).
 * Backend may return HTTP 204 with an empty body, so we synthesize a
 * success envelope so callers can rely on `response.success`.
 * @param {number|string} id - Report ID
 */
export async function deleteStudentReport(id) {
  const response = await axiosInstance.delete(`${REPORTS_BASE}/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Student report deleted successfully.', data: {} }
  }
  return response.data
}

/**
 * Fetch every player from the players module (Player model), walking
 * through every page so dropdowns never truncate.
 * @param {object} params - optional query params
 * @returns {Promise<Array>} Array of player objects
 */
export async function listAllPlayers(params = {}) {
  const all = []
  let page = params.page || 1
  try {
    for (;;) {
      const { data } = await axiosInstance.get(`${PLAYERS_BASE}/`, { params: { ...params, page } })
      if (!data?.success) break
      const results = Array.isArray(data.data?.results)
        ? data.data.results
        : Array.isArray(data.data)
          ? data.data
          : []
      all.push(...results)
      const total = data.data?.count ?? results.length
      if (results.length === 0 || all.length >= total) break
      page += 1
    }
  } catch {
    // Ignore — the caller handles whatever we managed to collect.
  }
  return all
}

/**
 * List matches for the dropdown.
 * @param {object} params - optional query params
 */
export async function listMatchesForReports(params = {}) {
  const { data } = await axiosInstance.get(`${MATCHES_BASE}/`, { params })
  return data
}