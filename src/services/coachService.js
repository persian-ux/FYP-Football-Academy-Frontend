import axiosInstance from '@/redux/api/axios'

const PLAYERS_BASE = '/api/v1/players'

// ---------------------------------------------------------------------------
// Response normalization helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a backend response into a plain array of results.
 * Handles the `{ success, message, data }` envelope with either a bare array,
 * a paginated `{ count, next, previous, results }` payload, or nested data.
 * @param {Object|Array} response - Raw API response (envelope or array)
 * @returns {Array}
 */
export function extractResults(response) {
  if (Array.isArray(response)) return response
  const data = response?.data ?? response
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data?.results)) return data.data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.roster)) return data.roster
  return []
}

/**
 * Extract the total count from a paginated response (falls back to the
 * number of results in the current page).
 * @param {Object|Array} response - Raw API response
 * @param {Array} results - Normalized results array
 * @returns {number}
 */
export function extractCount(response, results = []) {
  const data = response?.data ?? response
  if (typeof data?.count === 'number') return data.count
  if (typeof data?.data?.count === 'number') return data.data.count
  return results.length
}

/**
 * Pull the first human-readable message out of an axios / API error,
 * covering 401, 403, 404, 400 (DRF field errors) and 500 responses.
 * @param {Error} err - Thrown error (usually an AxiosError)
 * @param {string} fallback - Default message
 * @returns {string}
 */
export function extractApiError(err, fallback = 'Something went wrong. Please try again.') {
  const status = err?.response?.status
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) return 'The requested item was not found.'
  if (status === 400) {
    const errData = err?.response?.data
    if (errData?.errors && typeof errData.errors === 'object') {
      return Object.values(errData.errors).flat().join(', ')
    }
    if (errData && typeof errData === 'object' && !errData.message) {
      return Object.values(errData).flat().join(', ')
    }
  }
  if (status >= 500) return 'Server error. Please try again in a moment.'
  const errData = err?.response?.data
  if (errData?.errors && typeof errData.errors === 'object') {
    return Object.values(errData.errors).flat().join(', ')
  }
  return errData?.message || err?.message || fallback
}

/**
 * Extract a message from a non-throwing (success:false) API envelope.
 * @param {Object} response - API envelope
 * @param {string} fallback - Default message
 * @returns {string}
 */
export function envelopeError(response, fallback = 'Request failed. Please try again.') {
  if (response?.errors && typeof response.errors === 'object') {
    return Object.values(response.errors).flat().join(', ')
  }
  return response?.message || fallback
}

/** Extract field-level errors from an API envelope or axios error. */
export function extractFieldErrors(responseOrErr) {
  const errors = responseOrErr?.response?.data?.errors || responseOrErr?.errors
  return errors && typeof errors === 'object' ? errors : {}
}

// ---------------------------------------------------------------------------
// Players (assigned players for the logged-in coach)
// ---------------------------------------------------------------------------

/** Build a display name for a player record from the players module. */
export function playerName(player) {
  if (!player) return '—'
  if (player.full_name) return player.full_name
  const user = player.user || {}
  if (user.full_name) return user.full_name
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return name || user.email || `Player #${player.id ?? player.user_id ?? '?'}`
}

/** Build a display email for a player record. */
export function playerEmail(player) {
  return player?.user?.email || player?.email || ''
}

/** Resolve the auth-user id behind a player record (used for attendance). */
export function playerUserId(player) {
  if (player?.user && typeof player.user === 'object') return player.user.id
  if (player?.user_id) return player.user_id
  return player?.user ?? null
}

/**
 * Walk every page of GET /api/v1/players/ and collect the results.
 * For coach accounts the backend only returns players assigned to them,
 * which keeps unassigned players out of every coach view.
 * @param {Object} params - optional query params
 * @returns {Promise<Array>} Array of player objects
 */
export async function listAllMyPlayers(params = {}) {
  const all = []
  let page = params.page || 1
  try {
    for (;;) {
      const { data } = await axiosInstance.get(`${PLAYERS_BASE}/`, {
        params: { ...params, page },
      })
      if (!data?.success) break
      const results = extractResults(data)
      all.push(...results)
      const total = data?.data?.count ?? results.length
      if (results.length === 0 || all.length >= total) break
      page += 1
    }
  } catch {
    // Ignore — the caller handles whatever we managed to collect.
  }
  return all
}

/**
 * Get a single player by id.
 * @param {number|string} id - Player ID
 */
export async function getPlayer(id) {
  const { data } = await axiosInstance.get(`${PLAYERS_BASE}/${id}/`)
  return data
}

/**
 * Partial update of a player (used for coach-scoped status/group tweaks).
 * @param {number|string} id - Player ID
 * @param {Object} payload - Partial player object
 */
export async function patchPlayer(id, payload) {
  const { data } = await axiosInstance.patch(`${PLAYERS_BASE}/${id}/`, payload)
  return data
}