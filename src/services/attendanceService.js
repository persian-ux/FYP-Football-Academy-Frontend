import axiosInstance from '@/redux/api/axios'
import { listPlayers, listCoaches } from '@/redux/api/adminUsers'

const ATTENDANCE_BASE = '/api/v1/attendance'

/**
 * Walk through every page of a paginated admin endpoint and collect all results.
 * @param {(params:Object)=>Promise} fetcher - listPlayers / listCoaches from adminUsers
 * @param {Object} params - initial query params
 * @returns {Promise<Array>} Flat array of all user objects
 */
async function listAllPages(fetcher, params = {}) {
  const all = []
  let page = params.page || 1
  try {
    for (;;) {
      const response = await fetcher({ ...params, page })
      if (!response?.success) break
      const data = response.data
      const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
      all.push(...results)
      const total = data?.count ?? results.length
      if (results.length === 0 || all.length >= total) break
      page += 1
    }
  } catch {
    // Ignore — the caller handles whatever we managed to collect.
  }
  return all
}

/**
 * Fetch every player and coach user (all attendance-eligible members), walking
 * through every page. Used as a merge / fallback source so the attendance
 * roster always lists every member, even users created through User Management
 * that may not have a Player profile yet.
 * @returns {Promise<Array>} Array of roster-shaped items: { user_id, name, email, role, status, attendance_id }
 */
export async function listAllAttendanceMembers() {
  const [players, coaches] = await Promise.all([
    listAllPages(listPlayers, { is_active: 'true' }),
    listAllPages(listCoaches, { is_active: 'true' }),
  ])
  return [...players, ...coaches].map((user) => ({
    user_id: user.id,
    name:
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.email ||
      `Member #${user.id}`,
    email: user.email || '',
    role: user.role || '',
    status: 'absent',
    attendance_id: null,
  }))
}

/**
 * List attendance records (paginated). Accessible to admins and coaches (read-only).
 * Supported params: date, role (player|coach), status, search, ordering, page, page_size
 * @param {Object} params - optional query params
 * @returns {Promise<{success,message,data}>} Envelope with data.results array
 */
export async function listAttendanceRecords(params = {}) {
  const { data } = await axiosInstance.get(`${ATTENDANCE_BASE}/records/`, { params })
  return data
}

/**
 * Get a single attendance record.
 * @param {number|string} id - Attendance record ID
 */
export async function getAttendanceRecord(id) {
  const { data } = await axiosInstance.get(`${ATTENDANCE_BASE}/records/${id}/`)
  return data
}

/**
 * Create a single attendance record (admin only).
 * @param {Object} payload - { user, date, status }
 */
export async function createAttendanceRecord(payload) {
  const { data } = await axiosInstance.post(`${ATTENDANCE_BASE}/records/`, payload)
  return data
}

/**
 * Partial update of an attendance record (admin only).
 * @param {number|string} id - Attendance record ID
 * @param {Object} payload - Partial record object
 */
export async function updateAttendanceRecord(id, payload) {
  const { data } = await axiosInstance.patch(`${ATTENDANCE_BASE}/records/${id}/`, payload)
  return data
}

/**
 * Delete an attendance record (admin only).
 * Backend returns HTTP 204 with an empty body, so we synthesize a success
 * envelope so callers can rely on `response.success`.
 * @param {number|string} id - Attendance record ID
 */
export async function deleteAttendanceRecord(id) {
  const response = await axiosInstance.delete(`${ATTENDANCE_BASE}/records/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Attendance record deleted successfully.', data: {} }
  }
  return response.data
}

/**
 * Fetch the daily attendance roster (all players + coaches with their current
 * status for a date). Admin only.
 * @param {string} date - 'YYYY-MM-DD' date (defaults to today server-side)
 * @returns {Promise<{success,message,data}>} data: { date, count, roster }
 */
export async function getAttendanceRoster(date) {
  const { data } = await axiosInstance.get(`${ATTENDANCE_BASE}/roster/`, {
    params: { date },
  })
  return data
}

/**
 * Bulk mark attendance for multiple users on a single date (admin only).
 * Existing records for the same user+date are updated.
 * @param {string} date - 'YYYY-MM-DD' date
 * @param {Array<{user:number|string, status:string}>} records - [{ user, status }]
 */
export async function bulkMarkAttendance(date, records) {
  const { data } = await axiosInstance.post(`${ATTENDANCE_BASE}/bulk/`, { date, records })
  return data
}

/**
 * Toggle a single user's attendance between present and absent (admin only).
 * If no record exists for the date it is created as present.
 * @param {number|string} user - User ID
 * @param {string} date - 'YYYY-MM-DD' date
 */
export async function toggleAttendance(user, date) {
  const { data } = await axiosInstance.post(`${ATTENDANCE_BASE}/toggle/`, { user, date })
  return data
}
