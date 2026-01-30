'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EntrevistaInicialFamiliaPage() {
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
    psicologo_entrevista: '',
    fecha_entrevista: '',
    
    // I. Datos Familiares
    nombre_apellidos_nnaj: '',
    partida_nacimiento: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    madre_padre_familiar_referencia: '',
    direcciones: '',
    telefonos: '',
    
    // II. Relaciones Familiares
    relacion_hijo_miembros_familia: '',
    problemas_conyugales_familiares: '',
    separacion_familiar_temprana: '',
    
    // III. Antecedentes y Estado Clínico Actual
    padece_enfermedad_hijo: '',
    ha_recibido_tratamiento_hijo: '',
    familia_enfermedad_tratamiento: '',
    consumo_drogas_familia: '',
    consumo_drogas_detalle: '',
    
    // IV. Datos del Desarrollo
    embarazo_deseado_planificado: '',
    hubo_abortos: '',
    como_fue_embarazo: '',
    como_fue_parto: '',
    consumo_sustancias_embarazo: '',
    lactancia_materna_artificial: '',
    desarrollo_psicomotor: '',
    enuresis_encopresis: '',
    problemas_sueno: '',
    edad_comenzo_hablar: '',
    hablo_claro_desde_principio: '',
    adquiere_conocimientos_normalidad: '',
    hijo_escolarizado: '',
    edad_comenzo_escuela: '',
    asistia_regularmente_escuela: '',
    cambios_centros_escolares: '',
    ha_repetido_grado: '',
    ha_habido_desercion_escolar: '',
    rendimiento_colegio: '',
    comportamiento_escuela: '',
    relacion_companeros_profesores: '',
    
    // Desarrollo Socio-Emocional y Afectivo
    como_describen_caracter_hijo: '',
    con_que_padre_se_lleva_mejor: '',
    tiene_muchos_amigos: '',
    le_cuesta_hacer_conservar_amigos: '',
    amistades_buena_mala_influencia: '',
    que_cosas_le_gusta_jugar: '',
    como_expresa_afecto_hacia_demas: '',
    como_expresan_afecto_hacia_hijo: '',
    ofrece_ayuda_cuando_alguien_preocupado: '',
    preocupaciones_problemas_hijo: '',
    cuenta_personas_ayuden_apoyen: '',
    como_se_comporta_situaciones_dificiles: '',
    mayores_virtudes_defectos_hijo: '',
    
    // Desarrollo y Relaciones Afectivo-Sexuales
    ha_tenido_tiene_pareja_hijo: '',
    historia_hechos_sexuales: '',
    
    // V. Educación en Casa
    que_normas_se_pide_cumplir: '',
    como_consiguen_que_hijo_haga_lo_piden: '',
    
    // VI. Hábitos personales
    responsable_cumplimiento_horarios: '',
    
    // VII. Antecedentes y Situación Jurídica Actual
    habia_tenido_problemas_justicia: '',
    otros_familiares_problemas_justicia: '',
    como_reaccionaron_hechos_ingreso: '',
    que_consideran_causo_conducta_infractora: '',
    
    // VIII. Expectativas
    expectativas_intervencion: '',
    
    // IX. Observaciones
    observaciones: '',
    
    // X. Conclusiones
    conclusiones: '',
    
    // Firma
    nombre_firma_psicologo: '',
    colegiacion: ''
  })

  useEffect(() => {
    if (jovenId) {
      loadJovenData()
    }
  }, [jovenId])

  const loadJovenData = async () => {
    try {
      setLoading(true)
      const { data: jovenData, error } = await supabase
        .from('jovenes')
        .select(`
          *,
          centros!inner(nombre)
        `)
        .eq('id', jovenId)
        .single()

      if (error) throw error

      if (jovenData) {
        setFormData(prev => ({
          ...prev,
          nombre_apellidos_nnaj: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_entrevista: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : ''
        }))
      }
    } catch (error) {
      console.error('Error loading joven:', error)
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
      const { error } = await supabase
        .from('formularios_psicologicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'entrevista_inicial_familia_cpi',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])
      if (error) throw error
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar el formulario')
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
              ENTREVISTA PSICOLÓGICA INICIAL
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              MADRES/PADRES/U OTRO/A FAMILIAR DE REFERENCIA O ENCARGADO/A DE EL/LA ADOLESCENTE O JOVEN
            </p>
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
                  Nombre del CPI
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
                  Dirección del CPI
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
                  Psicólogo/a que realiza la Entrevista *
                </label>
                <input
                  type="text"
                  name="psicologo_entrevista"
                  value={formData.psicologo_entrevista}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de la Entrevista *
                </label>
                <input
                  type="date"
                  name="fecha_entrevista"
                  value={formData.fecha_entrevista}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* I. Datos Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre y apellidos del NNAJ *
                </label>
                <input
                  type="text"
                  name="nombre_apellidos_nnaj"
                  value={formData.nombre_apellidos_nnaj}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Partida de Nacimiento
                </label>
                <input
                  type="text"
                  name="partida_nacimiento"
                  value={formData.partida_nacimiento}
                  onChange={handleChange}
                  className="input-field"
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
                  Madre y padre y/o familiar/es o adultos/as de Referencia a su cargo
                </label>
                <input
                  type="text"
                  name="madre_padre_familiar_referencia"
                  value={formData.madre_padre_familiar_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección/es
                </label>
                <input
                  type="text"
                  name="direcciones"
                  value={formData.direcciones}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono/s
                </label>
                <input
                  type="text"
                  name="telefonos"
                  value={formData.telefonos}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* II. Relaciones Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Relaciones Familiares
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describirían la relación de su hijo/a con cada uno de los miembros de su familia?
                </label>
                <textarea
                  name="relacion_hijo_miembros_familia"
                  value={formData.relacion_hijo_miembros_familia}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la relación con cada miembro de la familia..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Problemas conyugales y/o problemas familiares presentes? En caso de ser así, ha presenciado su hijo/a con frecuencia discusiones entre sus progenitores o familiares?
                </label>
                <textarea
                  name="problemas_conyugales_familiares"
                  value={formData.problemas_conyugales_familiares}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los problemas conyugales y familiares..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha sufrido su hijo/a alguna separación familiar temprana?
                </label>
                <textarea
                  name="separacion_familiar_temprana"
                  value={formData.separacion_familiar_temprana}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la separación familiar temprana si aplica..."
                />
              </div>
            </div>
          </div>

          {/* III. Antecedentes y Estado Clínico Actual */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Antecedentes y Estado Clínico Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Padece o ha padecido su hijo/a alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? ¿O ha tenido algún otro tipo de problema médico o de salud? (accidentes, intervenciones quirúrgicas, etc.) De ser así, descríbalos brevemente.
                </label>
                <textarea
                  name="padece_enfermedad_hijo"
                  value={formData.padece_enfermedad_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las enfermedades y problemas de salud..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha recibido o recibe algún tipo de tratamiento médico (farmacológico), psicológico o psiquiátrico por ello? (en caso de ser así, describir brevemente e indicar durante cuánto tiempo ha recibido el tratamiento, Por Qué motivo/s y si el mismo, le fue o le es de ayuda y en qué sentido.
                </label>
                <textarea
                  name="ha_recibido_tratamiento_hijo"
                  value={formData.ha_recibido_tratamiento_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los tratamientos recibidos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Algún miembro de la familia ha padecido o padece de alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? De ser así, indiquen cual/es y si recibe o ha recibido algún tipo de tratamiento médico (farmacológico), psicológico o psiquiátrico por ello?
                </label>
                <textarea
                  name="familia_enfermedad_tratamiento"
                  value={formData.familia_enfermedad_tratamiento}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las enfermedades familiares..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Su hijo/a o algún miembro de la familia consume o ha consumido algún tipo de sustancia tóxica o drogas?, ¿han recibido algún tipo de ayuda o tratamiento médico (farmacológico), psicológico o psiquiátrico por ello? ¿De qué tipo?, les ha sido de ayuda?
                </label>
                <textarea
                  name="consumo_drogas_familia"
                  value={formData.consumo_drogas_familia}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa el consumo de drogas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  - En el caso de consumir su hijo/a o alguno/a de sus familiares sustancias tóxicas o drogas, a qué edad se inició el consumo, porque motivos, indiquen si consideran que presentan un problema de dependencia hacia estas sustancias, etc.
                </label>
                <textarea
                  name="consumo_drogas_detalle"
                  value={formData.consumo_drogas_detalle}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa los detalles del consumo..."
                />
              </div>
            </div>
          </div>

          {/* IV. Datos del Desarrollo */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Datos del Desarrollo
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">• Embarazo y Parto:</h4>
                <div className="space-y-4 ml-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Fue un embarazo deseado/planificado?
                    </label>
                    <textarea
                      name="embarazo_deseado_planificado"
                      value={formData.embarazo_deseado_planificado}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa si el embarazo fue deseado/planificado..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hubo abortos antes o después del nacimiento de su hijo/a?
                    </label>
                    <textarea
                      name="hubo_abortos"
                      value={formData.hubo_abortos}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa si hubo abortos..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Cómo fue el embarazo? ¿Duración? (hemorragias, depresión, náuseas, reposo...etc.).
                    </label>
                    <textarea
                      name="como_fue_embarazo"
                      value={formData.como_fue_embarazo}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa cómo fue el embarazo..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Cómo fue el parto? (prematuro, a término, prolongado, fórceps, cesárea, anoxia, problemas con el cordón umbilical, incubadora...etc.).
                    </label>
                    <textarea
                      name="como_fue_parto"
                      value={formData.como_fue_parto}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa cómo fue el parto..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Durante el embarazo consumió algún tipo de sustancias? En caso de ser así/ Qué tipo? (Investigar sobre TEAF)
                    </label>
                    <textarea
                      name="consumo_sustancias_embarazo"
                      value={formData.consumo_sustancias_embarazo}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa el consumo de sustancias durante el embarazo..."
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Alimentación:</h4>
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿La lactancia fue materna o artificial?
                  </label>
                  <textarea
                    name="lactancia_materna_artificial"
                    value={formData.lactancia_materna_artificial}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa el tipo de lactancia..."
                  />
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Desarrollo Psicomotor:</h4>
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    EJEMPLO: ¿A qué edad se mantenía sentado/a? ¿A qué edad comenzó a caminar? ¿Ha tenido alguna dificultad a la hora de moverse? ¿A qué edad logró el control de esfínteres?
                  </label>
                  <textarea
                    name="desarrollo_psicomotor"
                    value={formData.desarrollo_psicomotor}
                    onChange={handleChange}
                    className="input-field"
                    rows={6}
                    placeholder="Describa el desarrollo psicomotor..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha padecido de enuresis (emisión involuntaria de orina por ejemplo en la cama o en la ropa teniendo la madurez suficiente como para haber aprendido a controlarla) o encopresis (emisión repetida de heces en lugares inadecuados (por ejemplo, en la ropa o el suelo teniendo la madurez suficiente como para haber aprendido a controlarlo)?.
                </label>
                <textarea
                  name="enuresis_encopresis"
                  value={formData.enuresis_encopresis}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa si ha padecido enuresis o encopresis..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido o tiene algún problema con el sueño? (Pesadillas, insomnio, sonambulismo, terrores nocturnos, etc.).
                </label>
                <textarea
                  name="problemas_sueno"
                  value={formData.problemas_sueno}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los problemas con el sueño..."
                />
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Desarrollo Intelectual (nivel de lenguaje y conocimientos)</h4>
                <div className="space-y-4 ml-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿A qué edad comenzó a hablar?
                    </label>
                    <textarea
                      name="edad_comenzo_hablar"
                      value={formData.edad_comenzo_hablar}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa a qué edad comenzó a hablar..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Habló claro desde el principio o han notado algo especial en su manera de comunicarse?
                    </label>
                    <textarea
                      name="hablo_claro_desde_principio"
                      value={formData.hablo_claro_desde_principio}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa cómo habló desde el principio..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Adquiere conocimientos con normalidad o ha sido lento en alguna adquisición de conocimientos?
                    </label>
                    <textarea
                      name="adquiere_conocimientos_normalidad"
                      value={formData.adquiere_conocimientos_normalidad}
                      onChange={handleChange}
                      className="input-field"
                      rows={5}
                      placeholder="Describa la adquisición de conocimientos..."
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Desarrollo Escolar/Formativo/Ocupacional</h4>
                <div className="ml-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Su hijo/a ha sido escolarizado?
                  </label>
                  <textarea
                    name="hijo_escolarizado"
                    value={formData.hijo_escolarizado}
                    onChange={handleChange}
                    className="input-field"
                    rows={5}
                    placeholder="Describa si ha sido escolarizado..."
                  />
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Nivel Actual de Estudios:</h4>
                <div className="space-y-4 ml-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿A qué edad comenzó la escuela o el colegio?
                    </label>
                    <textarea
                      name="edad_comenzo_escuela"
                      value={formData.edad_comenzo_escuela}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa a qué edad comenzó la escuela..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Asistía anteriormente con regularidad a la escuela o el Colegio, Instituto o Centro Formativo?
                    </label>
                    <textarea
                      name="asistia_regularmente_escuela"
                      value={formData.asistia_regularmente_escuela}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa la regularidad de asistencia..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Ha habido cambios de Centros Escolares?, ¿a qué se han debido?
                    </label>
                    <textarea
                      name="cambios_centros_escolares"
                      value={formData.cambios_centros_escolares}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa los cambios de centros escolares..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Ha repetido algún grado o curso? ¿Por qué?
                    </label>
                    <textarea
                      name="ha_repetido_grado"
                      value={formData.ha_repetido_grado}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa si ha repetido algún grado..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Ha habido deserción escolar?
                    </label>
                    <textarea
                      name="ha_habido_desercion_escolar"
                      value={formData.ha_habido_desercion_escolar}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa si ha habido deserción escolar..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Cuál ha sido y/o es su rendimiento en el Colegio/ Instituto o Centro Formativo?
                    </label>
                    <textarea
                      name="rendimiento_colegio"
                      value={formData.rendimiento_colegio}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa el rendimiento escolar..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Cómo es y ha sido el comportamiento de su hijo/a en la Escuela/ Colegio/Centro Educativo/Centro Formativo/Instituto?
                    </label>
                    <textarea
                      name="comportamiento_escuela"
                      value={formData.comportamiento_escuela}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa el comportamiento en la escuela..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Cómo se ha relacionado y/o se relaciona con sus compañeros/as y su profesores/as?
                    </label>
                    <textarea
                      name="relacion_companeros_profesores"
                      value={formData.relacion_companeros_profesores}
                      onChange={handleChange}
                      className="input-field"
                      rows={6}
                      placeholder="Describa la relación con compañeros y profesores..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desarrollo Socio-Emocional y Afectivo */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              • Desarrollo Socio-Emocional y Afectivo (relación con adultos/as y pares)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describen el carácter de su hijo/a? ¿Qué le hace feliz?, ¿qué le entristece?, ¿qué le enoja?, etc. ¿Ha sido así desde niño/a o ha cambiado en la adolescencia?
                </label>
                <textarea
                  name="como_describen_caracter_hijo"
                  value={formData.como_describen_caracter_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa el carácter de su hijo/a..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Con qué padre se lleva mejor?
                </label>
                <textarea
                  name="con_que_padre_se_lleva_mejor"
                  value={formData.con_que_padre_se_lleva_mejor}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa con qué padre se lleva mejor..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene muchos amigos/as?, ¿son mayores o menores que él/ella?
                </label>
                <textarea
                  name="tiene_muchos_amigos"
                  value={formData.tiene_muchos_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa los amigos/as..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Le cuesta a su hijo/hija hacer y/o conservar amigos/as?
                </label>
                <textarea
                  name="le_cuesta_hacer_conservar_amigos"
                  value={formData.le_cuesta_hacer_conservar_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa si le cuesta hacer/conservar amigos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Considera que las amistades de su hijo/a son una buena o mala influencia para él/ella? (Explorar la posible relación con pares de riesgo o la pertenencia a maras o pandillas).
                </label>
                <textarea
                  name="amistades_buena_mala_influencia"
                  value={formData.amistades_buena_mala_influencia}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la influencia de las amistades..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿A qué cosas le gusta jugar o hacer en su tiempo libre? (Biografía lúdica) / practica algún deporte? ¿ve mucho la televisión? ¿Utiliza mucho el celular, etc.?, le gustaba hacer todo/a esto desde niño/a o ha habido algún cambio en la adolescencia o juventud en relación a estos aspectos?
                </label>
                <textarea
                  name="que_cosas_le_gusta_jugar"
                  value={formData.que_cosas_le_gusta_jugar}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa qué le gusta hacer en su tiempo libre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo expresa su hijo/a el afecto hacia los demás?
                </label>
                <textarea
                  name="como_expresa_afecto_hacia_demas"
                  value={formData.como_expresa_afecto_hacia_demas}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa cómo expresa el afecto..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo expresan su afecto hacia su hijo/hija?
                </label>
                <textarea
                  name="como_expresan_afecto_hacia_hijo"
                  value={formData.como_expresan_afecto_hacia_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa cómo expresan el afecto hacia su hijo/a..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ofrece su hijo/a ayuda cuando alguien está preocupado/a, disgustado/a o enfermo/a?
                </label>
                <textarea
                  name="ofrece_ayuda_cuando_alguien_preocupado"
                  value={formData.ofrece_ayuda_cuando_alguien_preocupado}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa si ofrece ayuda..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuáles son las preocupaciones o problemas más importantes de su hijo/a actualmente (a nivel personal, familiar, escolar o laboral, social, etc.)?
                </label>
                <textarea
                  name="preocupaciones_problemas_hijo"
                  value={formData.preocupaciones_problemas_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las preocupaciones y problemas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuenta su hijo/a con personas que le ayuden o apoyen cuando atraviesa por dificultades o problemas? De ser así, indique quiénes son.
                </label>
                <textarea
                  name="cuenta_personas_ayuden_apoyen"
                  value={formData.cuenta_personas_ayuden_apoyen}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las personas que le apoyan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo se comporta su hijo/a ante situaciones difíciles? (tipo de respuesta).
                </label>
                <textarea
                  name="como_se_comporta_situaciones_dificiles"
                  value={formData.como_se_comporta_situaciones_dificiles}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa cómo se comporta ante situaciones difíciles..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuáles consideran que son las mayores virtudes y defectos de su hijo/a?
                </label>
                <textarea
                  name="mayores_virtudes_defectos_hijo"
                  value={formData.mayores_virtudes_defectos_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las virtudes y defectos..."
                />
              </div>
            </div>
          </div>

          {/* Desarrollo y Relaciones Afectivo-Sexuales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              • Desarrollo y Relaciones Afectivo-Sexuales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido o tiene actualmente su hijo/a pareja sentimental?, describir tipo de relación/es establecida/s.
                </label>
                <textarea
                  name="ha_tenido_tiene_pareja_hijo"
                  value={formData.ha_tenido_tiene_pareja_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa las relaciones sentimentales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Es de su conocimiento que su hijo/a haya tenido relaciones sexuales (de forma voluntaria y consentida o haya sufrido o cometido algún abuso o violación):
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Historia de el/los hecho/s:</p>
                <textarea
                  name="historia_hechos_sexuales"
                  value={formData.historia_hechos_sexuales}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la historia de los hechos sexuales..."
                />
              </div>
            </div>
          </div>

          {/* V. Educación en Casa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Educación en Casa
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué normas se le pide cumplir en casa? ¿Qué pasa cuando no obedece las reglas? ¿Qué sucede cuando su hijo/a cumple las reglas?
                </label>
                <textarea
                  name="que_normas_se_pide_cumplir"
                  value={formData.que_normas_se_pide_cumplir}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las normas y consecuencias..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo consiguen que su hijo/a haga lo que le piden cuando él/ella se niega a hacerlo?
                </label>
                <textarea
                  name="como_consiguen_que_hijo_haga_lo_piden"
                  value={formData.como_consiguen_que_hijo_haga_lo_piden}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa cómo consiguen que haga lo que le piden..."
                />
              </div>
            </div>
          </div>

          {/* VI. Hábitos personales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Hábitos personales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Es responsable con el cumplimiento de horarios en casa?
              </label>
              <textarea
                name="responsable_cumplimiento_horarios"
                value={formData.responsable_cumplimiento_horarios}
                onChange={handleChange}
                className="input-field"
                rows={5}
                placeholder="Describa la responsabilidad con horarios..."
              />
            </div>
          </div>

          {/* VII. Antecedentes y Situación Jurídica Actual */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Antecedentes y Situación Jurídica Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Había tenido con anterioridad su hijo/a problemas con la justicia?, ¿de qué tipo?
                </label>
                <textarea
                  name="habia_tenido_problemas_justicia"
                  value={formData.habia_tenido_problemas_justicia}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los problemas previos con la justicia..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Algún otro miembro de la familia ha tenido problemas con la justicia?, ¿de qué tipo?
                </label>
                <textarea
                  name="otros_familiares_problemas_justicia"
                  value={formData.otros_familiares_problemas_justicia}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los problemas familiares con la justicia..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo reaccionaron al conocer los hechos y el ingreso de su hijo/a en el CPI?
                </label>
                <textarea
                  name="como_reaccionaron_hechos_ingreso"
                  value={formData.como_reaccionaron_hechos_ingreso}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa cómo reaccionaron..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué consideran que ha causado o influido en el comportamiento o presunto comportamiento infractor o delictivo que le ha llevado a su hijo/a a ingresar en el CPI?
                </label>
                <textarea
                  name="que_consideran_causo_conducta_infractora"
                  value={formData.que_consideran_causo_conducta_infractora}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa qué consideran que causó la conducta..."
                />
              </div>
            </div>
          </div>

          {/* VIII. Expectativas */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VIII. Expectativas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En que consideran que puede serle de ayuda a su hijo/a y/o a la familia la intervención psicológica y el cumplimiento de la medida socioeducativa?
              </label>
              <textarea
                name="expectativas_intervencion"
                value={formData.expectativas_intervencion}
                onChange={handleChange}
                className="input-field"
                rows={7}
                placeholder="Describa las expectativas..."
              />
            </div>
          </div>

          {/* IX. Observaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IX. Observaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              EJEMPLO:(Conducta observada en cada uno de los progenitores, estado emocional, físico, conductual, actitud hacia la entrevista, etc.).
            </p>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa las observaciones..."
            />
          </div>

          {/* X. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              X. Conclusiones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (Conclusiones de la entrevista familiar, impresión diagnóstica: detección de posibles factores desencadenantes, de riesgo y protección ante el comportamiento infractor o delictivo de el/la adolescente o joven, apoyo familiar hacia el/la adolescente o joven percibido, demanda o no demanda de intervención, problemas familiares específicos detectados, etc.).
            </p>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa las conclusiones..."
            />
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firma y Sello</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Firma y sello de el/la Psicólogo/a
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
                  Colegiación #
                </label>
                <input
                  type="text"
                  name="colegiacion"
                  value={formData.colegiacion}
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

