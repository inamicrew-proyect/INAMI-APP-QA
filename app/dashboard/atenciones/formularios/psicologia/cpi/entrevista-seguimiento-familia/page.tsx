'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function EntrevistaSeguimientoFamiliaPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Top Section - Información Administrativa
    cpi_region: '',
    direccion: '',
    psicologo_entrevista: '',
    fecha_entrevista: '',
    
    // I. Datos Identificativos
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    
    // Familiares que Acuden a la Entrevista
    cambios_positivos_logros: '',
    intervencion_puede_continuar: '',
    motivos_no_logros: '',
    
    // Valoración del psicólogo
    valoracion_psicologo: '',
    
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
          fecha_entrevista: new Date().toISOString().slice(0, 10),
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
          tipo_formulario: 'entrevista_seguimiento_familia',
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
              ENTREVISTA PSICOLÓGICA DE SEGUIMIENTO CPI
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              MADRES/PADRES/U OTRO/A FAMILIAR DE REFERENCIA O ENCARGADO/A DE EL/LA ADOLESCENTE O JOVEN
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Section - Información Administrativa */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CPI: Región
                </label>
                <input
                  type="text"
                  name="cpi_region"
                  value={formData.cpi_region}
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

          {/* I. Datos Identificativos */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Identificativos
            </h3>
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
            </div>
          </div>

          {/* Familiares que Acuden a la Entrevista */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b pb-2">
              Familiares que Acuden a la Entrevista
            </h3>
            <div className="space-y-6">
              {/* Pregunta 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  1. ¿Desde el inicio de la intervención psicológica hasta ahora, que cambios positivos consideran que se han alcanzado o que logros consideran que se han obtenido de acuerdo a los objetivos y el plan específico de intervención psicológica?
                </label>
                <textarea
                  name="cambios_positivos_logros"
                  value={formData.cambios_positivos_logros}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa los cambios positivos y logros obtenidos..."
                />
              </div>

              {/* Pregunta 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2. ¿Consideran que la intervención psicológica puede continuar apoyándole a su hijo/a y/o la familia en el logro de los objetivos propuestos en el plan de intervención?, en qué aspectos?
                </label>
                <textarea
                  name="intervencion_puede_continuar"
                  value={formData.intervencion_puede_continuar}
                  onChange={handleChange}
                  className="input-field"
                  rows={8}
                  placeholder="Describa en qué aspectos puede continuar apoyando la intervención..."
                />
              </div>

              {/* Pregunta 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3. Si consideran que no se han alcanzado logros esperados a través de la intervención psicológica, indiquen cual/es ha/n sido para ustedes los motivos?
                </label>
                <textarea
                  name="motivos_no_logros"
                  value={formData.motivos_no_logros}
                  onChange={handleChange}
                  className="input-field"
                  rows={5}
                  placeholder="Describa los motivos si aplica..."
                />
              </div>
            </div>
          </div>

          {/* Valoración del psicólogo */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Valoración de el/la psicólogo/a
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              En relación a los avances hasta ahora obtenidos de acuerdo al plan de intervención psicológica y/o los obstáculos o dificultades encontrados en la intervención que han impedido la obtención de los avances esperados:
            </p>
            <textarea
              name="valoracion_psicologo"
              value={formData.valoracion_psicologo}
              onChange={handleChange}
              className="input-field"
              rows={7}
              placeholder="Describa la valoración profesional sobre los avances y obstáculos encontrados..."
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

