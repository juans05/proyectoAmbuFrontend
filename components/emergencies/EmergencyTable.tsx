'use client'

import { useRouter } from 'next/navigation'
import { Emergency } from '@/types'
import { formatDate, formatCurrency, truncateId } from '@/lib/utils'
import EmergencyStatusBadge from './EmergencyStatusBadge'

interface EmergencyTableProps {
  emergencies: Emergency[]
  loading?: boolean
}

export default function EmergencyTable({ emergencies, loading }: EmergencyTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (emergencies.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No se encontraron emergencias con los filtros seleccionados.
      </div>
    )
  }

  return (
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
              Estado
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
              Dirección
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
              T. Respuesta
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
              Monto
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {emergencies.map((emergency) => (
            <tr
              key={emergency.id}
              onClick={() => router.push(`/emergencies/${emergency.id}`)}
              className="hover:bg-orange-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-orange-500">
                {truncateId(emergency.id)}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {emergency.user?.name ?? '—'}
              </td>
              <td className="px-4 py-3">
                <EmergencyStatusBadge status={emergency.status} />
              </td>
              <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                {emergency.address}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {emergency.estimatedArrivalMinutes != null
                  ? `${emergency.estimatedArrivalMinutes} min`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {emergency.totalAmount != null
                  ? formatCurrency(emergency.totalAmount)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {formatDate(emergency.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
