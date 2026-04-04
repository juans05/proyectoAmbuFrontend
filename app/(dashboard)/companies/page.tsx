'use client'

import { useEffect, useState, useCallback } from 'react'
import { Building2, CheckCircle, XCircle, RefreshCw, Plus, X } from 'lucide-react'
import api from '@/lib/axios'
import { Company, PaginatedResponse } from '@/types'
import { formatDate } from '@/lib/utils'

type CompanyStatus = 'all' | 'verified' | 'pending' | 'suspended'

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  verified: { label: 'Verificada', classes: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'Pendiente', classes: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  suspended: { label: 'Suspendida', classes: 'bg-red-100 text-red-700 border-red-200' },
}

function getCompanyStatus(company: Company): 'verified' | 'pending' | 'suspended' {
  if (company.isVerified) return 'verified'
  return 'pending'
}

interface RegisterForm {
  name: string
  ruc: string
  phone: string
  address: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<CompanyStatus>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  // Register modal state
  const [showModal, setShowModal] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [form, setForm] = useState<RegisterForm>({ name: '', ruc: '', phone: '', address: '' })

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit }
      if (filter !== 'all') params.filter = filter

      const { data } = await api.get<PaginatedResponse<Company>>('/companies', { params })
      setCompanies(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setCompanies([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { setPage(1) }, [filter])
  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const handleVerify = async (companyId: string) => {
    setActionLoading(companyId)
    try {
      await api.put(`/companies/${companyId}/verify`)
      await fetchCompanies()
    } catch { /* silent */ } finally { setActionLoading(null) }
  }

  const handleSuspend = async (companyId: string) => {
    if (!confirm('¿Estás seguro de suspender esta empresa?')) return
    setActionLoading(companyId)
    try {
      await api.put(`/companies/${companyId}/suspend`)
      await fetchCompanies()
    } catch { /* silent */ } finally { setActionLoading(null) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterLoading(true)
    setRegisterError(null)
    try {
      await api.post('/companies', form)
      setShowModal(false)
      setForm({ name: '', ruc: '', phone: '', address: '' })
      await fetchCompanies()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setRegisterError(typeof msg === 'string' ? msg : 'Error al registrar empresa')
    } finally {
      setRegisterLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Empresas de Ambulancias</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión y verificación de empresas operadoras registradas en AmbuGo
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Empresa
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'all', label: 'Todas' },
            { value: 'verified', label: 'Verificadas' },
            { value: 'pending', label: 'Pendientes' },
          ] as { value: CompanyStatus; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === opt.value
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
            {loading ? 'Cargando...' : `${total} empresa${total !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={fetchCompanies}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No se encontraron empresas con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Empresa', 'RUC', 'Contacto', 'Estado', 'Registro', 'Acciones'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company) => {
                  const status = getCompanyStatus(company)
                  const statusConfig = STATUS_LABELS[status]
                  const isActioning = actionLoading === company.id
                  return (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{company.name}</p>
                            {company.address && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{company.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{company.ruc}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{company.email ?? '—'}</p>
                        <p className="text-xs text-gray-400">{company.phone ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.classes}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {company.createdAt ? formatDate(company.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!company.isVerified && (
                            <button
                              onClick={() => handleVerify(company.id)}
                              disabled={isActioning}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Verificar
                            </button>
                          )}
                          {company.isVerified && (
                            <button
                              onClick={() => handleSuspend(company.id)}
                              disabled={isActioning}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Suspender
                            </button>
                          )}
                          {isActioning && <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full" />}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal registrar empresa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Registrar Empresa</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {registerError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {registerError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Ambulancias Lima S.A.C." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RUC (11 dígitos) *</label>
                <input required value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                  maxLength={11} pattern="[0-9]{11}" title="RUC debe tener 11 dígitos"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="20100000001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="+51 999 999 999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Av. Ejemplo 123, Lima" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={registerLoading}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold transition-colors">
                  {registerLoading ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
