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
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    }
    set({ token: null, user: null, isAuthenticated: false })
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User
          set({ token, user, isAuthenticated: true })
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
        }
      }
    }
  },
}))
