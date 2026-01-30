'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, FileText, User, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Atencion, Joven, TipoAtencion, Profile } from '@/lib/supabase'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth'

export default function EditarAtencionPage() {
  const router = useRouter()
  const params = useParams()
  const atencionId = params.id as string
  const supabase = createClientComponentClient()
  const { profile: currentUserProfile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [atencion, setAtencion] = useState<Atencion | null>(null)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [tipoAtencion, setTipoAtencion] = useState<TipoAtencion | null>(null)
  const [profesional, setProfesional] = useState<Profile | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [unauthorized, setUnauthorized] = useState(false)

  const [formData, setFormData] = useState({
    fecha_atencion: '',
    motivo: '',
    observaciones: '',
    recomendaciones: '',
    estado: 'completada' as 'pendiente' | 'completada' | 'cancelada',
    proxima_cita: '',
    formulario_especifico: {} as any
  })

  useEffect(() => {
    if (atencionId && currentUserProfile) {
      loadData()
    }
  }, [atencionId, currentUserProfile])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar datos de la atención
      // Especificar explícitamente la relación profesional_id para evitar ambigüedad
      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .select(`
          *,
          jovenes (*),
          tipos_atencion (*),
          profesional:profiles!atenciones_profesional_id_fkey (*)
        `)
        .eq('id', atencionId)
        .single()

      if (atencionError) {
        console.error('Error cargando atención:', atencionError)
        alert('Error al cargar los datos de la atención')
        return
      }

      if (atencionData) {
        // Verificar permisos: solo admin o el creador pueden editar
        const isAdmin = currentUserProfile?.role === 'admin'
        const isCreator = currentUserProfile && atencionData.profesional_id === currentUserProfile.id
        
        if (!isAdmin && !isCreator) {
          setUnauthorized(true)
          setLoading(false)
          return
        }
        
        setAtencion(atencionData)
        setJoven(atencionData.jovenes)
        setTipoAtencion(atencionData.tipos_atencion)
        setProfesional(atencionData.profesional)

        setFormData({
          fecha_atencion: atencionData.fecha_atencion ? format(new Date(atencionData.fecha_atencion), 'yyyy-MM-dd\'T\'HH:mm') : '',
          motivo: atencionData.motivo || '',
          observaciones: atencionData.observaciones || '',
          recomendaciones: atencionData.recomendaciones || '',
          estado: atencionData.estado || 'completada',
          proxima_cita: atencionData.proxima_cita ? format(new Date(atencionData.proxima_cita), 'yyyy-MM-dd') : '',
          formulario_especifico: atencionData.formulario_especifico || {}
        })
      }

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fecha_atencion) {
      newErrors.fecha_atencion = 'La fecha de atención es requerida'
    }

    if (!formData.motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      // Usar la API route que maneja permisos correctamente
      const response = await fetch(`/api/atenciones/${atencionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha_atencion: formData.fecha_atencion,
          motivo: formData.motivo.trim(),
          observaciones: formData.observaciones.trim() || null,
          recomendaciones: formData.recomendaciones.trim() || null,
          estado: formData.estado,
          proxima_cita: formData.proxima_cita || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Mensajes de error más específicos
        if (response.status === 401) {
          alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
          router.push('/login')
          return
        }
        if (response.status === 403) {
          alert(result.details || result.error || 'No tienes permisos para actualizar esta atención.')
          return
        }
        if (response.status === 404) {
          alert(result.details || result.error || 'Atención no encontrada.')
          return
        }
        alert(result.details || result.error || 'Error al actualizar la atención.')
        return
      }

      if (!result.success) {
        alert(result.error || 'No se pudo actualizar la atención.')
        return
      }

      alert('Atención actualizada exitosamente')
      router.push(`/dashboard/atenciones/${atencionId}`)

    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar la atención')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No autorizado</h2>
          <p className="text-gray-600 mb-4">Solo puedes editar las atenciones que creaste. Los administradores pueden editar cualquier atención.</p>
          <button
            onClick={() => router.push('/dashboard/atenciones')}
            className="btn-primary"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  if (!atencion || !joven || !tipoAtencion || !profesional) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Atención no encontrada</h2>
          <p className="text-gray-600 mb-4">La atención que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => router.push('/dashboard/atenciones')}
            className="btn-primary"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Atención</h1>
            <p className="text-gray-600 mt-1">Modificar información de la atención</p>
          </div>
        </div>

        {/* Información de la atención */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de la Atención</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Joven:</span>
              <p className="text-gray-900">{joven.nombres} {joven.apellidos}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipo de Atención:</span>
              <p className="text-gray-900">{tipoAtencion.nombre}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Profesional:</span>
              <p className="text-gray-900">{profesional.full_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Rol:</span>
              <p className="text-gray-900 capitalize">{profesional.role}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Información General
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora de Atención *
                </label>
                <input
                  type="datetime-local"
                  value={formData.fecha_atencion}
                  onChange={(e) => handleInputChange('fecha_atencion', e.target.value)}
                  className={`input-field ${errors.fecha_atencion ? 'border-red-500' : ''}`}
                />
                {errors.fecha_atencion && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha_atencion}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="input-field"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la Atención *
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => handleInputChange('motivo', e.target.value)}
                className={`input-field ${errors.motivo ? 'border-red-500' : ''}`}
                rows={3}
                placeholder="Describe el motivo de la atención..."
              />
              {errors.motivo && (
                <p className="text-red-500 text-sm mt-1">{errors.motivo}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Observaciones de la atención..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recomendaciones
              </label>
              <textarea
                value={formData.recomendaciones}
                onChange={(e) => handleInputChange('recomendaciones', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Recomendaciones para el seguimiento..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próxima Cita
              </label>
              <input
                type="date"
                value={formData.proxima_cita}
                onChange={(e) => handleInputChange('proxima_cita', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Formulario Específico */}
          {tipoAtencion && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Formulario Específico - {tipoAtencion.nombre}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datos del Formulario
                  </label>
                  <textarea
                    value={JSON.stringify(formData.formulario_especifico, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        handleInputChange('formulario_especifico', parsed)
                      } catch (error) {
                        // Ignorar errores de JSON mientras se escribe
                      }
                    }}
                    className="input-field font-mono text-sm"
                    rows={8}
                    placeholder="Datos del formulario específico en formato JSON..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nota: Este campo contiene los datos específicos del formulario. 
                    Modifica con cuidado para mantener la estructura JSON válida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

