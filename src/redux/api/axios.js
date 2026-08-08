import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('auth_tokens')
    if (tokens) {
      try {
        const { access } = JSON.parse(tokens)
        if (access) {
          config.headers.Authorization = `Bearer ${access}`
        }
      } catch {
        // ignore parse errors
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 and try token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not a retry already
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try refresh if the failed request was itself the refresh call
      if (originalRequest.url?.includes('/api/auth/refresh/')) {
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const tokens = localStorage.getItem('auth_tokens')
        let refreshToken = null
        if (tokens) {
          const parsed = JSON.parse(tokens)
          refreshToken = parsed.refresh
        }

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        })

        // Backend returns response in envelope
        const newAccess = data?.data?.access || data?.access
        const newRefresh = data?.data?.refresh || data?.refresh

        const newTokens = {
          access: newAccess,
          refresh: newRefresh || refreshToken,
        }
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

        processQueue(null, newAccess)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('auth_tokens')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance

