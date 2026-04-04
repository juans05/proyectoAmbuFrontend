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

interface MiniMapProps {
  lat: number
  lng: number
  address?: string
}

export default function MiniMap({ lat, lng, address }: MiniMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={emergencyMarker}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold text-red-700 mb-1">Ubicación de la emergencia</p>
            {address && <p className="text-gray-600">{address}</p>}
            <p className="font-mono text-xs text-gray-400 mt-1">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
