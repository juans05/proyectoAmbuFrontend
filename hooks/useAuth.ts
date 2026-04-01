'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const { token, user, isAuthenticated, login, logout, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return { token, user, isAuthenticated, login, logout }
}
