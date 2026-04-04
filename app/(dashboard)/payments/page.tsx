'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart2, RefreshCw } from 'lucide-react'
import api from '@/lib/axios'
import { Payment, PaginatedResponse } from '@/types'
import { formatDate, formatCurrency, truncateId } from '@/lib/utils'

const STATUS_CONFIG: Record<Payment['status'], { label: string; classes: string }> = {
  pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  completed: { label: 'Completado', classes: 'bg-green-100 text-green-700 border-green-200' },
  failed: { label: 'Fallido', classes: 'bg-red-100 text-red-700 border-red-200' },
  refunded: { label: 'Reembolsado', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const METHOD_LABELS: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
}

type StatusFilter = Payment['status'] | 'all'

const COMMISSION_RATE = 0.12

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (statusFilter !== 'all') params.status = statusFilter

      const { data } = await api.get<PaginatedResponse<Payment>>('/payments/report', { params })
      setPayments(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setPayments([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const totalAmount = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalCommission = totalAmount * COMMISSION_RATE

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pagos y Comisiones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registro de transacciones y comisiones generadas en la plataforma
        </p>
      </div>

      {/* Resumen */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 font-medium mb-1">Total pagado (página actual)</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500 font-medium mb-1">Comisión AmbuGo ({(COMMISSION_RATE * 100).toFixed(0)}%)</p>
            <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalCommission)}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'all', label: 'Todos' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'completed', label: 'Completados' },
            { value: 'failed', label: 'Fallidos' },
            { value: 'refunded', label: 'Reembolsados' },
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
            {loading ? 'Cargando...' : `${total} pago${total !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={fetchPayments}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No se encontraron pagos con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    ID
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Usuario
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Emergencia
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Monto
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Comisión
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Método
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => {
                  const statusConfig = STATUS_CONFIG[payment.status]
                  const commission = payment.status === 'completed' ? payment.amount * COMMISSION_RATE : 0

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-orange-500">
                        {truncateId(payment.id)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          <div>
                            <p className="text-gray-800">{payment.user?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{payment.user?.email ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {payment.emergencyId ? truncateId(payment.emergencyId) : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-orange-600 font-medium text-xs">
                        {commission > 0 ? formatCurrency(commission) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.classes}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(payment.createdAt)}
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
