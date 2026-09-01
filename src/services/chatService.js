import axiosInstance from '@/redux/api/axios'

/**
 * List all public FAQ questions (questions only, no answers).
 * @param {Object} params - optional query params (ordering, page)
 */
export async function listFAQQuestions(params = {}) {
  const { data } = await axiosInstance.get('/api/v1/chat/faqs/', { params })
  return data
}

/**
 * Fetch a single public FAQ answer (question + answer).
 * @param {number|string} id - FAQ id
 */
export async function getFAQAnswer(id) {
  const { data } = await axiosInstance.get(`/api/v1/chat/faqs/${id}/answer/`)
  return data
}