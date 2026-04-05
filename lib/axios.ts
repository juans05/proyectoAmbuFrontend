import axios from 'axios'

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token && token !== 'undefined') {
      console.log('Axios: Setting Authorization header', `${token.substring(0, 10)}...`)
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.log('Axios: No token found in localStorage for request')
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Unwrap TransformInterceptor envelope safely
    const data = response.data
    if (data && typeof data === 'object' && 'data' in data && 'statusCode' in data) {
      console.log('Axios: Unwrapping response data', data.data)
      response.data = data.data
    }

    // Guardar accessToken en cookie cuando el backend lo devuelve (login / refresh)
    const token = response.data?.accessToken || (response.data as any)?.data?.accessToken
    if (typeof window !== 'undefined' && token && token !== 'undefined') {
      console.log('Axios: Saving token to cookie', typeof token === 'string' ? `${token.substring(0, 10)}...` : 'INVALID TYPE')
      document.cookie = `accessToken=${token}; path=/; max-age=${15 * 60}`
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
