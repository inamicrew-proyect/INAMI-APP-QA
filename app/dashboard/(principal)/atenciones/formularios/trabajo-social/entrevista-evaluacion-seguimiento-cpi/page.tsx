'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User } from 'lucide-react'
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
  centro_pedagogico: string
  
  // DATOS DE IDENTIFICACIÓN DEL ADOLESCENTE
  nombre: string
  edad: number
  fecha_entrevista: string
  
  // SITUACIÓN ACTUAL - ÁREA INDIVIDUAL
  comportamiento_centro: string
  actividades_cpi_gusta: string
  
  // ÁREA DE CONVIVENCIA GRUPAL
  relacion_companeros_modulo: string
  comportamiento_personal_centro: string
  
  // ÁREA FAMILIAR
  mantiene_comunicacion_familia: 'si' | 'no' | ''
  explica_comunicacion_familia: string
  relacion_actual_familia: string
  quien_visita_centro: string
  apoyo_recibido_familia: string
  otros_servicios_equipo_tecnico: string
  
  // ÁREA EDUCATIVA
  ha_participado_charlas: 'si' | 'no' | ''
  cuales_charlas: string
  principales_aprendizajes: string
  actitud_estudios: string
  grado_actual: string
  taller_inscrito: string
  participa_actividades_religiosas: string
  actividades_fisicas_recreativas: string
  
  // ÁREA DE SALUD
  estado_salud_actual: string
  esta_tomando_medicamentos: 'si' | 'no' | ''
  explica_medicamentos: string
  recibio_atencion_hospitalaria: 'si' | 'no' | ''
  explica_atencion_hospitalaria: string
  recibe_atencion_psiquiatrica: 'si' | 'no' | ''
  explica_atencion_psiquiatrica: string
  
  // ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN
  contribucion_equipo_tecnico: string
  autovaloracion: string
  
  // VALORACIÓN TÉCNICA
  pronostico: string
  recomendaciones: string
  
  // FIRMA
  trabajador_social: string
}

export default function EntrevistaEvaluacionSeguimientoCPIPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre: '',
    edad: 0,
    fecha_entrevista: new Date().toISOString().split('T')[0],
    comportamiento_centro: '',
    actividades_cpi_gusta: '',
    relacion_companeros_modulo: '',
    comportamiento_personal_centro: '',
    mantiene_comunicacion_familia: '',
    explica_comunicacion_familia: '',
    relacion_actual_familia: '',
    quien_visita_centro: '',
    apoyo_recibido_familia: '',
    otros_servicios_equipo_tecnico: '',
    ha_participado_charlas: '',
    cuales_charlas: '',
    principales_aprendizajes: '',
    actitud_estudios: '',
    grado_actual: '',
    taller_inscrito: '',
    participa_actividades_religiosas: '',
    actividades_fisicas_recreativas: '',
    estado_salud_actual: '',
    esta_tomando_medicamentos: '',
    explica_medicamentos: '',
    recibio_atencion_hospitalaria: '',
    explica_atencion_hospitalaria: '',
    recibe_atencion_psiquiatrica: '',
    explica_atencion_psiquiatrica: '',
    contribucion_equipo_tecnico: '',
    autovaloracion: '',
    pronostico: '',
    recomendaciones: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad
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

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener tipo de atención para trabajador social
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

      // Crear fecha de atención en formato ISO
      const fechaAtencion = formData.fecha_entrevista ? new Date(formData.fecha_entrevista).toISOString() : new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Entrevista de Evaluación y Seguimiento CPI',
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      const atencionId = atencion.id

      // Preparar datos JSON
      const datosJson = {
        ...formData,
        fecha_entrevista: formData.fecha_entrevista
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'entrevista_evaluacion_seguimiento_cpi',
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

      alert('Entrevista de Evaluación y Seguimiento CPI guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la entrevista: ${error.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Entrevista de Evaluación y Seguimiento
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">TRABAJO SOCIAL / CPI</h3>
        <p className="text-md font-medium">CPI: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">ENTREVISTA DE EVALUACIÓN Y SEGUIMIENTO</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN DEL ADOLESCENTE */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DEL ADOLESCENTE
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {errors.joven_id && <p className="mt-1 text-sm text-red-600">{errors.joven_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de la entrevista</label>
              <input type="date" value={formData.fecha_entrevista} onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrevista: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN ACTUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN ACTUAL</h3>

          <div className="space-y-6">
            {/* Área Individual */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Área Individual:</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuál es su comportamiento dentro del centro, y considera si ha tenido un cambio en el presente trimestre?
                  </label>
                  <textarea
                    value={formData.comportamiento_centro}
                    onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_centro: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿En qué actividades que se desarrollan en el CPI le gusta participar?
                  </label>
                  <textarea
                    value={formData.actividades_cpi_gusta}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_cpi_gusta: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Área de Convivencia Grupal */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Área de Convivencia Grupal</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cómo es la relación con sus compañeros de módulo y si se siente aceptados por ellos /dormitorio/hogar/centro?
                  </label>
                  <textarea
                    value={formData.relacion_companeros_modulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, relacion_companeros_modulo: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Como es su comportamiento con el personal del centro?
                  </label>
                  <textarea
                    value={formData.comportamiento_personal_centro}
                    onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_personal_centro: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Área familiar */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Área familiar</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Mantiene comunicación con su familia?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mantiene_comunicacion_familia"
                        value="si"
                        checked={formData.mantiene_comunicacion_familia === 'si'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, mantiene_comunicacion_familia: 'si' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mantiene_comunicacion_familia"
                        value="no"
                        checked={formData.mantiene_comunicacion_familia === 'no'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, mantiene_comunicacion_familia: 'no' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NO</span>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explique:</label>
                  <textarea
                    value={formData.explica_comunicacion_familia}
                    onChange={(e) => setFormData(prev => ({ ...prev, explica_comunicacion_familia: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cómo es la relación actualmente con su familia?
                  </label>
                  <textarea
                    value={formData.relacion_actual_familia}
                    onChange={(e) => setFormData(prev => ({ ...prev, relacion_actual_familia: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Quién viene a visitarle durante ha permanecido en el centro y que apoyo ha recibido de su familia?
                  </label>
                  <textarea
                    value={formData.quien_visita_centro}
                    onChange={(e) => setFormData(prev => ({ ...prev, quien_visita_centro: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Qué otros servicios le gustarían recibir del Equipo Técnico Interdisciplinario del Centro en relación a su familia?
                  </label>
                  <textarea
                    value={formData.otros_servicios_equipo_tecnico}
                    onChange={(e) => setFormData(prev => ({ ...prev, otros_servicios_equipo_tecnico: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Área educativa */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Área educativa</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Involucramiento en actividades de educación Formal, no formal y Espiritual:
                  </label>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Ha participado en alguna charla o programa?
                    </label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="ha_participado_charlas"
                          value="si"
                          checked={formData.ha_participado_charlas === 'si'}
                          onChange={(_e) => setFormData(prev => ({ ...prev, ha_participado_charlas: 'si' }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">SI</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="ha_participado_charlas"
                          value="no"
                          checked={formData.ha_participado_charlas === 'no'}
                          onChange={(_e) => setFormData(prev => ({ ...prev, ha_participado_charlas: 'no' }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">NO</span>
                      </label>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿En cuáles?</label>
                    <textarea
                      value={formData.cuales_charlas}
                      onChange={(e) => setFormData(prev => ({ ...prev, cuales_charlas: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuáles han sido los principales aprendizajes que ha adquirido en esas charlas o programas?
                  </label>
                  <textarea
                    value={formData.principales_aprendizajes}
                    onChange={(e) => setFormData(prev => ({ ...prev, principales_aprendizajes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuál es la actitud hacia sus estudios? (Corroborar con área educativa)
                  </label>
                  <textarea
                    value={formData.actitud_estudios}
                    onChange={(e) => setFormData(prev => ({ ...prev, actitud_estudios: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ¿En qué grado está actualmente?
                    </label>
                    <input
                      type="text"
                      value={formData.grado_actual}
                      onChange={(e) => setFormData(prev => ({ ...prev, grado_actual: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ¿En qué taller está inscrito?
                    </label>
                    <input
                      type="text"
                      value={formData.taller_inscrito}
                      onChange={(e) => setFormData(prev => ({ ...prev, taller_inscrito: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Participa en actividades religiosas? ¿Cuáles?
                  </label>
                  <textarea
                    value={formData.participa_actividades_religiosas}
                    onChange={(e) => setFormData(prev => ({ ...prev, participa_actividades_religiosas: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Qué actividades físicas y recreativas realiza?
                  </label>
                  <textarea
                    value={formData.actividades_fisicas_recreativas}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_fisicas_recreativas: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Área de Salud */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Área de Salud</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuál es su estado de salud actual?
                  </label>
                  <textarea
                    value={formData.estado_salud_actual}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_salud_actual: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Está tomando medicamentos?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="esta_tomando_medicamentos"
                        value="si"
                        checked={formData.esta_tomando_medicamentos === 'si'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, esta_tomando_medicamentos: 'si' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="esta_tomando_medicamentos"
                        value="no"
                        checked={formData.esta_tomando_medicamentos === 'no'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, esta_tomando_medicamentos: 'no' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NO</span>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explique:</label>
                  <textarea
                    value={formData.explica_medicamentos}
                    onChange={(e) => setFormData(prev => ({ ...prev, explica_medicamentos: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Durante este trimestre ha recibido atención hospitalaria?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibio_atencion_hospitalaria"
                        value="si"
                        checked={formData.recibio_atencion_hospitalaria === 'si'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibio_atencion_hospitalaria: 'si' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibio_atencion_hospitalaria"
                        value="no"
                        checked={formData.recibio_atencion_hospitalaria === 'no'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibio_atencion_hospitalaria: 'no' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NO</span>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explique:</label>
                  <textarea
                    value={formData.explica_atencion_hospitalaria}
                    onChange={(e) => setFormData(prev => ({ ...prev, explica_atencion_hospitalaria: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Recibe atención médica psiquiátrica?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibe_atencion_psiquiatrica"
                        value="si"
                        checked={formData.recibe_atencion_psiquiatrica === 'si'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibe_atencion_psiquiatrica: 'si' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibe_atencion_psiquiatrica"
                        value="no"
                        checked={formData.recibe_atencion_psiquiatrica === 'no'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibe_atencion_psiquiatrica: 'no' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NO</span>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explique:</label>
                  <textarea
                    value={formData.explica_atencion_psiquiatrica}
                    onChange={(e) => setFormData(prev => ({ ...prev, explica_atencion_psiquiatrica: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha contribuido la atención que le está brindando el Equipo Técnico Multidisciplinario?
              </label>
              <textarea
                value={formData.contribucion_equipo_tecnico}
                onChange={(e) => setFormData(prev => ({ ...prev, contribucion_equipo_tecnico: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Autovaloración del 1 -100 (autopercepción sobre avances y/o cambios en todos los aspectos)
              </label>
              <textarea
                value={formData.autovaloracion}
                onChange={(e) => setFormData(prev => ({ ...prev, autovaloracion: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* VALORACIÓN TÉCNICA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VALORACIÓN TÉCNICA</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pronóstico:</label>
              <textarea
                value={formData.pronostico}
                onChange={(e) => setFormData(prev => ({ ...prev, pronostico: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendaciones:</label>
              <textarea
                value={formData.recomendaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trabajador/a Social - Nombre, Firma y sello <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.trabajador_social}
              onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.trabajador_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.trabajador_social && <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>}
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
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

