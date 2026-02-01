'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Eye, Shield, Search, RefreshCw } from 'lucide-react'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'

interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export default function RolesPage() {
  const router = useRouter()
  const { hasAccess, loading: authLoading } = useAdminAccess()

  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Verificar que el usuario tiene acceso
  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, authLoading, router])

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/roles', {
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar los roles')
      }

      setRoles(result.roles || [])
    } catch (error) {
      console.error('Error loading roles:', error)
      setError(error instanceof Error ? error.message : 'Error al cargar los roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasAccess) {
      loadRoles()
    }
  }, [hasAccess])

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el rol "${nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      setDeletingId(id)
      const response = await fetch(`/api/admin/roles?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el rol')
      }

      setRoles((prev) => prev.filter((r) => r.id !== id))
      alert('Rol eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting role:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar el rol')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRoles = roles.filter((rol) =>
    rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rol.descripcion && rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (authLoading) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Link
        href="/dashboard/admin"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Panel Administrador
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Roles</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Administrar roles y permisos del sistema INAMI
          </p>
        </div>
        <Link href="/dashboard/admin/roles/nuevo" className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Agregar Rol
        </Link>
      </div>

      {error && (
        <div className="card mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <div className="p-4">{error}</div>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="  Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => loadRoles()}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4 py-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="card text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
            {roles.length === 0
              ? 'No hay roles registrados en el sistema'
              : 'No se encontraron roles con los filtros aplicados'}
          </p>
          {roles.length === 0 && (
            <Link href="/dashboard/admin/roles/nuevo" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear Primer Rol
            </Link>
          )}
          {filteredRoles.length === 0 && roles.length > 0 && (
            <button
              onClick={() => setSearchTerm('')}
              className="btn-secondary mt-4 inline-flex items-center gap-2"
            >
              Limpiar Búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((rol) => (
                  <tr key={rol.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">{rol.nombre}</div>
                    </td>
                    <td className="text-gray-600 dark:text-gray-300">
                      {rol.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                    </td>
                    <td>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          rol.activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {rol.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/roles/${rol.id}/permisos`}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ver permisos"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/roles/${rol.id}/editar`}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(rol.id, rol.nombre)}
                          disabled={deletingId === rol.id}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de roles: <span className="font-semibold text-gray-900 dark:text-white">{roles.length}</span>
        </p>
      </div>
    </div>
  )
}

