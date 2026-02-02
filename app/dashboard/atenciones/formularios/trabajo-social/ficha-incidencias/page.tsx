'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import JovenSearchInput from '@/components/JovenSearchInput'

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
  regional: string
  nombre_completo_nnaj: string
  medida: string
  expediente_interno: string
  expediente_judicial: string
  fecha_elaboracion: string
  trabajador_social: string
  situacion_presentada: string
  acciones_realizadas: string
  recomendaciones: string
  medios_verificacion: string[]
  medios_verificacion_otro: string
  firma_trabajador_social: string
}

export default function FichaIncidenciasPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_completo_nnaj: '',
    medida: '',
    expediente_interno: '',
    expediente_judicial: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    trabajador_social: '',
    situacion_presentada: '',
    acciones_realizadas: '',
    recomendaciones: '',
    medios_verificacion: [],
    medios_verificacion_otro: '',
    firma_trabajador_social: ''
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
        joven_id: jovenId,
        nombre_completo_nnaj: `${joven.nombres} ${joven.apellidos}`,
        expediente_interno: joven.expediente_administrativo || '',
        expediente_judicial: joven.expediente_judicial || ''
      }))
    }
  }

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev.medios_verificacion
      if (checked) {
        return {
          ...prev,
          medios_verificacion: [...current, value]
        }
      } else {
        return {
          ...prev,
          medios_verificacion: current.filter(v => v !== value)
        }
      }
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) {
      newErrors.joven_id = 'Debe seleccionar un joven'
    }

    if (!formData.trabajador_social.trim()) {
      newErrors.trabajador_social = 'El nombre del trabajador social es requerido'
    }

    if (!formData.fecha_elaboracion) {
      newErrors.fecha_elaboracion = 'La fecha de elaboración es requerida'
    }

    if (!formData.situacion_presentada.trim()) {
      newErrors.situacion_presentada = 'La situación presentada es requerida'
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
          fecha_atencion: formData.fecha_elaboracion,
          motivo: 'Ficha de Incidencias',
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

      // Preparar medios de verificación
      let mediosVerificacionFinal = [...formData.medios_verificacion]
      if (formData.medios_verificacion_otro.trim()) {
        mediosVerificacionFinal.push(`Otros: ${formData.medios_verificacion_otro}`)
      }

      // Preparar datos para la función stored procedure
      const datosJson = {
        ...formData,
        fecha_incidencia: formData.fecha_elaboracion,
        tipo_incidencia: 'otra', // Por defecto 'otra' ya que es un formulario general
        severidad: null,
        descripcion_incidencia: formData.situacion_presentada,
        lugar_incidencia: null,
        personas_involucradas: [],
        testigos: [],
        antecedentes: null,
        factores_desencadenantes: [],
        situacion_previo_incidencia: null,
        acciones_inmediatas: formData.acciones_realizadas,
        medidas_aplicadas: [],
        personas_notificadas: [],
        instituciones_notificadas: [],
        requiere_seguimiento: false,
        plan_seguimiento: null,
        fecha_proximo_seguimiento: null,
        observaciones: null,
        recomendaciones: formData.recomendaciones,
        medios_verificacion: mediosVerificacionFinal
      }

      // Usar la función stored procedure
      const { data: formularioId, error: formularioError } = await supabase
        .rpc('crear_formulario_trabajo_social', {
          p_tipo_formulario: 'informe_incidencias',
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
            tipo_formulario: 'informe_incidencias',
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
          const { error: informeError } = await supabase
            .from('informes_incidencias')
            .insert({
              formulario_id: formularioData.id,
              joven_id: formData.joven_id,
              atencion_id: atencionId,
              trabajador_social: formData.trabajador_social,
              fecha_incidencia: formData.fecha_elaboracion,
              tipo_incidencia: 'otra',
              descripcion_incidencia: formData.situacion_presentada,
              acciones_inmediatas: formData.acciones_realizadas,
              recomendaciones: formData.recomendaciones,
              observaciones: mediosVerificacionFinal.join(', '),
              created_by: user.id
            })

          if (informeError) {
            console.error('Error al guardar en informes_incidencias:', informeError)
          }
        }
      } else {
        console.log('✅ Formulario guardado exitosamente usando stored procedure:', formularioId)
      }

      alert('Ficha de Incidencias guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la ficha de incidencias: ${error.message || 'Error desconocido'}`)
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
            Ficha de Incidencias
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
        <p className="text-md font-medium">REGIONAL: <span className="font-normal">{formData.regional || '________________'}</span></p>
        <h4 className="text-lg font-bold mt-4">ÁREA DE TRABAJO SOCIAL</h4>
        <h5 className="text-lg font-bold mt-2">INFORME DE INCIDENCIAS</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Información General
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regional
              </label>
              <input
                type="text"
                value={formData.regional}
                onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese la regional"
              />
            </div>

            {/* Selección de Joven */}
            <div>
              <JovenSearchInput
                value={formData.nombre_completo_nnaj}
                onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo_nnaj: value }))}
                onJovenSelect={(joven) => {
                  if (joven.id) {
                    handleJovenChange(joven.id)
                  }
                }}
                label="Nombre completo NNAJ"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id}
              />
            </div>

            {/* Medida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medida
              </label>
              <input
                type="text"
                value={formData.medida}
                onChange={(e) => setFormData(prev => ({ ...prev, medida: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Tipo de medida"
              />
            </div>

            {/* Expediente interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expediente interno
              </label>
              <input
                type="text"
                value={formData.expediente_interno}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white"
              />
            </div>

            {/* Expediente Judicial No. */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expediente Judicial No.
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Número de expediente judicial"
              />
            </div>

            {/* Fecha de elaboración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de elaboración <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha_elaboracion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_elaboracion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_elaboracion && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_elaboracion}</p>
              )}
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

        {/* Situación Presentada */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            SITUACIÓN PRESENTADA <span className="text-red-500">*</span>
          </h3>
          <textarea
            value={formData.situacion_presentada}
            onChange={(e) => setFormData(prev => ({ ...prev, situacion_presentada: e.target.value }))}
            rows={10}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.situacion_presentada ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describa detalladamente la situación presentada"
          />
          {errors.situacion_presentada && (
            <p className="mt-1 text-sm text-red-600">{errors.situacion_presentada}</p>
          )}
        </div>

        {/* Acciones Realizadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ACCIONES REALIZADAS
          </h3>
          <textarea
            value={formData.acciones_realizadas}
            onChange={(e) => setFormData(prev => ({ ...prev, acciones_realizadas: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las acciones realizadas"
          />
        </div>

        {/* Recomendaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            RECOMENDACIONES
          </h3>
          <textarea
            value={formData.recomendaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las recomendaciones"
          />
        </div>

        {/* Medios de Verificación */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            MEDIOS DE VERIFICACIÓN
          </h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4">
              {['Testimonios', 'Informes', 'Hojas de faltas', 'Libro de novedades'].map((opcion) => (
                <label key={opcion} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.medios_verificacion.includes(opcion)}
                    onChange={(e) => handleCheckboxChange(opcion, e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{opcion}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={formData.medios_verificacion.includes('Otros')}
                  onChange={(e) => handleCheckboxChange('Otros', e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Otros</span>
              </label>
              {formData.medios_verificacion.includes('Otros') && (
                <input
                  type="text"
                  value={formData.medios_verificacion_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, medios_verificacion_otro: e.target.value }))}
                  placeholder="Especifique otros medios de verificación"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* Firma */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Firma y Sello
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Firma y sello del/la Trabajador/a Social
            </label>
            <input
              type="text"
              value={formData.firma_trabajador_social}
              onChange={(e) => setFormData(prev => ({ ...prev, firma_trabajador_social: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nombre del trabajador social"
            />
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
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </form>
    </div>
  )
}

