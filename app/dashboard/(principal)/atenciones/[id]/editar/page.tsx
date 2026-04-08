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

const FORMULARIO_ROUTE_BY_TIPO: Record<string, string> = {
  // Trabajo social
  entrevista_familiar_pmspl: '/dashboard/atenciones/formularios/trabajo-social/entrevista-familiar',
  entrevista_familiar_cpi: '/dashboard/atenciones/formularios/trabajo-social/entrevista-familiar-cpi',
  entrevista_evaluacion_seguimiento: '/dashboard/atenciones/formularios/trabajo-social/entrevista-evaluacion-seguimiento',
  entrevista_evaluacion_seguimiento_cpi: '/dashboard/atenciones/formularios/trabajo-social/entrevista-evaluacion-seguimiento-cpi',
  ficha_entrevista_egreso_cpi: '/dashboard/atenciones/formularios/trabajo-social/ficha-entrevista-egreso-cpi',
  ficha_entrevista_final_cierre: '/dashboard/atenciones/formularios/trabajo-social/ficha-entrevista-final-cierre',
  ficha_intervencion: '/dashboard/atenciones/formularios/trabajo-social/ficha-intervencion',
  ficha_intervencion_cpi: '/dashboard/atenciones/formularios/trabajo-social/ficha-intervencion-cpi',
  ficha_remision_interna_cpi: '/dashboard/atenciones/formularios/trabajo-social/ficha-remision-interna-cpi',
  ficha_social: '/dashboard/atenciones/formularios/trabajo-social/ficha-social',
  ficha_social_area_trabajo_social: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-area-trabajo-social',
  ficha_social_fase_diagnostico: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-fase-diagnostico',
  ficha_social_fase_ingreso: '/dashboard/atenciones/formularios/trabajo-social/ficha-social-fase-ingreso',
  ficha_visita_domiciliaria_cpi: '/dashboard/atenciones/formularios/trabajo-social/ficha-visita-domiciliaria-cpi',
  informe_evaluacion_seguimiento_cpi: '/dashboard/atenciones/formularios/trabajo-social/informe-evaluacion-seguimiento-cpi',
  informe_incidencias: '/dashboard/atenciones/formularios/trabajo-social/informe-incidencias',
  informe_servicio_comunitario: '/dashboard/atenciones/formularios/trabajo-social/informe-servicio-comunitario',
  informe_social_egreso_cierre: '/dashboard/atenciones/formularios/trabajo-social/informe-social-egreso-cierre',
  informe_social_egreso_cpi: '/dashboard/atenciones/formularios/trabajo-social/informe-social-egreso-cpi',
  informe_social_evaluacion_seguimiento: '/dashboard/atenciones/formularios/trabajo-social/informe-social-evaluacion-seguimiento',
  informe_social_fase_diagnostico: '/dashboard/atenciones/formularios/trabajo-social/informe-social-fase-diagnostico',
  informe_social_inicial: '/dashboard/atenciones/formularios/trabajo-social/informe-social-inicial',
  informe_socioeconomico: '/dashboard/atenciones/formularios/trabajo-social/informe-socioeconomico',
  plan_atencion_cautelar_cpi: '/dashboard/atenciones/formularios/trabajo-social/plan-atencion-cautelar-cpi',
  plan_atencion_individual: '/dashboard/atenciones/formularios/trabajo-social/plan-atencion-individual',
  visita_domiciliaria: '/dashboard/atenciones/formularios/trabajo-social/visita-domiciliaria',
  platin_cpi: '/dashboard/atenciones/formularios/trabajo-social/platin-cpi',
  estudio_socioeconomico: '/dashboard/atenciones/formularios/trabajo-social/estudio-socioeconomico',

  // Psicologia
  entrevista_inicial_adolescente_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-inicial-adolescente',
  entrevista_inicial_familia_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-inicial-familia',
  entrevista_preeliminar: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-preeliminar',
  entrevista_seguimiento_familia: '/dashboard/atenciones/formularios/psicologia/cpi/entrevista-seguimiento-familia',
  informe_final_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/informe-final',
  informe_preliminar_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/informe-preliminar',
  informe_seguimiento_post_sancion_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/informe-seguimiento-post-sancion',
  intervencion_crisis_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/intervencion-crisis',
  remision_cpi_pmspl: '/dashboard/atenciones/formularios/psicologia/cpi/remision',
  remision_interna_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/remision-interna',
  seguimiento_terapeutico_familiar_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-familiar',
  seguimiento_terapeutico_grupal_adolescentes_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-grupal-adolescentes',
  seguimiento_terapeutico_grupal_padres: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-grupal-padres',
  seguimiento_terapeutico_individual_adolescentes_cpi: '/dashboard/atenciones/formularios/psicologia/cpi/seguimiento-terapeutico-individual-adolescentes',

  // Seguridad
  ficha_ingreso_seguridad: '/dashboard/atenciones/formularios/seguridad/ficha-ingreso',
  datos_aprehension: '/dashboard/atenciones/formularios/seguridad/datos-aprehension',
  estado_fisico: '/dashboard/atenciones/formularios/seguridad/estado-fisico',

  // Legal
  asesoria_legal: '/dashboard/atenciones/formularios/legal/asesoria-legal',
  datos_judiciales: '/dashboard/atenciones/formularios/legal/datos-judiciales',
  resumen_causas: '/dashboard/atenciones/formularios/legal/resumen-causas',

  // Medicos / salud
  historia_clinica: '/dashboard/atenciones/formularios/medicos/historia-clinica',
  examen_fisico: '/dashboard/atenciones/formularios/medicos/examen-fisico',
  hoja_egreso: '/dashboard/atenciones/formularios/medicos/hoja-egreso',
  informe_seguimiento: '/dashboard/atenciones/formularios/medicos/informe-seguimiento',
  informe_seguimiento_salud: '/dashboard/atenciones/formularios/salud/informe-seguimiento',

  // Pedagogia / educacion
  cierre: '/dashboard/atenciones/formularios/pedagogia/cierre',
  especial: '/dashboard/atenciones/formularios/pedagogia/especial',
  seguimiento: '/dashboard/atenciones/formularios/pedagogia/seguimiento',
  informe_inicial: '/dashboard/atenciones/formularios/pedagogia/informe-inicial',
  informe_inicial_educativo: '/dashboard/atenciones/formularios/educacion/informe-inicial'
}

// Solo redirigir cuando la ficha ya soporta cargar/actualizar por ?atencion_id=
const FORMULARIOS_CON_EDICION_SOPORTADA = new Set<string>([
  'entrevista_familiar_pmspl'
])

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
  const [formularioTipo, setFormularioTipo] = useState<string | null>(null)
  const [redirectingToSpecificForm, setRedirectingToSpecificForm] = useState(false)

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

  useEffect(() => {
    if (!atencionId || !formularioTipo) return

    if (!FORMULARIOS_CON_EDICION_SOPORTADA.has(formularioTipo)) return

    const route = FORMULARIO_ROUTE_BY_TIPO[formularioTipo]
    if (!route) return

    setRedirectingToSpecificForm(true)
    router.replace(`${route}?atencion_id=${atencionId}`)
  }, [atencionId, formularioTipo, router])

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
          .select('datos_json, tipo_formulario')
          .eq('atencion_id', atencionRow.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!formularioError && formularioData?.datos_json) {
          formularioEspecificoCompleto = formularioData.datos_json
        }
        setFormularioTipo(formularioData?.tipo_formulario || null)

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

  const handleFormularioEspecificoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      formulario_especifico: {
        ...(prev.formulario_especifico || {}),
        [field]: value
      }
    }))
  }

  const renderFormularioEspecifico = () => {
    const profesional = tipoAtencion?.profesional_responsable
    if (!profesional) return null

    switch (profesional) {
      case 'medico':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Historia Clínica</label>
              <textarea value={formData.formulario_especifico.historia_clinica || ''} onChange={(e) => handleFormularioEspecificoChange('historia_clinica', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Examen Físico</label>
              <textarea value={formData.formulario_especifico.examen_fisico || ''} onChange={(e) => handleFormularioEspecificoChange('examen_fisico', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
              <input type="text" value={formData.formulario_especifico.diagnostico || ''} onChange={(e) => handleFormularioEspecificoChange('diagnostico', e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tratamiento</label>
              <textarea value={formData.formulario_especifico.tratamiento || ''} onChange={(e) => handleFormularioEspecificoChange('tratamiento', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      case 'psicologo':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación Psicológica</label>
              <textarea value={formData.formulario_especifico.evaluacion_psicologica || ''} onChange={(e) => handleFormularioEspecificoChange('evaluacion_psicologica', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico Psicológico</label>
              <input type="text" value={formData.formulario_especifico.diagnostico_psicologico || ''} onChange={(e) => handleFormularioEspecificoChange('diagnostico_psicologico', e.target.value)} className="input-field w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recomendaciones Terapéuticas</label>
              <textarea value={formData.formulario_especifico.recomendaciones_terapeuticas || ''} onChange={(e) => handleFormularioEspecificoChange('recomendaciones_terapeuticas', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      case 'trabajador_social':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación Social</label>
              <textarea value={formData.formulario_especifico.evaluacion_social || ''} onChange={(e) => handleFormularioEspecificoChange('evaluacion_social', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Situación Familiar</label>
              <textarea value={formData.formulario_especifico.situacion_familiar || ''} onChange={(e) => handleFormularioEspecificoChange('situacion_familiar', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recursos Disponibles</label>
              <textarea value={formData.formulario_especifico.recursos_disponibles || ''} onChange={(e) => handleFormularioEspecificoChange('recursos_disponibles', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      case 'abogado':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Situación Legal</label>
              <textarea value={formData.formulario_especifico.situacion_legal || ''} onChange={(e) => handleFormularioEspecificoChange('situacion_legal', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proceso Judicial</label>
              <textarea value={formData.formulario_especifico.proceso_judicial || ''} onChange={(e) => handleFormularioEspecificoChange('proceso_judicial', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Derechos del Menor</label>
              <textarea value={formData.formulario_especifico.derechos_menor || ''} onChange={(e) => handleFormularioEspecificoChange('derechos_menor', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      case 'pedagogo':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación Educativa</label>
              <textarea value={formData.formulario_especifico.evaluacion_educativa || ''} onChange={(e) => handleFormularioEspecificoChange('evaluacion_educativa', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plan de Estudios</label>
              <textarea value={formData.formulario_especifico.plan_estudios || ''} onChange={(e) => handleFormularioEspecificoChange('plan_estudios', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Necesidades Educativas</label>
              <textarea value={formData.formulario_especifico.necesidades_educativas || ''} onChange={(e) => handleFormularioEspecificoChange('necesidades_educativas', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      case 'seguridad':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registro de Ingreso</label>
              <textarea value={formData.formulario_especifico.registro_ingreso || ''} onChange={(e) => handleFormularioEspecificoChange('registro_ingreso', e.target.value)} className="input-field w-full" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medidas de Seguridad</label>
              <textarea value={formData.formulario_especifico.medidas_seguridad || ''} onChange={(e) => handleFormularioEspecificoChange('medidas_seguridad', e.target.value)} className="input-field w-full" rows={3} />
            </div>
          </div>
        )
      default:
        return null
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

  if (redirectingToSpecificForm) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Abriendo ficha específica para edición...</p>
          </div>
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
              {renderFormularioEspecifico() || (
                <DynamicForm
                  value={formData.formulario_especifico}
                  onChange={(next) => handleInputChange('formulario_especifico', next)}
                  hideEmpty={false}
                />
              )}
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

