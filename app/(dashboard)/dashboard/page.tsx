'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, Ambulance, Clock, DollarSign } from 'lucide-react'
import MetricCard from '@/components/dashboard/MetricCard'
import ActiveEmergencies from '@/components/dashboard/ActiveEmergencies'
import RevenueChart from '@/components/dashboard/RevenueChart'
import api from '@/lib/axios'
import { DashboardMetrics, Emergency, EmergencyByHour } from '@/types'

const MOCK_METRICS: DashboardMetrics = {
  activeEmergencies: 0,
  availableAmbulances: 0,
  avgResponseTimeMinutes: 0,
  todayRevenue: 0,
}

const MOCK_CHART_DATA: EmergencyByHour[] = []

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS)
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [chartData, setChartData] = useState<EmergencyByHour[]>(MOCK_CHART_DATA)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [loadingEmergencies, setLoadingEmergencies] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const { data } = await api.get<DashboardMetrics>('/admin/metrics')
      setMetrics(data)
    } catch {
      // mantener los valores actuales si falla
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  const fetchEmergencies = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: Emergency[] }>('/admin/emergencies', {
        params: { status: 'pending,assigned,on_route,arrived', limit: 8 },
      })
      setEmergencies(data.data ?? [])
    } catch {
      setEmergencies([])
    } finally {
      setLoadingEmergencies(false)
    }
  }, [])

  const fetchChartData = useCallback(async () => {
    try {
      const { data } = await api.get<EmergencyByHour[]>('/admin/emergencies/by-hour')
      setChartData(data)
    } catch {
      setChartData([])
    } finally {
      setLoadingChart(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    fetchEmergencies()
    fetchChartData()

    const interval = setInterval(() => {
      fetchMetrics()
      fetchEmergencies()
      fetchChartData()
    }, 30_000)

    return () => clearInterval(interval)
  }, [fetchMetrics, fetchEmergencies, fetchChartData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen operativo en tiempo real — Lima, Perú
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Emergencias Activas"
          value={loadingMetrics ? '…' : metrics.activeEmergencies}
          subtitle="Pendientes y en curso"
          icon={AlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-100"
        />
        <MetricCard
          title="Ambulancias Disponibles"
          value={loadingMetrics ? '…' : metrics.availableAmbulances}
          subtitle="Listas para despacho"
          icon={Ambulance}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <MetricCard
          title="Tiempo Resp. Promedio"
          value={loadingMetrics ? '…' : `${metrics.avgResponseTimeMinutes} min`}
          subtitle="Promedio del día"
          icon={Clock}
          iconColor="text-blue-500"
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Ingresos del Día"
          value={
            loadingMetrics
              ? '…'
              : new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: 'PEN',
                  minimumFractionDigits: 2,
                }).format(metrics.todayRevenue)
          }
          subtitle="Total facturado hoy"
          icon={DollarSign}
          iconColor="text-orange-500"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Emergencias activas y gráfica */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActiveEmergencies emergencies={emergencies} loading={loadingEmergencies} />
        <RevenueChart data={chartData} loading={loadingChart} />
      </div>
    </div>
  )
}
