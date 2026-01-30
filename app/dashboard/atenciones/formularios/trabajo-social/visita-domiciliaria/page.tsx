'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Calendar, FileText, Home, Phone } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
  expediente_administrativo?: string
  expediente_judicial?: string
}

interface FormData {
  joven_id: string
  servicio_regional: string
  fecha_atencion: string
  nombre_entrevistado: string
  numero_telefonico: string
  lugar_entrevista: string
  objetivo_visita: string
  desarrollo_visita: string
  observaciones: string
  trabajador_social: string
  nombre_entrevistado_firma: string
  firma_entrevistado: string
}

export default function VisitaDomiciliariaPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    servicio_regional: '',
    fecha_atencion: new Date().toISOString().split('T')[0],
    nombre_entrevistado: '',
    numero_telefonico: '',
    lugar_entrevista: '',
    objetivo_visita: '',
    desarrollo_visita: '',
    observaciones: '',
    trabajador_social: '',
    nombre_entrevistado_firma: '',
    firma_entrevistado: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad, expediente_administrativo, expediente_judicial')
        .eq('estado', 'activo')
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
    } catch (error) {
      console.error('Error loading jovenes:', error)
      alert('Error al cargar los jóvenes')
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) {
      newErrors.joven_id = 'Debe seleccionar un joven'
    }

    if (!formData.trabajador_social.trim()) {
      newErrors.trabajador_social = 'El nombre del trabajador social es requerido'
    }

    if (!formData.fecha_atencion) {
      newErrors.fecha_atencion = 'La fecha de atención es requerida'
    }

    if (!formData.objetivo_visita.trim()) {
      newErrors.objetivo_visita = 'El objetivo de la visita es requerido'
    }

    if (!formData.desarrollo_visita.trim()) {
      newErrors.desarrollo_visita = 'El desarrollo de la visita es requerido'
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

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.')
      }

      // Obtener el tipo de atención de trabajo social
      const { data: tipoAtencion } = await supabase
        .from('tipos_atencion')
        .select('id')
        .eq('profesional_responsable', 'trabajador_social')
        .limit(1)
        .maybeSingle()

      let tipoAtencionId = tipoAtencion?.id
      
      if (!tipoAtencionId) {
        const { data: anyTipo } = await supabase
          .from('tipos_atencion')
          .select('id')
          .limit(1)
          .maybeSingle()
        
        tipoAtencionId = anyTipo?.id
      }

      if (!tipoAtencionId) {
        throw new Error('No se encontró ningún tipo de atención en la base de datos.')
      }

      // Verificar que el usuario tenga perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('Tu usuario no tiene un perfil configurado. Por favor, ejecuta el script crear-perfil-usuario.sql en Supabase.')
      }

      // Crear una nueva atención
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: formData.fecha_atencion,
          motivo: 'Visita Domiciliaria de Supervisión y Seguimiento',
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        console.error('Error al crear atención:', atencionError)
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      if (!nuevaAtencion) {
        throw new Error('No se pudo crear la atención')
      }

      const atencionId = nuevaAtencion.id
      console.log('✅ Atención creada exitosamente:', atencionId)

      // Preparar datos para la función stored procedure
      const datosJson = {
        ...formData,
        fecha_visita: formData.fecha_atencion,
        hora_visita: null,
        direccion_completa: formData.lugar_entrevista,
        departamento: null,
        municipio: null,
        aldea_colonia_barrio: null,
        calle_avenida_sector: null,
        numero_casa: null,
        referencias: null,
        medios_transporte: null,
        personas_presentes: [],
        observaciones_ambiente: null,
        recomendaciones: null,
        requiere_seguimiento: false,
        fecha_proxima_visita: null,
        compromisos: []
      }

      // Usar la función stored procedure
      const { data: formularioId, error: formularioError } = await supabase
        .rpc('crear_formulario_trabajo_social', {
          p_tipo_formulario: 'visita_domiciliaria',
          p_joven_id: formData.joven_id,
          p_atencion_id: atencionId,
          p_trabajador_social: formData.trabajador_social,
          p_datos_json: datosJson,
          p_created_by: user.id
        })

      if (formularioError) {
        console.error('Error al guardar formulario:', formularioError)
        // Fallback manual
        const { data: formularioData, error: insertError } = await supabase
          .from('formularios_atencion')
          .insert({
            tipo_formulario: 'visita_domiciliaria',
            joven_id: formData.joven_id,
            atencion_id: atencionId,
            datos_json: datosJson,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Error al guardar el formulario: ${insertError.message}`)
        }

        if (formularioData?.id) {
          const { error: visitaError } = await supabase
            .from('visitas_domiciliarias')
            .insert({
              formulario_id: formularioData.id,
              joven_id: formData.joven_id,
              atencion_id: atencionId,
              trabajador_social: formData.trabajador_social,
              fecha_visita: formData.fecha_atencion,
              direccion_completa: formData.lugar_entrevista,
              objetivo_visita: formData.objetivo_visita,
              desarrollo_visita: formData.desarrollo_visita,
              observaciones: formData.observaciones,
              created_by: user.id
            })

          if (visitaError) {
            console.error('Error al guardar en visitas_domiciliarias:', visitaError)
          }
        }
      } else {
        console.log('✅ Formulario guardado exitosamente usando stored procedure:', formularioId)
      }

      alert('Ficha de Visita Domiciliaria guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la visita domiciliaria: ${error.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha de Visita Domiciliaria de Supervisión y Seguimiento
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Área de Trabajo Social
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">PROGRAMA DE ATENCIÓN A MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD</h3>
        <p className="text-md font-medium">SERVICIO REGIONAL: <span className="font-normal">{formData.servicio_regional || '________________'}</span></p>
        <h4 className="text-lg font-bold mt-4">FICHA DE VISITA DOMICILIARIA DE SUPERVISIÓN Y SEGUIMIENTO</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Información General
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selección de Joven */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joven <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.joven_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Seleccione un joven</option>
                {jovenes.map((joven) => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
              {errors.joven_id && (
                <p className="mt-1 text-sm text-red-600">{errors.joven_id}</p>
              )}
            </div>

            {/* Fecha de Atención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Atención <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha_atencion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_atencion: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_atencion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_atencion && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_atencion}</p>
              )}
            </div>

            {/* Nombre del Entrevistado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Entrevistado
              </label>
              <input
                type="text"
                value={formData.nombre_entrevistado}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_entrevistado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre completo del entrevistado"
              />
            </div>

            {/* Número telefónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Número telefónico
              </label>
              <input
                type="text"
                value={formData.numero_telefonico}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_telefonico: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Número de teléfono"
              />
            </div>

            {/* Lugar donde se realiza la entrevista */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Lugar donde se realiza la entrevista
              </label>
              <input
                type="text"
                value={formData.lugar_entrevista}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_entrevista: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dirección completa donde se realiza la entrevista"
              />
              <textarea
                value={formData.lugar_entrevista}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_entrevista: e.target.value }))}
                rows={2}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dirección completa (continuación)"
              />
            </div>

            {/* Trabajador/a Social */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trabajador/a Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.trabajador_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nombre del trabajador social"
              />
              {errors.trabajador_social && (
                <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>
              )}
            </div>
          </div>
        </div>

        {/* Objetivo de la visita */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Objetivo de la visita <span className="text-red-500">*</span>
          </h3>
          <textarea
            value={formData.objetivo_visita}
            onChange={(e) => setFormData(prev => ({ ...prev, objetivo_visita: e.target.value }))}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.objetivo_visita ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describa el objetivo de la visita"
          />
          {errors.objetivo_visita && (
            <p className="mt-1 text-sm text-red-600">{errors.objetivo_visita}</p>
          )}
        </div>

        {/* Desarrollo de la Visita */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Desarrollo de la Visita <span className="text-red-500">*</span>
          </h3>
          <textarea
            value={formData.desarrollo_visita}
            onChange={(e) => setFormData(prev => ({ ...prev, desarrollo_visita: e.target.value }))}
            rows={12}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.desarrollo_visita ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describa detalladamente el desarrollo de la visita"
          />
          {errors.desarrollo_visita && (
            <p className="mt-1 text-sm text-red-600">{errors.desarrollo_visita}</p>
          )}
        </div>

        {/* Observaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Observaciones
          </h3>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las observaciones realizadas durante la visita"
          />
        </div>

        {/* Firmas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Firmas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TRABAJADOR SOCIAL PAMSPL-INAMI
                </label>
                <input
                  type="text"
                  value={formData.trabajador_social}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white"
                />
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Firma del Trabajador Social</p>
                <div className="h-16 border-b-2 border-gray-400 dark:border-gray-500"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NOMBRE ENTREVISTADO
                </label>
                <input
                  type="text"
                  value={formData.nombre_entrevistado_firma}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre_entrevistado_firma: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nombre del entrevistado"
                />
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">FIRMA ENTREVISTADO</p>
                <div className="h-16 border-b-2 border-gray-400 dark:border-gray-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/atenciones"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Visita'}
          </button>
        </div>
      </form>
    </div>
  )
}

