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
    if (token) {
      sock.auth = { token }
    }

    sock.connect()

    if (onAmbulanceLocation) {
      sock.on('ambulance:location', onAmbulanceLocation)
    }
    if (onEmergencyUpdate) {
      sock.on('emergency:update', onEmergencyUpdate)
    }

    return () => {
      if (onAmbulanceLocation) sock.off('ambulance:location', onAmbulanceLocation)
      if (onEmergencyUpdate) sock.off('emergency:update', onEmergencyUpdate)
      sock.disconnect()
      setSocket(null)
    }
  }, [onAmbulanceLocation, onEmergencyUpdate])

  return socket
}
