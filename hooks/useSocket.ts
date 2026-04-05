'use client'

import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { getTrackingSocket } from '@/lib/socket'

interface UseSocketOptions {
  onAmbulanceLocation?: (data: { ambulanceId: string; lat: number; lng: number }) => void
  onEmergencyUpdate?: (data: { emergencyId: string; status: string }) => void
}

export function useTrackingSocket({ onAmbulanceLocation, onEmergencyUpdate }: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null)
  // useState asegura que el valor del socket sea reactivo y consistente con cada render
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const sock = getTrackingSocket()
    socketRef.current = sock
    setSocket(sock)

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token && token !== 'undefined') {
      sock.auth = { token }
    } else {
      sock.auth = {}
    }

    sock.connect()
    
    // Manejo de errores de autenticación (ej. jwt expired)
    sock.on('connect_error', (error) => {
      console.error('Socket Connection Error:', error.message)
      if (error.message === 'jwt expired' || error.message === 'Unauthorized' || error.message === 'invalid token') {
        if (typeof window !== 'undefined') {
          console.warn('Socket Auth Error: Sesión expirada. Limpiando localStorage...')
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
          document.cookie = 'accessToken=; path=/; max-age=0'
          window.location.href = '/login'
        }
      }
    })

    if (onAmbulanceLocation) {
      sock.on('ambulance_location', onAmbulanceLocation)
    }
    if (onEmergencyUpdate) {
      sock.on('emergency:update', onEmergencyUpdate)
    }

    return () => {
      if (onAmbulanceLocation) sock.off('ambulance_location', onAmbulanceLocation)
      if (onEmergencyUpdate) sock.off('emergency:update', onEmergencyUpdate)
      sock.off('connect_error')
      sock.disconnect()
      setSocket(null)
    }
  }, [onAmbulanceLocation, onEmergencyUpdate])

  return socket
}
