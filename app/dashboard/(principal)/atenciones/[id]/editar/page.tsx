'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, FileText, User, AlertTriangle } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-browser'
import type { Atencion, Joven, TipoAtencion, Profile } from '@/lib/supabase'
import { format } from 'date-fns'
import DynamicForm from '@/components/DynamicForm'
import { formularioFieldsByRole, type RoleKey } from '@/lib/formulario-utils'
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
  const [creatorName, setCreatorName] = useState('Sin profesional asignado')
  const [creatorRole, setCreatorRole] = useState('Sin rol registrado')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [unauthorized, setUnauthorized] = useState(false)

  // Map global reusado por nuevos formularios (importado)

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
    if (atencionId) {
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
        const atencionRow: any = atencionData
        // Verificar permisos cuando el perfil ya está disponible:
        // si todavía no se hidrata, no bloquear la carga del formulario.
        const isAdmin = currentUserProfile?.role === 'admin'
        const isCreator = !!currentUserProfile?.id && atencionRow.profesional_id === currentUserProfile.id

        if (currentUserProfile && !isAdmin && !isCreator) {
          setUnauthorized(true)
          setLoading(false)
          return
        }
        
        setAtencion(atencionData)
        setJoven(atencionRow.jovenes)
        setTipoAtencion(atencionRow.tipos_atencion)

        // Resolver creador y rol de forma robusta:
        // 1) relación incluida en la query
        // 2) búsqueda directa por profesional_id
        // 3) fallback a system_logs de creación
        let resolvedProfessional = (atencionRow.profesional || null) as Profile | null
        let resolvedName = resolvedProfessional?.full_name || ''
        let resolvedRole = resolvedProfessional?.role || ''

        if (!resolvedProfessional && atencionRow.profesional_id) {
          const { data: profileById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', atencionRow.profesional_id)
            .maybeSingle()

          if (profileById) {
            const profileByIdAny = profileById as any
            resolvedProfessional = profileByIdAny as Profile
            resolvedName = profileByIdAny.full_name || ''
            resolvedRole = profileByIdAny.role || ''
          }
        }

        if (!resolvedName || !resolvedRole) {
          const { data: creationLog } = await supabase
            .from('system_logs')
            .select('usuario_id, detalles')
            .eq('accion', 'create_atencion')
            .eq('entidad', 'atenciones')
            .eq('entidad_id', atencionRow.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const creationLogAny = creationLog as any
          const logUserId = creationLogAny?.usuario_id as string | undefined
          const details = (creationLogAny?.detalles || {}) as Record<string, any>

          if (!resolvedRole) {
            resolvedRole =
              (typeof details.profesional_role === 'string' && details.profesional_role) ||
              (typeof details.role === 'string' && details.role) ||
              ''
          }

          if (!resolvedName && logUserId) {
            const { data: profileFromLog } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', logUserId)
              .maybeSingle()

            if (profileFromLog) {
              const profileFromLogAny = profileFromLog as any
              resolvedName = profileFromLogAny.full_name || ''
              if (!resolvedRole) resolvedRole = profileFromLogAny.role || ''
            } else {
              resolvedName = `Usuario creador (${logUserId.slice(0, 8)}...)`
            }
          }
        }

        setCreatorName(resolvedName || 'Sin profesional asignado')
        setCreatorRole(resolvedRole || 'Sin rol registrado')

        // El formulario específico completo vive en `formularios_atencion`.
        // Si no existe registro relacionado, usar fallback al campo embebido.
        let formularioEspecificoCompleto: any = atencionRow.formulario_especifico || {}
        const { data: formularioData, error: formularioError } = await supabase
          .from('formularios_atencion')
          .select('datos_json')
          .eq('atencion_id', atencionRow.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!formularioError && formularioData?.datos_json) {
          formularioEspecificoCompleto = formularioData.datos_json
        }

        const roleKey = atencionRow.tipos_atencion?.profesional_responsable as RoleKey | undefined
        const allowedFields =
          roleKey && roleKey in formularioFieldsByRole ? formularioFieldsByRole[roleKey] : undefined
        let formularioFiltrado = formularioEspecificoCompleto

        // Evitar mezclar formularios: si el tipo tiene esquema conocido,
        // mostramos solo sus campos esperados.
        if (
          allowedFields &&
          formularioEspecificoCompleto &&
          typeof formularioEspecificoCompleto === 'object' &&
          !Array.isArray(formularioEspecificoCompleto)
        ) {
          const onlyAllowed = Object.fromEntries(
            allowedFields
              .filter((key) => key in formularioEspecificoCompleto)
              .map((key) => [key, formularioEspecificoCompleto[key]])
          )

          if (Object.keys(onlyAllowed).length > 0) {
            formularioFiltrado = onlyAllowed
          }
        }

        setFormData({
          fecha_atencion: atencionRow.fecha_atencion ? format(new Date(atencionRow.fecha_atencion), 'yyyy-MM-dd\'T\'HH:mm') : '',
          motivo: atencionRow.motivo || '',
          observaciones: atencionRow.observaciones || '',
          recomendaciones: atencionRow.recomendaciones || '',
          estado: atencionRow.estado || 'completada',
          proxima_cita: atencionRow.proxima_cita ? format(new Date(atencionRow.proxima_cita), 'yyyy-MM-dd') : '',
          formulario_especifico: formularioFiltrado
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

  const formatFieldLabel = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())

  const updateFormularioField = (path: Array<string | number>, value: any) => {
    setFormData((prev) => {
      const current = prev.formulario_especifico || {}
      const next = structuredClone(current)

      let ref: any = next
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i]
        if (typeof ref[key] !== 'object' || ref[key] === null) {
          ref[key] = typeof path[i + 1] === 'number' ? [] : {}
        }
        ref = ref[key]
      }
      ref[path[path.length - 1]] = value

      return { ...prev, formulario_especifico: next }
    })
  }

  const renderFormularioFields = (data: any, path: Array<string | number> = []): React.ReactNode => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null
    }

    return Object.entries(data).map(([key, rawValue]) => {
      const value = rawValue as any
      const fieldPath = [...path, key]
      const fieldId = fieldPath.join('.')
      const label = formatFieldLabel(key)

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={fieldId} className="rounded-lg border border-gray-200 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFormularioFields(value, fieldPath)}
            </div>
          </div>
        )
      }

      if (typeof value === 'boolean') {
        return (
          <div key={fieldId} className="flex items-center gap-3">
            <input
              id={fieldId}
              type="checkbox"
              checked={value}
              onChange={(e) => updateFormularioField(fieldPath, e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label}
            </label>
          </div>
        )
      }

      if (Array.isArray(value)) {
        const hasObjectItems = value.some((item) => item && typeof item === 'object' && !Array.isArray(item))
        const hasPrimitiveItems = value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))

        return (
          <div key={fieldId} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>

            {value.length === 0 && (
              <p className="text-sm text-gray-500">Sin elementos.</p>
            )}

            {hasObjectItems && (
              <div className="space-y-3">
                {value.map((item, index) => (
                  <div key={`${fieldId}-${index}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Elemento {index + 1}</p>
                    {item && typeof item === 'object' && !Array.isArray(item) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderFormularioFields(item, [...fieldPath, index])}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item ?? ''}
                        onChange={(e) => updateFormularioField([...fieldPath, index], e.target.value)}
                        className="input-field"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!hasObjectItems && hasPrimitiveItems && (
              <textarea
                id={fieldId}
                value={value.map((item) => (item ?? '').toString()).join('\n')}
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0)
                  updateFormularioField(fieldPath, lines)
                }}
                className="input-field"
                rows={4}
                placeholder="Un valor por línea"
              />
            )}

            {!hasObjectItems && !hasPrimitiveItems && (
              <p className="text-sm text-gray-500">
                Este campo contiene una estructura compleja no editable en modo visual.
              </p>
            )}
          </div>
        )
      }

      const isLongText =
        typeof value === 'string' &&
        (value.length > 120 || value.includes('\n') || key.includes('observ') || key.includes('descripcion'))

      if (isLongText) {
        return (
          <div key={fieldId} className="md:col-span-2">
            <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <textarea
              id={fieldId}
              value={value ?? ''}
              onChange={(e) => updateFormularioField(fieldPath, e.target.value)}
              className="input-field"
              rows={4}
            />
          </div>
        )
      }

      return (
        <div key={fieldId}>
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <input
            id={fieldId}
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value ?? ''}
            onChange={(e) =>
              updateFormularioField(
                fieldPath,
                typeof value === 'number' ? Number(e.target.value || 0) : e.target.value
              )
            }
            className="input-field"
          />
        </div>
      )
    })
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
          formulario_especifico: formData.formulario_especifico || null,
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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Atención actualizada', message: 'Los cambios se guardaron correctamente.' } }))
      }
      router.push(`/dashboard/atenciones/${atencionId}`)

    } catch (error) {
      console.error('Error:', error)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', title: 'Error', message: error instanceof Error ? error.message : 'Error al actualizar la atención' } }))
      }
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

  if (!atencion) {
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
              <p className="text-gray-900">{joven ? `${joven.nombres} ${joven.apellidos}` : 'Sin joven asociado'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Tipo de Atención:</span>
              <p className="text-gray-900">{tipoAtencion?.nombre || 'Sin tipo de atención'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Profesional:</span>
              <p className="text-gray-900">{creatorName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Rol:</span>
              <p className="text-gray-900 capitalize">{creatorRole}</p>
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
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Formulario Específico {tipoAtencion?.nombre ? `- ${tipoAtencion.nombre}` : ''}
            </h2>
            
            <div className="space-y-4">
              <DynamicForm
                value={formData.formulario_especifico}
                onChange={(next) => handleInputChange('formulario_especifico', next)}
                hideEmpty={false}
              />
            </div>
          </div>

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

