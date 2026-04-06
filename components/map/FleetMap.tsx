'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Ambulance, Emergency } from '@/types'

// Fix leaflet default icons in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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
}

function MapBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView([-12.0464, -77.0428], 12)
  }, [map])
  return null
}

export default function FleetMap({ ambulances, emergencies }: FleetMapProps) {
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

      {/* Emergency markers */}
      {emergencies.map((emergency) => {
        if (!emergency.userLat || !emergency.userLng) return null
        return (
          <Marker
            key={emergency.id}
            position={[emergency.userLat, emergency.userLng]}
            icon={emergencyIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-red-700">Emergencia</p>
                <p className="text-gray-600">Tipo: {emergency.type}</p>
                <p className="text-gray-600">Dirección: {emergency.address}</p>
                {emergency.user && (
                  <p className="text-gray-600">Usuario: {emergency.user.name}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
