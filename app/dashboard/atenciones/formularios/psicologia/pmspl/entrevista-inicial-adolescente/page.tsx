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

interface NucleoConvivencia {
  nombre: string
  parentesco: string
  fecha_nacimiento: string
  edad: string
  estado_civil: string
  profesion_ocupacion: string
}

interface ConsumoDroga {
  sustancia: string
  cantidad: string
  frecuencia: string
  actualmente_consume: boolean
  ultima_vez_consumo: string
  edad_inicio: string
}

export default function EntrevistaInicialAdolescentePage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formularioId, setFormularioId] = useState<string | null>(null)
  const [nucleoConvivencia, setNucleoConvivencia] = useState<NucleoConvivencia[]>([
    { nombre: '', parentesco: '', fecha_nacimiento: '', edad: '', estado_civil: '', profesion_ocupacion: '' },
    { nombre: '', parentesco: '', fecha_nacimiento: '', edad: '', estado_civil: '', profesion_ocupacion: '' },
    { nombre: '', parentesco: '', fecha_nacimiento: '', edad: '', estado_civil: '', profesion_ocupacion: '' },
    { nombre: '', parentesco: '', fecha_nacimiento: '', edad: '', estado_civil: '', profesion_ocupacion: '' }
  ])
  const [consumoDrogas, setConsumoDrogas] = useState<ConsumoDroga[]>([
    { sustancia: 'Alcohol', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Tabaco', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Marihuana', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Cocaína', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Crack', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Heroína', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Resistol', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Pastillas', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' },
    { sustancia: 'Otros', cantidad: '', frecuencia: '', actualmente_consume: false, ultima_vez_consumo: '', edad_inicio: '' }
  ])

  const [formData, setFormData] = useState({
    // Información inicial
    psicologo_entrevista: '',
    fecha_entrevista: '',
    lugar_entrevista: '',
    
    // I. Datos Identificativos Personales y Familiares
    joven_id: jovenId || '',
    nombre_completo_nnaj: '',
    numero_partida_nacimiento: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    genero: '',
    estado_civil: '',
    ocupacion_actual: '',
    escolaridad: '',
    familiares_adultos_referencia: '',
    direccion_residencia_actual: '',
    telefono: '',
    fecha_ingreso_reingreso_pmspl: '',
    expediente_interno: '',
    
    // II. Datos Judiciales
    juzgado_juez_remitente: '',
    numero_expediente_judicial: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_impuesta: '',
    
    // Preguntas sobre el evento
    que_paso_vivencia_infraccion: '',
    que_causo_influido_proceso_judicial: '',
    como_reaccionaron_personas_cercanas: '',
    
    // Preguntas generales
    fue_maltratado_infancia: '',
    necesito_intervencion_servicios_sociales: '',
    describa_familia: '',
    
    // III. Preguntas orientadas a los padres o encargados
    hijo_consume_drogas: '',
    como_fue_embarazo_parto: '',
    problemas_empezar_caminar_materna: false,
    problemas_empezar_caminar_artificial: false,
    problemas_lenguaje_materna: false,
    problemas_lenguaje_artificial: false,
    actividades_familiares_materna: false,
    actividades_familiares_artificial: false,
    como_describiria_caracter_hijo: '',
    
    // Datos de Salud
    padece_enfermedad_fisica_mental: '',
    familiar_padece_enfermedad: '',
    historial_consumo_drogas: '',
    quien_historial_drogas: '',
    ha_consumido_usado_drogas: '',
    ha_recibido_tratamiento_drogas: '',
    tiene_problema_dependencia: '',
    
    // Historia de hechos/s
    tiene_pareja_sentimental: '',
    ha_tenido_relaciones_sexuales: '',
    relaciones_sexuales_voluntarias: '',
    abuso_violacion: '',
    edad_inicio_vida_sexual: '',
    es_activo_sexualmente: '',
    ha_tenido_abortos: '',
    tiene_hijos: '',
    ha_recibido_educacion_sexual: '',
    
    // V. Ámbito Educativo y/o Formativo-Laboral
    estudia_actualmente: '',
    grado_institucion: '',
    ocupacion: '',
    ha_reprobado_grados: '',
    motivos_reprobacion: '',
    ha_habido_desercion_escolar: '',
    problemas_escuela_colegio: '',
    tipo_problemas_escuela: '',
    ha_cambiado_centros_educativos: '',
    le_gusta_estudia_trabaja: '',
    tiene_metas_academicas_laborales: '',
    
    // VI. Características Personales, Gustos, Intereses y Metas de Vida
    como_describiria_caracter: '',
    tiene_amigos_actualmente: '',
    vinculo_grupos_antisociales: '',
    tiene_amigos_pmspl: '',
    relacion_amigos_pmspl: '',
    le_gusta_barrio_colonia: '',
    que_gusta_menos_entorno: '',
    considera_comunidad_peligrosa: '',
    conocimiento_grupo_predomina_zona: '',
    
    // VII. Problemas y Preocupaciones Actuales
    tiene_problema_preocupacion_actual: '',
    cuenta_personas_ayuden_apoyen: '',
    quienes_ayudan_apoyan: '',
    
    // VIII. Relaciones Sociales
    de_nino_tenia_amigos: '',
    donde_se_relaciona: '',
    padres_conocen_relaciones_amistad: '',
    
    // IX. Observaciones
    observaciones: '',
    
    // Firma
    nombre_firma_psicologo: '',
    colegiacion: ''
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
        TIPOS_FORMULARIOS.ENTREVISTA_INICIAL_ADOLESCENTE_PMSPL
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_completo_nnaj: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_entrevista: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          fecha_ingreso_reingreso_pmspl: jovenData.fecha_ingreso || ''
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          setFormularioId(formularioExistente.id || null)
          const datosCargados = formularioExistente.datos_json as any
          setFormData({
            ...datosIniciales,
            ...datosCargados,
            joven_id: formularioExistente.joven_id || jovenId || ''
          })
          // Cargar arrays si existen
          if (datosCargados.nucleo_convivencia) {
            setNucleoConvivencia(datosCargados.nucleo_convivencia)
          }
          if (datosCargados.consumo_drogas) {
            setConsumoDrogas(datosCargados.consumo_drogas)
          }
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

  const handleNucleoChange = (index: number, field: keyof NucleoConvivencia, value: string) => {
    const updated = [...nucleoConvivencia]
    updated[index] = { ...updated[index], [field]: value }
    setNucleoConvivencia(updated)
  }

  const handleConsumoChange = (index: number, field: keyof ConsumoDroga, value: string | boolean) => {
    const updated = [...consumoDrogas]
    updated[index] = { ...updated[index], [field]: value }
    setConsumoDrogas(updated)
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
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre completo del NNAJ" es obligatorio.')
        setSaving(false)
        return
      }

      // Convertir joven_id a string si es necesario
      const joven_id = String(formData.joven_id).trim()
      
      if (joven_id === '' || joven_id === 'undefined' || joven_id === 'null') {
        console.error('Error: joven_id está vacío o inválido:', joven_id)
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre completo del NNAJ" es obligatorio.')
        setSaving(false)
        return
      }

      // Validar que el tipo de formulario esté definido
      const tipoFormulario = TIPOS_FORMULARIOS.ENTREVISTA_INICIAL_ADOLESCENTE_PMSPL
      if (!tipoFormulario) {
        alert('Error: Tipo de formulario no definido')
        setSaving(false)
        return
      }
      
      // Extraer joven_id del formData para no incluirlo en datos_json
      const { joven_id: _, ...datosFormulario } = formData
      
      // Preparar los datos del formulario
      const datosJson = {
        ...datosFormulario,
        nucleo_convivencia: nucleoConvivencia,
        consumo_drogas: consumoDrogas
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ENTREVISTA PSICOLÓGICA INICIAL: ADOLESCENTES/JÓVENES
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              PROGRAMA DE MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD (PMSPL)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Inicial */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de la Entrevista</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lugar donde se realiza la entrevista
                </label>
                <input
                  type="text"
                  name="lugar_entrevista"
                  value={formData.lugar_entrevista}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* I. Datos Identificativos Personales y Familiares */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              I. Datos Identificativos Personales y Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_completo_nnaj}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo_nnaj: value }))}
                  onJovenSelect={(joven) => {
                    console.log('Joven seleccionado:', joven)
                    if (joven && joven.id) {
                      console.log('Estableciendo joven_id:', joven.id)
                      setFormData(prev => ({
                        ...prev,
                        joven_id: joven.id,
                        nombre_completo_nnaj: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                      console.log('joven_id establecido en formData')
                    } else {
                      console.warn('Joven seleccionado sin ID:', joven)
                    }
                  }}
                  label="Nombre completo del NNAJ"
                  required
                  placeholder="Buscar joven por nombre..."
                  error={errors.nombre_completo_nnaj}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No. de Partida de Nacimiento
                </label>
                <input
                  type="text"
                  name="numero_partida_nacimiento"
                  value={formData.numero_partida_nacimiento}
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
                  Género
                </label>
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Civil
                </label>
                <select
                  name="estado_civil"
                  value={formData.estado_civil}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccione...</option>
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="union_libre">Unión Libre</option>
                  <option value="divorciado">Divorciado/a</option>
                  <option value="viudo">Viudo/a</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ocupación actual
                </label>
                <input
                  type="text"
                  name="ocupacion_actual"
                  value={formData.ocupacion_actual}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Escolaridad
                </label>
                <input
                  type="text"
                  name="escolaridad"
                  value={formData.escolaridad}
                  onChange={handleChange}
                  className="input-field"
                />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección de residencia actual
                </label>
                <input
                  type="text"
                  name="direccion_residencia_actual"
                  value={formData.direccion_residencia_actual}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Ingreso/Reingreso en el PMSPL
                </label>
                <input
                  type="date"
                  name="fecha_ingreso_reingreso_pmspl"
                  value={formData.fecha_ingreso_reingreso_pmspl}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expediente Interno
                </label>
                <input
                  type="text"
                  name="expediente_interno"
                  value={formData.expediente_interno}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* II. Datos Judiciales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              II. Datos Judiciales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juzgado y/o Juez Remitente
                </label>
                <input
                  type="text"
                  name="juzgado_juez_remitente"
                  value={formData.juzgado_juez_remitente}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nº de Expediente Judicial
                </label>
                <input
                  type="text"
                  name="numero_expediente_judicial"
                  value={formData.numero_expediente_judicial}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del ingreso/Reingreso
                </label>
                <input
                  type="text"
                  name="motivo_ingreso_reingreso"
                  value={formData.motivo_ingreso_reingreso}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medida Judicial Impuesta
                </label>
                <input
                  type="text"
                  name="medida_judicial_impuesta"
                  value={formData.medida_judicial_impuesta}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Preguntas sobre el evento */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preguntas sobre el Evento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué fue lo que pasó? Vivencia en relación a la infracción cometida (en caso de ser necesario, proporcionar el apoyo psicológico requerido, indagar sobre infracciones previas):
                </label>
                <textarea
                  name="que_paso_vivencia_infraccion"
                  value={formData.que_paso_vivencia_infraccion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué considera que ha causado o influido para que actualmente este en el proceso judicial?
                </label>
                <textarea
                  name="que_causo_influido_proceso_judicial"
                  value={formData.que_causo_influido_proceso_judicial}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo reaccionaron las personas cercanas a usted (familia, amistades, etc.) al conocer los hechos y su ingreso en el PMSPL?, ¿tiene importancia para usted lo que piensan y sienten?, ¿en qué sentido?
                </label>
                <textarea
                  name="como_reaccionaron_personas_cercanas"
                  value={formData.como_reaccionaron_personas_cercanas}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                />
              </div>
            </div>
          </div>

          {/* Núcleo de convivencia */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Núcleo de convivencia</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOMBRE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PARENTESCO O TIPO DE RELACIÓN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      FECHA DE NACIMIENTO / EDAD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ESTADO CIVIL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PROFESIÓN U OCUPACIÓN
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {nucleoConvivencia.map((persona, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.nombre}
                          onChange={(e) => handleNucleoChange(index, 'nombre', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.parentesco}
                          onChange={(e) => handleNucleoChange(index, 'parentesco', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={persona.fecha_nacimiento}
                            onChange={(e) => handleNucleoChange(index, 'fecha_nacimiento', e.target.value)}
                            className="input-field text-sm flex-1"
                            placeholder="Fecha"
                          />
                          <input
                            type="text"
                            value={persona.edad}
                            onChange={(e) => handleNucleoChange(index, 'edad', e.target.value)}
                            className="input-field text-sm w-20"
                            placeholder="Edad"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.estado_civil}
                          onChange={(e) => handleNucleoChange(index, 'estado_civil', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.profesion_ocupacion}
                          onChange={(e) => handleNucleoChange(index, 'profesion_ocupacion', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preguntas generales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preguntas Generales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Fue maltratado en su infancia o vivió en un núcleo familiar violento?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fue_maltratado_infancia"
                      value="si"
                      checked={formData.fue_maltratado_infancia === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fue_maltratado_infancia"
                      value="no"
                      checked={formData.fue_maltratado_infancia === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Alguna vez necesito la intervención de servicios sociales? ¿Cuándo y por qué?
                </label>
                <textarea
                  name="necesito_intervencion_servicios_sociales"
                  value={formData.necesito_intervencion_servicios_sociales}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describa brevemente a su familia, ¿por quiénes está conformada?, ¿cómo es la relación con su familia (cercana, distante, buena, mala) ¿con quién se lleva mejor?, ¿con quién se lleva menos bien o peor?, ¿tiene o ha tenido problemas familiares?
                </label>
                <textarea
                  name="describa_familia"
                  value={formData.describa_familia}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                />
              </div>
            </div>
          </div>

          {/* III. Preguntas orientadas a los padres o encargados */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              III. Preguntas orientadas a los padres o encargados
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene conocimiento, si su hijo ha consumido o consume drogas u otras sustancias psicotrópicas?
                </label>
                <textarea
                  name="hijo_consume_drogas"
                  value={formData.hijo_consume_drogas}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo fue su embarazo y parto, físico/emocional? (Explorar si consumió sustancias tóxicas o drogas) (Lactancia materna).
                </label>
                <textarea
                  name="como_fue_embarazo_parto"
                  value={formData.como_fue_embarazo_parto}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              
              {/* Tabla de Lactancia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lactancia
                </label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Pregunta
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Materna
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Artificial
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-4 py-2 text-sm">Problemas para empezar a caminar</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.problemas_empezar_caminar_materna}
                            onChange={(e) => setFormData(prev => ({ ...prev, problemas_empezar_caminar_materna: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">SI</span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.problemas_empezar_caminar_artificial}
                            onChange={(e) => setFormData(prev => ({ ...prev, problemas_empezar_caminar_artificial: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">NO</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Problemas del lenguaje</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.problemas_lenguaje_materna}
                            onChange={(e) => setFormData(prev => ({ ...prev, problemas_lenguaje_materna: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">SI</span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.problemas_lenguaje_artificial}
                            onChange={(e) => setFormData(prev => ({ ...prev, problemas_lenguaje_artificial: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">NO</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Realizan algún tipo de actividades familiares</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.actividades_familiares_materna}
                            onChange={(e) => setFormData(prev => ({ ...prev, actividades_familiares_materna: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">SI</span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.actividades_familiares_artificial}
                            onChange={(e) => setFormData(prev => ({ ...prev, actividades_familiares_artificial: e.target.checked }))}
                            className="mr-2"
                          />
                          <span className="text-xs">NO</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describiría el carácter de su hijo y como reacciona él, ante situaciones difíciles?
                </label>
                <textarea
                  name="como_describiria_caracter_hijo"
                  value={formData.como_describiria_caracter_hijo}
                  onChange={handleChange}
                  className="input-field"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Datos de Salud */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              IV. Datos de Salud
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Padece o ha padecido de alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? ¿O ha tenido algún otro tipo de problema médico o de salud?
                </label>
                <textarea
                  name="padece_enfermedad_fisica_mental"
                  value={formData.padece_enfermedad_fisica_mental}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Algún miembro de su familia ha padecido o padece de alguna enfermedad física, mental, problemas emocionales, del estado de ánimo o del comportamiento? De ser así, indique cual/es y si recibe o ha recibido algún tipo de tratamiento por ello.
                </label>
                <textarea
                  name="familiar_padece_enfermedad"
                  value={formData.familiar_padece_enfermedad}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Hay historial de consumo de drogas?
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historial_consumo_drogas"
                      value="si"
                      checked={formData.historial_consumo_drogas === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="historial_consumo_drogas"
                      value="no"
                      checked={formData.historial_consumo_drogas === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
                {formData.historial_consumo_drogas === 'si' && (
                  <input
                    type="text"
                    name="quien_historial_drogas"
                    value={formData.quien_historial_drogas}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="¿Quién/es?"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Usted ha consumido o ha usado drogas?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ha_consumido_usado_drogas"
                      value="si"
                      checked={formData.ha_consumido_usado_drogas === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ha_consumido_usado_drogas"
                      value="no"
                      checked={formData.ha_consumido_usado_drogas === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cuadro de Consumo/Adicciones Personales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cuadro de Consumo/Adicciones Personales
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Sustancia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Frecuencia</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actualmente consume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Última vez de consumo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Edad de inicio</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {consumoDrogas.map((droga, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm font-medium">{droga.sustancia}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={droga.cantidad}
                          onChange={(e) => handleConsumoChange(index, 'cantidad', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={droga.frecuencia}
                          onChange={(e) => handleConsumoChange(index, 'frecuencia', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={droga.actualmente_consume}
                          onChange={(e) => handleConsumoChange(index, 'actualmente_consume', e.target.checked)}
                          className="mr-2"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={droga.ultima_vez_consumo}
                          onChange={(e) => handleConsumoChange(index, 'ultima_vez_consumo', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={droga.edad_inicio}
                          onChange={(e) => handleConsumoChange(index, 'edad_inicio', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha recibido algún tipo de tratamiento en relación al consumo de drogas?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ha_recibido_tratamiento_drogas"
                    value="si"
                    checked={formData.ha_recibido_tratamiento_drogas === 'si'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="ha_recibido_tratamiento_drogas"
                    value="no"
                    checked={formData.ha_recibido_tratamiento_drogas === 'no'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Considera usted que tiene un problema de dependencia a las sustancias manifestadas?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tiene_problema_dependencia"
                    value="si"
                    checked={formData.tiene_problema_dependencia === 'si'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Sí
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tiene_problema_dependencia"
                    value="no"
                    checked={formData.tiene_problema_dependencia === 'no'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* Historia de hechos/s */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Historia de hechos/s
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido o tiene actualmente pareja sentimental?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tiene_pareja_sentimental"
                      value="si"
                      checked={formData.tiene_pareja_sentimental === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tiene_pareja_sentimental"
                      value="no"
                      checked={formData.tiene_pareja_sentimental === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha tenido relaciones sexuales?
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ha_tenido_relaciones_sexuales"
                      value="si"
                      checked={formData.ha_tenido_relaciones_sexuales === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="ha_tenido_relaciones_sexuales"
                      value="no"
                      checked={formData.ha_tenido_relaciones_sexuales === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
                {formData.ha_tenido_relaciones_sexuales === 'si' && (
                  <div className="ml-4 space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Voluntaria o consentida:
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="relaciones_sexuales_voluntarias"
                            value="si"
                            checked={formData.relaciones_sexuales_voluntarias === 'si'}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          Sí
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="relaciones_sexuales_voluntarias"
                            value="no"
                            checked={formData.relaciones_sexuales_voluntarias === 'no'}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Abuso o Violación:
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="abuso_violacion"
                            value="si"
                            checked={formData.abuso_violacion === 'si'}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          Sí
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="abuso_violacion"
                            value="no"
                            checked={formData.abuso_violacion === 'no'}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          No
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Edad en que inició su vida sexual
                  </label>
                  <input
                    type="number"
                    name="edad_inicio_vida_sexual"
                    value={formData.edad_inicio_vida_sexual}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Eres activo sexualmente?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="es_activo_sexualmente"
                        value="si"
                        checked={formData.es_activo_sexualmente === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="es_activo_sexualmente"
                        value="no"
                        checked={formData.es_activo_sexualmente === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Ha tenido aborto/s?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_tenido_abortos"
                        value="si"
                        checked={formData.ha_tenido_abortos === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_tenido_abortos"
                        value="no"
                        checked={formData.ha_tenido_abortos === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Tiene Hijos?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tiene_hijos"
                        value="si"
                        checked={formData.tiene_hijos === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tiene_hijos"
                        value="no"
                        checked={formData.tiene_hijos === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Ha recibido Educación Sexual?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_recibido_educacion_sexual"
                        value="si"
                        checked={formData.ha_recibido_educacion_sexual === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_recibido_educacion_sexual"
                        value="no"
                        checked={formData.ha_recibido_educacion_sexual === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* V. Ámbito Educativo y/o Formativo-Laboral */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              V. Ámbito Educativo y/o Formativo-Laboral
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Estudia Actualmente?
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="estudia_actualmente"
                      value="si"
                      checked={formData.estudia_actualmente === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="estudia_actualmente"
                      value="no"
                      checked={formData.estudia_actualmente === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
                {formData.estudia_actualmente === 'si' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grado: Institución
                      </label>
                      <input
                        type="text"
                        name="grado_institucion"
                        value={formData.grado_institucion}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ocupación
                      </label>
                      <input
                        type="text"
                        name="ocupacion"
                        value={formData.ocupacion}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Ha reprobado grados o cursos escolares? por qué motivos?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_reprobado_grados"
                        value="si"
                        checked={formData.ha_reprobado_grados === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_reprobado_grados"
                        value="no"
                        checked={formData.ha_reprobado_grados === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                  {formData.ha_reprobado_grados === 'si' && (
                    <textarea
                      name="motivos_reprobacion"
                      value={formData.motivos_reprobacion}
                      onChange={handleChange}
                      className="input-field"
                      rows={2}
                      placeholder="Motivos..."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Ha habido deserción escolar?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_habido_desercion_escolar"
                        value="si"
                        checked={formData.ha_habido_desercion_escolar === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_habido_desercion_escolar"
                        value="no"
                        checked={formData.ha_habido_desercion_escolar === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Ha presentado o experimentado algún tipo de problemas en la escuela o colegio? ¿de qué tipo?
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="problemas_escuela_colegio"
                        value="si"
                        checked={formData.problemas_escuela_colegio === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="problemas_escuela_colegio"
                        value="no"
                        checked={formData.problemas_escuela_colegio === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                  {formData.problemas_escuela_colegio === 'si' && (
                    <textarea
                      name="tipo_problemas_escuela"
                      value={formData.tipo_problemas_escuela}
                      onChange={handleChange}
                      className="input-field"
                      rows={2}
                      placeholder="Tipo de problemas..."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿A cambiado de Centros Educativos?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_cambiado_centros_educativos"
                        value="si"
                        checked={formData.ha_cambiado_centros_educativos === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ha_cambiado_centros_educativos"
                        value="no"
                        checked={formData.ha_cambiado_centros_educativos === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Le gusta lo que estudia o en lo que trabajas actualmente?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="le_gusta_estudia_trabaja"
                        value="si"
                        checked={formData.le_gusta_estudia_trabaja === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="le_gusta_estudia_trabaja"
                        value="no"
                        checked={formData.le_gusta_estudia_trabaja === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Tiene metas académicas y/o laborales?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tiene_metas_academicas_laborales"
                        value="si"
                        checked={formData.tiene_metas_academicas_laborales === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tiene_metas_academicas_laborales"
                        value="no"
                        checked={formData.tiene_metas_academicas_laborales === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VI. Características Personales, Gustos, Intereses y Metas de Vida */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              VI. Características Personales, Gustos, Intereses y Metas de Vida
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describiría su carácter y manera de ser actualmente?
                </label>
                <textarea
                  name="como_describiria_caracter"
                  value={formData.como_describiria_caracter}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Actualmente tiene muchos/as o pocos/as amigos/as? ¿Tiene algún vínculo con grupos antisociales?
                </label>
                <textarea
                  name="tiene_amigos_actualmente"
                  value={formData.tiene_amigos_actualmente}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene amigos/as o conocidos que sean usuarios del PMSPL?, ¿Cuál es la relación que tiene con ellos/as?
                </label>
                <textarea
                  name="tiene_amigos_pmspl"
                  value={formData.tiene_amigos_pmspl}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Le gusta el barrio o colonia en la que vive?, ¿Qué es lo que más le gusta y lo que menos le gusta de su entorno?
                </label>
                <textarea
                  name="le_gusta_barrio_colonia"
                  value={formData.le_gusta_barrio_colonia}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Considera que su comunidad es peligrosa?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="considera_comunidad_peligrosa"
                        value="si"
                        checked={formData.considera_comunidad_peligrosa === 'si'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Sí
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="considera_comunidad_peligrosa"
                        value="no"
                        checked={formData.considera_comunidad_peligrosa === 'no'}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Tiene conocimiento de que grupo predomina en su zona?
                  </label>
                  <input
                    type="text"
                    name="conocimiento_grupo_predomina_zona"
                    value={formData.conocimiento_grupo_predomina_zona}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VII. Problemas y Preocupaciones Actuales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              VII. Problemas y Preocupaciones Actuales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene algún problema o preocupación actual? (personal, familiar, escolar o laboral, social, etc.). Si es así, descríbalo/s brevemente.
                </label>
                <textarea
                  name="tiene_problema_preocupacion_actual"
                  value={formData.tiene_problema_preocupacion_actual}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuenta con personas que le ayuden o apoyen cuando atraviesa por dificultades o problemas?, De ser así, indique quiénes son.
                </label>
                <textarea
                  name="cuenta_personas_ayuden_apoyen"
                  value={formData.cuenta_personas_ayuden_apoyen}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                />
              </div>
            </div>
          </div>

          {/* VIII. Relaciones Sociales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              VIII. Relaciones Sociales
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿De niño/a tenía muchos/as o pocos/as amigos/as?
                </label>
                <textarea
                  name="de_nino_tenia_amigos"
                  value={formData.de_nino_tenia_amigos}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Actualmente tiene muchos/as o pocos/as amigos/as? ¿Tiene algún vínculo con grupos antisociales? ¿Dónde se relaciona con ellos/as?: En el colegio, trabajo, barrio o colonia, etc.
                </label>
                <textarea
                  name="donde_se_relaciona"
                  value={formData.donde_se_relaciona}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Sus padres o responsables, conocen sus relaciones de amistad?
                </label>
                <textarea
                  name="padres_conocen_relaciones_amistad"
                  value={formData.padres_conocen_relaciones_amistad}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* IX. Observaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              IX. Observaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (Conducta observada, estado emocional, físico, conductual, perspectivas de cambio, demanda o no demanda de intervención, etc.)
            </p>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              className="input-field"
              rows={8}
            />
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firma y Sello</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre y firma del psicólogo/a
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
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Programa de Medidas Sustitutivas a la Privación de Libertad
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                INAMI
              </p>
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
