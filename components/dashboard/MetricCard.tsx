'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-orange-500',
  iconBg = 'bg-orange-100',
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trend.positive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {trend.positive ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
