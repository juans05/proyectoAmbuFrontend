'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Ambulance, Emergency } from '@/types'
import { decodePolyline } from '@/lib/utils'

// Fix leaflet default icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface TrafficSignal {
  id: string
  lat: number
  lng: number
  name?: string
}

function createColoredIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })
}

function createTrafficSignalIcon(isActive: boolean) {
  const bgColor = isActive ? '#1d4ed8' : '#94a3b8'
  const animClass = isActive ? 'traffic-pulse' : ''
  return L.divIcon({
    className: animClass,
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${bgColor};
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: background-color 0.3s ease;
        position: relative;
      ">
        🚦
        ${
          isActive
            ? `<svg style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; pointer-events: none;" viewBox="0 0 64 64">
                 <circle cx="32" cy="32" r="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" opacity="0.6" style="animation: trafficRingPulse 1.5s ease-out infinite;" />
                 <circle cx="32" cy="32" r="14" fill="none" stroke="#1d4ed8" stroke-width="1.5" opacity="0.4" style="animation: trafficRingPulse 1.5s ease-out 0.5s infinite;" />
               </svg>`
            : ''
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  })
}

const ambulanceIcons = {
  available: createColoredIcon('#16a34a'),   // green
  on_route: createColoredIcon('#dc2626'),    // red
  busy: createColoredIcon('#f97316'),        // orange
  offline: createColoredIcon('#6b7280'),     // gray
}

const emergencyIcon = createColoredIcon('#2563eb')  // blue

interface FleetMapProps {
  ambulances: Ambulance[]
  emergencies: Emergency[]
  trafficSignals?: TrafficSignal[]
  activePriorityIds?: string[]
}

function MapBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView([-12.0464, -77.0428], 12)
  }, [map])
  return null
}

export default function FleetMap({ ambulances, emergencies, trafficSignals = [], activePriorityIds = [] }: FleetMapProps) {
  return (
    <MapContainer
      center={[-12.0464, -77.0428]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds />

      {/* Traffic Signal markers — semáforos con prioridad */}
      {trafficSignals.map((signal) => {
        const isActive = activePriorityIds.includes(signal.id)
        return (
          <Marker
            key={`traffic-${signal.id}`}
            position={[signal.lat, signal.lng]}
            icon={createTrafficSignalIcon(isActive)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-blue-700">🚦 Semáforo en Prioridad</p>
                {signal.name && <p className="text-gray-600">Ubicación: {signal.name}</p>}
                <p className="text-xs text-gray-500 mt-1">ChuyaNam Priority Engine</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Ambulance markers — lat/lng actualizados en tiempo real desde MapPage vía socket */}
      {ambulances.map((amb) => {
        const lat = amb.locationLat
        const lng = amb.locationLng
        if (!lat || !lng) return null

        return (
          <Marker
            key={amb.id}
            position={[lat, lng]}
            icon={ambulanceIcons[amb.status] ?? ambulanceIcons.offline}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-gray-800">{amb.plate}</p>
                <p className="text-gray-600">Tipo: {amb.type}</p>
                <p className="text-gray-600">
                  Estado:{' '}
                  <span
                    className={
                      amb.status === 'available'
                        ? 'text-green-600'
                        : amb.status === 'on_route'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }
                  >
                    {amb.status === 'available'
                      ? 'Disponible'
                      : amb.status === 'on_route'
                      ? 'En Ruta'
                      : amb.status === 'busy'
                      ? 'Ocupado'
                      : 'Offline'}
                  </span>
                </p>
                {amb.locationAltitude !== undefined && (
                  <p className="text-gray-600">Altitud: {amb.locationAltitude.toFixed(1)}m</p>
                )}
                {amb.conductor && (
                  <p className="text-gray-600">Conductor: {amb.conductor.name}</p>
                )}
                {amb.company && (
                  <p className="text-gray-600">Empresa: {amb.company.name}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Emergency markers & routes */}
      {emergencies.map((emergency) => {
        if (!emergency.userLat || !emergency.userLng) return null

        const decodedRoute = emergency.suggestedRoutePolyline
          ? decodePolyline(emergency.suggestedRoutePolyline)
          : []

        return (
          <div key={emergency.id}>
            {/* Draw route if exists */}
            {decodedRoute.length > 0 && (
              <Polyline
                positions={decodedRoute}
                pathOptions={{
                  color: '#2563eb',
                  weight: 4,
                  opacity: 0.6,
                  dashArray: '10, 10',
                }}
              />
            )}

            <Marker position={[emergency.userLat, emergency.userLng]} icon={emergencyIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-red-700">Emergencia</p>
                  <p className="text-gray-600">Tipo: {emergency.type}</p>
                  <p className="text-gray-600">Dirección: {emergency.address}</p>
                  {emergency.user && <p className="text-gray-600">Usuario: {emergency.user.name}</p>}
                  {emergency.estimatedArrivalMinutes && (
                    <p className="text-blue-600 font-semibold mt-1">
                      ETA: {emergency.estimatedArrivalMinutes} min
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          </div>
        )
      })}
    </MapContainer>
  )
}
