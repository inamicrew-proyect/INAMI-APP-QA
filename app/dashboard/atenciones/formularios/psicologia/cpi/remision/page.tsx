'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RemisionPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Header Section - CPI (Institución Remitente)
    cpi: '',
    direccion_cpi: '',
    psicologo_remision: '',
    fecha_remision: '',
    
    // Header Section - PMSPL (Programa Receptor)
    pmspl_region: '',
    direccion_pmspl: '',
    
    // I. Datos Identificativos Personales, Judiciales y Familiares
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    grado_escolaridad_ocupacion: '',
    direccion: '',
    familiares_adultos_referencia: '',
    direccion_referencia: '',
    telefonos: '',
    fecha_ingreso_cpi: '',
    fecha_egreso_cpi: '',
    juzgado_remitente: '',
    motivo_ingreso_cpi: '',
    medida_judicial_aplicada_finaliza: '',
    medidas_no_privativas_libertad: '',
    
    // II. Motivo de Remisión
    motivo_remision: '',
    cambio_medida_orden_juzgados: '',
    
    // III. Síntesis de la Valoración Diagnóstica
    sintesis_valoracion_diagnostica: '',
    
    // IV. Logros obtenidos en la Intervención terapéutica
    logros_intervencion_terapeutica: '',
    modalidades_intervencion: '',
    obstaculos_encontrados: '',
    
    // V. Coordinación Externa
    coordinacion_externa: '',
    
    // VI. Conclusiones
    conclusiones: '',
    
    // VII. Recomendaciones
    recomendaciones: '',
    
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
          fecha_remision: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          direccion: jovenData.direccion || '',
          fecha_ingreso_cpi: jovenData.fecha_ingreso || ''
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
          tipo_formulario: 'remision_cpi_pmspl',
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
              FICHA DE REMISIÓN
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Centros Pedagógicos de Internamiento (CPI) al Programa de Medidas Sustitutivas (PMSPL)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section - CPI (Institución Remitente) */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
              CPI (Institución Remitente)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPI
                </label>
                <input
                  type="text"
                  name="cpi"
                  value={formData.cpi}
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
                  Psicólogo/a que realiza la remisión *
                </label>
                <input
                  type="text"
                  name="psicologo_remision"
                  value={formData.psicologo_remision}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de remisión *
                </label>
                <input
                  type="date"
                  name="fecha_remision"
                  value={formData.fecha_remision}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Header Section - PMSPL (Programa Receptor) */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
              PMSPL (Programa Receptor)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PMSPL (Región)
                </label>
                <input
                  type="text"
                  name="pmspl_region"
                  value={formData.pmspl_region}
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
                  name="direccion_pmspl"
                  value={formData.direccion_pmspl}
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
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Datos Personales:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre y apellidos *
                    </label>
                    <input
                      type="text"
                      name="nombre_apellidos"
                      value={formData.nombre_apellidos}
                      onChange={handleChange}
                      className="input-field"
                      required
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
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Familiar/es o Adultos/as de Referencia a su cargo:</h4>
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
                      name="direccion_referencia"
                      value={formData.direccion_referencia}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfonos
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
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Datos CPI y Judiciales:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Fecha de Egreso del CPI
                    </label>
                    <input
                      type="date"
                      name="fecha_egreso_cpi"
                      value={formData.fecha_egreso_cpi}
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
                      Motivo del ingreso en el CPI
                    </label>
                    <input
                      type="text"
                      name="motivo_ingreso_cpi"
                      value={formData.motivo_ingreso_cpi}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Medida/s no privativas de libertad por cumplir
                    </label>
                    <input
                      type="text"
                      name="medidas_no_privativas_libertad"
                      value={formData.medidas_no_privativas_libertad}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* II. Motivo de Remisión */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Motivo de Remisión
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Resumen de las intervenciones y/o las problemáticas sobre las que se ha trabajado con el/la adolescente/joven y/o su familia.
            </p>
            <textarea
              name="motivo_remision"
              value={formData.motivo_remision}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa el motivo de la remisión..."
            />
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cambio de Medida por Orden de los juzgados
              </label>
              <input
                type="text"
                name="cambio_medida_orden_juzgados"
                value={formData.cambio_medida_orden_juzgados}
                onChange={handleChange}
                className="input-field"
                placeholder="Describa el cambio de medida si aplica..."
              />
            </div>
          </div>

          {/* III. Síntesis de la Valoración Diagnóstica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Síntesis de la Valoración Diagnóstica
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              EJEMPLO: (Incluir un resumen de la valoración psicodiagnóstica o diagnóstico inicial).
            </p>
            <textarea
              name="sintesis_valoracion_diagnostica"
              value={formData.sintesis_valoracion_diagnostica}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la síntesis de la valoración diagnóstica..."
            />
          </div>

          {/* IV. Logros obtenidos en la Intervención terapéutica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Logros obtenidos en la Intervención terapéutica
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                  EJEMPLO: Logros de la intervención psicológica individuales y familiares planteados.
                </p>
                <textarea
                  name="logros_intervencion_terapeutica"
                  value={formData.logros_intervencion_terapeutica}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa los logros obtenidos..."
                />
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Modalidades de Intervención:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  en las que han participado el/la adolescente o joven y/o su familia: terapia individual, familiar, grupal, programas específicos, etc., a nivel interno y/o externo. En este último caso, debe especificarse desde qué Recursos o Instituciones.
                </p>
                <textarea
                  name="modalidades_intervencion"
                  value={formData.modalidades_intervencion}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa las modalidades de intervención..."
                />
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
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
                  rows={8}
                  placeholder="Describa los obstáculos encontrados..."
                />
              </div>
            </div>
          </div>

          {/* V. Coordinación Externa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Coordinación Externa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reuniones de coordinación, actuaciones conjuntas realizadas a lo largo del proceso de intervención y al finalizar el mismo, tipo de trabajo en red que se debe continuar realizando y mediante qué Instituciones con el objetivo de favorecer la reinserción social tras el egreso, la prevención de la reincidencia, etc.
            </p>
            <textarea
              name="coordinacion_externa"
              value={formData.coordinacion_externa}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la coordinación externa..."
            />
          </div>

          {/* VI. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Conclusiones
            </h3>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa las conclusiones..."
            />
          </div>

          {/* VII. Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              EJEMPLO: Aspectos a seguir Interviniendo o realizar un seguimiento: Acciones, contenidos o programas que deben seguirse desarrollando o reforzando con el/la adolescente o joven y/o su familia, para garantizar el logro de los objetivos propuestos y el cumplimiento de los planes psicológicos de actuación en su totalidad. A nivel individual y familiar en relación a la intervención a realizar desde el PMSPL.
            </p>
            <textarea
              name="recomendaciones"
              value={formData.recomendaciones}
              onChange={handleChange}
              className="input-field"
              rows={6}
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

