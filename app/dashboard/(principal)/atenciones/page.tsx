'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Eye, Filter, FileText, CheckCircle2, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-browser'
import type { Atencion } from '@/lib/supabase'
import { format } from 'date-fns'
import { useIsAdmin, useCanCreate } from '@/lib/auth'

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const

type AtencionExtendida = Atencion & {
  jovenes?: { nombres: string; apellidos: string }
  tipos_atencion?: { nombre: string }
  profesional?: { full_name: string; role: string }
}


export default function AtencionesPage() {
  const supabase = createClientComponentClient()
  const { isAdmin, loading: authLoading } = useIsAdmin()
  const { loading: canCreateLoading } = useCanCreate()
  
  const [atenciones, setAtenciones] = useState<AtencionExtendida[]>([])
  const [loading, setLoading] = useState(true)
  
  const isAuthReady = !authLoading && !canCreateLoading
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25)
  const [totalFromApi, setTotalFromApi] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Memoizar el cliente de Supabase para evitar recreaciones
  const supabaseClient = useMemo(() => supabase, [])

  const loadAtenciones = useCallback(async (showLoading = true) => {
    // Timeout de seguridad: forzar desactivación del loading después de 15 segundos
    // Sin mostrar error automáticamente - probablemente la carga está progresando
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      if (showLoading) {
        setLoading(true)
      }
      setFeedback(null)

      timeoutId = showLoading ? setTimeout(() => {
        setLoading(false)
        // No mostrar error automático - la UI se mostrará con los datos que tenga
      }, 15000) : null

      console.log('Cargando atenciones...')

      // Verificar autenticación primero - sin timeout agresivo
      // Si la sesión ya está en cache, será instantáneo
      try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        
        if (sessionError || !session) {
          // Solo mostrar error si es explícitamente una carga inicial
          if (showLoading) {
            console.error('Error de autenticación:', sessionError)
            if (timeoutId) clearTimeout(timeoutId)
            setFeedback({ type: 'error', message: 'No estás autenticado. Por favor, inicia sesión nuevamente.' })
            setLoading(false)
          }
          return
        }

        console.log('Sesión verificada, cargando atenciones desde API...')

        // Usar la API route con timeout más largo (10 segundos)
        const controller = new AbortController()
        const fetchTimeout = setTimeout(() => controller.abort(), 10000) // 10 segundos para la petición

        const params = new URLSearchParams()
        params.set('limit', String(itemsPerPage))
        params.set('offset', String((currentPage - 1) * itemsPerPage))
        if (filterEstado && filterEstado !== 'todos') {
          params.set('estado', filterEstado)
        }
        if (fechaDesde) params.set('fecha_desde', fechaDesde)
        if (fechaHasta) params.set('fecha_hasta', fechaHasta)
        const response = await fetch(`/api/atenciones?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        })

        clearTimeout(fetchTimeout)
        if (timeoutId) clearTimeout(timeoutId)

        const result = await response.json()

        console.log('Resultado de carga desde API:', { status: response.status, count: result.atenciones?.length })

        if (!response.ok) {
          console.error('Error loading atenciones:', result)
          
          if (response.status === 401) {
            setFeedback({ type: 'error', message: 'No estás autenticado. Por favor, inicia sesión nuevamente.' })
          } else {
            setFeedback({ 
              type: 'error', 
              message: result.details || result.error || 'Error al cargar las atenciones.' 
            })
          }
          
          setAtenciones([])
          if (showLoading) setLoading(false)
          return
        }

        if (!result.success) {
          console.error('API returned error:', result)
          setFeedback({ 
            type: 'error', 
            message: result.error || 'Error al cargar las atenciones.' 
          })
          setAtenciones([])
          if (showLoading) setLoading(false)
          return
        }

        // Si todo está bien, usar los datos directamente
        const atencionesData = result.atenciones || []
        console.log(`Cargadas ${atencionesData.length} atenciones exitosamente`)
        
        setAtenciones(atencionesData)
        setTotalFromApi(typeof result.total === 'number' ? result.total : 0)
        
        if (process.env.NODE_ENV === 'development') {
          setDebugInfo(`Cargadas ${atencionesData.length} atenciones exitosamente`)
        }
        
        if (showLoading) setLoading(false)
      } catch (authError) {
        if (timeoutId) clearTimeout(timeoutId)
        throw authError
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      
      // Solo mostrar errores críticos, no timeouts esperados
      if (showLoading) {
        // Solo loggear timeouts en desarrollo, no mostrar errores al usuario
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.message.includes('Timeout')) {
            // No mostrar error de timeout - probablemente hay datos cargados
            console.warn('Timeout en carga de atenciones - manteniendo datos existentes')
            setLoading(false)
            return
          }
        }
        
        // Solo mostrar errores reales, no timeouts
        console.error('Error loading atenciones:', error)
        setLoading(false)
        // No establecer feedback automáticamente - los datos existentes se mantienen
      } else {
        // En recarga silenciosa, solo loggear en consola si es relevante
        if (!(error instanceof Error && (error.name === 'AbortError' || error.message.includes('Timeout')))) {
          console.warn('Error en recarga silenciosa de atenciones:', error)
        }
      }
    }
  }, [supabaseClient, currentPage, itemsPerPage, filterEstado, fechaDesde, fechaHasta])

  // Cargar datos al montar y cuando cambian página, tamaño de página o filtro de estado
  useEffect(() => {
    loadAtenciones(true)
  }, [loadAtenciones])

  // Escuchar eventos de actualización de atenciones
  useEffect(() => {
    const handleAtencionesUpdated = () => {
      loadAtenciones(false) // Recargar sin mostrar loading
    }

    window.addEventListener('atenciones:updated', handleAtencionesUpdated)
    // Removido el listener de focus para evitar recargas innecesarias
    // Solo recargar cuando haya un evento explícito de actualización

    return () => {
      window.removeEventListener('atenciones:updated', handleAtencionesUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  const requestDelete = useCallback((id: string) => {
    console.log('requestDelete called with id:', id)
    setFeedback(null)
    setConfirmDeleteId(id)
  }, [])

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) {
      console.warn('handleConfirmDelete called but confirmDeleteId is null')
      return
    }

    console.log('Iniciando eliminación de atención:', confirmDeleteId)
    setDeleteLoading(true)
    setFeedback(null)
    
    try {
      // Verificar sesión antes de eliminar
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
      
      if (sessionError) {
        console.error('Error obteniendo sesión:', sessionError)
        throw new Error('Error al verificar tu sesión. Por favor, inicia sesión nuevamente.')
      }
      
      if (!session) {
        console.error('No hay sesión activa')
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
      }

      console.log('Sesión verificada, eliminando atención vía API...')
      
      // Usar la API route que maneja permisos correctamente
      const response = await fetch(`/api/atenciones/${confirmDeleteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      console.log('Resultado de eliminación desde API:', { response: response.status, result })

      if (!response.ok) {
        // Mensajes de error más específicos
        if (response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
        }
        if (response.status === 403) {
          throw new Error(result.details || result.error || 'No tienes permisos para eliminar esta atención.')
        }
        if (response.status === 404) {
          throw new Error(result.details || result.error || 'Atención no encontrada.')
        }
        throw new Error(result.details || result.error || 'Error al eliminar la atención.')
      }

      if (!result.success) {
        throw new Error(result.error || 'No se pudo eliminar la atención.')
      }

      console.log('Atención eliminada exitosamente')
      setAtenciones((prev) => prev.filter((a) => a.id !== confirmDeleteId))
      setFeedback({ type: 'success', message: 'Atención eliminada exitosamente.' })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Eliminada', message: 'La atención se eliminó correctamente.' } }))
      }
      
      // Disparar evento para actualizar otras partes de la aplicación
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('atenciones:updated'))
      }
    } catch (error) {
      console.error('Error deleting atencion (catch):', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la atención. Intenta nuevamente.'
      setFeedback({ type: 'error', message: errorMessage })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', title: 'Error', message: errorMessage } }))
      }
    } finally {
      setDeleteLoading(false)
      setConfirmDeleteId(null)
    }
  }

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null)
  }, [])

  // Filtrado solo por búsqueda (estado se aplica en la API)
  const filteredAtenciones = useMemo(() => {
    if (!searchTerm.trim()) return atenciones
    const term = searchTerm.toLowerCase().trim()
    return atenciones.filter(atencion => {
      const jovenNombre = atencion.jovenes
        ? `${atencion.jovenes.nombres} ${atencion.jovenes.apellidos}`.toLowerCase()
        : ''
      const tipoAtencion = atencion.tipos_atencion?.nombre.toLowerCase() || ''
      const profesional = atencion.profesional?.full_name.toLowerCase() || ''

      return (
        jovenNombre.includes(term) ||
        tipoAtencion.includes(term) ||
        profesional.includes(term) ||
        (atencion.motivo && atencion.motivo.toLowerCase().includes(term))
      )
    })
  }, [atenciones, searchTerm])

  // Paginación (total desde API)
  const totalPages = Math.max(1, Math.ceil(totalFromApi / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const showingEnd = Math.min(startIndex + filteredAtenciones.length, startIndex + itemsPerPage)
  const showingStart = totalFromApi === 0 ? 0 : startIndex + 1

  // Resetear página cuando cambian filtros o tamaño de página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterEstado, fechaDesde, fechaHasta])

  const getEstadoBadge = useCallback((estado: string) => {
    const badges = {
      pendiente: 'badge-warning',
      en_proceso: 'badge-info',
      completada: 'badge-success',
      cancelada: 'badge-danger'
    }
    return badges[estado as keyof typeof badges] || 'badge-info'
  }, [])

  // Estadísticas memoizadas (datos visibles en la página actual)
  const stats = useMemo(() => ({
    total: totalFromApi,
    pendientes: filteredAtenciones.filter(a => a.estado === 'pendiente').length,
    enProceso: filteredAtenciones.filter(a => a.estado === 'en_proceso').length,
    completadas: filteredAtenciones.filter(a => a.estado === 'completada').length,
  }), [totalFromApi, filteredAtenciones])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Atenciones</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Gestión de atenciones a jóvenes</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/atenciones/formularios" className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            <FileText className="w-5 h-5" />
            Formularios
          </Link>
          <Link href="/dashboard/atenciones/nueva" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Nueva Atención
          </Link>
        </div>
      </div>

      {/* Debug Info - solo después de montar para evitar hydration mismatch */}
      {mounted && process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <strong>Debug:</strong> {debugInfo} | Total en estado: {atenciones.length}
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-6 rounded-lg border p-4 flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters: más altura, búsqueda/estado un poco más cortos y con espacio para icono */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1.2fr_150px_150px] gap-4">
          <div className="flex flex-col min-w-0">
            <label htmlFor="filter-busqueda" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Búsqueda
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5 pointer-events-none shrink-0" />
              <input
                id="filter-busqueda"
                type="text"
                placeholder="Joven, tipo de atención, profesional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-12 py-2.5 min-h-[44px]"
              />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <label htmlFor="filter-estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5 pointer-events-none shrink-0" />
              <select
                id="filter-estado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="input-field w-full pl-12 py-2.5 min-h-[44px] appearance-none"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completada">Completadas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col min-w-0 lg:w-[150px]">
            <label htmlFor="filter-fecha-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha desde
            </label>
            <input
              id="filter-fecha-desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="input-field w-full py-2.5 min-h-[44px] max-w-[150px] lg:max-w-none"
            />
          </div>
          <div className="flex flex-col min-w-0 lg:w-[150px]">
            <label htmlFor="filter-fecha-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha hasta
            </label>
            <input
              id="filter-fecha-hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="input-field w-full py-2.5 min-h-[44px] max-w-[150px] lg:max-w-none"
            />
          </div>
        </div>
        {(fechaDesde || fechaHasta) && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setFechaDesde('')
                setFechaHasta('')
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Limpiar filtro de fechas
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4 py-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : atenciones.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-2 font-medium">No hay atenciones en la base de datos</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {loading ? 'Cargando...' : 'Registra la primera atención para comenzar'}
          </p>
          <Link href="/dashboard/atenciones/nueva" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Registrar Primera Atención
          </Link>
        </div>
      ) : filteredAtenciones.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-2 font-medium">
            No se encontraron atenciones con los filtros aplicados
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Intenta cambiar los filtros de búsqueda o estado
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterEstado('todos')
              setFechaDesde('')
              setFechaHasta('')
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Joven</th>
                    <th>Tipo de Atención</th>
                    <th>Profesional</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtenciones.map((atencion) => (
                    <tr key={atencion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="font-medium text-gray-900 dark:text-white">
                        {atencion.jovenes
                          ? `${atencion.jovenes.nombres} ${atencion.jovenes.apellidos}`
                          : 'N/A'}
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {atencion.tipos_atencion?.nombre || 'N/A'}
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-300">
                        {atencion.profesional?.full_name || 'N/A'}
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {format(new Date(atencion.fecha_atencion), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadge(atencion.estado)}`}>
                          {atencion.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/atenciones/${atencion.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {mounted && (isAdmin || !isAuthReady) && (
                            <>
                              <Link
                                href={`/dashboard/atenciones/${atencion.id}/editar`}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => requestDelete(atencion.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {(totalFromApi > 0 || atenciones.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="atenciones-per-page" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Registros por página:
                  </label>
                  <select
                    id="atenciones-per-page"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value) as 25 | 50 | 100)
                      setCurrentPage(1)
                    }}
                    className="input-field py-1.5 px-2 text-sm w-20"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando {showingStart} - {showingEnd} de {totalFromApi} resultados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 px-4 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar atención</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Esta acción no se puede deshacer. ¿Deseas eliminar la atención seleccionada?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleCancelDelete} 
                className="btn-secondary" 
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendientes}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En Proceso</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.enProceso}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completadas}</p>
        </div>
      </div>
    </div>
  )
}
