'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Ambulance as AmbulanceType, Emergency } from '@/types'
import api from '@/lib/axios'
import { getTrackingSocket } from '@/lib/socket'

// FleetMap usa Leaflet que no soporta SSR
const FleetMap = dynamic(() => import('@/components/map/FleetMap'), { ssr: false })

export default function MapPage() {
  const [ambulances, setAmbulances] = useState<AmbulanceType[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)

  // Polling de posiciones cada 15 segundos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ambRes, emgRes] = await Promise.allSettled([
          api.get<AmbulanceType[] | { data: AmbulanceType[] }>('/ambulances', {
            params: { limit: 100 },
          }),
          api.get<Emergency[] | { data: Emergency[] }>('/emergencies', {
            params: { status: 'pending,assigned,on_route,arrived', limit: 50 },
          }),
        ])

        if (ambRes.status === 'fulfilled') {
          const ambData = ambRes.value.data
          // Soportar tanto arreglo simple como objeto paginado { data: [], meta: {} }
          setAmbulances(Array.isArray(ambData) ? ambData : (ambData as any).data ?? [])
        }
        if (emgRes.status === 'fulfilled') {
          const emgData = emgRes.value.data
          setEmergencies(Array.isArray(emgData) ? emgData : (emgData as { data: Emergency[] }).data ?? [])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const pollInterval = setInterval(fetchData, 15_000)

    // getTrackingSocket() inyecta el token del localStorage en el handshake
    const socket = getTrackingSocket()
    if (!socket.connected) socket.connect()

    // Escuchar actualizaciones de ubicación de ambulancias
    socket.on('ambulance_location', (data: { 
      ambulanceId: string; 
      lat: number; 
      lng: number;
      status?: string;
    }) => {
      setAmbulances(prev => prev.map(amb => 
        amb.id === data.ambulanceId 
          ? { ...amb, locationLat: data.lat, locationLng: data.lng, status: (data.status ?? amb.status) as AmbulanceType['status'] }
          : amb
      ))
    })

    // Escuchar nuevas emergencias o cambios de estado
    socket.on('emergency_assigned', () => {
      fetchData()
    })

    socket.on('status_change', () => {
      fetchData()
    })

    return () => {
      clearInterval(pollInterval)
      socket.off('ambulance_location')
      socket.off('emergency_assigned')
      socket.off('status_change')
    }
  }, [])

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mapa de Flota en Tiempo Real</h1>
          <p className="text-sm text-gray-500 mt-1">
            Posición y estado de ambulancias y emergencias activas en Lima
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
            En Ruta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-500 inline-block" />
            Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            Emergencia
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ minHeight: '500px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-white">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <FleetMap ambulances={ambulances} emergencies={emergencies} />
        )}
      </div>

      <div className="flex gap-4 text-sm text-gray-600">
        <span className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-2">
          Ambulancias: <span className="font-semibold text-gray-800">{ambulances.length}</span>
        </span>
        <span className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-2">
          Emergencias activas: <span className="font-semibold text-gray-800">{emergencies.length}</span>
        </span>
      </div>
    </div>
  )
}
