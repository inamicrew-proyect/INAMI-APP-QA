'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Shield, Check, X } from 'lucide-react'

interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

interface Modulo {
  id: string
  nombre: string
  descripcion: string | null
  ruta: string
  icono: string | null
}

interface Permiso {
  id: string
  role_id: string
  modulo_id: string
  puede_ver: boolean
  puede_crear: boolean
  puede_editar: boolean
  puede_eliminar: boolean
  modulos?: Modulo
}

export default function EditarRolPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  })
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [permisos, setPermisos] = useState<Record<string, Permiso>>({})

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar rol
      const rolesResponse = await fetch('/api/admin/roles')
      if (!rolesResponse.ok) {
        throw new Error('Error al cargar roles')
      }
      const rolesData = await rolesResponse.json()
      const foundRol = rolesData.roles?.find((r: Rol) => r.id === id)
      if (!foundRol) {
        throw new Error('Rol no encontrado')
      }
      setFormData({
        nombre: foundRol.nombre,
        descripcion: foundRol.descripcion || '',
        activo: foundRol.activo,
      })

      // Cargar módulos
      const modulesResponse = await fetch('/api/admin/modules')
      if (!modulesResponse.ok) {
        throw new Error('Error al cargar módulos')
      }
      const modulesData = await modulesResponse.json()
      const modulosList = modulesData.modulos || []
      setModulos(modulosList)

      // Cargar permisos existentes
      const permissionsResponse = await fetch(`/api/admin/roles/${id}/permissions`)
      const permisosMap: Record<string, Permiso> = {}
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        permissionsData.permisos?.forEach((p: Permiso) => {
          permisosMap[p.modulo_id] = p
        })
      }
      
      // Inicializar permisos para todos los módulos (incluso si no tienen permisos previos)
      // Esto asegura que todos los módulos aparezcan en el formulario
      modulosList.forEach((modulo: Modulo) => {
        if (!permisosMap[modulo.id]) {
          permisosMap[modulo.id] = {
            id: '',
            role_id: id,
            modulo_id: modulo.id,
            puede_ver: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
          } as Permiso
        }
      })
      
      setPermisos(permisosMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const togglePermiso = (moduloId: string, tipo: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_eliminar') => {
    setPermisos((prev) => {
      const current = prev[moduloId]
      const newPermisos = { ...prev }

      if (current) {
        newPermisos[moduloId] = {
          ...current,
          [tipo]: !current[tipo],
        }
      } else {
        newPermisos[moduloId] = {
          id: '',
          role_id: id,
          modulo_id: moduloId,
          puede_ver: tipo === 'puede_ver',
          puede_crear: tipo === 'puede_crear',
          puede_editar: tipo === 'puede_editar',
          puede_eliminar: tipo === 'puede_eliminar',
        } as Permiso
      }

      return newPermisos
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Actualizar información del rol
      const roleResponse = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...formData,
        }),
      })

      const roleResult = await roleResponse.json()

      if (!roleResponse.ok) {
        throw new Error(roleResult.error || 'Error al actualizar el rol')
      }

      // Guardar permisos para cada módulo (incluyendo los que no tienen permisos previos)
      // Asegurarse de guardar permisos para TODOS los módulos, no solo los que ya existían
      const permissionPromises = modulos.map((modulo) => {
        const permiso = permisos[modulo.id]
        return fetch(`/api/admin/roles/${id}/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduloId: modulo.id,
            puedeVer: permiso?.puede_ver || false,
            puedeCrear: permiso?.puede_crear || false,
            puedeEditar: permiso?.puede_editar || false,
            puedeEliminar: permiso?.puede_eliminar || false,
          }),
        })
      })

      const permissionResults = await Promise.allSettled(permissionPromises)
      
      // Verificar si hubo errores
      const errors = permissionResults
        .map((result, index) => {
          if (result.status === 'rejected') {
            return `Error guardando permisos para módulo ${modulos[index]?.nombre}`
          }
          return null
        })
        .filter(Boolean)

      if (errors.length > 0) {
        console.warn('Algunos permisos no se guardaron correctamente:', errors)
      }
      setSuccess('Rol y permisos guardados correctamente')
      setTimeout(() => {
        router.push('/dashboard/admin/roles')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link
        href="/dashboard/admin/roles"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Roles
      </Link>

      <div className="card space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Rol</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Modifica la información del rol
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Rol */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información del Rol</h2>
            
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Rol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="input-field"
                placeholder="Describe las responsabilidades y funciones de este rol..."
              />
            </div>

            <div>
              <label htmlFor="activo" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol activo</span>
              </label>
            </div>
          </div>

          {/* Permisos de Módulos */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Permisos de Módulos</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestionar permisos de acceso para los módulos del sistema
            </p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Módulo</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ver</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Crear</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Editar</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {modulos.map((modulo) => {
                    const permiso = permisos[modulo.id]
                    return (
                      <tr key={modulo.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{modulo.nombre}</div>
                            {modulo.descripcion && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{modulo.descripcion}</div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <button
                            type="button"
                            onClick={() => togglePermiso(modulo.id, 'puede_ver')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              permiso?.puede_ver
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                          >
                            {permiso?.puede_ver ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="text-center py-4 px-4">
                          <button
                            type="button"
                            onClick={() => togglePermiso(modulo.id, 'puede_crear')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              permiso?.puede_crear
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                          >
                            {permiso?.puede_crear ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="text-center py-4 px-4">
                          <button
                            type="button"
                            onClick={() => togglePermiso(modulo.id, 'puede_editar')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              permiso?.puede_editar
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                          >
                            {permiso?.puede_editar ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="text-center py-4 px-4">
                          <button
                            type="button"
                            onClick={() => togglePermiso(modulo.id, 'puede_eliminar')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              permiso?.puede_eliminar
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                          >
                            {permiso?.puede_eliminar ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/dashboard/admin/roles" className="btn-secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

