import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not destroy a valid-looking client session just because any request
    // returned 401. Login/register failures are ordinary form errors, and
    // protected-page requests are handled centrally by AuthProvider.
    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isAuthFormRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')

    // Only the explicit session check can invalidate the client session.
    // A 401 from a normal page request must not kick the user to login while
    // navigating with the browser Back/Forward buttons.
    const isSessionCheck = requestUrl.includes('/auth/me')
    if (status === 401 && isSessionCheck && !isAuthFormRequest) {
      window.dispatchEvent(new CustomEvent('packai:auth-expired'))
    }

    return Promise.reject(error)
  }
)

export function extractErrorMessage(error) {
  const detail = error?.response?.data?.detail
  if (!detail) return 'Something went wrong. Please try again.'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'string' ? d : d.msg)).join(' ')
  }
  return 'Something went wrong. Please try again.'
}

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
}

export const foodApi = {
  list: () => api.get('/foods'),
  get: (id) => api.get(`/foods/${id}`),
  create: (payload) => api.post('/foods', payload),
  update: (id, payload) => api.put(`/foods/${id}`, payload),
  remove: (id) => api.delete(`/foods/${id}`),
}

export const packagingApi = {
  list: () => api.get('/packaging'),
  get: (id) => api.get(`/packaging/${id}`),
}

export const analysisApi = {
  create: (payload) => api.post('/analysis', payload),
  get: (id) => api.get(`/analysis/${id}`),
  recommendation: (id) => api.get(`/analysis/${id}/recommendation`),
  comparison: (id) => api.get(`/analysis/${id}/comparison`),
  explanation: (id) => api.post(`/analysis/${id}/explanation`),
  report: (id) => api.get(`/analysis/${id}/report`),
  regenerateReport: (id) => api.post(`/analysis/${id}/report`),
  // PDF must be fetched through axios so the JWT Authorization header is sent
  reportPdf: (id) => api.get(`/analysis/${id}/report/pdf`, { responseType: 'blob' }),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
}

export default api
