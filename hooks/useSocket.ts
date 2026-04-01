'use client'

import { useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { getTrackingSocket } from '@/lib/socket'

interface UseSocketOptions {
  onAmbulanceLocation?: (data: { ambulanceId: string; lat: number; lng: number }) => void
  onEmergencyUpdate?: (data: { emergencyId: string; status: string }) => void
}

export function useTrackingSocket({ onAmbulanceLocation, onEmergencyUpdate }: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = getTrackingSocket()
    socketRef.current = socket

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      socket.auth = { token }
    }

    socket.connect()

    if (onAmbulanceLocation) {
      socket.on('ambulance:location', onAmbulanceLocation)
    }
    if (onEmergencyUpdate) {
      socket.on('emergency:update', onEmergencyUpdate)
    }

    return () => {
      if (onAmbulanceLocation) socket.off('ambulance:location', onAmbulanceLocation)
      if (onEmergencyUpdate) socket.off('emergency:update', onEmergencyUpdate)
      socket.disconnect()
    }
  }, [onAmbulanceLocation, onEmergencyUpdate])

  return socketRef.current
}
