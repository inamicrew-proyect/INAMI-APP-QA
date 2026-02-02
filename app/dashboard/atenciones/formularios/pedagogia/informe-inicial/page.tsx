'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeInicialPedagogicoPage() {
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
    
    // Datos educativos
    nivel_escolar: '',
    grado_curso: '',
    institucion_educativa: '',
    rendimiento_academico: '',
    
    // Evaluación pedagógica
    habilidades_cognitivas: '',
    habilidades_sociales: '',
    habilidades_emocionales: '',
    areas_fortaleza: '',
    areas_mejora: '',
    
    // Plan de intervención
    objetivos_pedagogicos: '',
    estrategias_metodologicas: '',
    recursos_necesarios: '',
    tiempo_estimado: '',
    
    // Recomendaciones
    recomendaciones: ''
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
          tipo_formulario: 'informe_inicial',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Informe inicial pedagógico guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving informe inicial:', error)
      alert('Error al guardar el informe inicial pedagógico')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Informe Inicial Pedagógico</h1>
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
                        edad: joven.edad?.toString() || prev.edad
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

          {/* Datos Educativos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Datos Educativos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel Escolar
                </label>
                <select
                  name="nivel_escolar"
                  value={formData.nivel_escolar}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                  <option value="bachillerato">Bachillerato</option>
                  <option value="universidad">Universidad</option>
                  <option value="tecnico">Técnico</option>
                  <option value="ninguno">Ninguno</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grado/Curso
                </label>
                <input
                  type="text"
                  name="grado_curso"
                  value={formData.grado_curso}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Grado o curso actual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institución Educativa
                </label>
                <input
                  type="text"
                  name="institucion_educativa"
                  value={formData.institucion_educativa}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre de la institución educativa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rendimiento Académico
                </label>
                <select
                  name="rendimiento_academico"
                  value={formData.rendimiento_academico}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="excelente">Excelente</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="deficiente">Deficiente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Evaluación Pedagógica */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Evaluación Pedagógica
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Habilidades Cognitivas
                </label>
                <textarea
                  name="habilidades_cognitivas"
                  value={formData.habilidades_cognitivas}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las habilidades cognitivas observadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Habilidades Sociales
                </label>
                <textarea
                  name="habilidades_sociales"
                  value={formData.habilidades_sociales}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las habilidades sociales observadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Habilidades Emocionales
                </label>
                <textarea
                  name="habilidades_emocionales"
                  value={formData.habilidades_emocionales}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las habilidades emocionales observadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Áreas de Fortaleza
                </label>
                <textarea
                  name="areas_fortaleza"
                  value={formData.areas_fortaleza}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las áreas de fortaleza identificadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Áreas de Mejora
                </label>
                <textarea
                  name="areas_mejora"
                  value={formData.areas_mejora}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las áreas que requieren mejora"
                />
              </div>
            </div>
          </div>

          {/* Plan de Intervención */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Plan de Intervención
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetivos Pedagógicos
                </label>
                <textarea
                  name="objetivos_pedagogicos"
                  value={formData.objetivos_pedagogicos}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa los objetivos pedagógicos a alcanzar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estrategias Metodológicas
                </label>
                <textarea
                  name="estrategias_metodologicas"
                  value={formData.estrategias_metodologicas}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa las estrategias metodológicas a utilizar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recursos Necesarios
                </label>
                <textarea
                  name="recursos_necesarios"
                  value={formData.recursos_necesarios}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa los recursos necesarios para la intervención"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo Estimado
                </label>
                <input
                  type="text"
                  name="tiempo_estimado"
                  value={formData.tiempo_estimado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tiempo estimado para la intervención"
                />
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Recomendaciones
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones
              </label>
              <textarea
                name="recomendaciones"
                value={formData.recomendaciones}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones para el seguimiento pedagógico"
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
              {saving ? 'Guardando...' : 'Guardar Informe Inicial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
