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
  regional: string
  nombre_nnaj: string
  edad: number
  exp_interno: string
  exp_judicial: string
  nombre_responsable: string
  parentesco: string
  telefono: string
  domicilio: string
  fecha_elaboracion: string
  trabajador_social: string
  
  // ÁREA INDIVIDUAL
  esta_estudiando: 'si' | 'no' | ''
  grado_cursa: string
  institucion: string
  modalidad: string
  observaciones_estudio: string
  esta_trabajando: 'si' | 'no' | ''
  detalle_trabajo: string
  actividades_tiempo_libre_individual: string
  actividades_tiempo_libre_grupal: string
  cambios_positivos_comportamiento: 'si' | 'no' | ''
  especifica_cambios_positivos: string
  consume_drogas: 'si' | 'no' | ''
  especifica_drogas: string
  tiene_pareja: 'si' | 'no' | ''
  tipo_relacion_pareja: string
  vida_sexual_activa: 'si' | 'no' | ''
  metodos_prevencion: 'siempre' | 'a_veces' | 'nunca' | ''
  explica_metodos_prevencion: string
  ha_cumplido_metas: 'si' | 'no' | ''
  explica_metas_cumplidas: string
  se_planteado_nuevas_metas: 'si' | 'no' | ''
  explica_nuevas_metas: string
  ha_participado_charlas: 'si' | 'no' | ''
  cuales_charlas: string
  aprendizajes_charlas: string
  temas_ampliar_seguimiento: string
  considera_aspectos_mejorar: 'si' | 'no' | ''
  explica_aspectos_mejorar: string
  
  // ÁREA FAMILIAR
  con_quien_convive: string
  relacion_personas_convive: 'buena' | 'regular' | 'mala' | ''
  explica_relacion_convive: string
  comunicacion_padres: 'buena' | 'regular' | 'mala' | ''
  explica_comunicacion_padres: string
  comunicacion_hermanos: 'buena' | 'regular' | 'mala' | ''
  explica_comunicacion_hermanos: string
  familia_apoyo_proceso: 'si' | 'no' | ''
  tipo_apoyo_familia: string
  familia_involucrada: 'si' | 'no' | ''
  explica_familia_involucrada: string
  funciones_hogar: string
  logros_familiares: 'si' | 'no' | ''
  explica_logros_familiares: string
  obstaculos_familiares: 'si' | 'no' | ''
  explica_obstaculos_familiares: string
  
  // ÁREA COMUNITARIA
  tiene_amigos_comunidad: 'si' | 'no' | ''
  ambito_comparte: string[]
  ambito_comparte_otro: string
  actividades_amigos: string
  actividades_colectivas_comunidad: 'si' | 'no' | ''
  explica_actividades_colectivas: string
  involucra_actividades_comunitarias: 'si' | 'no' | ''
  explica_involucramiento: string
  asiste_iglesia: 'si' | 'no' | ''
  cual_iglesia: string
  donde_iglesia: string
  desde_cuando_iglesia: string
  visita_domiciliaria: 'si' | 'no' | ''
  explica_visita_domiciliaria: string
  
  // ACTITUD HACIA EL CUMPLIMIENTO
  contribucion_programa: 'si' | 'no' | ''
  explica_contribucion: string
  autovaloracion: string
  
  // COMPROMISOS Y OBSERVACIONES
  compromisos_nnaj: string
  observaciones_generales: string
}

export default function EntrevistaEvaluacionSeguimientoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_nnaj: '',
    edad: 0,
    exp_interno: '',
    exp_judicial: '',
    nombre_responsable: '',
    parentesco: '',
    telefono: '',
    domicilio: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    trabajador_social: '',
    esta_estudiando: '',
    grado_cursa: '',
    institucion: '',
    modalidad: '',
    observaciones_estudio: '',
    esta_trabajando: '',
    detalle_trabajo: '',
    actividades_tiempo_libre_individual: '',
    actividades_tiempo_libre_grupal: '',
    cambios_positivos_comportamiento: '',
    especifica_cambios_positivos: '',
    consume_drogas: '',
    especifica_drogas: '',
    tiene_pareja: '',
    tipo_relacion_pareja: '',
    vida_sexual_activa: '',
    metodos_prevencion: '',
    explica_metodos_prevencion: '',
    ha_cumplido_metas: '',
    explica_metas_cumplidas: '',
    se_planteado_nuevas_metas: '',
    explica_nuevas_metas: '',
    ha_participado_charlas: '',
    cuales_charlas: '',
    aprendizajes_charlas: '',
    temas_ampliar_seguimiento: '',
    considera_aspectos_mejorar: '',
    explica_aspectos_mejorar: '',
    con_quien_convive: '',
    relacion_personas_convive: '',
    explica_relacion_convive: '',
    comunicacion_padres: '',
    explica_comunicacion_padres: '',
    comunicacion_hermanos: '',
    explica_comunicacion_hermanos: '',
    familia_apoyo_proceso: '',
    tipo_apoyo_familia: '',
    familia_involucrada: '',
    explica_familia_involucrada: '',
    funciones_hogar: '',
    logros_familiares: '',
    explica_logros_familiares: '',
    obstaculos_familiares: '',
    explica_obstaculos_familiares: '',
    tiene_amigos_comunidad: '',
    ambito_comparte: [],
    ambito_comparte_otro: '',
    actividades_amigos: '',
    actividades_colectivas_comunidad: '',
    explica_actividades_colectivas: '',
    involucra_actividades_comunitarias: '',
    explica_involucramiento: '',
    asiste_iglesia: '',
    cual_iglesia: '',
    donde_iglesia: '',
    desde_cuando_iglesia: '',
    visita_domiciliaria: '',
    explica_visita_domiciliaria: '',
    contribucion_programa: '',
    explica_contribucion: '',
    autovaloracion: '',
    compromisos_nnaj: '',
    observaciones_generales: ''
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
        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        exp_interno: joven.expediente_administrativo || '',
        exp_judicial: joven.expediente_judicial || ''
      }))
    }
  }

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[field] as string[]
      if (Array.isArray(current)) {
        return {
          ...prev,
          [field]: checked ? [...current, value] : current.filter(v => v !== value)
        }
      }
      return prev
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
          motivo: 'Entrevista Social de Evaluación y Seguimiento',
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

      // Preparar datos para la función stored procedure
      const datosJson = {
        ...formData,
        fecha_entrevista: formData.fecha_elaboracion,
        tipo_entrevista: 'seguimiento', // Por defecto seguimiento
        avances_observados: formData.autovaloracion,
        cambios_comportamiento: formData.especifica_cambios_positivos,
        cumplimiento_objetivos: formData.explica_metas_cumplidas,
        areas_mejora: formData.explica_aspectos_mejorar ? [formData.explica_aspectos_mejorar] : [],
        fortalezas_identificadas: formData.explica_logros_familiares ? [formData.explica_logros_familiares] : [],
        situacion_actual: formData.autovaloracion,
        necesidades_identificadas: formData.temas_ampliar_seguimiento ? [formData.temas_ampliar_seguimiento] : [],
        factores_protectores: [],
        factores_riesgo: formData.explica_obstaculos_familiares ? [formData.explica_obstaculos_familiares] : [],
        plan_accion: formData.compromisos_nnaj,
        compromisos: formData.compromisos_nnaj ? [formData.compromisos_nnaj] : [],
        metas_corto_plazo: [],
        metas_mediano_plazo: [],
        metas_largo_plazo: [],
        observaciones: formData.observaciones_generales,
        recomendaciones: ''
      }

      // Usar la función stored procedure
      const { error: formularioError } = await supabase
        .rpc('crear_formulario_trabajo_social', {
          p_tipo_formulario: 'entrevista_evaluacion_seguimiento',
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
            tipo_formulario: 'entrevista_evaluacion_seguimiento',
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
          const { error: entrevistaError } = await supabase
            .from('entrevistas_evaluacion_seguimiento')
            .insert({
              formulario_id: formularioData.id,
              joven_id: formData.joven_id,
              atencion_id: atencionId,
              trabajador_social: formData.trabajador_social,
              fecha_entrevista: formData.fecha_elaboracion,
              tipo_entrevista: 'seguimiento',
              avances_observados: formData.autovaloracion,
              cambios_comportamiento: formData.especifica_cambios_positivos,
              cumplimiento_objetivos: formData.explica_metas_cumplidas,
              areas_mejora: formData.explica_aspectos_mejorar ? [formData.explica_aspectos_mejorar] : [],
              fortalezas_identificadas: formData.explica_logros_familiares ? [formData.explica_logros_familiares] : [],
              situacion_actual: formData.autovaloracion,
              necesidades_identificadas: formData.temas_ampliar_seguimiento ? [formData.temas_ampliar_seguimiento] : [],
              factores_protectores: [],
              factores_riesgo: formData.explica_obstaculos_familiares ? [formData.explica_obstaculos_familiares] : [],
              plan_accion: formData.compromisos_nnaj,
              compromisos: formData.compromisos_nnaj ? [formData.compromisos_nnaj] : [],
              observaciones: formData.observaciones_generales,
              created_by: user.id
            })

          if (entrevistaError) {
            console.error('Error al guardar en entrevistas_evaluacion_seguimiento:', entrevistaError)
          }
        }
      }

      alert('Entrevista Social de Evaluación y Seguimiento guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la entrevista: ${error.message || 'Error desconocido'}`)
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
            Entrevista Social de Evaluación y Seguimiento
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
        <h5 className="text-lg font-bold mt-2">ENTREVISTA SOCIAL DE EVALUACIÓN Y SEGUIMIENTO</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DE NNAJ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regional
              </label>
              <input
                type="text"
                value={formData.regional}
                onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del NNAJ <span className="text-red-500">*</span>
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
              <input type="text" value={formData.nombre_nnaj} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Interno</label>
              <input type="text" value={formData.exp_interno} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Judicial</label>
              <input type="text" value={formData.exp_judicial} onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del responsable</label>
              <input type="text" value={formData.nombre_responsable} onChange={(e) => setFormData(prev => ({ ...prev, nombre_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parentesco</label>
              <input type="text" value={formData.parentesco} onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
              <input type="text" value={formData.domicilio} onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

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
              {errors.fecha_elaboracion && <p className="mt-1 text-sm text-red-600">{errors.fecha_elaboracion}</p>}
            </div>

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
              />
              {errors.trabajador_social && <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>}
            </div>
          </div>
        </div>

        {/* ÁREA INDIVIDUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ÁREA INDIVIDUAL</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Está estudiando actualmente?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="esta_estudiando" value="si" checked={formData.esta_estudiando === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, esta_estudiando: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="esta_estudiando" value="no" checked={formData.esta_estudiando === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, esta_estudiando: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.esta_estudiando === 'si' && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" value={formData.grado_cursa} onChange={(e) => setFormData(prev => ({ ...prev, grado_cursa: e.target.value }))} placeholder="Grado que cursa" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  <input type="text" value={formData.institucion} onChange={(e) => setFormData(prev => ({ ...prev, institucion: e.target.value }))} placeholder="Institución" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  <input type="text" value={formData.modalidad} onChange={(e) => setFormData(prev => ({ ...prev, modalidad: e.target.value }))} placeholder="Modalidad" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                </div>
              )}
              <textarea value={formData.observaciones_estudio} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_estudio: e.target.value }))} rows={2} placeholder="Observaciones" className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Está trabajando actualmente?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="esta_trabajando" value="si" checked={formData.esta_trabajando === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, esta_trabajando: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="esta_trabajando" value="no" checked={formData.esta_trabajando === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, esta_trabajando: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.detalle_trabajo} onChange={(e) => setFormData(prev => ({ ...prev, detalle_trabajo: e.target.value }))} rows={2} placeholder="Detalle" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detalle que actividades hace en su tiempo libre (Ocio)
              </label>
              <div className="space-y-2">
                <textarea value={formData.actividades_tiempo_libre_individual} onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre_individual: e.target.value }))} rows={2} placeholder="Individual" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                <textarea value={formData.actividades_tiempo_libre_grupal} onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre_grupal: e.target.value }))} rows={2} placeholder="Grupal" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Identifica cambios positivos en su comportamiento?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cambios_positivos" value="si" checked={formData.cambios_positivos_comportamiento === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, cambios_positivos_comportamiento: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cambios_positivos" value="no" checked={formData.cambios_positivos_comportamiento === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, cambios_positivos_comportamiento: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.especifica_cambios_positivos} onChange={(e) => setFormData(prev => ({ ...prev, especifica_cambios_positivos: e.target.value }))} rows={3} placeholder="Especifique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Consume algún tipo de droga o estupefaciente?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="consume_drogas" value="si" checked={formData.consume_drogas === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, consume_drogas: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="consume_drogas" value="no" checked={formData.consume_drogas === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, consume_drogas: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.especifica_drogas} onChange={(e) => setFormData(prev => ({ ...prev, especifica_drogas: e.target.value }))} rows={3} placeholder="Especifique qué tipo y con qué frecuencia lo hace" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Actualmente tiene pareja?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tiene_pareja" value="si" checked={formData.tiene_pareja === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, tiene_pareja: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tiene_pareja" value="no" checked={formData.tiene_pareja === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, tiene_pareja: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.tipo_relacion_pareja} onChange={(e) => setFormData(prev => ({ ...prev, tipo_relacion_pareja: e.target.value }))} rows={2} placeholder="Detalle que tipo de relación tiene" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Tiene una vida sexual activa?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="vida_sexual" value="si" checked={formData.vida_sexual_activa === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, vida_sexual_activa: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="vida_sexual" value="no" checked={formData.vida_sexual_activa === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, vida_sexual_activa: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.vida_sexual_activa === 'si' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">
                    Utiliza métodos de prevención (ITS, VIH y Embarazos no deseados)
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="metodos_prevencion" value="siempre" checked={formData.metodos_prevencion === 'siempre'} onChange={(e) => setFormData(prev => ({ ...prev, metodos_prevencion: e.target.value as any }))} className="w-4 h-4" />
                      <span>Siempre</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="metodos_prevencion" value="a_veces" checked={formData.metodos_prevencion === 'a_veces'} onChange={(e) => setFormData(prev => ({ ...prev, metodos_prevencion: e.target.value as any }))} className="w-4 h-4" />
                      <span>A veces</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="metodos_prevencion" value="nunca" checked={formData.metodos_prevencion === 'nunca'} onChange={(e) => setFormData(prev => ({ ...prev, metodos_prevencion: e.target.value as any }))} className="w-4 h-4" />
                      <span>Nunca</span>
                    </label>
                  </div>
                  <textarea value={formData.explica_metodos_prevencion} onChange={(e) => setFormData(prev => ({ ...prev, explica_metodos_prevencion: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durante el tiempo que lleva en su medida ¿Ha logrado cumplir alguna meta u objetivo?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ha_cumplido_metas" value="si" checked={formData.ha_cumplido_metas === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, ha_cumplido_metas: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ha_cumplido_metas" value="no" checked={formData.ha_cumplido_metas === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, ha_cumplido_metas: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_metas_cumplidas} onChange={(e) => setFormData(prev => ({ ...prev, explica_metas_cumplidas: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Se ha planteado nuevas metas u objetivos?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="nuevas_metas" value="si" checked={formData.se_planteado_nuevas_metas === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, se_planteado_nuevas_metas: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="nuevas_metas" value="no" checked={formData.se_planteado_nuevas_metas === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, se_planteado_nuevas_metas: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_nuevas_metas} onChange={(e) => setFormData(prev => ({ ...prev, explica_nuevas_metas: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha participado en alguna charla, taller o consejería?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ha_participado_charlas" value="si" checked={formData.ha_participado_charlas === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, ha_participado_charlas: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ha_participado_charlas" value="no" checked={formData.ha_participado_charlas === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, ha_participado_charlas: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.cuales_charlas} onChange={(e) => setFormData(prev => ({ ...prev, cuales_charlas: e.target.value }))} rows={2} placeholder="¿En cuáles?" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué aprendizajes ha adquirido en esas charlas, talleres o consejerías?
              </label>
              <textarea value={formData.aprendizajes_charlas} onChange={(e) => setFormData(prev => ({ ...prev, aprendizajes_charlas: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué temas le gustaría ampliar en el próximo seguimiento?
              </label>
              <textarea value={formData.temas_ampliar_seguimiento} onChange={(e) => setFormData(prev => ({ ...prev, temas_ampliar_seguimiento: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Considera algún aspecto en su vida que debe mejorar?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="aspectos_mejorar" value="si" checked={formData.considera_aspectos_mejorar === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, considera_aspectos_mejorar: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="aspectos_mejorar" value="no" checked={formData.considera_aspectos_mejorar === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, considera_aspectos_mejorar: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_aspectos_mejorar} onChange={(e) => setFormData(prev => ({ ...prev, explica_aspectos_mejorar: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* ÁREA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ÁREA FAMILIAR</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Con quién/es convive actualmente?
              </label>
              <textarea value={formData.con_quien_convive} onChange={(e) => setFormData(prev => ({ ...prev, con_quien_convive: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la relación con las personas que convive?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="relacion_convive" value="buena" checked={formData.relacion_personas_convive === 'buena'} onChange={(e) => setFormData(prev => ({ ...prev, relacion_personas_convive: e.target.value as any }))} className="w-4 h-4" />
                  <span>Buena</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="relacion_convive" value="regular" checked={formData.relacion_personas_convive === 'regular'} onChange={(e) => setFormData(prev => ({ ...prev, relacion_personas_convive: e.target.value as any }))} className="w-4 h-4" />
                  <span>Regular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="relacion_convive" value="mala" checked={formData.relacion_personas_convive === 'mala'} onChange={(e) => setFormData(prev => ({ ...prev, relacion_personas_convive: e.target.value as any }))} className="w-4 h-4" />
                  <span>Mala</span>
                </label>
              </div>
              <textarea value={formData.explica_relacion_convive} onChange={(e) => setFormData(prev => ({ ...prev, explica_relacion_convive: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la comunicación con sus padres o representantes legales?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_padres" value="buena" checked={formData.comunicacion_padres === 'buena'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_padres: e.target.value as any }))} className="w-4 h-4" />
                  <span>Buena</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_padres" value="regular" checked={formData.comunicacion_padres === 'regular'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_padres: e.target.value as any }))} className="w-4 h-4" />
                  <span>Regular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_padres" value="mala" checked={formData.comunicacion_padres === 'mala'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_padres: e.target.value as any }))} className="w-4 h-4" />
                  <span>Mala</span>
                </label>
              </div>
              <textarea value={formData.explica_comunicacion_padres} onChange={(e) => setFormData(prev => ({ ...prev, explica_comunicacion_padres: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la comunicación con sus hermanos y demás familiares?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_hermanos" value="buena" checked={formData.comunicacion_hermanos === 'buena'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_hermanos: e.target.value as any }))} className="w-4 h-4" />
                  <span>Buena</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_hermanos" value="regular" checked={formData.comunicacion_hermanos === 'regular'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_hermanos: e.target.value as any }))} className="w-4 h-4" />
                  <span>Regular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="comunicacion_hermanos" value="mala" checked={formData.comunicacion_hermanos === 'mala'} onChange={(e) => setFormData(prev => ({ ...prev, comunicacion_hermanos: e.target.value as any }))} className="w-4 h-4" />
                  <span>Mala</span>
                </label>
              </div>
              <textarea value={formData.explica_comunicacion_hermanos} onChange={(e) => setFormData(prev => ({ ...prev, explica_comunicacion_hermanos: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Su familia le ha apoyado en su proceso actual?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="familia_apoyo" value="si" checked={formData.familia_apoyo_proceso === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, familia_apoyo_proceso: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="familia_apoyo" value="no" checked={formData.familia_apoyo_proceso === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, familia_apoyo_proceso: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.tipo_apoyo_familia} onChange={(e) => setFormData(prev => ({ ...prev, tipo_apoyo_familia: e.target.value }))} rows={2} placeholder="Explique qué tipo de apoyo" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Se ha involucrado su familia en el proceso?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="familia_involucrada" value="si" checked={formData.familia_involucrada === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, familia_involucrada: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="familia_involucrada" value="no" checked={formData.familia_involucrada === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, familia_involucrada: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_familia_involucrada} onChange={(e) => setFormData(prev => ({ ...prev, explica_familia_involucrada: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué funciones desempeña en su hogar?
              </label>
              <textarea value={formData.funciones_hogar} onChange={(e) => setFormData(prev => ({ ...prev, funciones_hogar: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Identifican logros familiares en el proceso evolutivo actual?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="logros_familiares" value="si" checked={formData.logros_familiares === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, logros_familiares: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="logros_familiares" value="no" checked={formData.logros_familiares === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, logros_familiares: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_logros_familiares} onChange={(e) => setFormData(prev => ({ ...prev, explica_logros_familiares: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Identifican obstáculos familiares en el proceso evolutivo actual?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="obstaculos_familiares" value="si" checked={formData.obstaculos_familiares === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, obstaculos_familiares: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="obstaculos_familiares" value="no" checked={formData.obstaculos_familiares === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, obstaculos_familiares: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_obstaculos_familiares} onChange={(e) => setFormData(prev => ({ ...prev, explica_obstaculos_familiares: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* ÁREA COMUNITARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ÁREA COMUNITARIA</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Tiene amigos/as de su comunidad?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tiene_amigos" value="si" checked={formData.tiene_amigos_comunidad === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, tiene_amigos_comunidad: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tiene_amigos" value="no" checked={formData.tiene_amigos_comunidad === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, tiene_amigos_comunidad: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.tiene_amigos_comunidad === 'si' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-2">
                    ¿En qué ámbito comparte con ellos/as?
                  </label>
                  <div className="flex flex-wrap gap-4 mb-2">
                    {['Escuela', 'Trabajo', 'Iglesia', 'Barrio o colonia'].map((opcion) => (
                      <label key={opcion} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.ambito_comparte.includes(opcion)}
                          onChange={(e) => handleCheckboxChange('ambito_comparte', opcion, e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div>
                  <input type="text" value={formData.ambito_comparte_otro} onChange={(e) => setFormData(prev => ({ ...prev, ambito_comparte_otro: e.target.value }))} placeholder="Otro (Explique)" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  <textarea value={formData.actividades_amigos} onChange={(e) => setFormData(prev => ({ ...prev, actividades_amigos: e.target.value }))} rows={2} placeholder="¿Qué actividades hace con sus amigos? Explique" className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Hay actividades colectivas en su comunidad? (Patronato, junta de agua, grupo de vecinos, etc.)
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="actividades_colectivas" value="si" checked={formData.actividades_colectivas_comunidad === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, actividades_colectivas_comunidad: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="actividades_colectivas" value="no" checked={formData.actividades_colectivas_comunidad === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, actividades_colectivas_comunidad: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_actividades_colectivas} onChange={(e) => setFormData(prev => ({ ...prev, explica_actividades_colectivas: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Se involucra en las actividades comunitarias?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="involucra_comunitarias" value="si" checked={formData.involucra_actividades_comunitarias === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, involucra_actividades_comunitarias: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="involucra_comunitarias" value="no" checked={formData.involucra_actividades_comunitarias === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, involucra_actividades_comunitarias: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_involucramiento} onChange={(e) => setFormData(prev => ({ ...prev, explica_involucramiento: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Asiste a la iglesia?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="asiste_iglesia" value="si" checked={formData.asiste_iglesia === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, asiste_iglesia: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="asiste_iglesia" value="no" checked={formData.asiste_iglesia === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, asiste_iglesia: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.asiste_iglesia === 'si' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <input type="text" value={formData.cual_iglesia} onChange={(e) => setFormData(prev => ({ ...prev, cual_iglesia: e.target.value }))} placeholder="¿Cuál?" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  <input type="text" value={formData.donde_iglesia} onChange={(e) => setFormData(prev => ({ ...prev, donde_iglesia: e.target.value }))} placeholder="¿Dónde?" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                  <input type="text" value={formData.desde_cuando_iglesia} onChange={(e) => setFormData(prev => ({ ...prev, desde_cuando_iglesia: e.target.value }))} placeholder="¿Desde cuándo?" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Se ha realizado visita domiciliaria?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visita_domiciliaria" value="si" checked={formData.visita_domiciliaria === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, visita_domiciliaria: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="visita_domiciliaria" value="no" checked={formData.visita_domiciliaria === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, visita_domiciliaria: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_visita_domiciliaria} onChange={(e) => setFormData(prev => ({ ...prev, explica_visita_domiciliaria: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* ACTITUD HACIA EL CUMPLIMIENTO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En qué le ha contribuido la atención que le está brindando el programa en el cumplimiento de su medida?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="contribucion_programa" value="si" checked={formData.contribucion_programa === 'si'} onChange={(e) => setFormData(prev => ({ ...prev, contribucion_programa: e.target.value as any }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="contribucion_programa" value="no" checked={formData.contribucion_programa === 'no'} onChange={(e) => setFormData(prev => ({ ...prev, contribucion_programa: e.target.value as any }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_contribucion} onChange={(e) => setFormData(prev => ({ ...prev, explica_contribucion: e.target.value }))} rows={3} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Autovaloración (NNAJ relata su autopercepción sobre avances y aspectos de mejora)
              </label>
              <textarea value={formData.autovaloracion} onChange={(e) => setFormData(prev => ({ ...prev, autovaloracion: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* COMPROMISOS Y OBSERVACIONES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">COMPROMISOS Y OBSERVACIONES</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                COMPROMISOS ADQUIRIDOS POR NNAJ
              </label>
              <textarea value={formData.compromisos_nnaj} onChange={(e) => setFormData(prev => ({ ...prev, compromisos_nnaj: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                OBSERVACIONES GENERALES
              </label>
              <textarea value={formData.observaciones_generales} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_generales: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white" />
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
            {saving ? 'Guardando...' : 'Guardar Entrevista'}
          </button>
        </div>
      </form>
    </div>
  )
}

