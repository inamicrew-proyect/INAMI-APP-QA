'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeEspecialPedagogicoPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Datos del pedagogo
    pedagogo_informe: '',
    fecha_informe: '',
    
    // Datos del NNAJ
    nombre_nnaj: '',
    edad: '',
    centro: '',
    
    // Motivo del informe especial
    motivo_informe: '',
    
    // Situación actual
    situacion_actual: '',
    
    // Evaluación especializada
    evaluacion_especializada: '',
    
    // Necesidades educativas especiales
    necesidades_educativas_especiales: '',
    
    // Adaptaciones curriculares
    adaptaciones_curriculares: '',
    
    // Recursos especializados
    recursos_especializados: '',
    
    // Colaboración interdisciplinaria
    colaboracion_interdisciplinaria: '',
    
    // Recomendaciones especiales
    recomendaciones_especiales: '',
    
    // Seguimiento especial
    seguimiento_especial: ''
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
        setJoven(jovenData)
        // Autocompletar datos del joven
        setFormData(prev => ({
          ...prev,
          nombre_nnaj: `${jovenData.nombres} ${jovenData.apellidos}`,
          edad: calcularEdad(jovenData.fecha_nacimiento),
          centro: jovenData.centros?.nombre || '',
          fecha_informe: new Date().toISOString().slice(0, 10)
        }))
      }
    } catch (error) {
      console.error('Error loading joven:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return ''
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad.toString()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre_nnaj.trim()) {
      newErrors.nombre_nnaj = 'El nombre del NNAJ es requerido'
    }

    if (!formData.pedagogo_informe.trim()) {
      newErrors.pedagogo_informe = 'El nombre del pedagogo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)

      // Guardar en la tabla de formularios pedagógicos
      const { error } = await supabase
        .from('formularios_pedagogicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'especial',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Informe especial pedagógico guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving informe especial:', error)
      alert('Error al guardar el informe especial pedagógico')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!joven) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Joven no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">El joven que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push('/dashboard/jovenes')}
            className="btn-primary"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary p-2"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Informe Especial Pedagógico</h1>
            <p className="text-gray-600 dark:text-gray-300">Programa de Medidas Sustitutivas a la Privación de Libertad (PMSPL)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos del Pedagogo */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Pedagogo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pedagogo/a que realiza el Informe *
                </label>
                <input
                  type="text"
                  name="pedagogo_informe"
                  value={formData.pedagogo_informe}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del pedagogo"
                />
                {errors.pedagogo_informe && (
                  <p className="text-red-500 text-sm mt-1">{errors.pedagogo_informe}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Informe
                </label>
                <input
                  type="date"
                  name="fecha_informe"
                  value={formData.fecha_informe}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Datos del NNAJ */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              I. Datos del NNAJ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_nnaj}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_nnaj: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
                        edad: calcularEdad(joven.fecha_nacimiento),
                        centro: joven.centros?.nombre || prev.centro
                      }))
                    }
                  }}
                  label="Nombre del NNAJ"
                  required
                  placeholder="Buscar joven por nombre..."
                  error={errors.nombre_nnaj}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edad
                </label>
                <input
                  type="text"
                  value={formData.edad}
                  className="input-field"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Centro
                </label>
                <input
                  type="text"
                  value={formData.centro}
                  className="input-field"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Motivo del Informe Especial */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Motivo del Informe Especial
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa el motivo del informe especial
              </label>
              <textarea
                name="motivo_informe"
                value={formData.motivo_informe}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa detalladamente el motivo que justifica la elaboración de este informe especial"
              />
            </div>
          </div>

          {/* Situación Actual */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Situación Actual
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la situación actual del NNAJ
              </label>
              <textarea
                name="situacion_actual"
                value={formData.situacion_actual}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa detalladamente la situación actual del NNAJ en el ámbito pedagógico"
              />
            </div>
          </div>

          {/* Evaluación Especializada */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Evaluación Especializada
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la evaluación especializada realizada
              </label>
              <textarea
                name="evaluacion_especializada"
                value={formData.evaluacion_especializada}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa la evaluación especializada realizada y sus resultados"
              />
            </div>
          </div>

          {/* Necesidades Educativas Especiales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Necesidades Educativas Especiales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las necesidades educativas especiales identificadas
              </label>
              <textarea
                name="necesidades_educativas_especiales"
                value={formData.necesidades_educativas_especiales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las necesidades educativas especiales del NNAJ"
              />
            </div>
          </div>

          {/* Adaptaciones Curriculares */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Adaptaciones Curriculares
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las adaptaciones curriculares necesarias
              </label>
              <textarea
                name="adaptaciones_curriculares"
                value={formData.adaptaciones_curriculares}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las adaptaciones curriculares que se requieren"
              />
            </div>
          </div>

          {/* Recursos Especializados */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Recursos Especializados
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los recursos especializados necesarios
              </label>
              <textarea
                name="recursos_especializados"
                value={formData.recursos_especializados}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa los recursos especializados que se requieren para la atención del NNAJ"
              />
            </div>
          </div>

          {/* Colaboración Interdisciplinaria */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Colaboración Interdisciplinaria
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la colaboración interdisciplinaria necesaria
              </label>
              <textarea
                name="colaboracion_interdisciplinaria"
                value={formData.colaboracion_interdisciplinaria}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa la colaboración necesaria con otros profesionales"
              />
            </div>
          </div>

          {/* Recomendaciones Especiales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Recomendaciones Especiales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las recomendaciones especiales
              </label>
              <textarea
                name="recomendaciones_especiales"
                value={formData.recomendaciones_especiales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones especiales para la atención del NNAJ"
              />
            </div>
          </div>

          {/* Seguimiento Especial */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Seguimiento Especial
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa el seguimiento especial requerido
              </label>
              <textarea
                name="seguimiento_especial"
                value={formData.seguimiento_especial}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa el seguimiento especial que se requiere para el NNAJ"
              />
            </div>
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Firma y Sello
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre y firma del pedagogo/a
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nombre y firma del pedagogo"
              />
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
              {saving ? 'Guardando...' : 'Guardar Informe Especial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
