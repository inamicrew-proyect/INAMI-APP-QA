'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeSeguimientoPostSancionCPIPage() {
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
    institucion_profesional_remite: '',
    
    // I. Datos Identificativos Personales, Judiciales y Familiares
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    grado_escolaridad_ocupacion: '',
    direccion: '',
    telefono_email_contacto: '',
    fecha_ingreso_reingreso_cpi: '',
    juzgado_juez_remitente: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_aplicada_finaliza: '',
    otras_medidas_judiciales: '',
    familiares_adultos_referencia: '',
    direccion_familiares: '',
    telefonos_emails_familiares: '',
    
    // II. Motivo de Consulta
    motivo_consulta: '',
    
    // III. Síntesis de la Valoración Diagnóstica
    sintesis_valoracion_diagnostica: '',
    
    // IV. Objetivos de la Intervención Psicológica
    objetivos_intervencion_psicologica: '',
    
    // V. Desarrollo de la Intervención
    modalidades_intervencion: '',
    logros_obtenidos: '',
    obstaculos_encontrados: '',
    
    // Aspectos a reforzar
    aspectos_reforzar: '',
    
    // VI. Coordinación Interna y Externa
    coordinacion_interna_externa: '',
    
    // VII. Conclusiones y Recomendaciones
    conclusiones_recomendaciones: '',
    
    // Firma
    nombre_firma_psicologo: '',
    numero_colegiado: ''
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
          nombre_apellidos: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_informe: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          direccion: jovenData.direccion || '',
          telefono_email_contacto: jovenData.telefono || ''
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
          tipo_formulario: 'informe_seguimiento_post_sancion_cpi',
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
              INFORME PSICOLÓGICO PARA LA REALIZACIÓN DEL SEGUIMIENTO POST SANCIÓN CPI
            </h1>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institución/profesional al que remite el Informe
                </label>
                <input
                  type="text"
                  name="institucion_profesional_remite"
                  value={formData.institucion_profesional_remite}
                  onChange={handleChange}
                  className="input-field"
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
                      if (joven.id) {
                        setFormData(prev => ({
                          ...prev,
                          nombre_apellidos: `${joven.nombres} ${joven.apellidos}`,
                          edad: joven.edad?.toString() || prev.edad
                        }))
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
                    Teléfono/Email de Contacto
                  </label>
                  <input
                    type="text"
                    name="telefono_email_contacto"
                    value={formData.telefono_email_contacto}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de Ingreso/Reingreso en el CPI
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
                    Motivo del ingreso/reingreso
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
                    Medida Judicial Aplicada y que Finaliza
                  </label>
                  <input
                    type="text"
                    name="medida_judicial_aplicada_finaliza"
                    value={formData.medida_judicial_aplicada_finaliza}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Otra/s medida/s judicial/es en cumplimiento o por cumplir o Egreso del Sistema de Justicia
                </label>
                <input
                  type="text"
                  name="otras_medidas_judiciales"
                  value={formData.otras_medidas_judiciales}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              
              {/* Family/Reference Adults Contact Information */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Familiar/es o Adultos/as de Referencia a su cargo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion_familiares"
                      value={formData.direccion_familiares}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfonos/Emails de Contacto
                    </label>
                    <input
                      type="text"
                      name="telefonos_emails_familiares"
                      value={formData.telefonos_emails_familiares}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* II. Motivo de Consulta */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Motivo de Consulta
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Demanda de intervención y/o valoración de las necesidades de intervención detectadas.
            </p>
            <textarea
              name="motivo_consulta"
              value={formData.motivo_consulta}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa el motivo de consulta..."
            />
          </div>

          {/* III. Síntesis de la Valoración Diagnóstica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Síntesis de la Valoración Diagnóstica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: (Incluir un resumen de la valoración psicodiagnóstica o diagnóstico inicial).
            </p>
            <textarea
              name="sintesis_valoracion_diagnostica"
              value={formData.sintesis_valoracion_diagnostica}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa la síntesis de la valoración diagnóstica..."
            />
          </div>

          {/* IV. Objetivos de la Intervención Psicológica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Objetivos de la Intervención Psicológica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Objetivos de la intervención psicológica individual y familiar planteados.
            </p>
            <textarea
              name="objetivos_intervencion_psicologica"
              value={formData.objetivos_intervencion_psicologica}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa los objetivos de la intervención psicológica..."
            />
          </div>

          {/* V. Desarrollo de la Intervención */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Desarrollo de la Intervención
            </h3>
            <div className="space-y-6">
              {/* Modalidades de Intervención */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Modalidades de Intervención:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  en las que han participado el/la adolescente o joven y/o su familia: terapia individual, familiar, grupal, programas específicos, etc., a nivel interno y/o externo. En este último caso, debe especificarse desde que Recursos o Instituciones.
                </p>
                <textarea
                  name="modalidades_intervencion"
                  value={formData.modalidades_intervencion}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa las modalidades de intervención..."
                />
              </div>

              {/* Logros Obtenidos */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Logros Obtenidos:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Objetivos generales y específicos de la intervención psicológica, alcanzados y logros en relación a los contenidos y/o programas aplicados a nivel interno y/o externo. Descripción de los cambios cognitivos, conductuales, emocionales y relacionales en general y relativos a la prevención ante la reincidencia, en comparación al punto de partida.
                </p>
                <textarea
                  name="logros_obtenidos"
                  value={formData.logros_obtenidos}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los logros obtenidos..."
                />
              </div>

              {/* Obstáculos encontrados */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Obstáculos encontrados:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Dificultades u obstáculos encontrados en la implementación o avances esperados en relación a los planes psicológicos de intervención.
                </p>
                <textarea
                  name="obstaculos_encontrados"
                  value={formData.obstaculos_encontrados}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los obstáculos encontrados..."
                />
              </div>
            </div>
          </div>

          {/* Aspectos a reforzar */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              Aspectos a reforzar, sobre los cuales seguir Interviniendo o realizar un seguimiento:
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Acciones, contenidos o programas que deben seguirse desarrollando o reforzando con el/la adolescente o joven y/o su familia, para garantizar el logro de los objetivos propuestos y el cumplimiento de los planes psicológicos de actuación en su totalidad.
            </p>
            <textarea
              name="aspectos_reforzar"
              value={formData.aspectos_reforzar}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa los aspectos a reforzar..."
            />
          </div>

          {/* VI. Coordinación Interna y Externa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Coordinación Interna y Externa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Reuniones de coordinación, actuaciones conjuntas realizadas a lo largo del proceso de intervención y al finalizar el mismo, tipo de trabajo en red que se debe continuar realizando y mediante qué Instituciones con el objetivo de favorecer la reinserción social tras el egreso, la prevención de la reincidencia, etc.
            </p>
            <textarea
              name="coordinacion_interna_externa"
              value={formData.coordinacion_interna_externa}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa la coordinación interna y externa..."
            />
          </div>

          {/* VII. Conclusiones y Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Conclusiones y Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              A nivel individual y familiar en relación a la intervención a realizar.
            </p>
            <textarea
              name="conclusiones_recomendaciones"
              value={formData.conclusiones_recomendaciones}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa las conclusiones y recomendaciones..."
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

