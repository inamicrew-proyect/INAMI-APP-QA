'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformePreliminarCPIPage() {
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
    fecha_ingreso_reingreso_cpi: '',
    juzgado_juez_remitente: '',
    numero_expediente: '',
    motivo_ingreso_reingreso: '',
    medida_judicial_aplicada: '',
    familiares_adultos_referencia: '',
    
    // II. Datos Sanitarios
    enfermedad_fisica_mental: '',
    medicacion: '',
    
    // III. Nivel de adaptabilidad personal y social
    caracter_manejo_emociones: '',
    relaciones_familiares: '',
    relaciones_amistades: '',
    
    // IV. Conclusiones
    conclusiones: '',
    
    // V. Recomendaciones
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
          tipo_formulario: 'informe_preliminar_cpi',
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
              INFORME PSICOLÓGICO PRELIMINAR
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              CENTRO PEDAGÓGICO DE INTERNAMIENTO (CPI)
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
          </div>

          {/* II. Datos Sanitarios */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Datos Sanitarios
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Padece algún tipo de enfermedad física, mental, trastorno del comportamiento o del estado de ánimo? (en caso de ser así, describir brevemente):
                </label>
                <textarea
                  name="enfermedad_fisica_mental"
                  value={formData.enfermedad_fisica_mental}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa brevemente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Toma algún tipo de medicación?, ¿Por qué motivo le ha sido prescrita?:
                </label>
                <textarea
                  name="medicacion"
                  value={formData.medicacion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la medicación y motivo de prescripción..."
                />
              </div>
            </div>
          </div>

          {/* III. Nivel de adaptabilidad personal y social */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Nivel de adaptabilidad personal y social
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo describe el/la adolescente o joven su carácter o manera de ser? (Describir el manejo que realiza de sus emociones, control del comportamiento).
                </label>
                <textarea
                  name="caracter_manejo_emociones"
                  value={formData.caracter_manejo_emociones}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa el carácter y manejo de emociones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de relaciones familiares y con otras personas con las que convivía o se relacionaba en diferentes contextos, antes de su ingreso en el CPI.
                </label>
                <textarea
                  name="relaciones_familiares"
                  value={formData.relaciones_familiares}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las relaciones familiares y sociales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Tiene amigos/as? ¿Cómo se relaciona con ellos/as? (Describir el tipo de relaciones que establece y si pertenece o no a grupos o asociaciones ilícitas).
                </label>
                <textarea
                  name="relaciones_amistades"
                  value={formData.relaciones_amistades}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las relaciones de amistad..."
                />
              </div>
            </div>
          </div>

          {/* IV. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Conclusiones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (Conclusiones de la entrevista preliminar, impresión diagnóstica: sospecha o determinación del padecimiento de enfermedades mentales o trastornos de personalidad, conducta, estado de ánimo, etc.)
            </p>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa las conclusiones de la entrevista preliminar..."
            />
          </div>

          {/* V. Recomendaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Recomendaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: En cuanto a la colocación de el/la adolescente o joven en las diferentes áreas del CPI, en relación a la intervención a llevar a cabo por parte de las distintas áreas de atención, teniendo en cuenta su nivel de competencia socioemocional y grado de adaptación psicológica. (En caso de haber podido realizar una detección precoz de problemáticas psicológicas de riesgo, cuando sea necesario se debe enviar informe al Juzgado de la Niñez, solicitando, cambios, ajustes de condiciones, etc., en cuanto a las medidas judiciales impuestas).
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
                  Nº Colegiado
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

