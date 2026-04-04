'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { Subscription, PaginatedResponse } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

const STATUS_CONFIG: Record<Subscription['status'], { label: string; classes: string }> = {
  active: { label: 'Activa', classes: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: 'Inactiva', classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: 'Vencida', classes: 'bg-red-100 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelada', classes: 'bg-orange-100 text-orange-700 border-orange-200' },
}

type StatusFilter = Subscription['status'] | 'all'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (statusFilter !== 'all') params.status = statusFilter

      const { data } = await api.get<PaginatedResponse<Subscription>>('/subscriptions', { params })
      setSubscriptions(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setSubscriptions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const isExpiringSoon = (endDate: string): boolean => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000 // menos de 7 días
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Suscripciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de planes y suscripciones activas de los usuarios
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'all', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'expired', label: 'Vencidas' },
            { value: 'cancelled', label: 'Canceladas' },
            { value: 'inactive', label: 'Inactivas' },
          ] as { value: StatusFilter; label: string }[]).map((opt) => (
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
            {loading ? 'Cargando...' : `${total} suscripción${total !== 1 ? 'es' : ''}`}
          </span>
          <button
            onClick={fetchSubscriptions}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No se encontraron suscripciones con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Usuario
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Plan
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Inicio
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Vencimiento
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => {
                  const statusConfig = STATUS_CONFIG[sub.status]
                  const expiring = sub.status === 'active' && isExpiringSoon(sub.endDate)

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{sub.user?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{sub.user?.email ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{sub.planName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.classes}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {formatDate(sub.startDate, 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={expiring ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                          {formatDate(sub.endDate, 'dd/MM/yyyy')}
                          {expiring && ' ⚠ Próximo a vencer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatCurrency(sub.amount)}
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
