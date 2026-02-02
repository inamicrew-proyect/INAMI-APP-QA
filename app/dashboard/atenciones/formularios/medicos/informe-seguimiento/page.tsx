'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeSeguimientoPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Datos del joven (se autocompletan)
    nombre_nnaj: '',
    edad: '',
    centro_pedagogico: '',
    fecha: '',
    
    // Estado nutricional
    peso: '',
    talla: '',
    imc: '',
    
    // Estado de salud actual
    estado_salud_actual: '',
    
    // Información complementaria
    informacion_complementaria: '',
    
    // Resultados laboratorio clínico
    resultados_laboratorio: '',
    
    // Referencias y diagnóstico especializado
    referencias_diagnostico_especializado: '',
    
    // Diagnóstico odontológico
    diagnostico_odontologico: ''
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
          centro_pedagogico: jovenData.centros?.nombre || '',
          fecha: new Date().toISOString().slice(0, 10)
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

      // Guardar en la tabla de formularios médicos
      const { error } = await supabase
        .from('formularios_medicos')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'informe_seguimiento',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Informe de seguimiento guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving informe seguimiento:', error)
      alert('Error al guardar el informe de seguimiento')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Informe Médico de Seguimiento</h1>
            <p className="text-gray-600 dark:text-gray-300">Departamento de Salud y Bienestar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos del NNAJ */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del NNAJ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        centro_pedagogico: joven.centros?.nombre || prev.centro_pedagogico
                      }))
                    }
                  }}
                  label="Nombre NNAJ"
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
                  Centro Pedagógico de Internamiento
                </label>
                <input
                  type="text"
                  value={formData.centro_pedagogico}
                  className="input-field"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Estado Nutricional */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado Nutricional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Peso en kilogramos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Talla (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="talla"
                  value={formData.talla}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Talla en metros"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IMC (Kg/m²)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="imc"
                  value={formData.imc}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Índice de masa corporal"
                />
              </div>
            </div>
          </div>

          {/* Estado de Salud Actual */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado de Salud Actual
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa el estado de salud actual del paciente
              </label>
              <textarea
                name="estado_salud_actual"
                value={formData.estado_salud_actual}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa detalladamente el estado de salud actual, síntomas, signos vitales, etc."
              />
            </div>
          </div>

          {/* Información Complementaria */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información Complementaria
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Información complementaria relevante
              </label>
              <textarea
                name="informacion_complementaria"
                value={formData.informacion_complementaria}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya cualquier información complementaria relevante para el seguimiento médico"
              />
            </div>
          </div>

          {/* Resultados Laboratorio Clínico */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resultados Laboratorio Clínico
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resultados de laboratorio clínico
              </label>
              <textarea
                name="resultados_laboratorio"
                value={formData.resultados_laboratorio}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya resultados de análisis de sangre, orina, cultivos, etc."
              />
            </div>
          </div>

          {/* Referencias y Diagnóstico Especializado */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Referencias y Diagnóstico Especializado
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Referencias y diagnóstico especializado
              </label>
              <textarea
                name="referencias_diagnostico_especializado"
                value={formData.referencias_diagnostico_especializado}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya referencias a especialistas y diagnósticos especializados"
              />
            </div>
          </div>

          {/* Diagnóstico Odontológico */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Diagnóstico Odontológico
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diagnóstico odontológico
              </label>
              <textarea
                name="diagnostico_odontologico"
                value={formData.diagnostico_odontologico}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya diagnóstico y tratamiento odontológico"
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
                Firma y sello del Médico
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nombre, firma y sello del médico"
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
              {saving ? 'Guardando...' : 'Guardar Informe de Seguimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
