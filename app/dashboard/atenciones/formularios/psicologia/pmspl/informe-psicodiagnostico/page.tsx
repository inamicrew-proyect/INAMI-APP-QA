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

export default function InformePsicodiagnosticoPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formularioId, setFormularioId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Header Section
    psicologo_informe: '',
    fecha_informe: '',
    
    // I. Datos Identificativos Personales, Familiares
    nombre_nino: '',
    numero_partida_nacimiento: '',
    lugar_nacimiento: '',
    fecha_nacimiento: '',
    estado_civil: '',
    edad: '',
    genero: '',
    escolaridad: '',
    ocupacion: '',
    responsable: '',
    direccion: '',
    telefono: '',
    
    // II. Datos Judiciales
    fecha_ingreso_pmspl: '',
    expediente_judicial: '',
    juzgado_remite: '',
    juez_remite: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_impuesta: '',
    
    // III. Motivo de Evaluación
    motivo_evaluacion: '',
    
    // IV. Antecedentes y Situación Actual
    antecedentes_situacion_actual: '',
    
    // V. Fase Evaluativa
    instrumentos_aplicados_resultados: '',
    
    // VI. Valoración Técnica
    valoracion_tecnica: '',
    
    // VII. Recomendaciones
    recomendaciones: '',
    
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
        TIPOS_FORMULARIOS.INFORME_PSICODIAGNOSTICO_PMSPL
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_nino: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_informe: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          fecha_nacimiento: jovenData.fecha_nacimiento || '',
          lugar_nacimiento: jovenData.lugar_nacimiento || '',
          genero: jovenData.sexo || '',
          direccion: jovenData.direccion || '',
          telefono: jovenData.telefono || '',
          fecha_ingreso_pmspl: jovenData.fecha_ingreso || '',
          expediente_judicial: jovenData.expediente_judicial || ''
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          setFormularioId(formularioExistente.id || null)
          setFormData({
            ...datosIniciales,
            ...formularioExistente.datos_json
          })
        } else {
          setFormData(prev => ({
            ...prev,
            ...datosIniciales
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
      
      await saveOrUpdateFormulario(
        jovenId,
        TIPOS_FORMULARIOS.INFORME_PSICODIAGNOSTICO_PMSPL,
        formData
      )
      
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error: any) {
      console.error('Error saving form:', error)
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
              PROGRAMA DE MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD (PMSPL)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* I. Datos Identificativos Personales, Familiares */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              I. Datos Identificativos Personales, Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_nino}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_nino: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_nino: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                    }
                  }}
                  label="Nombre del Niño (a)"
                  required
                  placeholder="Buscar joven por nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className="input-field"
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
                  Lugar de Nacimiento
                </label>
                <input
                  type="text"
                  name="lugar_nacimiento"
                  value={formData.lugar_nacimiento}
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
              <div className="flex gap-4">
                <div className="flex-1">
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
                <div className="flex-1">
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
                  Responsable
                </label>
                <input
                  type="text"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
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
                  Fecha de Ingreso en el PMSPL
                </label>
                <input
                  type="date"
                  name="fecha_ingreso_pmspl"
                  value={formData.fecha_ingreso_pmspl}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expediente Judicial
                </label>
                <input
                  type="text"
                  name="expediente_judicial"
                  value={formData.expediente_judicial}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juzgado que Remite
                </label>
                <input
                  type="text"
                  name="juzgado_remite"
                  value={formData.juzgado_remite}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juez que Remite
                </label>
                <input
                  type="text"
                  name="juez_remite"
                  value={formData.juez_remite}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo del ingreso / Reingreso
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

          {/* III. Motivo de Evaluación */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              III. Motivo de Evaluación
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: ¿Existe o no demanda de intervención individual y/o familiar?, incluir la valoración de las necesidades de intervención detectadas.
            </p>
            <textarea
              name="motivo_evaluacion"
              value={formData.motivo_evaluacion}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa el motivo de la evaluación..."
            />
          </div>

          {/* IV. Antecedentes y Situación Actual */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              IV. Antecedentes y Situación Actual
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: (Breve resumen de la información recopilada en la historia clínica y/o entrevistas iniciales individuales y familiares relativa a el/la adolescente o joven en cuanto a su desarrollo y grado de adaptación emocional, conductual, cognitivo, escolar, familiar, social, vínculos afectivos y estilos de apego establecidos, problemáticas previas presentadas en relación a estos aspectos, etc. Comportamientos delictuales actuales y previos, causas que hayan influido en los mismos. Padecimiento de enfermedades físicas, mentales, trastorno del comportamiento o el estado de ánimo, etc. Toma de medicación. Dinámica familiar, estructura familiar, roles desempeñados, tipo de relaciones vinculares y afectivas mantenidas, conflictos familiares y de convivencia, comportamientos delictuales o infractores en otros miembros de la familia u otras problemáticas del grupo familiar o de sus miembros: violencia intrafamiliar, pertenencia a maras o pandillas, abuso sexual, consumo de drogas, etc., nivel sociocultural y económico de la familia, adaptación e integración social familiar. Factores protectores ante la reincidencia, individuales, familiares, comunitarios y sociales).
            </p>
            <textarea
              name="antecedentes_situacion_actual"
              value={formData.antecedentes_situacion_actual}
              onChange={handleChange}
              className="input-field"
              rows={12}
              placeholder="Describa los antecedentes y situación actual..."
            />
          </div>

          {/* V. Fase Evaluativa */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              V. Fase Evaluativa
            </h3>
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
              Instrumentos aplicados/Resultados obtenidos:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Nombrar los instrumentos aplicados y describir los resultados obtenidos.
            </p>
            <textarea
              name="instrumentos_aplicados_resultados"
              value={formData.instrumentos_aplicados_resultados}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa los instrumentos aplicados y los resultados obtenidos..."
            />
          </div>

          {/* VI. Valoración Técnica */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              VI. Valoración Técnica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Brindar una explicación psicológica que permita comprender las causas individualizadas del comportamiento infractor o delictivo de el/la adolescente o joven, las principales variables psicosociales que influencian el mismo, así como otras problemáticas psicológicas de importancia que pudiera presentar y los factores de riesgo y los factores resilientes o de protección individuales, familiares y ambientales ante la reincidencia. Debe incluirse en el diagnóstico, el padecimiento de trastornos psicológicos, anímicos, de personalidad, comportamiento, etc., detectados a través de la evaluación.
            </p>
            <textarea
              name="valoracion_tecnica"
              value={formData.valoracion_tecnica}
              onChange={handleChange}
              className="input-field"
              rows={12}
              placeholder="Describa la valoración técnica..."
            />
          </div>

          {/* VII. Recomendaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">
              VII. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              En relación a las intervenciones a realizar desde las distintas áreas de atención o Instituciones externas, elaboración del PLATÍN, toma de decisiones judiciales y en relación a las medidas impuestas, etc.
            </p>
            <textarea
              name="recomendaciones"
              value={formData.recomendaciones}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa las recomendaciones..."
            />
          </div>

          {/* Nota especial */}
          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">*</span> En el caso de realizarse una derivación por parte del <span className="font-bold">PMSPL</span> a Instituciones Prestadoras de Servicios para la realización de la intervención psicológica o psicoterapéutica, debe hacérseles llegar una copia de este informe, realizando las adaptaciones requeridas a sus apartados, para asegurar el mantenimiento de la confidencialidad debida relativa a datos o informaciones en relación el/la adolescente o joven y/o su familia.
            </p>
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

