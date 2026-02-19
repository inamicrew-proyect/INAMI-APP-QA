'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, CheckCircle, Activity, Users, FileText, Bell, Clock } from 'lucide-react'
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

interface SystemLog {
  id: string
  accion: string
  entidad: string | null
  entidad_id: string | null
  detalles: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  usuario: {
    id: string
    email: string
    full_name: string
    role: string
  } | null
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
  
  // Estados para bitácora
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showLogs, setShowLogs] = useState(true)
  const [filtroAccion, setFiltroAccion] = useState<string>('')
  const [filtroEntidad, setFiltroEntidad] = useState<string>('')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('')
  const [totalLogs, setTotalLogs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 50

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

      // Cargar logs siempre (ahora se muestran en alertas)
      loadLogs()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async () => {
    try {
      setLoadingLogs(true)
      const params = new URLSearchParams()
      params.append('limit', logsPerPage.toString())
      params.append('offset', ((currentPage - 1) * logsPerPage).toString())
      
      if (filtroAccion) {
        params.append('accion', filtroAccion)
      }
      if (filtroEntidad) {
        params.append('entidad', filtroEntidad)
      }
      if (filtroUsuario) {
        // Si parece un UUID, usar usuario_id, sino usar búsqueda por nombre/email
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
        if (uuidRegex.test(filtroUsuario)) {
          params.append('usuario_id', filtroUsuario)
        } else {
          params.append('usuario', filtroUsuario)
        }
      }

      const response = await fetch(`/api/admin/security/logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalLogs(data.total || 0)
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    if (hasAccess) {
      loadLogs()
    }
  }, [hasAccess, currentPage, filtroAccion, filtroEntidad, filtroUsuario])

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
              id="filtro-resuelta"
              name="filtro-resuelta"
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
              id="filtro-severidad"
              name="filtro-severidad"
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

      {/* Bitácora del Sistema */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bitácora del Sistema</h2>
          </div>
          <button
            onClick={() => {
              setShowLogs(!showLogs)
              if (!showLogs) {
                loadLogs()
              }
            }}
            className="btn-secondary text-sm"
          >
            {showLogs ? 'Ocultar' : 'Mostrar'} Bitácora
          </button>
        </div>

        {showLogs && (
          <>
            {/* Filtros de Bitácora */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Acción
                </label>
                <input
                  type="text"
                  value={filtroAccion}
                  onChange={(e) => {
                    setFiltroAccion(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Filtrar por acción..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entidad
                </label>
                <input
                  type="text"
                  value={filtroEntidad}
                  onChange={(e) => {
                    setFiltroEntidad(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Filtrar por entidad..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuario ID
                </label>
                <input
                  type="text"
                  value={filtroUsuario}
                  onChange={(e) => {
                    setFiltroUsuario(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Filtrar por usuario..."
                  className="input-field"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltroAccion('')
                    setFiltroEntidad('')
                    setFiltroUsuario('')
                    setCurrentPage(1)
                  }}
                  className="btn-secondary w-full"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Tabla de Logs */}
            {loadingLogs ? (
              <div className="text-center py-8 text-gray-500">Cargando bitácora...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay registros en la bitácora</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Fecha/Hora</th>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Entidad</th>
                        <th>Detalles</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(log.created_at).toLocaleString('es-ES')}
                          </td>
                          <td>
                            {log.usuario ? (
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {log.usuario.full_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.usuario.email}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {log.usuario.role.toUpperCase()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Sistema</span>
                            )}
                          </td>
                          <td>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-sm font-medium">
                              {log.accion}
                            </span>
                          </td>
                          <td className="text-sm text-gray-600 dark:text-gray-400">
                            {log.entidad || '-'}
                          </td>
                          <td className="text-sm">
                            {log.detalles && Object.keys(log.detalles).length > 0 ? (
                              <details className="cursor-pointer group">
                                <summary className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-2">
                                  <span>Ver detalles</span>
                                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </summary>
                                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(log.detalles).map(([key, value]) => {
                                      // Formatear la clave para que sea más legible
                                      const formattedKey = key
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, l => l.toUpperCase())
                                      
                                      // Determinar el tipo de valor y formatearlo
                                      let displayValue: string | object = value as string | object
                                      let valueClass = 'text-gray-700 dark:text-gray-300'
                                      
                                      if (value === null || value === undefined) {
                                        displayValue = 'N/A'
                                        valueClass = 'text-gray-400 dark:text-gray-500 italic'
                                      } else if (typeof value === 'boolean') {
                                        displayValue = value ? 'Sí' : 'No'
                                        valueClass = value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                      } else if (typeof value === 'object') {
                                        displayValue = JSON.stringify(value, null, 2)
                                        valueClass = 'text-gray-600 dark:text-gray-400 font-mono text-xs'
                                      } else if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                        // Es un UUID - mostrar abreviado
                                        displayValue = `${value.substring(0, 8)}...`
                                        valueClass = 'text-purple-600 dark:text-purple-400 font-mono text-xs'
                                      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                                        // Es una fecha, formatearla
                                        try {
                                          const date = new Date(value)
                                          displayValue = date.toLocaleString('es-ES', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                          valueClass = 'text-blue-600 dark:text-blue-400'
                                        } catch {
                                          displayValue = String(value)
                                        }
                                      } else {
                                        const strValue = String(value)
                                        displayValue = strValue.length > 50 ? `${strValue.substring(0, 50)}...` : strValue
                                      }
                                      
                                      // Determinar si es un UUID para mostrar tooltip
                                      const isUUID = typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                                      
                                      return (
                                        <div key={key} className="flex flex-col">
                                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            {formattedKey}
                                          </span>
                                          {typeof value === 'object' && value !== null ? (
                                            <pre className={`${valueClass} p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-32`}>
                                              {displayValue}
                                            </pre>
                                          ) : isUUID ? (
                                            <div className="group/uid relative inline-block">
                                              <span 
                                                className={`${valueClass} cursor-help border-b border-dashed border-purple-400 dark:border-purple-500 hover:border-purple-600 dark:hover:border-purple-400 transition-colors px-1`}
                                                title={value}
                                              >
                                                {displayValue}
                                              </span>
                                              <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover/uid:opacity-100 group-hover/uid:visible transition-all duration-200 z-50 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl max-w-xs break-all whitespace-normal border border-gray-700">
                                                <div className="font-mono text-xs mb-1 text-gray-400">UUID completo:</div>
                                                <div className="font-mono">{value}</div>
                                                <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className={valueClass} title={typeof value === 'string' && value.length > 50 ? String(value) : undefined}>
                                              {displayValue}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </details>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="text-xs text-gray-500 dark:text-gray-400">
                            {log.ip_address || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, totalLogs)} de {totalLogs} registros
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage * logsPerPage >= totalLogs}
                      className="btn-secondary text-sm disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Alertas de Seguridad y Monitoreo del Sistema */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alertas de Seguridad</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitoreo de todas las acciones del sistema</p>
            </div>
          </div>
        </div>

        {/* Filtros para logs en alertas */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Acción
            </label>
            <input
              type="text"
              value={filtroAccion}
              onChange={(e) => {
                setFiltroAccion(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Filtrar por acción..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entidad
            </label>
            <input
              type="text"
              value={filtroEntidad}
              onChange={(e) => {
                setFiltroEntidad(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Filtrar por entidad..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuario
            </label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => {
                setFiltroUsuario(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Nombre, email o ID..."
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroAccion('')
                setFiltroEntidad('')
                setFiltroUsuario('')
                setCurrentPage(1)
              }}
              className="btn-secondary w-full"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Mostrar Logs del Sistema */}
        {loadingLogs ? (
          <div className="text-center py-8 text-gray-500">Cargando acciones de monitoreo...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay acciones de monitoreo para mostrar
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Detalles</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString('es-ES')}
                      </td>
                      <td>
                        {log.usuario ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {log.usuario.full_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {log.usuario.email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {log.usuario.role.toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Sistema</span>
                        )}
                      </td>
                      <td>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-sm font-medium">
                          {log.accion}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-400">
                        {log.entidad || '-'}
                      </td>
                          <td className="text-sm">
                            {log.detalles && Object.keys(log.detalles).length > 0 ? (
                              <details className="cursor-pointer group">
                                <summary className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-2">
                                  <span>Ver detalles</span>
                                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </summary>
                                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(log.detalles).map(([key, value]) => {
                                      // Formatear la clave para que sea más legible
                                      const formattedKey = key
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, l => l.toUpperCase())
                                      
                                      // Determinar el tipo de valor y formatearlo
                                      let displayValue: string | object = value as string | object
                                      let valueClass = 'text-gray-700 dark:text-gray-300'
                                      
                                      if (value === null || value === undefined) {
                                        displayValue = 'N/A'
                                        valueClass = 'text-gray-400 dark:text-gray-500 italic'
                                      } else if (typeof value === 'boolean') {
                                        displayValue = value ? 'Sí' : 'No'
                                        valueClass = value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                      } else if (typeof value === 'object') {
                                        displayValue = JSON.stringify(value, null, 2)
                                        valueClass = 'text-gray-600 dark:text-gray-400 font-mono text-xs'
                                      } else if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                                        // Es un UUID - mostrar abreviado
                                        displayValue = `${value.substring(0, 8)}...`
                                        valueClass = 'text-purple-600 dark:text-purple-400 font-mono text-xs'
                                      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                                        // Es una fecha, formatearla
                                        try {
                                          const date = new Date(value)
                                          displayValue = date.toLocaleString('es-ES', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                          valueClass = 'text-blue-600 dark:text-blue-400'
                                        } catch {
                                          displayValue = String(value)
                                        }
                                      } else {
                                        const strValue = String(value)
                                        displayValue = strValue.length > 50 ? `${strValue.substring(0, 50)}...` : strValue
                                      }
                                      
                                      // Determinar si es un UUID para mostrar tooltip
                                      const isUUID = typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                                      
                                      return (
                                        <div key={key} className="flex flex-col">
                                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            {formattedKey}
                                          </span>
                                          {typeof value === 'object' && value !== null ? (
                                            <pre className={`${valueClass} p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-32`}>
                                              {displayValue}
                                            </pre>
                                          ) : isUUID ? (
                                            <div className="group/uid relative inline-block">
                                              <span 
                                                className={`${valueClass} cursor-help border-b border-dashed border-purple-400 dark:border-purple-500 hover:border-purple-600 dark:hover:border-purple-400 transition-colors px-1`}
                                                title={value}
                                              >
                                                {displayValue}
                                              </span>
                                              <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover/uid:opacity-100 group-hover/uid:visible transition-all duration-200 z-50 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl max-w-xs break-all whitespace-normal border border-gray-700">
                                                <div className="font-mono text-xs mb-1 text-gray-400">UUID completo:</div>
                                                <div className="font-mono">{value}</div>
                                                <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                              </div>
                                            </div>
                                          ) : (
                                            <span className={valueClass} title={typeof value === 'string' && value.length > 50 ? String(value) : undefined}>
                                              {displayValue}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </details>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                      <td className="text-xs text-gray-500 dark:text-gray-400">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, totalLogs)} de {totalLogs} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * logsPerPage >= totalLogs}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}

        {/* También mostrar alertas de seguridad tradicionales si existen */}
        {alertas.length > 0 && (
          <>
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Alertas de Seguridad Tradicionales</h3>
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}

