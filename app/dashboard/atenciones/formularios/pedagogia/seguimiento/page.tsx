'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function SeguimientoPedagogicoPage() {
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
    
    // Período de seguimiento
    periodo_seguimiento: '',
    
    // Actividades realizadas
    actividades_realizadas: '',
    
    // Progreso observado
    progreso_observado: '',
    
    // Dificultades encontradas
    dificultades_encontradas: '',
    
    // Estrategias utilizadas
    estrategias_utilizadas: '',
    
    // Participación del NNAJ
    participacion_nnaj: '',
    
    // Colaboración familiar
    colaboracion_familiar: '',
    
    // Objetivos alcanzados
    objetivos_alcanzados: '',
    
    // Objetivos pendientes
    objetivos_pendientes: '',
    
    // Recomendaciones
    recomendaciones: '',
    
    // Próximas acciones
    proximas_acciones: ''
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
          tipo_formulario: 'seguimiento',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Informe de seguimiento pedagógico guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving seguimiento pedagogico:', error)
      alert('Error al guardar el informe de seguimiento pedagógico')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Informe de Seguimiento Pedagógico</h1>
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

          {/* Período de Seguimiento */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Período de Seguimiento
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período de Seguimiento
              </label>
              <input
                type="text"
                name="periodo_seguimiento"
                value={formData.periodo_seguimiento}
                onChange={handleChange}
                className="input-field"
                placeholder="Ej: Del 1 de enero al 31 de marzo de 2024"
              />
            </div>
          </div>

          {/* Actividades Realizadas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Actividades Realizadas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las actividades realizadas durante el período
              </label>
              <textarea
                name="actividades_realizadas"
                value={formData.actividades_realizadas}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa detalladamente las actividades pedagógicas realizadas"
              />
            </div>
          </div>

          {/* Progreso Observado */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Progreso Observado
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa el progreso observado en el NNAJ
              </label>
              <textarea
                name="progreso_observado"
                value={formData.progreso_observado}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa los avances y progresos observados en el NNAJ"
              />
            </div>
          </div>

          {/* Dificultades Encontradas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Dificultades Encontradas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las dificultades encontradas
              </label>
              <textarea
                name="dificultades_encontradas"
                value={formData.dificultades_encontradas}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las dificultades o obstáculos encontrados durante el seguimiento"
              />
            </div>
          </div>

          {/* Estrategias Utilizadas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Estrategias Utilizadas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las estrategias utilizadas para superar las dificultades
              </label>
              <textarea
                name="estrategias_utilizadas"
                value={formData.estrategias_utilizadas}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las estrategias pedagógicas utilizadas"
              />
            </div>
          </div>

          {/* Participación del NNAJ */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Participación del NNAJ
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la participación del NNAJ en las actividades
              </label>
              <textarea
                name="participacion_nnaj"
                value={formData.participacion_nnaj}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Describa el nivel de participación y compromiso del NNAJ"
              />
            </div>
          </div>

          {/* Colaboración Familiar */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Colaboración Familiar
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la colaboración de la familia
              </label>
              <textarea
                name="colaboracion_familiar"
                value={formData.colaboracion_familiar}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Describa el nivel de colaboración y apoyo de la familia"
              />
            </div>
          </div>

          {/* Objetivos Alcanzados */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Objetivos Alcanzados
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los objetivos alcanzados
              </label>
              <textarea
                name="objetivos_alcanzados"
                value={formData.objetivos_alcanzados}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Describa los objetivos pedagógicos que se han alcanzado"
              />
            </div>
          </div>

          {/* Objetivos Pendientes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Objetivos Pendientes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los objetivos pendientes
              </label>
              <textarea
                name="objetivos_pendientes"
                value={formData.objetivos_pendientes}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Describa los objetivos que aún están pendientes de alcanzar"
              />
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XI. Recomendaciones
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones para el seguimiento
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

          {/* Próximas Acciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XII. Próximas Acciones
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa las próximas acciones a realizar
              </label>
              <textarea
                name="proximas_acciones"
                value={formData.proximas_acciones}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las acciones que se realizarán en el próximo período"
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
              {saving ? 'Guardando...' : 'Guardar Seguimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
