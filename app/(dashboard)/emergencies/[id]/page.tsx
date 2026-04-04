'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, MapPin, Clock, User, Ambulance as AmbulanceIcon } from 'lucide-react'
import EmergencyStatusBadge from '@/components/emergencies/EmergencyStatusBadge'
import api from '@/lib/axios'
import { Emergency } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

// Mini mapa con react-leaflet — cargado sin SSR
const MiniMap = dynamic(
  () => import('@/components/map/MiniMap'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-gray-50 text-sm text-gray-400">Cargando mapa...</div> }
)

const STATUS_TIMELINE: { key: Emergency['status']; label: string }[] = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'assigned', label: 'Ambulancia asignada' },
  { key: 'on_route', label: 'En camino' },
  { key: 'arrived', label: 'En el lugar' },
  { key: 'completed', label: 'Completada' },
]

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  assigned: 1,
  on_route: 2,
  arrived: 3,
  completed: 4,
  cancelled: -1,
}

export default function EmergencyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [emergency, setEmergency] = useState<Emergency | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchEmergency = async () => {
      setLoading(true)
      try {
        const { data } = await api.get<Emergency>(`/emergencies/${id}`)
        setEmergency(data)
      } catch {
        setError('No se pudo cargar la emergencia. Verifica que el ID sea correcto.')
      } finally {
        setLoading(false)
      }
    }
    fetchEmergency()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !emergency) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
          {error ?? 'Emergencia no encontrada.'}
        </div>
      </div>
    )
  }

  const currentOrder = STATUS_ORDER[emergency.status] ?? -1
  const isCancelled = emergency.status === 'cancelled'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Encabezado */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">Emergencia</h1>
            <span className="font-mono text-sm text-gray-400">#{emergency.id.slice(-10)}</span>
            <EmergencyStatusBadge status={emergency.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">{formatDate(emergency.createdAt)}</p>
        </div>
      </div>

      {/* Timeline de estados */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Progreso de la emergencia</h2>
          <div className="flex items-center gap-0">
            {STATUS_TIMELINE.map((step, index) => {
              const stepOrder = STATUS_ORDER[step.key]
              const isDone = currentOrder >= stepOrder
              const isLast = index === STATUS_TIMELINE.length - 1

              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        isDone
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 text-center max-w-[70px] leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mb-4 ${
                        currentOrder > stepOrder ? 'bg-orange-400' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Esta emergencia fue cancelada.
          {emergency.cancelReason && (
            <span className="ml-1 font-medium">Motivo: {emergency.cancelReason}</span>
          )}
        </div>
      )}

      {/* Mini mapa de ubicación del usuario */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">Ubicación de la emergencia</h2>
          <span className="text-xs text-gray-400 ml-auto font-mono">
            {emergency.userLat.toFixed(5)}, {emergency.userLng.toFixed(5)}
          </span>
        </div>
        <div style={{ height: '300px' }}>
          <MiniMap lat={emergency.userLat} lng={emergency.userLng} address={emergency.address} />
        </div>
      </div>

      {/* Detalles en grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos del usuario */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />
            Datos del usuario
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre</span>
              <span className="text-gray-800 font-medium">{emergency.user?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Correo</span>
              <span className="text-gray-800">{emergency.user?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Teléfono</span>
              <span className="text-gray-800">{emergency.user?.phone ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID usuario</span>
              <span className="font-mono text-xs text-gray-400">{emergency.userId}</span>
            </div>
          </div>
        </div>

        {/* Datos de la emergencia */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            Datos de la emergencia
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="text-gray-800 font-medium capitalize">{emergency.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dirección</span>
              <span className="text-gray-800 text-right max-w-[200px]">{emergency.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coordenadas</span>
              <span className="font-mono text-xs text-gray-400">
                {emergency.userLat.toFixed(5)}, {emergency.userLng.toFixed(5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha creación</span>
              <span className="text-gray-800">{formatDate(emergency.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Ambulancia asignada */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AmbulanceIcon className="w-4 h-4 text-orange-500" />
            Ambulancia asignada
          </h2>
          {emergency.ambulance ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Placa</span>
                <span className="font-mono font-semibold text-gray-800">{emergency.ambulance.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="text-gray-800">Tipo {emergency.ambulance.type}</span>
              </div>
              {emergency.ambulance.conductor && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Conductor</span>
                  <span className="text-gray-800">{emergency.ambulance.conductor.name}</span>
                </div>
              )}
              {emergency.ambulance.company && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Empresa</span>
                  <span className="text-gray-800">{emergency.ambulance.company.name}</span>
                </div>
              )}
              {emergency.estimatedArrivalMinutes != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ETA</span>
                  <span className="text-gray-800 font-medium">{emergency.estimatedArrivalMinutes} min</span>
                </div>
              )}
            </div>
          ) : emergency.ambulanceId ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID ambulancia</span>
                <span className="font-mono text-xs text-gray-400">{emergency.ambulanceId}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin ambulancia asignada aún.</p>
          )}
        </div>

        {/* Tiempos y monto */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Tiempos y cobro
          </h2>
          <div className="space-y-2 text-sm">
            {emergency.assignedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Asignada</span>
                <span className="text-gray-800">{formatDate(emergency.assignedAt)}</span>
              </div>
            )}
            {emergency.arrivedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Llegó al lugar</span>
                <span className="text-gray-800">{formatDate(emergency.arrivedAt)}</span>
              </div>
            )}
            {emergency.completedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Completada</span>
                <span className="text-gray-800">{formatDate(emergency.completedAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Monto total</span>
              <span className="text-gray-800 font-semibold">
                {emergency.totalAmount != null
                  ? formatCurrency(emergency.totalAmount)
                  : '—'}
              </span>
            </div>
            {emergency.platformFee != null && (
              <div className="flex justify-between">
                <span className="text-gray-500">Comisión AmbuGo (12%)</span>
                <span className="text-orange-600 font-medium">{formatCurrency(emergency.platformFee)}</span>
              </div>
            )}
            {emergency.discountApplied && (
              <div className="flex justify-between">
                <span className="text-gray-500">Descuento suscripción</span>
                <span className="text-green-600 font-medium">20% aplicado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
