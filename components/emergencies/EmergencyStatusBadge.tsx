'use client'

import { Emergency } from '@/types'

const statusConfig: Record<
  Emergency['status'],
  { label: string; classes: string }
> = {
  pending: {
    label: 'Pendiente',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  assigned: {
    label: 'Asignada',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  on_route: {
    label: 'En Ruta',
    classes: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  arrived: {
    label: 'En Lugar',
    classes: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  completed: {
    label: 'Completada',
    classes: 'bg-green-100 text-green-800 border-green-200',
  },
  cancelled: {
    label: 'Cancelada',
    classes: 'bg-red-100 text-red-800 border-red-200',
  },
}

interface EmergencyStatusBadgeProps {
  status: Emergency['status']
}

export default function EmergencyStatusBadge({ status }: EmergencyStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    classes: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}
    >
      {config.label}
    </span>
  )
}
