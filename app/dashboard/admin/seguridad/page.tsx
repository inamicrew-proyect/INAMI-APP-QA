'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, Activity, Users, FileText, Bell } from 'lucide-react'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'

interface Alerta {
  id: string
  tipo_alerta: string
  severidad: 'baja' | 'media' | 'alta' | 'critica'
  usuario_id: string | null
  descripcion: string
  detalles: any
  resuelta: boolean
  resuelta_por: string | null
  fecha_resolucion: string | null
  created_at: string
  usuario?: {
    id: string
    email: string
    full_name: string
  } | null
}

interface Metricas {
  totalUsuarios: number
  totalJovenes: number
  totalAtenciones: number
  alertasPendientes: number
  alertasCriticas: number
  usuariosActivos: number
}

const severidadColors = {
  baja: 'bg-blue-100 text-blue-800 border-blue-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  alta: 'bg-orange-100 text-orange-800 border-orange-200',
  critica: 'bg-red-100 text-red-800 border-red-200',
}

const tipoAlertaLabels: Record<string, string> = {
  intento_acceso_no_autorizado: 'Intento de Acceso No Autorizado',
  cambio_rol: 'Cambio de Rol',
  cambio_permisos: 'Cambio de Permisos',
  actividad_sospechosa: 'Actividad Sospechosa',
  múltiples_intentos_fallidos: 'Múltiples Intentos Fallidos',
  acceso_desde_ubicacion_inesperada: 'Acceso desde Ubicación Inesperada',
  modificacion_masiva_datos: 'Modificación Masiva de Datos',
  eliminacion_datos: 'Eliminación de Datos',
  otro: 'Otro',
}

export default function SeguridadPage() {
  const router = useRouter()
  const { hasAccess, loading: authLoading } = useAdminAccess()

  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [filtroResuelta, setFiltroResuelta] = useState<string | null>(null)
  const [filtroSeveridad, setFiltroSeveridad] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, authLoading, router])

  useEffect(() => {
    if (hasAccess) {
      loadData()
      const interval = setInterval(loadData, 30000) // Actualizar cada 30 segundos
      return () => clearInterval(interval)
    }
  }, [hasAccess, filtroResuelta, filtroSeveridad])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar alertas
      const alertasParams = new URLSearchParams()
      if (filtroResuelta !== null) {
        alertasParams.append('resuelta', filtroResuelta)
      }
      if (filtroSeveridad) {
        alertasParams.append('severidad', filtroSeveridad)
      }

      const alertasResponse = await fetch(`/api/admin/security/alerts?${alertasParams.toString()}`)
      if (alertasResponse.ok) {
        const alertasData = await alertasResponse.json()
        setAlertas(alertasData.alertas || [])
      }

      // Cargar métricas
      const metricasResponse = await fetch('/api/admin/security/metrics')
      if (metricasResponse.ok) {
        const metricasData = await metricasResponse.json()
        setMetricas(metricasData.metricas)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolverAlerta = async (alertaId: string, resuelta: boolean) => {
    try {
      const response = await fetch('/api/admin/security/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: alertaId, resuelta }),
      })

      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Shield className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seguridad</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitoreo y alertas de seguridad del sistema</p>
          </div>
        </div>
      </div>

      {/* Métricas del Sistema */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.totalUsuarios}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jóvenes Registrados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.totalJovenes}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Atenciones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.totalAtenciones}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos (7 días)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.usuariosActivos}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricas.alertasPendientes}</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertas Críticas</p>
                <p className="text-2xl font-bold text-red-600">{metricas.alertasCriticas}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select
              value={filtroResuelta || ''}
              onChange={(e) => setFiltroResuelta(e.target.value || null)}
              className="input-field"
            >
              <option value="">Todas</option>
              <option value="false">Pendientes</option>
              <option value="true">Resueltas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
            <select
              value={filtroSeveridad || ''}
              onChange={(e) => setFiltroSeveridad(e.target.value || null)}
              className="input-field"
            >
              <option value="">Todas</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Alertas de Seguridad</h2>

        {alertas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay alertas para mostrar
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`border rounded-lg p-4 ${
                  alerta.resuelta ? 'bg-gray-50 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${severidadColors[alerta.severidad]}`}
                      >
                        {alerta.severidad.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {tipoAlertaLabels[alerta.tipo_alerta] || alerta.tipo_alerta}
                      </span>
                      {alerta.resuelta && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Resuelta
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-2">{alerta.descripcion}</p>
                    {alerta.usuario && (
                      <p className="text-sm text-gray-600">
                        Usuario: {alerta.usuario.full_name} ({alerta.usuario.email})
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alerta.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!alerta.resuelta && (
                    <button
                      onClick={() => handleResolverAlerta(alerta.id, true)}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Marcar como Resuelta
                    </button>
                  )}
                  {alerta.resuelta && (
                    <button
                      onClick={() => handleResolverAlerta(alerta.id, false)}
                      className="btn-secondary text-sm px-3 py-1"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

