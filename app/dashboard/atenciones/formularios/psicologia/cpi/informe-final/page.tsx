'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeFinalCPIPage() {
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
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    grado_escolaridad_ocupacion: '',
    fecha_egreso_cpi: '',
    juzgado_remitente: '',
    numero_expediente: '',
    motivo_ingreso: '',
    medida_judicial_aplicada_finaliza: '',
    otras_medidas_judiciales: '',
    familiares_adultos_referencia: '',
    
    // II. Motivo de Cierre
    motivo_cierre: '',
    
    // III. Objetivo del Proceso
    objetivo_proceso: '',
    
    // IV. Resumen del Proceso terapéutico
    resumen_proceso_terapeutico: '',
    
    // V. Coordinación Interna y Externa
    coordinacion_interna_externa: '',
    
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
          fecha_informe: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { error } = await supabase
        .from('formularios_psicologicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'informe_final_cpi',
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
              INFORME PSICOLÓGICO FINAL
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
                    Fecha de Egreso en el CPI
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

          {/* II. Motivo de Cierre */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Motivo de Cierre
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Demanda de intervención y/o valoración de las necesidades de intervención detectadas.
            </p>
            <textarea
              name="motivo_cierre"
              value={formData.motivo_cierre}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa el motivo de cierre..."
            />
          </div>

          {/* III. Objetivo del Proceso */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Objetivo del Proceso
            </h3>
            <textarea
              name="objetivo_proceso"
              value={formData.objetivo_proceso}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa el objetivo del proceso..."
            />
          </div>

          {/* IV. Resumen del Proceso terapéutico */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Resumen del Proceso terapéutico
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              EJEMPLO:(Incluir un resumen de la valoración Psicodiagnóstica o diagnóstico inicial).
            </p>
            <textarea
              name="resumen_proceso_terapeutico"
              value={formData.resumen_proceso_terapeutico}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa el resumen del proceso terapéutico..."
            />
          </div>

          {/* V. Coordinación Interna y Externa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Coordinación Interna y Externa
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Reuniones de coordinación, actuaciones conjuntas realizadas a lo largo del proceso de intervención y al finalizar el mismo, con el objetivo de favorecer la reinserción social tras el egreso del CPI, etc.
            </p>
            <textarea
              name="coordinacion_interna_externa"
              value={formData.coordinacion_interna_externa}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa la coordinación interna y externa..."
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
              rows={7}
              placeholder="Describa las conclusiones..."
            />
          </div>

          {/* VII. Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: A nivel individual y familiar y en relación a la continuidad de la intervención psicológica a través del PMSPL u otras Instituciones externas, así como a nivel judicial, en cuanto al cambio de medida, etc.
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

