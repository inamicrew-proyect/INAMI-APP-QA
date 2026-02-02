'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

interface NucleoConvivencia {
  nombre: string
  parentesco: string
  edad: string
  estado_civil: string
  ocupacion: string
  observacion: string
}

export default function EntrevistaPreeliminarPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nucleoConvivencia, setNucleoConvivencia] = useState<NucleoConvivencia[]>([
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observacion: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observacion: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observacion: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observacion: '' },
    { nombre: '', parentesco: '', edad: '', estado_civil: '', ocupacion: '', observacion: '' }
  ])

  const [formData, setFormData] = useState({
    // Sección 1: Información del CPI
    nombre_cpi: '',
    direccion_cpi: '',
    
    // Sección 2: Detalles de la Entrevista
    psicologo_entrevista: '',
    fecha_entrevista: '',
    
    // Sección 3: Datos Personales y Familiares
    nombre_apellidos_naj: '',
    numero_partida_nacimiento: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    genero: '',
    estado_civil: '',
    direccion: '',
    referencia_su_cargo: '',
    direcciones_referencia: '',
    telefonos_referencia: '',
    
    // Otros Familiares Significativos
    otros_familiares_significativos: '',
    
    // II. Datos Legales
    fecha_ingreso_reingreso_cpi: '',
    juzgado_juez_remitente: '',
    numero_expediente: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_impuesta: '',
    infracciones_previas_reingreso: '',
    vivencia_emocional_medida_judicial: '',
    
    // III. Datos Educativos/Ocupacionales
    datos_educativos_ocupacionales: '',
    
    // IV. Datos de Salud
    padece_enfermedad_tratamiento: '',
    ha_consumido_consume_drogas: '',
    ha_recibido_tratamiento_drogas: '',
    
    // V. Historia Familiar
    relacion_familia_miembros: '',
    
    // VI. Nivel de adaptabilidad personal y social
    como_describe_caracter: '',
    tiene_amigos_como_se_relaciona: '',
    
    // VII. Conclusiones
    conclusiones: '',
    
    // VIII. Recomendaciones
    recomendaciones: '',
    
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
          nombre_apellidos_naj: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_entrevista: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          direccion: jovenData.direccion || '',
          fecha_ingreso_reingreso_cpi: jovenData.fecha_ingreso || '',
          numero_expediente: jovenData.numero_expediente_judicial || ''
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

  const handleNucleoChange = (index: number, field: keyof NucleoConvivencia, value: string) => {
    const updated = [...nucleoConvivencia]
    updated[index] = { ...updated[index], [field]: value }
    setNucleoConvivencia(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { error } = await supabase
        .from('formularios_psicologicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'entrevista_preeliminar',
          datos_json: {
            ...formData,
            nucleo_convivencia: nucleoConvivencia
          },
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
              ENTREVISTA E INFORME PSICOLÓGICO PRELIMINAR
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              CENTRO PEDAGOGICO DE INTERNAMIENTO (CPI)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección 1: Información del CPI */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información del CPI
            </h3>
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
            </div>
          </div>

          {/* Sección 2: Detalles de la Entrevista */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detalles de la Entrevista
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Sección 3: Datos Personales y Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Personales y Familiares
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_apellidos_naj}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_apellidos_naj: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_apellidos_naj: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                    }
                  }}
                  label="Nombre y apellidos del NAJ"
                  required
                  placeholder="Buscar joven por nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  N.º Partida de Nacimiento
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referencia a su cargo
                </label>
                <input
                  type="text"
                  name="referencia_su_cargo"
                  value={formData.referencia_su_cargo}
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
                  name="direcciones_referencia"
                  value={formData.direcciones_referencia}
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
                  name="telefonos_referencia"
                  value={formData.telefonos_referencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Núcleo de convivencia */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Núcleo de convivencia (anterior al ingreso en el CPI)
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      NOMBRE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      PARENTESCO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      EDAD
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ESTADO CIVIL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      OCUPACIÓN
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      OBSERVACIÓN
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
                        <input
                          type="text"
                          value={persona.edad}
                          onChange={(e) => handleNucleoChange(index, 'edad', e.target.value)}
                          className="input-field text-sm"
                        />
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
                          value={persona.ocupacion}
                          onChange={(e) => handleNucleoChange(index, 'ocupacion', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={persona.observacion}
                          onChange={(e) => handleNucleoChange(index, 'observacion', e.target.value)}
                          className="input-field text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Otros Familiares Significativos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Otros Familiares Significativos y tipo de relación
            </h3>
            <textarea
              name="otros_familiares_significativos"
              value={formData.otros_familiares_significativos}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa otros familiares significativos y el tipo de relación..."
            />
          </div>

          {/* II. Datos Legales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Datos Legales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Ingreso/Reingreso en el CPI
                </label>
                <input
                  type="date"
                  name="fecha_ingreso_reingreso_cpi"
                  value={formData.fecha_ingreso_reingreso_cpi}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
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
                  Motivo del Ingreso/Reingreso
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  En caso de reingreso, especificar infracción/es previa/s cometida/s (reincidencia/s)
                </label>
                <input
                  type="text"
                  name="infracciones_previas_reingreso"
                  value={formData.infracciones_previas_reingreso}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vivencia emocional en relación a la medida judicial impuesta: (en caso de ser necesario, proporcionar el apoyo psicológico requerido).
              </label>
              <textarea
                name="vivencia_emocional_medida_judicial"
                value={formData.vivencia_emocional_medida_judicial}
                onChange={handleChange}
                className="input-field"
                rows={5}
                placeholder="Describa la vivencia emocional..."
              />
            </div>
          </div>

          {/* III. Datos Educativos/Ocupacionales */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Datos Educativos/Ocupacionales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Nivel educativo o formativo (analfabetismo, último curso escolar aprobado o que se encuentra cursando. Reprobación de grados o deserción escolar. Nivel de adaptación escolar, Ocupación):
            </p>
            <textarea
              name="datos_educativos_ocupacionales"
              value={formData.datos_educativos_ocupacionales}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa los datos educativos y ocupacionales..."
            />
          </div>

          {/* IV. Datos de Salud */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Datos de Salud
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Padece algún tipo de enfermedad física, mental, trastorno del comportamiento o del estado de ánimo? ¿Ha recibido o recibe algún tipo de tratamiento médico, psicológico o psiquiátrico por ello? (en caso de ser así, describa brevemente):
                </label>
                <textarea
                  name="padece_enfermedad_tratamiento"
                  value={formData.padece_enfermedad_tratamiento}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa las enfermedades y tratamientos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha consumido o consume algún tipo de sustancia tóxica o drogas?
                </label>
                <textarea
                  name="ha_consumido_consume_drogas"
                  value={formData.ha_consumido_consume_drogas}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa el consumo de sustancias..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Ha recibido o recibe algún tipo de tratamiento médico, psicológico o psiquiátrico por ello? (en caso de ser así, describa brevemente):
                </label>
                <textarea
                  name="ha_recibido_tratamiento_drogas"
                  value={formData.ha_recibido_tratamiento_drogas}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los tratamientos recibidos..."
                />
              </div>
            </div>
          </div>

          {/* V. Historia Familiar */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Historia Familiar
            </h3>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ¿Cómo es la relación con los miembros de su familia y/o con las personas con las que convivía antes de su ingreso al CPI? (Explorar tipo de relaciones, dinámica familiar y problemáticas o posibles problemáticas familiares presentes).
            </label>
            <textarea
              name="relacion_familia_miembros"
              value={formData.relacion_familia_miembros}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa la relación familiar..."
            />
          </div>

          {/* VI. Nivel de adaptabilidad personal y social */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Nivel de adaptabilidad personal y social
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describe su carácter o manera de ser? (Explorar manejo de emociones, control del comportamiento, impulsos y adaptabilidad).
                </label>
                <textarea
                  name="como_describe_caracter"
                  value={formData.como_describe_caracter}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa su carácter y manera de ser..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene amigos/as? ¿Cómo se relaciona con ellos/as? (Explorar el tipo de relaciones que establece y si pertenece o no a grupos o asociaciones ilícitas).
                </label>
                <textarea
                  name="tiene_amigos_como_se_relaciona"
                  value={formData.tiene_amigos_como_se_relaciona}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa sus relaciones de amistad..."
                />
              </div>
            </div>
          </div>

          {/* VII. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Conclusiones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: (Conclusiones de la entrevista preliminar, impresión diagnóstica: sospecha o determinación del padecimiento de enfermedades mentales o trastornos de personalidad, conducta, estado de ánimo, consumos, etc.)
            </p>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa las conclusiones..."
            />
          </div>

          {/* VIII. Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VIII. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: En cuanto a la colocación de el/la adolescente o joven en las diferentes áreas del CPI, en relación a la intervención a llevar a cabo por parte de las distintas áreas de atención, teniendo en cuenta su nivel de competencia socioemocional y grado de adaptación psicológica. (En caso de haber podido realizar una detección precoz de problemáticas psicológicas de riesgo, cuando sea necesario se debe enviar informe al Juzgado de la Niñez, solicitando, cambios, ajustes de condiciones, etc., en cuanto a las medidas judiciales impuestas).
            </p>
            <textarea
              name="recomendaciones"
              value={formData.recomendaciones}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa las recomendaciones..."
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
