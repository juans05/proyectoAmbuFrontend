'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, RefreshCw, BarChart2 } from 'lucide-react'
import RevenueChart from '@/components/dashboard/RevenueChart'
import MetricCard from '@/components/dashboard/MetricCard'
import api from '@/lib/axios'
import { EmergencyByHour, DashboardMetrics } from '@/types'
import { AlertTriangle, Ambulance, DollarSign, Clock } from 'lucide-react'

interface ReportData {
  totalEmergencies: number
  completedEmergencies: number
  cancelledEmergencies: number
  totalRevenue: number
  avgResponseTime: number
  byHour: EmergencyByHour[]
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = useState(sevenDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [chartData, setChartData] = useState<EmergencyByHour[]>([])

  const fetchReport = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    try {
      const [reportRes, chartRes] = await Promise.allSettled([
        api.get<ReportData>('/admin/reports', { params: { from: dateFrom, to: dateTo } }),
        api.get<EmergencyByHour[]>('/admin/emergencies/by-hour', { params: { from: dateFrom, to: dateTo } }),
      ])

      if (reportRes.status === 'fulfilled') {
        setReportData(reportRes.value.data)
      } else {
        setReportData(null)
      }

      if (chartRes.status === 'fulfilled') {
        setChartData(chartRes.value.data)
      } else {
        setChartData([])
      }
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const response = await api.get('/admin/reports/export', {
        params: { from: dateFrom, to: dateTo },
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ambugoperú-reporte-${dateFrom}-${dateTo}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('No se pudo exportar el reporte. Inténtalo de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  const metrics: DashboardMetrics | null = reportData
    ? {
        activeEmergencies: reportData.totalEmergencies,
        availableAmbulances: reportData.completedEmergencies,
        avgResponseTimeMinutes: Math.round(reportData.avgResponseTime),
        todayRevenue: reportData.totalRevenue,
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Análisis de rendimiento operativo y financiero del sistema
        </p>
      </div>

      {/* Selector de rango + acciones */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Fecha inicio</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Fecha fin</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generando...' : 'Generar reporte'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Métricas resumen */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-500">Generando reporte...</p>
          </div>
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="Total Emergencias"
              value={metrics.activeEmergencies}
              subtitle={`Del ${dateFrom} al ${dateTo}`}
              icon={AlertTriangle}
              iconColor="text-red-500"
              iconBg="bg-red-100"
            />
            <MetricCard
              title="Emergencias Completadas"
              value={metrics.availableAmbulances}
              subtitle="Atendidas exitosamente"
              icon={Ambulance}
              iconColor="text-green-600"
              iconBg="bg-green-100"
            />
            <MetricCard
              title="Tiempo Resp. Promedio"
              value={`${metrics.avgResponseTimeMinutes} min`}
              subtitle="Tiempo medio de respuesta"
              icon={Clock}
              iconColor="text-blue-500"
              iconBg="bg-blue-100"
            />
            <MetricCard
              title="Ingresos del Período"
              value={new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
                minimumFractionDigits: 2,
              }).format(metrics.todayRevenue)}
              subtitle="Total facturado"
              icon={DollarSign}
              iconColor="text-orange-500"
              iconBg="bg-orange-100"
            />
          </div>

          {/* Emergencias canceladas */}
          {reportData && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-700">Detalle del período</h2>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Canceladas: </span>
                  <span className="font-semibold text-gray-800">{reportData.cancelledEmergencies}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tasa de éxito: </span>
                  <span className="font-semibold text-green-600">
                    {reportData.totalEmergencies > 0
                      ? ((reportData.completedEmergencies / reportData.totalEmergencies) * 100).toFixed(1)
                      : '0'}
                    %
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tasa de cancelación: </span>
                  <span className="font-semibold text-red-600">
                    {reportData.totalEmergencies > 0
                      ? ((reportData.cancelledEmergencies / reportData.totalEmergencies) * 100).toFixed(1)
                      : '0'}
                    %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Gráfica */}
          <RevenueChart data={chartData} loading={false} />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center py-16">
          <div className="text-center">
            <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              Selecciona un rango de fechas y genera el reporte para visualizar los datos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
