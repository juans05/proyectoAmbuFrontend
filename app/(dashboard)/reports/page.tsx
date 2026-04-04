'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, RefreshCw, BarChart2 } from 'lucide-react'
import { AlertTriangle, Ambulance, DollarSign, Clock } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import MetricCard from '@/components/dashboard/MetricCard'
import api from '@/lib/axios'
import { DashboardMetrics, EmergencyByHour } from '@/types'

interface RevenuePoint {
  date: string
  revenue: number
  commission?: number
}

interface ResponseTimePoint {
  date: string
  avgMinutes: number
}

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
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimePoint[]>([])

  const fetchReport = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    try {
      const [revenueRes, responseTimesRes] = await Promise.allSettled([
        api.get<RevenuePoint[] | { data: RevenuePoint[]; summary?: ReportData }>('/reports/revenue', {
          params: { from: dateFrom, to: dateTo },
        }),
        api.get<ResponseTimePoint[] | { data: ResponseTimePoint[]; summary?: Partial<ReportData> }>('/reports/response-times', {
          params: { from: dateFrom, to: dateTo },
        }),
      ])

      if (revenueRes.status === 'fulfilled') {
        const raw = revenueRes.value.data
        if (Array.isArray(raw)) {
          setRevenueData(raw)
          // Calcular summary a partir del array
          const totalRevenue = raw.reduce((s, r) => s + (r.revenue ?? 0), 0)
          setReportData((prev) => ({
            totalEmergencies: prev?.totalEmergencies ?? 0,
            completedEmergencies: prev?.completedEmergencies ?? 0,
            cancelledEmergencies: prev?.cancelledEmergencies ?? 0,
            avgResponseTime: prev?.avgResponseTime ?? 0,
            byHour: prev?.byHour ?? [],
            totalRevenue,
          }))
        } else {
          setRevenueData((raw as { data: RevenuePoint[] }).data ?? [])
          if ((raw as { summary?: ReportData }).summary) {
            setReportData((raw as { summary: ReportData }).summary)
          }
        }
      } else {
        setRevenueData([])
      }

      if (responseTimesRes.status === 'fulfilled') {
        const raw = responseTimesRes.value.data
        if (Array.isArray(raw)) {
          setResponseTimeData(raw)
          if (raw.length > 0) {
            const avg = raw.reduce((s, r) => s + (r.avgMinutes ?? 0), 0) / raw.length
            setReportData((prev) => prev ? { ...prev, avgResponseTime: avg } : null)
          }
        } else {
          setResponseTimeData((raw as { data: ResponseTimePoint[] }).data ?? [])
        }
      } else {
        setResponseTimeData([])
      }
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  // Exportar CSV generado en el browser con los datos actuales
  const handleExportCSV = () => {
    setExporting(true)
    try {
      const rows: string[] = [
        'Fecha,Ingresos (S/),Comisión AmbuGo (S/),Tiempo Respuesta Promedio (min)',
      ]

      // Combinar datos de revenue y response-times por fecha
      const dateMap = new Map<string, { revenue: number; commission: number; avgMin: number }>()
      revenueData.forEach((r) => {
        dateMap.set(r.date, {
          revenue: r.revenue ?? 0,
          commission: r.commission ?? (r.revenue ?? 0) * 0.12,
          avgMin: 0,
        })
      })
      responseTimeData.forEach((r) => {
        const existing = dateMap.get(r.date) ?? { revenue: 0, commission: 0, avgMin: 0 }
        dateMap.set(r.date, { ...existing, avgMin: r.avgMinutes ?? 0 })
      })

      dateMap.forEach((val, date) => {
        rows.push(
          `${date},${val.revenue.toFixed(2)},${val.commission.toFixed(2)},${val.avgMin.toFixed(1)}`
        )
      })

      if (rows.length === 1) {
        rows.push(`${dateFrom} al ${dateTo},0.00,0.00,0.0`)
      }

      const csvContent = rows.join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `ambugo-reporte-${dateFrom}-${dateTo}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
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

          {/* Gráfica de ingresos por período */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Ingresos por Período (S/)</h2>
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                Sin datos de ingresos para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: unknown) => [`S/ ${Number(value).toFixed(2)}`, 'Ingresos']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gráfica de tiempos de respuesta */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Tiempos de Respuesta (minutos)</h2>
            {responseTimeData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-sm text-gray-400">
                Sin datos de tiempos de respuesta para el período seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={responseTimeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: unknown) => [`${Number(value).toFixed(1)} min`, 'Tiempo promedio']}
                  />
                  <Bar dataKey="avgMinutes" name="Tiempo promedio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
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
