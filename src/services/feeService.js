import axiosInstance from '@/redux/api/axios'

const FEES_BASE = '/api/v1/fees'

/**
 * Get all students with their fee status.
 * This is the main endpoint for the fees dashboard UI.
 * @param {Object} params - optional query params
 */
export async function getStudentsWithFeeStatus(params = {}) {
  const { data } = await axiosInstance.get(`${FEES_BASE}/students/`, { params })
  return data
}

/**
 * List all fee records.
 * @param {Object} params - optional query params
 */
export async function getFeeRecords(params = {}) {
  const { data } = await axiosInstance.get(`${FEES_BASE}/`, { params })
  return data
}

/**
 * Get a single fee record.
 * @param {number|string} id - Fee ID
 */
export async function getFeeRecord(id) {
  const { data } = await axiosInstance.get(`${FEES_BASE}/${id}/`)
  return data
}

/**
 * Create a fee record.
 * @param {Object} payload - { player, amount, status, due_date }
 */
export async function createFeeRecord(payload) {
  const { data } = await axiosInstance.post(`${FEES_BASE}/`, payload)
  return data
}

/**
 * Partial update of a fee record.
 * @param {number|string} id - Fee ID
 * @param {Object} payload - { amount, status, due_date }
 */
export async function updateFeeRecord(id, payload) {
  const { data } = await axiosInstance.patch(`${FEES_BASE}/${id}/`, payload)
  return data
}

/**
 * Delete a fee record.
 * Backend may return HTTP 204 with an empty body, so we synthesize a
 * success envelope so callers can rely on `response.success`.
 * @param {number|string} id - Fee ID
 */
export async function deleteFeeRecord(id) {
  const response = await axiosInstance.delete(`${FEES_BASE}/${id}/`)
  if (response.status === 204 || !response.data) {
    return { success: true, message: 'Fee deleted successfully.', data: {} }
  }
  return response.data
}

/**
 * Toggle a fee's status.
 * @param {number|string} id - Fee ID
 * @param {string} status - New status ('paid' | 'unpaid' | 'pending' | 'overdue')
 */
export async function toggleFeeStatus(id, status) {
  const { data } = await axiosInstance.patch(`${FEES_BASE}/${id}/toggle-status/`, {
    status,
  })
  return data
}