'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet default icons en Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const emergencyMarker = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background-color: #dc2626;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(220,38,38,0.5);
    "></div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
})

const ambulanceMarker = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background-color: #f97316;
      border-radius: 4px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(249,115,22,0.5);
      display: flex;
      items-center;
      justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14h4"/><path d="M12 12v4"/><path d="m11.1 2.5 1.8 1.8c.2.2.5.2.7 0l1.8-1.8c.3-.3.8-.3 1.1 0l4 4c.3.3.3.8 0 1.1l-1.8 1.8c-.2.2-.2.5 0 .7l1.8 1.8c.3.3.3.8 0 1.1l-8.5 8.5c-.3.3-.8.3-1.1 0l-8.5-8.5c-.3-.3-.3-.8 0-1.1l1.8-1.8c.2-.2.2-.5 0-.7l-1.8-1.8c-.3-.3-.3-.8 0-1.1l4-4c.3-.3.8-.3 1.1 0z"/></svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

interface MiniMapProps {
  lat: number
  lng: number
  address?: string
  ambulance?: {
    lat: number
    lng: number
    heading?: number
  } | null
}

export default function MiniMap({ lat, lng, address, ambulance }: MiniMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Marcador del Paciente */}
      <Marker position={[lat, lng]} icon={emergencyMarker}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-red-700 mb-1">Ubicación de la emergencia</p>
            {address && <p className="text-gray-600">{address}</p>}
          </div>
        </Popup>
      </Marker>

      {/* Marcador de la Ambulancia (si está activa) */}
      {ambulance && (
        <Marker 
          position={[ambulance.lat, ambulance.lng]} 
          icon={ambulanceMarker}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-orange-600 mb-1">Ambulancia en camino</p>
              <p className="text-xs text-gray-500">Actualizando en tiempo real</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
