import axiosInstance from '@/redux/api/axios'

const SCHEDULING_BASE = '/api/v1/scheduling'

// ---------------------------------------------------------------------------
// Date/time helpers
// ---------------------------------------------------------------------------

/**
 * Convert a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:mm") into an
 * ISO 8601 UTC string ("YYYY-MM-DDTHH:mm:ssZ") suitable for the backend.
 * @param {string} value - datetime-local value
 * @returns {string} ISO UTC string or '' when empty/invalid
 */
export function toApiDateTime(value) {
  if (!value) return ''
  const d = new Date(value) // parsed as local wall time
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

/**
 * Convert an ISO 8601 date string from the backend into a
 * `<input type="datetime-local">` value in the local timezone.
 * @param {string} iso - ISO date string
 * @returns {string} "YYYY-MM-DDTHH:mm" or '' when empty/invalid
 */
export function toInputDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${hh}:${mm}`
}

/**
 * Format an ISO date string for human display with date + time.
 * @param {string} dateStr - ISO date string
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

/**
 * List teams (paginated). Supports search, ordering, page.
 * @param {Object} params - { search, ordering, page }
 */
export async function listTeams(params = {}) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/teams/`, { params })
  return data
}

/**
 * Get a single team's details.
 * @param {number|string} id - Team ID
 */
export async function getTeam(id) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/teams/${id}/`)
  return data
}

/**
 * Create a new team (admin only).
 * @param {Object} payload - { name, short_code, description, coach }
 */
export async function createTeam(payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/teams/`, payload)
  return data
}

/**
 * Full update of a team (admin only).
 * @param {number|string} id - Team ID
 * @param {Object} payload - Full team object
 */
export async function updateTeam(id, payload) {
  const { data } = await axiosInstance.put(`${SCHEDULING_BASE}/teams/${id}/`, payload)
  return data
}

/**
 * Partial update of a team (admin only).
 * @param {number|string} id - Team ID
 * @param {Object} payload - Partial team object
 */
export async function patchTeam(id, payload) {
  const { data } = await axiosInstance.patch(`${SCHEDULING_BASE}/teams/${id}/`, payload)
  return data
}

/**
 * Delete a team (admin only).
 * Backend may return HTTP 204 with an empty body, so we synthesize a success
 * envelope so callers can rely on `response.success`.
 * @param {number|string} id - Team ID
 */
export async function deleteTeam(id) {
  const response = await axiosInstance.delete(`${SCHEDULING_BASE}/teams/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Team deleted successfully.', data: {} }
  }
  return response.data
}


// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

/**
 * List matches (paginated). Supports search, ordering, page and the filters
 * team, status, date.
 * @param {Object} params - { team, status, date, search, ordering, page }
 */
export async function listMatches(params = {}) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/matches/`, { params })
  return data
}

/**
 * Get a single match's details (includes result + events).
 * @param {number|string} id - Match ID
 */
export async function getMatch(id) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/matches/${id}/`)
  return data
}

/**
 * Create a new match (admin only).
 * @param {Object} payload - { home_team, away_team, match_date, venue, notes }
 */
export async function createMatch(payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/matches/`, payload)
  return data
}

/**
 * Full update of a match (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - Full match object
 */
export async function updateMatch(id, payload) {
  const { data } = await axiosInstance.put(`${SCHEDULING_BASE}/matches/${id}/`, payload)
  return data
}

/**
 * Partial update of a match (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - Partial match object
 */
export async function patchMatch(id, payload) {
  const { data } = await axiosInstance.patch(`${SCHEDULING_BASE}/matches/${id}/`, payload)
  return data
}

/**
 * Delete a match (admin only).
 * @param {number|string} id - Match ID
 */
export async function deleteMatch(id) {
  const response = await axiosInstance.delete(`${SCHEDULING_BASE}/matches/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Match deleted successfully.', data: {} }
  }
  return response.data
}


/**
 * List upcoming matches (future, SCHEDULED or POSTPONED).
 * @param {Object} params - optional query params
 */
export async function listUpcomingMatches(params = {}) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/matches/upcoming/`, { params })
  return data
}

/**
 * List today's matches.
 * @param {Object} params - optional query params
 */
export async function listTodayMatches(params = {}) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/matches/today/`, { params })
  return data
}

/**
 * List completed results.
 * @param {Object} params - optional query params
 */
export async function listResults(params = {}) {
  const { data } = await axiosInstance.get(`${SCHEDULING_BASE}/matches/results/`, { params })
  return data
}

/**
 * Reschedule a match to a new date (and optionally venue) (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - { new_date, new_venue }
 */
export async function rescheduleMatch(id, payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/matches/${id}/reschedule/`, payload)
  return data
}

/**
 * Postpone a match (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - { new_date?, notes? }
 */
export async function postponeMatch(id, payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/matches/${id}/postpone/`, payload)
  return data
}

/**
 * Cancel a match (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - { notes? }
 */
export async function cancelMatch(id, payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/matches/${id}/cancel/`, payload)
  return data
}

/**
 * Complete a match with final score and optional goal events (admin only).
 * @param {number|string} id - Match ID
 * @param {Object} payload - { home_score, away_score, duration_minutes?, events? }
 */
export async function completeMatch(id, payload) {
  const { data } = await axiosInstance.post(`${SCHEDULING_BASE}/matches/${id}/complete/`, payload)
  return data
}
