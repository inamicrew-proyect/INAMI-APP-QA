'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  getUltimoFormulario, 
  saveOrUpdateFormulario,
  TIPOS_FORMULARIOS 
} from '@/lib/formularios-psicologicos'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformePsicodiagnosticoCPIPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Header Section
    nombre_cpi: '',
    direccion_cpi: '',
    psicologo_informe: '',
    fecha_informe: '',
    
    // I. Datos Identificativos Personales, Judiciales y Familiares
    joven_id: jovenId || '',
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    grado_escolaridad_ocupacion: '',
    fecha_ingreso_cpi: '',
    juzgado_remitente: '',
    numero_expediente: '',
    motivo_ingreso: '',
    medida_judicial_aplicada: '',
    familiares_adultos_referencia: '',
    
    // II. Motivo de Consulta
    motivo_consulta: '',
    
    // III. Antecedentes y Situación Actual
    antecedentes_situacion_actual: '',
    
    // IV. Fase Evaluativa
    procedimientos_instrumentos_evaluacion: '',
    
    // V. Impresión Diagnóstica
    impresion_diagnostica: '',
    caso_posible_teaf: '',
    
    // VI. Pronóstico
    pronostico: '',
    
    // VII. Derivación individual o familiar
    derivacion_instituciones: '',
    
    // VIII. Objetivos de la intervención Psicológica
    objetivos_intervencion: '',
    
    // IX. Plan de Intervención
    plan_intervencion: '',
    
    // X. Recomendaciones
    recomendaciones: '',
    
    // Firma
    nombre_firma_psicologo: '',
    numero_colegiado: ''
  })

  useEffect(() => {
    if (jovenId) {
      loadData()
    }
  }, [jovenId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos del joven
      const { data: jovenData, error: jovenError } = await supabase
        .from('jovenes')
        .select(`
          *,
          centros!inner(nombre)
        `)
        .eq('id', jovenId)
        .single()

      if (jovenError) throw jovenError

      // Cargar formulario existente si existe
      const formularioExistente = await getUltimoFormulario(
        jovenId,
        TIPOS_FORMULARIOS.INFORME_PSICODIAGNOSTICO_CPI
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_apellidos: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_informe: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          fecha_ingreso_cpi: jovenData.fecha_ingreso || '',
          numero_expediente: jovenData.numero_expediente_judicial || ''
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          const datosCargados = formularioExistente.datos_json as any
          setFormData({
            ...datosIniciales,
            ...datosCargados,
            joven_id: formularioExistente.joven_id || jovenId || ''
          })
        } else {
          setFormData(prev => ({
            ...prev,
            ...datosIniciales,
            joven_id: jovenId || prev.joven_id || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      console.log('FormData completo:', formData)
      console.log('joven_id en formData:', formData.joven_id)
      console.log('Tipo de joven_id:', typeof formData.joven_id)
      
      // Validar que se haya seleccionado un joven
      if (!formData.joven_id) {
        console.error('Error: joven_id no está definido en formData')
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre y apellidos" es obligatorio.')
        setSaving(false)
        return
      }

      // Convertir joven_id a string si es necesario
      const joven_id = String(formData.joven_id).trim()
      
      if (joven_id === '' || joven_id === 'undefined' || joven_id === 'null') {
        console.error('Error: joven_id está vacío o inválido:', joven_id)
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre y apellidos" es obligatorio.')
        setSaving(false)
        return
      }

      // Validar que el tipo de formulario esté definido
      const tipoFormulario = TIPOS_FORMULARIOS.INFORME_PSICODIAGNOSTICO_CPI
      if (!tipoFormulario) {
        alert('Error: Tipo de formulario no definido')
        setSaving(false)
        return
      }
      
      // Extraer joven_id del formData para no incluirlo en datos_json
      const { joven_id: _, ...datosFormulario } = formData
      
      // Preparar los datos del formulario
      const datosJson = {
        ...datosFormulario
      }

      // Validar que haya datos para guardar
      if (Object.keys(datosJson).length === 0) {
        alert('Error: No hay datos para guardar')
        setSaving(false)
        return
      }

      console.log('Guardando formulario:', {
        joven_id,
        tipo_formulario: tipoFormulario,
        datos_keys: Object.keys(datosJson),
        joven_id_type: typeof joven_id,
        joven_id_length: joven_id.length
      })
      
      await saveOrUpdateFormulario(
        joven_id,
        tipoFormulario,
        datosJson
      )
      
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${joven_id}/expediente`)
    } catch (error: any) {
      console.error('Error saving form:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      })
      alert(error.message || 'Error al guardar el formulario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary p-2"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              INFORME PSICODIAGNÓSTICO
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              CENTROS PEDAGÓGICOS DE INTERNAMIENTO (CPI)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre CPI
                </label>
                <input
                  type="text"
                  name="nombre_cpi"
                  value={formData.nombre_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion_cpi"
                  value={formData.direccion_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Psicólogo/a que realiza el Informe *
                </label>
                <input
                  type="text"
                  name="psicologo_informe"
                  value={formData.psicologo_informe}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Informe *
                </label>
                <input
                  type="date"
                  name="fecha_informe"
                  value={formData.fecha_informe}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* I. Datos Identificativos Personales, Judiciales y Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Identificativos Personales, Judiciales y Familiares
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <JovenSearchInput
                    value={formData.nombre_apellidos}
                    onChange={(value) => setFormData(prev => ({ ...prev, nombre_apellidos: value }))}
                    onJovenSelect={(joven) => {
                      console.log('Joven seleccionado:', joven)
                      if (joven && joven.id) {
                        console.log('Estableciendo joven_id:', joven.id)
                        setFormData(prev => ({
                          ...prev,
                          joven_id: joven.id,
                          nombre_apellidos: `${joven.nombres} ${joven.apellidos}`,
                          edad: joven.edad?.toString() || prev.edad,
                          lugar_fecha_nacimiento: joven.fecha_nacimiento 
                            ? `${joven.lugar_nacimiento || ''}, ${new Date(joven.fecha_nacimiento).toLocaleDateString('es-HN')}`
                            : prev.lugar_fecha_nacimiento,
                          fecha_ingreso_cpi: joven.fecha_ingreso || prev.fecha_ingreso_cpi,
                          numero_expediente: joven.expediente_judicial || prev.numero_expediente
                        }))
                        console.log('joven_id establecido en formData')
                      } else {
                        console.warn('Joven seleccionado sin ID:', joven)
                      }
                    }}
                    label="Nombre y apellidos"
                    required
                    placeholder="Buscar joven por nombre..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lugar y fecha de nacimiento
                  </label>
                  <input
                    type="text"
                    name="lugar_fecha_nacimiento"
                    value={formData.lugar_fecha_nacimiento}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Tegucigalpa, 15/03/2005"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Edad
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grado de Escolaridad/Ocupación
                  </label>
                  <input
                    type="text"
                    name="grado_escolaridad_ocupacion"
                    value={formData.grado_escolaridad_ocupacion}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Ingreso en el CPI
                  </label>
                  <input
                    type="date"
                    name="fecha_ingreso_cpi"
                    value={formData.fecha_ingreso_cpi}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Juzgado Remitente
                  </label>
                  <input
                    type="text"
                    name="juzgado_remitente"
                    value={formData.juzgado_remitente}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nº de Expediente
                  </label>
                  <input
                    type="text"
                    name="numero_expediente"
                    value={formData.numero_expediente}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo del ingreso
                  </label>
                  <input
                    type="text"
                    name="motivo_ingreso"
                    value={formData.motivo_ingreso}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medida Judicial Aplicada
                  </label>
                  <input
                    type="text"
                    name="medida_judicial_aplicada"
                    value={formData.medida_judicial_aplicada}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Familiar/es o Adultos/as de Referencia a su cargo
                </label>
                <input
                  type="text"
                  name="familiares_adultos_referencia"
                  value={formData.familiares_adultos_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* II. Motivo de Consulta */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Motivo de Consulta
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: ¿Existe o no demanda de intervención individual y/o familiar?, incluir la valoración de las necesidades de intervención detectadas
            </p>
            <textarea
              name="motivo_consulta"
              value={formData.motivo_consulta}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa el motivo de consulta..."
            />
          </div>

          {/* III. Antecedentes y Situación Actual */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Antecedentes y Situación Actual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: (Breve resumen de la información recopilada en la historia clínica y/o entrevistas iniciales individuales y familiares relativa a el/la adolescente o joven en cuanto a su desarrollo y grado de adaptación emocional, conductual, cognitivo, escolar, familiar, social, vínculos afectivos y estilos de apego establecidos, problemáticas previas presentadas en relación a estos aspectos, etc. Comportamientos delictuales actuales y previos, causas que hayan influido en los mismos. Padecimiento de enfermedades físicas, mentales, trastorno del comportamiento o el estado de ánimo, etc. Toma de medicación. Dinámica familiar, estructura familiar, roles desempeñados, tipo de relaciones vinculares y afectivas mantenidas, conflictos familiares y de convivencia, comportamientos delictuales o infractores en otros miembros de la familia u otras problemáticas del grupo familiar o de sus miembros: violencia intrafamiliar, pertenencia a maras o pandillas, abuso sexual, consumo de drogas, etc., nivel sociocultural y económico de la familia, adaptación e integración social familiar. Factores protectores ante la reincidencia, individuales, familiares, comunitarios y sociales).
            </p>
            <textarea
              name="antecedentes_situacion_actual"
              value={formData.antecedentes_situacion_actual}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa los antecedentes y situación actual..."
            />
          </div>

          {/* IV. Fase Evaluativa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Fase Evaluativa
            </h3>
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
              Procedimientos/Instrumentos de Evaluación:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Nombrar y describir brevemente la batería de pruebas aplicadas y los aspectos que miden. Incluir los resultados y conclusiones relativas a los aspectos emocionales, conductuales, de personalidad, inteligencia, psicosociales, familiares y conductas infractoras, etc. explorados a través de estos instrumentos (por áreas), así como el comportamiento y actitud mostrada por el/la adolescente o joven durante la aplicación de los instrumentos de evaluación. Indicar fecha/s de aplicación de las pruebas. Si se mantuvieron reuniones, entrevistas o coordinaciones con diferentes servicios y/o recursos para obtener información sobre el/la adolescente o joven y/o su familia, como parte de la evaluación inicial, deben mencionarse en este apartado.
            </p>
            <textarea
              name="procedimientos_instrumentos_evaluacion"
              value={formData.procedimientos_instrumentos_evaluacion}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa los procedimientos e instrumentos de evaluación..."
            />
          </div>

          {/* V. Impresión Diagnóstica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Impresión Diagnóstica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              (Ejemplo): Brindar una explicación psicológica que permita comprender las causas individualizadas del comportamiento infractor o delictivo de el/la adolescente o joven, las principales variables psicosociales que influencian el mismo, así como otras problemáticas psicológicas de importancia que pudiera presentar y los factores de riesgo y los factores resilientes o de protección individuales, familiares y ambientales ante la reincidencia. Debe incluirse en el diagnóstico, el padecimiento de trastornos psicológicos, anímicos, de personalidad, comportamiento, etc., detectados a través de la evaluación.
            </p>
            <textarea
              name="impresion_diagnostica"
              value={formData.impresion_diagnostica}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la impresión diagnóstica..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agregar si existe un caso con posible Trastorno del espectro alcohólico fetal (TEAF)
              </label>
              <textarea
                name="caso_posible_teaf"
                value={formData.caso_posible_teaf}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Describa si existe un caso con posible TEAF..."
              />
            </div>
          </div>

          {/* VI. Pronóstico */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Pronóstico
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              (Ejemplo): Descripción de la probabilidad de volver a incurrir en comportamientos infractores, y en el caso de recibir o no recibir una intervención psicológica individual y familiar e intervención transversal y en red con diferentes profesionales y/o recursos.
            </p>
            <textarea
              name="pronostico"
              value={formData.pronostico}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa el pronóstico..."
            />
          </div>

          {/* VII. Derivación individual o familiar */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Derivación individual o familiar a Instituciones Prestadoras de Servicios u otros Recursos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              (Ejemplo): Se realizará en el caso de haberse encontrado necesario, de acuerdo a los resultados de la evaluación, especificando la necesidad de atenciones psicológicas o psiquiátricas especializadas y describiendo los motivos.
            </p>
            <textarea
              name="derivacion_instituciones"
              value={formData.derivacion_instituciones}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la derivación si aplica..."
            />
          </div>

          {/* VIII. Objetivos de la intervención Psicológica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VIII. Objetivos de la intervención Psicológica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              (Ejemplo): Objetivos generales y específicos de la intervención psicológica individual y familiar a realizar.
            </p>
            <textarea
              name="objetivos_intervencion"
              value={formData.objetivos_intervencion}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa los objetivos de la intervención..."
            />
          </div>

          {/* IX. Plan de Intervención */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IX. Plan de Intervención
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Tipo de intervenciones, programas o actividades en las que participará el/la adolescente o joven y su familia. Periodización de las mismas.
            </p>
            <textarea
              name="plan_intervencion"
              value={formData.plan_intervencion}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa el plan de intervención..."
            />
          </div>

          {/* X. Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              X. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: En relación a las intervenciones a realizar desde las distintas áreas de atención, elaboración del PLATÍN, toma de decisiones judiciales y en relación a las medidas impuestas, etc.
            </p>
            <textarea
              name="recomendaciones"
              value={formData.recomendaciones}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa las recomendaciones..."
            />
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firma y Sello</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firma y sello de el/la psicólogo/a
                </label>
                <input
                  type="text"
                  name="nombre_firma_psicologo"
                  value={formData.nombre_firma_psicologo}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nº Colegiado/a
                </label>
                <input
                  type="text"
                  name="numero_colegiado"
                  value={formData.numero_colegiado}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
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
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Formulario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

