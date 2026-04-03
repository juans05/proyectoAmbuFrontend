import axios from 'axios'

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Guardar accessToken en cookie cuando el backend lo devuelve (login / refresh)
    if (typeof window !== 'undefined' && response.data?.accessToken) {
      document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=${15 * 60}`
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      // Limpiar cookie también
      document.cookie = 'accessToken=; path=/; max-age=0'
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
