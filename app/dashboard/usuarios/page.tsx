'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Eye, RefreshCw, UserPlus, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' 
import { format } from 'date-fns'

const ITEMS_PER_PAGE = 20

type User = {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
  photo_url?: string | null
}

export default function UsuariosPage() {
  const supabase = createClientComponentClient()

  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('todos')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const roleConfig = {
    admin: { label: 'Administrador', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    pedagogo: { label: 'Pedagogo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    abogado: { label: 'Abogado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    medico: { label: 'Médico', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    psicologo: { label: 'Psicólogo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    trabajador_social: { label: 'Trabajador Social', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
    seguridad: { label: 'Seguridad', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  } as const

  const checkAdminStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setIsAdmin(profile?.role === 'admin' || false)
    } catch (error) {
      console.error('Error verifying admin role:', error)
      setIsAdmin(false)
    }
  }, [supabase])

  const loadUsuarios = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      const response = await fetch('/api/users', {
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(result.error || 'No tienes permisos para ver los usuarios.')
        } else {
          setError(result.error || 'No se pudieron cargar los usuarios.')
        }
        if (showLoading) setLoading(false)
        return
      }

      const formatted = (result.users || []).map((user: any) => ({
        id: user.id || '',
        email: user.email || '',
        full_name: user.full_name || 'Sin nombre',
        role: user.role || 'seguridad',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        photo_url: user.photo_url || null,
      }))

      console.log(`Usuarios cargados desde profiles: ${formatted.length}`)
      setUsuarios(formatted)
    } catch (error) {
      console.error('Error loading usuarios:', error)
      setError('Error al cargar los usuarios. Intenta nuevamente.')
      setUsuarios([])
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadUsuarios(true)
    checkAdminStatus()
  }, [loadUsuarios, checkAdminStatus])

  useEffect(() => {
    const handleUsuariosUpdated = () => {
      loadUsuarios(false)
    }

    const handleWindowFocus = () => {
      loadUsuarios(false)
    }

    window.addEventListener('usuarios:updated', handleUsuariosUpdated)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('usuarios:updated', handleUsuariosUpdated)
      window.removeEventListener('focus', handleWindowFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()

      if (!response.ok) {
        // Mensajes de error más específicos
        if (response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar usuarios. Solo los administradores pueden realizar esta acción.')
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.')
        }
        throw new Error(result.error || result.details || 'Error al eliminar el usuario')
      }

      setUsuarios((prev) => prev.filter((u) => u.id !== id))
      
      // Disparar evento para actualizar otras partes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usuarios:updated'))
      }
      
      alert('Usuario eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar el usuario')
    }
  }
  
  // Memoizar filtrado
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch = 
        usuario.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.role.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = filterRole === 'todos' || usuario.role === filterRole

      return matchesSearch && matchesRole
    })
  }, [usuarios, searchTerm, filterRole])

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsuarios = useMemo(() => 
    filteredUsuarios.slice(startIndex, endIndex),
    [filteredUsuarios, startIndex, endIndex]
  )

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole])

  const getRoleBadge = useCallback((role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: role, 
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
    }
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }, [])

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: usuarios.length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    profesionales: usuarios.filter(u => ['psicologo', 'medico', 'trabajador_social'].includes(u.role)).length,
    seguridad: usuarios.filter(u => u.role === 'seguridad').length,
  }), [usuarios])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gestión de usuarios del sistema INAMI
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/admin/usuarios/nuevo" className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
            <UserPlus className="w-5 h-5" />
            Agregar Usuario
          </Link>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <div className="p-4">{error}</div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="  Buscar por nombre, email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="relative flex gap-2">
            <Filter className="absolute left-0.01 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field pl-10 flex-1"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="pedagogo">Pedagogo</option>
              <option value="abogado">Abogado</option>
              <option value="medico">Médico</option>
              <option value="psicologo">Psicólogo</option>
              <option value="trabajador_social">Trabajador Social</option>
              <option value="seguridad">Seguridad</option>
            </select>
            <button
              onClick={() => loadUsuarios(true)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4 py-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : filteredUsuarios.length === 0 ? (
        <div className="card text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {usuarios.length === 0 
              ? 'No hay usuarios registrados en el sistema' 
              : 'No se encontraron usuarios con los filtros aplicados'}
          </p>
          {isAdmin && usuarios.length === 0 && (
            <Link href="/dashboard/admin/usuarios/nuevo" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Registrar Primer Usuario
            </Link>
          )}
          {filteredUsuarios.length === 0 && usuarios.length > 0 && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterRole('todos')
              }}
              className="btn-secondary mt-4 inline-flex items-center gap-2"
            >
              Limpiar Filtros
            </button>
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
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Fecha de Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {usuario.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={usuario.photo_url}
                                alt={usuario.full_name || usuario.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                {usuario.full_name
                                  ? usuario.full_name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : usuario.email[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {usuario.full_name || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {usuario.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {usuario.email}
                      </td>
                      <td>
                        {getRoleBadge(usuario.role)}
                      </td>
                      <td className="text-gray-600 dark:text-gray-300">
                        {format(new Date(usuario.created_at), 'dd/MM/yyyy')}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/admin/usuarios/${usuario.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                href={`/dashboard/admin/usuarios/${usuario.id}/editar`}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(usuario.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredUsuarios.length)} de {filteredUsuarios.length} resultados
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Administradores</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.admins}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profesionales</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.profesionales}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Seguridad</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.seguridad}</p>
        </div>
      </div>
    </div>
  )
}
