'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Shield } from 'lucide-react'

export default function NuevoRolPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el rol')
      }

      // Redirigir a la página de permisos del nuevo rol
      router.push(`/dashboard/admin/roles/${result.rol.id}/permisos`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el rol')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Nuevo Rol</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Define un nuevo rol para el sistema. Podrás asignar permisos después de crearlo.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Ej: Coordinador, Supervisor, etc."
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/dashboard/admin/roles" className="btn-secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creando...' : 'Crear Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

