import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const rt = useAuthStore.getState().refreshToken
      if (!rt) { useAuthStore.getState().logout(); return Promise.reject(error) }
      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken: rt })
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken)
        orig.headers.Authorization = `Bearer ${data.accessToken}`
        return api(orig)
      } catch { useAuthStore.getState().logout(); return Promise.reject(error) }
    }
    return Promise.reject(error)
  },
)

export default api
