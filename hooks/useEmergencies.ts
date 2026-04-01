'use client'

import { useEffect, useCallback } from 'react'
import api from '@/lib/axios'
import { useEmergenciesStore } from '@/store/emergencies.store'
import { Emergency } from '@/types'

export function useEmergencies(pollInterval = 30000) {
  const { activeEmergencies, setActiveEmergencies } = useEmergenciesStore()

  const fetchActiveEmergencies = useCallback(async () => {
    try {
      const response = await api.get<Emergency[]>('/emergencies?status=pending,assigned,on_route,arrived')
      setActiveEmergencies(response.data)
    } catch (error) {
      console.error('Error al obtener emergencias activas:', error)
    }
  }, [setActiveEmergencies])

  useEffect(() => {
    fetchActiveEmergencies()
    const interval = setInterval(fetchActiveEmergencies, pollInterval)
    return () => clearInterval(interval)
  }, [fetchActiveEmergencies, pollInterval])

  return { activeEmergencies, refetch: fetchActiveEmergencies }
}
