import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    if (!token || token === 'undefined') {
      console.error('Error: Intento de login con token inválido o undefined')
      return
    }
    console.log(user);
    console.log(token);
    if (typeof window !== 'undefined') {
      if (token && token !== 'undefined') {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(user))
        // Sincronizar cookie para que el middleware de Next.js pueda leerla
        document.cookie = `accessToken=${token}; path=/; max-age=${15 * 60}` // 15 minutos
        set({ token, user, isAuthenticated: true })
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        document.cookie = 'accessToken=; path=/; max-age=0'
        set({ token: null, user: null, isAuthenticated: false })
      }
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      // Limpiar cookie
      document.cookie = 'accessToken=; path=/; max-age=0'
    }
    set({ token: null, user: null, isAuthenticated: false })
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')

      // Limpieza de emergencia para tokens malformados ("undefined" string)
      if (token === 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        document.cookie = 'accessToken=; path=/; max-age=0'
        return
      }

      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          // Verificar que el JWT no esté expirado antes de restaurar la sesión
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            document.cookie = 'accessToken=; path=/; max-age=0'
            return
          }
          const user = JSON.parse(userStr) as User
          // Restaurar cookie si existe token en localStorage pero no en cookie
          document.cookie = `accessToken=${token}; path=/; max-age=${15 * 60}`
          set({ token, user, isAuthenticated: true })
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          document.cookie = 'accessToken=; path=/; max-age=0'
        }
      }
    }
  },
}))
