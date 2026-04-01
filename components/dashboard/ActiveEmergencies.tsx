'use client'

import Link from 'next/link'
import { Emergency } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import EmergencyStatusBadge from '@/components/emergencies/EmergencyStatusBadge'

interface ActiveEmergenciesProps {
  emergencies: Emergency[]
  loading?: boolean
}

export default function ActiveEmergencies({ emergencies, loading }: ActiveEmergenciesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Emergencias Activas</h2>
        <Link
          href="/emergencies"
          className="text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          Ver todas →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : emergencies.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay emergencias activas en este momento.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">ID</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Estado</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Dirección</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-2">Hace</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.slice(0, 8).map((emergency) => (
                <tr
                  key={emergency.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`/emergencies/${emergency.id}`}
                      className="text-orange-500 hover:underline font-mono text-xs"
                    >
                      ...{emergency.id.slice(-8)}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-gray-700 capitalize">{emergency.type}</td>
                  <td className="py-2 pr-4">
                    <EmergencyStatusBadge status={emergency.status} />
                  </td>
                  <td className="py-2 pr-4 text-gray-600 max-w-[180px] truncate">
                    {emergency.address}
                  </td>
                  <td className="py-2 text-gray-400 text-xs whitespace-nowrap">
                    {formatRelativeTime(emergency.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
