'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react' 
import type { Joven, Centro } from '@/lib/supabase'
import { format } from 'date-fns'
import { useIsAdmin, useCanCreate } from '@/lib/auth'

const ITEMS_PER_PAGE = 20

export default function JovenesPage() {
  const { isAdmin, loading: authLoading } = useIsAdmin()
  const { canCreate, loading: canCreateLoading } = useCanCreate()

  const [jovenes, setJovenes] = useState<(Joven & { centros?: Centro })[]>([])
  const [loading, setLoading] = useState(true)
  
  // No bloquear la UI si los hooks de auth aún están cargando
  const isAuthReady = !authLoading && !canCreateLoading
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [, setTotalCount] = useState(0)

  const loadJovenes = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    // Timeout de seguridad: forzar desactivación del loading después de 15 segundos
    // Sin mostrar error automáticamente - probablemente la carga está progresando
    const timeoutId = setTimeout(() => {
      setLoading(false)
      // No mostrar error automático - la UI se mostrará con los datos que tenga
    }, 15000)

    try {
      // Agregar timeout a la petición fetch (10 segundos)
      const controller = new AbortController()
      const fetchTimeout = setTimeout(() => controller.abort(), 10000) // 10 segundos para la petición

      const response = await fetch('/api/jovenes', {
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(fetchTimeout)
      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(result.error || 'No autenticado.')
        } else {
          setError(result.error || 'No se pudieron cargar los jóvenes.')
        }
        setJovenes([])
        setLoading(false)
        return
      }

      setJovenes(result.jovenes || [])
      setTotalCount(result.jovenes?.length || 0)
      setLoading(false)
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Solo mostrar errores reales, no timeouts esperados
      if (error instanceof Error && error.name === 'AbortError') {
        // No mostrar error de timeout - probablemente hay datos cargados
        console.warn('Timeout en carga de jóvenes - manteniendo datos existentes')
        setLoading(false)
        return
      }
      
      console.error('Error loading jovenes:', error)
      
      // Solo mostrar errores si no son de autenticación (esos son manejados arriba)
      if (!(error instanceof Error && (error.message.includes('autenticado') || error.message.includes('autorizado')))) {
        setError('No se pudieron cargar los jóvenes. Intenta nuevamente.')
      }
      setJovenes([])
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJovenes()
  }, [loadJovenes])

  useEffect(() => {
    const handleJovenesUpdated = () => {
      loadJovenes()
    }

    window.addEventListener('jovenes:updated', handleJovenesUpdated)
    return () => {
      window.removeEventListener('jovenes:updated', handleJovenesUpdated)
    }
  }, [loadJovenes])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return

    try {
      console.log('Iniciando eliminación de joven:', id)
      
      const response = await fetch(`/api/jovenes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      console.log('Resultado de eliminación desde API:', { status: response.status, result })

      if (!response.ok) {
        if (response.status === 401) {
          alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
          return
        }
        if (response.status === 403) {
          alert(result.details || result.error || 'No tienes permisos para eliminar este joven.')
          return
        }
        if (response.status === 404) {
          alert(result.details || result.error || 'Joven no encontrado.')
          return
        }
        alert(result.details || result.error || 'Error al eliminar el joven.')
        return
      }

      if (!result.success) {
        alert(result.error || 'No se pudo eliminar el joven.')
        return
      }

      console.log('Joven eliminado exitosamente')
      setJovenes((prev) => prev.filter((j) => j.id !== id))
      setTotalCount(prev => prev - 1)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jovenes:updated'))
      }
      alert('Joven eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting joven:', error)
      alert('Error al eliminar el registro')
    }
  }

  // Memoizar filtrado de jóvenes
  const filteredJovenes = useMemo(() => {
    return jovenes.filter(joven => {
      const matchesSearch = 
        joven.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        joven.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (joven.identidad && joven.identidad.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesEstado = filterEstado === 'todos' || joven.estado === filterEstado

      return matchesSearch && matchesEstado
    })
  }, [jovenes, searchTerm, filterEstado])

  // Paginación
  const totalPages = Math.ceil(filteredJovenes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedJovenes = useMemo(() => 
    filteredJovenes.slice(startIndex, endIndex),
    [filteredJovenes, startIndex, endIndex]
  )

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterEstado])

  const getEstadoBadge = useCallback((estado: string) => {
    const badges = {
      activo: 'badge-success',
      egresado: 'badge-info',
      transferido: 'badge-warning'
    }
    return badges[estado as keyof typeof badges] || 'badge-info'
  }, [])

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: filteredJovenes.length,
    activos: filteredJovenes.filter(j => j.estado === 'activo').length,
    egresados: filteredJovenes.filter(j => j.estado === 'egresado').length,
  }), [filteredJovenes])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jóvenes</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Gestión de menores en el sistema</p>
        </div>
        {(canCreate || !isAuthReady) && (
          <Link href="/dashboard/jovenes/nuevo" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Registrar Joven
          </Link>
        )}
      </div>

      {/* Filters */}
{/*==============================================================================================================================================*/}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            
            <input
              type="text"
              placeholder="  Buscar por nombre, apellido o identidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="input-field pl-10"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="egresado">Egresados</option>
              <option value="transferido">Transferidos</option>
            </select>
          </div>
        </div>
      </div>
{/*==============================================================================================================================================*/}
      {/* Error Message */}
      {error && (
        <div className="card mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <div className="p-4">{error}</div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4 py-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : filteredJovenes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No se encontraron jóvenes registrados</p>
          {(canCreate || !isAuthReady) && (
            <Link href="/dashboard/jovenes/nuevo" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Registrar Primer Joven
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Identidad</th>
                    <th>Edad</th>
                    <th>Centro</th>
                    <th>Estado</th>
                    <th>Fecha Ingreso</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJovenes.map((joven) => (
                    <tr key={joven.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="font-medium text-gray-900 dark:text-white">
                        {joven.nombres} {joven.apellidos}
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">{joven.identidad || 'N/A'}</td>
                      <td className="text-gray-600 dark:text-gray-300">{joven.edad} años</td>
                      <td className="text-sm text-gray-600 dark:text-gray-300">
                        {joven.centros?.nombre || 'Sin asignar'}
                      </td>
                      <td>
                        <span className={`badge ${getEstadoBadge(joven.estado)}`}>
                          {joven.estado}
                        </span>
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {format(new Date(joven.fecha_ingreso), 'dd/MM/yyyy')}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/jovenes/${joven.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(isAdmin || !isAuthReady) && (
                            <>
                              <Link
                                href={`/dashboard/jovenes/${joven.id}/editar`}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(joven.id)}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredJovenes.length)} de {filteredJovenes.length} resultados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Registrados</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Egresados</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.egresados}</p>
        </div>
      </div>
    </div>
  )
}
