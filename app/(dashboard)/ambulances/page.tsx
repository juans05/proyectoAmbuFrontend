'use client'

import { useEffect, useState, useCallback } from 'react'
import { Ambulance as AmbulanceIcon, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { Ambulance, PaginatedResponse } from '@/types'

type StatusFilter = Ambulance['status'] | 'all'

const STATUS_CONFIG: Record<Ambulance['status'], { label: string; classes: string }> = {
  available: { label: 'Disponible', classes: 'bg-green-100 text-green-700 border-green-200' },
  on_route: { label: 'En Ruta', classes: 'bg-red-100 text-red-700 border-red-200' },
  busy: { label: 'Ocupada', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
  offline: { label: 'Offline', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const AMBULANCE_TYPES: Record<string, string> = {
  I: 'Tipo I — Básica',
  II: 'Tipo II — Soporte Vital Básico',
  III: 'Tipo III — Soporte Vital Avanzado',
}

export default function AmbulancesPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchAmbulances = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (statusFilter !== 'all') params.status = statusFilter

      const { data } = await api.get<PaginatedResponse<Ambulance>>('/admin/ambulances', { params })
      setAmbulances(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setAmbulances([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    fetchAmbulances()
  }, [fetchAmbulances])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'available', label: 'Disponible' },
    { value: 'on_route', label: 'En Ruta' },
    { value: 'busy', label: 'Ocupada' },
    { value: 'offline', label: 'Offline' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Flota de Ambulancias</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registro y estado operativo de todas las ambulancias en la plataforma
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${total} ambulancia${total !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={fetchAmbulances}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : ambulances.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No se encontraron ambulancias con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Placa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Empresa
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Conductor
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Ubicación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ambulances.map((amb) => {
                  const statusConfig = STATUS_CONFIG[amb.status]
                  return (
                    <tr key={amb.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <AmbulanceIcon className="w-4 h-4 text-orange-500" />
                          </div>
                          <span className="font-mono font-semibold text-gray-800">{amb.plate}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {AMBULANCE_TYPES[amb.type] ?? `Tipo ${amb.type}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {amb.company?.name ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {amb.conductor ? (
                          <div>
                            <p className="text-gray-700">{amb.conductor.name}</p>
                            <p className="text-xs text-gray-400">{amb.conductor.phone ?? ''}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.classes}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">
                        {amb.locationLat != null && amb.locationLng != null
                          ? `${amb.locationLat.toFixed(4)}, ${amb.locationLng.toFixed(4)}`
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
