'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react'
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
  const [rolAEliminar, setRolAEliminar] = useState<{ id: string; nombre: string } | null>(null)
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

  useEffect(() => {
    if (!successMessage) return
    const t = window.setTimeout(() => setSuccessMessage(null), 5000)
    return () => window.clearTimeout(t)
  }, [successMessage])

  const abrirEliminarRol = (id: string, nombre: string) => {
    setDeleteModalError(null)
    setRolAEliminar({ id, nombre })
  }

  const cerrarModalEliminar = useCallback(() => {
    if (deletingId) return
    setRolAEliminar(null)
    setDeleteModalError(null)
  }, [deletingId])

  const confirmarEliminarRol = async () => {
    if (!rolAEliminar) return
    const { id, nombre } = rolAEliminar
    setDeleteModalError(null)
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
      setRolAEliminar(null)
      setSuccessMessage(`El rol «${nombre}» se ha eliminado correctamente.`)
    } catch (err) {
      console.error('Error deleting role:', err)
      setDeleteModalError(err instanceof Error ? err.message : 'Error al eliminar el rol')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!rolAEliminar || deletingId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarModalEliminar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rolAEliminar, deletingId, cerrarModalEliminar])

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
        Volver a administración
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

      {successMessage && (
        <div
          className="mb-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-sm flex items-start gap-3 p-4 transition-opacity"
          role="status"
        >
          <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <p className="text-sm font-medium pt-0.5">{successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-auto p-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              id="search-roles"
              name="search-roles"
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
                      <div className="font-medium text-gray-900 dark:text-white">{rol.nombre.toUpperCase()}</div>
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
                          onClick={() => abrirEliminarRol(rol.id, rol.nombre)}
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

      {rolAEliminar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eliminar-rol-titulo"
          aria-describedby="eliminar-rol-desc"
          onClick={cerrarModalEliminar}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden ring-1 ring-sky-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-4 flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <AlertTriangle className="w-6 h-6 text-white" aria-hidden />
              </div>
              <h2 id="eliminar-rol-titulo" className="text-lg font-bold text-white">
                Eliminar rol
              </h2>
              <button
                type="button"
                onClick={cerrarModalEliminar}
                disabled={!!deletingId}
                className="ml-auto p-1.5 rounded-lg text-white/90 hover:bg-white/20 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p id="eliminar-rol-desc" className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                ¿Seguro que deseas eliminar el rol{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  «{rolAEliminar.nombre.toUpperCase()}»
                </span>
                ? Se quitarán las asignaciones y permisos asociados en base de datos.{' '}
                <span className="text-red-600 dark:text-red-400 font-medium">Esta acción no se puede deshacer.</span>
              </p>
              {deleteModalError && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                  {deleteModalError}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
                <button
                  type="button"
                  onClick={cerrarModalEliminar}
                  disabled={!!deletingId}
                  className="btn-secondary w-full sm:w-auto justify-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarRol}
                  disabled={!!deletingId}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-60 transition-colors"
                >
                  {deletingId ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

