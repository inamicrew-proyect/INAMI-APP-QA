'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, RefreshCw, Users, AlertTriangle } from 'lucide-react'
import { optimizedSupabase } from '@/lib/supabase-optimized'
import { debounce } from '@/lib/optimization'
import JovenCard from '@/components/optimized/JovenCard'
import type { Joven } from '@/lib/supabase'

export default function JovenesPageOptimized() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [centroFilter, setCentroFilter] = useState('')
  const [centros, setCentros] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term)
    }, 300),
    []
  )

  // Memoized filtered jovenes
  const filteredJovenes = useMemo(() => {
    return jovenes.filter(joven => {
      const matchesSearch = searchTerm === '' || 
        `${joven.nombres} ${joven.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        joven.identidad?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCentro = centroFilter === '' || joven.centro_id === centroFilter
      
      return matchesSearch && matchesCentro
    })
  }, [jovenes, searchTerm, centroFilter])

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [jovenesData, centrosData] = await Promise.all([
        optimizedSupabase.getJovenes(),
        optimizedSupabase.getCentros()
      ])
      
      setJovenes(jovenesData)
      setCentros(centrosData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value)
  }, [debouncedSearch])

  const handleRefresh = useCallback(() => {
    optimizedSupabase.invalidateJoven('all')
    loadData()
  }, [loadData])

  const handleEdit = useCallback((id: string) => {
    router.push(`/dashboard/jovenes/${id}/editar`)
  }, [router])

  const handleView = useCallback((id: string) => {
    router.push(`/dashboard/jovenes/${id}/expediente`)
  }, [router])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8" />
            Gestión de Jóvenes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Administra la información de los jóvenes en el programa
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => router.push('/dashboard/jovenes/nuevo')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Joven
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o identidad..."
                className="input-field pl-10"
                onChange={handleSearch}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Centro
            </label>
            <select
              value={centroFilter}
              onChange={(e) => setCentroFilter(e.target.value)}
              className="input-field"
            >
              <option value="">Todos los centros</option>
              {centros.map(centro => (
                <option key={centro.id} value={centro.id}>
                  {centro.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              className="btn-secondary flex items-center gap-2 w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Mostrando {filteredJovenes.length} de {jovenes.length} jóvenes
        </p>
      </div>

      {/* Jovenes Grid */}
      {filteredJovenes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No se encontraron jóvenes
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchTerm || centroFilter 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay jóvenes registrados en el sistema'
            }
          </p>
          {!searchTerm && !centroFilter && (
            <button
              onClick={() => router.push('/dashboard/jovenes/nuevo')}
              className="btn-primary"
            >
              Registrar Primer Joven
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJovenes.map((joven) => (
            <JovenCard
              key={joven.id}
              joven={joven}
              onEdit={handleEdit}
              onView={handleView}
            />
          ))}
        </div>
      )}
    </div>
  )
}
