'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Activity, Users, FileText, Clock, FileDown, Bell } from 'lucide-react'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'
import { Routes } from '@/lib/routes'
import { BitacoraLogDetalles } from '@/components/BitacoraLogDetalles'

interface Metricas {
  totalUsuarios: number
  totalJovenes: number
  totalAtenciones: number
  usuariosActivos: number
}

interface NotificacionCritica {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  fecha_creacion: string
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

/** Rango de fechas en ISO para filtrar `created_at` en la API (día local). */
function fechaInicioDiaIso(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toISOString()
}

function fechaFinDiaIso(fecha: string) {
  return new Date(`${fecha}T23:59:59.999`).toISOString()
}

export default function SeguridadPage() {
  const router = useRouter()
  const { hasAccess, loading: authLoading } = useAdminAccess()

  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState<Metricas | null>(null)

  // Estados para bitácora
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showLogs, setShowLogs] = useState(true)
  const [filtroAccion, setFiltroAccion] = useState<string>('')
  const [filtroEntidad, setFiltroEntidad] = useState<string>('')
  const [filtroUsuario, setFiltroUsuario] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [totalLogs, setTotalLogs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [logsPerPage, setLogsPerPage] = useState(50)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [criticalNotifs, setCriticalNotifs] = useState<NotificacionCritica[]>([])
  const [criticalUnread, setCriticalUnread] = useState(0)
  const [diasNotificacionVisible, setDiasNotificacionVisible] = useState(7)
  const [guardandoDiasNotificacion, setGuardandoDiasNotificacion] = useState(false)
  const [msgDiasNotificacion, setMsgDiasNotificacion] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, authLoading, router])

  useEffect(() => {
    if (hasAccess) {
      loadData()
    }
  }, [hasAccess])

  const loadData = async () => {
    try {
      setLoading(true)

      const [metricasResponse, criticalResponse, diasNotificacionResponse] = await Promise.all([
        fetch('/api/admin/security/metrics'),
        fetch('/api/admin/security/critical-notifications'),
        fetch('/api/admin/maintenance/notifications-lifetime'),
      ])

      if (metricasResponse.ok) {
        const metricasData = await metricasResponse.json()
        const m = metricasData.metricas
        setMetricas({
          totalUsuarios: m.totalUsuarios ?? 0,
          totalJovenes: m.totalJovenes ?? 0,
          totalAtenciones: m.totalAtenciones ?? 0,
          usuariosActivos: m.usuariosActivos ?? 0,
        })
      }

      if (criticalResponse.ok) {
        const crit = await criticalResponse.json()
        setCriticalNotifs(crit.items || [])
        setCriticalUnread(typeof crit.unreadCount === 'number' ? crit.unreadCount : 0)
      } else {
        setCriticalNotifs([])
        setCriticalUnread(0)
      }

      if (diasNotificacionResponse.ok) {
        const cfg = await diasNotificacionResponse.json()
        setDiasNotificacionVisible(typeof cfg.diasVisibles === 'number' ? cfg.diasVisibles : 7)
      }

      loadLogs()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarDiasNotificacion = async () => {
    try {
      setGuardandoDiasNotificacion(true)
      setMsgDiasNotificacion(null)
      const res = await fetch('/api/admin/maintenance/notifications-lifetime', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ diasVisibles: diasNotificacionVisible }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar el parámetro')
      }
      setDiasNotificacionVisible(data.diasVisibles)
      setMsgDiasNotificacion(`Guardado. Las notificaciones durarán ${data.diasVisibles} día(s).`)
    } catch (error) {
      setMsgDiasNotificacion(error instanceof Error ? error.message : 'Error al guardar parámetro')
    } finally {
      setGuardandoDiasNotificacion(false)
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
      if (fechaDesde) {
        params.append('fecha_desde', fechaInicioDiaIso(fechaDesde))
      }
      if (fechaHasta) {
        params.append('fecha_hasta', fechaFinDiaIso(fechaHasta))
      }

      const response = await fetch(`/api/admin/security/logs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const fetchedLogs: SystemLog[] = data.logs || []
        // Ocultar login/logout en la bitácora (no se registran para nuevas acciones)
        const visibleLogs = fetchedLogs.filter(l => {
          const a = String(l.accion || '').toLowerCase()
          return a !== 'login' && a !== 'logout'
        })
        setLogs(visibleLogs)
        setTotalLogs(data.total || 0)
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const exportBitacoraPDF = async () => {
    if (logs.length === 0) return
    setExportingPdf(true)
    try {
      const JsPDF = (await import('jspdf')).default
      const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 12
      const lineHeight = 3.8
      const tableTop = 32
      const bottomLimit = pageH - 15

      const cols = [
        { label: 'Fecha/Hora', w: 30 },
        { label: 'Usuario', w: 42 },
        { label: 'Acción', w: 28 },
        { label: 'Entidad', w: 26 },
        { label: 'Detalles', w: 72 },
        { label: 'IP', w: 24 },
      ]
      const totalColW = cols.reduce((s, c) => s + c.w, 0)

      const formatDetalles = (det: any): string => {
        if (det == null) return '-'
        if (typeof det !== 'object') return String(det)
        const parts: string[] = []
        for (const [k, v] of Object.entries(det)) {
          const val = v === null || v === undefined ? 'N/A' : typeof v === 'object' ? JSON.stringify(v) : String(v)
          parts.push(`${k}: ${val}`)
        }
        return parts.length ? parts.join(' | ') : '-'
      }

      const drawLogo = async () => {
        try {
          const url = typeof window !== 'undefined' ? `${window.location.origin}/inami.png` : ''
          if (!url) return
          const resp = await fetch(url)
          if (!resp.ok) return
          const blob = await resp.blob()
          const dataUrl = await new Promise<string>((res, rej) => {
            const r = new FileReader()
            r.onload = () => res(r.result as string)
            r.onerror = rej
            r.readAsDataURL(blob)
          })
          doc.addImage(dataUrl, 'PNG', pageW - margin - 22, 6, 22, 22)
        } catch {
          // Si no hay logo, continuar sin él
        }
      }

      await drawLogo()

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Bitácora del Sistema', margin, 14)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Exportado: ${new Date().toLocaleString('es-ES')} — ${logs.length} registros`, margin, 21)

      const drawTableHeader = (startY: number) => {
        let x = margin
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        cols.forEach((col) => {
          doc.text(col.label, x, startY)
          x += col.w
        })
        const lineY = startY + 4
        doc.setDrawColor(180, 180, 180)
        doc.line(margin, lineY, margin + totalColW, lineY)
        return lineY + 3
      }

      let y = drawTableHeader(tableTop)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)

      for (const log of logs) {
        const fecha = new Date(log.created_at).toLocaleString('es-ES')
        const usuario = log.usuario ? `${log.usuario.full_name} (${log.usuario.email})` : 'Sistema'
        const detalles = formatDetalles(log.detalles)
        const cellTexts = [
          fecha,
          usuario,
          log.accion,
          log.entidad || '-',
          detalles,
          log.ip_address || '-',
        ]

        const cellLines = cols.map((col, i) => {
          const text = String(cellTexts[i] ?? '')
          return doc.splitTextToSize(text || '-', col.w - 1.5)
        })
        const rowLines = Math.max(1, ...cellLines.map((arr) => arr.length))
        const rowHeight = rowLines * lineHeight

        if (y + rowHeight > bottomLimit) {
          doc.addPage('l')
          y = margin + 8
          drawTableHeader(y)
          y += 6
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7)
        }

        const rowYStart = y
        cols.forEach((_, i) => {
          const lines = cellLines[i]
          let lineY = rowYStart + lineHeight * 0.7
          const x = margin + cols.slice(0, i).reduce((s, c) => s + c.w, 0)
          lines.forEach((line: string) => {
            doc.text(line, x, lineY)
            lineY += lineHeight
          })
        })
        y = rowYStart + rowHeight

        doc.setDrawColor(240, 240, 240)
        doc.line(margin, y, margin + totalColW, y)
        y += 2
      }

      const filename = `Bitacora-Sistema-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('Error exportando PDF:', err)
    } finally {
      setExportingPdf(false)
    }
  }

  useEffect(() => {
    if (hasAccess) {
      loadLogs()
    }
  }, [hasAccess, currentPage, filtroAccion, filtroEntidad, filtroUsuario, fechaDesde, fechaHasta, logsPerPage])

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
            <p className="text-gray-600 dark:text-gray-400">
              Métricas del sistema, alertas críticas (cambios de rol) y bitácora de actividad
            </p>
          </div>
        </div>
      </div>

      {/* Métricas del sistema + notificaciones críticas (mismo nivel visual) */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
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

          <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col min-h-[160px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificaciones críticas</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{criticalUnread}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">sin leer</p>
              </div>
              <Bell className="w-8 h-8 text-amber-600 shrink-0" aria-hidden />
            </div>
            {criticalNotifs.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">Sin alertas recientes de este tipo.</p>
            ) : (
              <ul className="text-xs space-y-1.5 max-h-28 overflow-y-auto flex-1 border-t border-amber-200/60 dark:border-amber-800/40 pt-2">
                {criticalNotifs.slice(0, 5).map((n) => (
                  <li key={n.id} className={n.leida ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300 font-medium'}>
                    <span className="line-clamp-2">{n.titulo}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {new Date(n.fecha_creacion).toLocaleString('es-ES')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={Routes.NOTIFICACIONES}
              className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline mt-2"
            >
              Ver todas las notificaciones →
            </Link>
          </div>
        </div>
      )}

      {/* Mantenimiento de parámetros */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Mantenimiento de parámetros</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días visibles de notificaciones (máximo 7)
            </label>
            <input
              type="number"
              min={1}
              max={7}
              value={diasNotificacionVisible}
              onChange={(e) => setDiasNotificacionVisible(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
              className="input-field w-full md:max-w-xs"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Define cuántos días permanece visible una notificación para los usuarios.
            </p>
          </div>
          <button
            onClick={guardarDiasNotificacion}
            disabled={guardandoDiasNotificacion}
            className="btn-primary disabled:opacity-50"
          >
            {guardandoDiasNotificacion ? 'Guardando...' : 'Guardar parámetro'}
          </button>
        </div>
        {msgDiasNotificacion && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{msgDiasNotificacion}</p>
        )}
      </div>

      {/* Bitácora del Sistema */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bitácora del Sistema</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportBitacoraPDF}
              disabled={exportingPdf || logs.length === 0}
              className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
              title="Exportar la bitácora visible en PDF"
            >
              <FileDown className="w-4 h-4" />
              {exportingPdf ? 'Exportando...' : 'Exportar PDF'}
            </button>
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
        </div>

        {showLogs && (
          <>
            {/* Filtros de Bitácora: primero texto; debajo rango de fechas */}
            <div className="mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    type="button"
                    onClick={() => {
                      setFiltroAccion('')
                      setFiltroEntidad('')
                      setFiltroUsuario('')
                      setFechaDesde('')
                      setFechaHasta('')
                      setCurrentPage(1)
                    }}
                    className="btn-secondary w-full"
                    title="Vacía acción, entidad, usuario y fechas"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 p-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Busqueda por fechas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="bitacora-fecha-desde"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Desde
                    </label>
                    <input
                      id="bitacora-fecha-desde"
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => {
                        setFechaDesde(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="bitacora-fecha-hasta"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Hasta
                    </label>
                    <input
                      id="bitacora-fecha-hasta"
                      type="date"
                      value={fechaHasta}
                      min={fechaDesde || undefined}
                      onChange={(e) => {
                        setFechaHasta(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="input-field"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFechaDesde('')
                        setFechaHasta('')
                        setCurrentPage(1)
                      }}
                      className="btn-secondary w-full text-sm"
                    >
                      Quitar fechas
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Filtra los registros por fecha de creación. Puedes usar solo &quot;desde&quot;, solo &quot;hasta&quot; o ambos.
                </p>
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
                          <td className="text-sm max-w-xl">
                            {log.detalles && Object.keys(log.detalles).length > 0 ? (
                              <details className="cursor-pointer group">
                                <summary className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-2">
                                  <span>Ver detalles</span>
                                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </summary>
                                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-3xl">
                                  <BitacoraLogDetalles
                                    accion={log.accion}
                                    entidad={log.entidad}
                                    entidad_id={log.entidad_id}
                                    detalles={log.detalles}
                                  />
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
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="logs-per-page" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        Registros por página:
                      </label>
                      <select
                        id="logs-per-page"
                        value={logsPerPage}
                        onChange={(e) => {
                          setLogsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="input-field py-1.5 px-2 text-sm w-20"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, totalLogs)} de {totalLogs} registros
                    </span>
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
    </div>
  )
}

