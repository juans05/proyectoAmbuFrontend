'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Ambulance as AmbulanceType, Emergency } from '@/types'
import api from '@/lib/axios'
import { getTrackingSocket } from '@/lib/socket'

// FleetMap usa Leaflet que no soporta SSR
const FleetMap = dynamic(() => import('@/components/map/FleetMap'), { ssr: false })

interface TrafficSignal {
  id: string
  lat: number
  lng: number
  name?: string
}

export default function MapPage() {
  const [ambulances, setAmbulances] = useState<AmbulanceType[]>([])
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([])
  const [activePriorityIds, setActivePriorityIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
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
        if (Array.isArray(ambData)) {
          setAmbulances(ambData)
        } else if (ambData && 'data' in ambData) {
          setAmbulances(ambData.data || [])
        }
      }
      if (emgRes.status === 'fulfilled') {
        const emgData = emgRes.value.data
        setEmergencies(Array.isArray(emgData) ? emgData : (emgData as { data: Emergency[] }).data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling de posiciones cada 15 segundos
  useEffect(() => {
    fetchData()
    const pollInterval = setInterval(fetchData, 15_000)

    // getTrackingSocket() inyecta el token del localStorage en el handshake
    const socket = getTrackingSocket()
    if (!socket.connected) socket.connect()

    // Timer para auto-limpiar activePriorityIds después de 30 segundos
    let priorityTimeout: ReturnType<typeof setTimeout> | null = null

    // Escuchar actualizaciones de ubicación de ambulancias
    socket.on('ambulance_location', (data: {
      ambulanceId: string;
      lat: number;
      lng: number;
      altitude?: number;
      status?: string;
    }) => {
      console.log(`[SOCKET] Nueva ubicación: ID=${data.ambulanceId} Lat=${data.lat} Lng=${data.lng} Alt=${data.altitude}`);
      setAmbulances(prev => prev.map(amb =>
        amb.id === data.ambulanceId
          ? { ...amb, locationLat: data.lat, locationLng: data.lng, locationAltitude: data.altitude, status: (data.status ?? amb.status) as AmbulanceType['status'] }
          : amb
      ))
    })

    // Escuchar evento de prioridad de semáforos — ChuyaNam Priority Engine
    socket.on('traffic_priority_active', (data: {
      signalIds?: string[]
      signals?: TrafficSignal[]
    }) => {
      console.log(`[SOCKET] traffic_priority_active: IDs=${data.signalIds}, Signals=${data.signals?.length ?? 0}`)

      // Actualizar señales de tráfico si vienen en el payload
      if (data.signals && Array.isArray(data.signals)) {
        setTrafficSignals(prev => {
          const newSignals = [...prev]
          data.signals!.forEach(signal => {
            const idx = newSignals.findIndex(s => s.id === signal.id)
            if (idx >= 0) {
              newSignals[idx] = signal
            } else {
              newSignals.push(signal)
            }
          })
          return newSignals
        })
      }

      // Actualizar IDs activos
      if (data.signalIds && Array.isArray(data.signalIds)) {
        setActivePriorityIds(data.signalIds)

        // Reset del timer de auto-limpieza
        if (priorityTimeout) clearTimeout(priorityTimeout)
        priorityTimeout = setTimeout(() => {
          setActivePriorityIds([])
          console.log('[SOCKET] traffic_priority_active timeout — resetting')
        }, 30_000)
      }
    })

    // Escuchar nuevas emergencias o cambios de estado
    socket.on('emergency_assigned', () => {
      console.log('[SOCKET] Nueva emergencia asignada — Activando alerta visual');
      setNewEmergencyAlert(true);
      fetchData();
      
      // Auto-limpiar el parpadeo después de 5 segundos
      setTimeout(() => setNewEmergencyAlert(false), 5000);
      
      // Opcional: Sonido de alerta (usando beep nativo si el navegador lo permite o un audio simple)
      try {
        const audio = new Audio('/sounds/emergency.mp3');
        audio.play().catch(() => console.log('Autoplay bloqueado: El usuario debe interactuar con la web primero.'));
      } catch (e) {
        // Ignorar falla de audio
      }
    });

    socket.on('status_change', () => {
      fetchData()
    })

    return () => {
      clearInterval(pollInterval)
      if (priorityTimeout) clearTimeout(priorityTimeout)
      socket.off('ambulance_location')
      socket.off('emergency_assigned')
      socket.off('status_change')
      socket.off('traffic_priority_active')
    }
  }, [fetchData])

  const [newEmergencyAlert, setNewEmergencyAlert] = useState(false);

  return (
    <div className={`flex flex-col h-full space-y-4 transition-all duration-300 ${newEmergencyAlert ? 'ring-8 ring-red-500 ring-inset animate-pulse p-2 bg-red-50' : ''}`}>
      {newEmergencyAlert && (
          <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-bold">NUEVA EMERGENCIA ASIGNADA</p>
              <p className="text-xs opacity-90">Verifica la flota en el mapa</p>
            </div>
          </div>
      )}
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
          <FleetMap
            ambulances={ambulances}
            emergencies={emergencies}
            trafficSignals={trafficSignals}
            activePriorityIds={activePriorityIds}
          />
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
