'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'

export default function HistoriaClinicaPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Datos del joven (se autocompletan)
    nombre_completo: '',
    fecha_nacimiento: '',
    edad: '',
    centro: '',
    fecha_ingreso: '',
    
    // Antecedentes personales patológicos
    antecedentes_patologicos: '',
    
    // Antecedentes traumáticos quirúrgicos
    antecedentes_quirurgicos: '',
    
    // Antecedentes inmunoalergénicos y toxicológicos
    antecedentes_inmunoalergenicos: '',
    antecedentes_toxicologicos: '',
    
    // Antecedentes psiquiátricos
    antecedentes_psiquiatricos: '',
    
    // Inmunizaciones
    vacunas_recibidas: '',
    fecha_ultima_vacuna: '',
    
    // Antecedentes gineco-obstétricos (para mujeres)
    vida_sexual_activa: '',
    embarazos: '',
    partos: '',
    cesareas: '',
    abortos: '',
    hijos_vivos: '',
    hijos_muertos: '',
    fecha_ultima_regla: '',
    anticoncepcion_anterior: '',
    menarquia: '',
    
    // Historia actual de la enfermedad
    historia_actual_enfermedad: ''
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
          nombre_completo: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_nacimiento: jovenData.fecha_nacimiento || '',
          edad: calcularEdad(jovenData.fecha_nacimiento),
          centro: jovenData.centros?.nombre || '',
          fecha_ingreso: jovenData.fecha_ingreso || ''
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

    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido'
    }

    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida'
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
          tipo_formulario: 'historia_clinica',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Historia clínica guardada exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving historia clinica:', error)
      alert('Error al guardar la historia clínica')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historia Clínica CPI</h1>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre completo del NNAJ"
                  disabled
                />
                {errors.nombre_completo && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre_completo}</p>
                )}
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
                  value={formData.centro}
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
                  className="input-field"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          </div>

          {/* Antecedentes Personales Patológicos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Antecedentes Personales Patológicos
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los antecedentes patológicos del paciente
              </label>
              <textarea
                name="antecedentes_patologicos"
                value={formData.antecedentes_patologicos}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya enfermedades previas, hospitalizaciones, cirugías, etc."
              />
            </div>
          </div>

          {/* Antecedentes Traumáticos Quirúrgicos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Antecedentes Traumáticos Quirúrgicos
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los antecedentes traumáticos y quirúrgicos
              </label>
              <textarea
                name="antecedentes_quirurgicos"
                value={formData.antecedentes_quirurgicos}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Incluya accidentes, traumas, cirugías previas, etc."
              />
            </div>
          </div>

          {/* Antecedentes Inmunoalergénicos y Toxicológicos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Antecedentes Inmunoalergénicos y Toxicológicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inmunoalergénicos
                </label>
                <textarea
                  name="antecedentes_inmunoalergenicos"
                  value={formData.antecedentes_inmunoalergenicos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Alergias, reacciones adversas, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Toxicológicos
                </label>
                <textarea
                  name="antecedentes_toxicologicos"
                  value={formData.antecedentes_toxicologicos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Consumo de sustancias, intoxicaciones, etc."
                />
              </div>
            </div>
          </div>

          {/* Antecedentes Psiquiátricos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Antecedentes Psiquiátricos
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa los antecedentes psiquiátricos
              </label>
              <textarea
                name="antecedentes_psiquiatricos"
                value={formData.antecedentes_psiquiatricos}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Trastornos mentales, tratamientos psiquiátricos, etc."
              />
            </div>
          </div>

          {/* Inmunizaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Inmunizaciones (Vacunas)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vacunas Recibidas
                </label>
                <textarea
                  name="vacunas_recibidas"
                  value={formData.vacunas_recibidas}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste las vacunas recibidas y fechas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Última Vacuna
                </label>
                <input
                  type="date"
                  name="fecha_ultima_vacuna"
                  value={formData.fecha_ultima_vacuna}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Antecedentes Gineco-obstétricos (solo para mujeres) */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Antecedentes Gineco-obstétricos (CPI - Sagrado Corazón)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vida Sexual Activa
                </label>
                <select
                  name="vida_sexual_activa"
                  value={formData.vida_sexual_activa}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Última Regla
                </label>
                <input
                  type="date"
                  name="fecha_ultima_regla"
                  value={formData.fecha_ultima_regla}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  G (Gravidez)
                </label>
                <input
                  type="text"
                  name="embarazos"
                  value={formData.embarazos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de embarazos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  P (Partos)
                </label>
                <input
                  type="text"
                  name="partos"
                  value={formData.partos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de partos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  C (Cesáreas)
                </label>
                <input
                  type="text"
                  name="cesareas"
                  value={formData.cesareas}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de cesáreas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ab (Abortos)
                </label>
                <input
                  type="text"
                  name="abortos"
                  value={formData.abortos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de abortos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HV (Hijos Vivos)
                </label>
                <input
                  type="text"
                  name="hijos_vivos"
                  value={formData.hijos_vivos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de hijos vivos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HM (Hijos Muertos)
                </label>
                <input
                  type="text"
                  name="hijos_muertos"
                  value={formData.hijos_muertos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de hijos muertos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Antecedentes de Anticoncepción
                </label>
                <input
                  type="text"
                  name="anticoncepcion_anterior"
                  value={formData.anticoncepcion_anterior}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Métodos anticonceptivos utilizados"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Menarquia
                </label>
                <input
                  type="text"
                  name="menarquia"
                  value={formData.menarquia}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Edad de la primera menstruación"
                />
              </div>
            </div>
          </div>

          {/* Historia Actual de la Enfermedad */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Historia Actual de la Enfermedad (HEA)
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describa la historia actual de la enfermedad
              </label>
              <textarea
                name="historia_actual_enfermedad"
                value={formData.historia_actual_enfermedad}
                onChange={handleChange}
                className="input-field"
                rows={6}
                placeholder="Describa detalladamente la historia actual de la enfermedad, síntomas, evolución, etc."
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
              {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
