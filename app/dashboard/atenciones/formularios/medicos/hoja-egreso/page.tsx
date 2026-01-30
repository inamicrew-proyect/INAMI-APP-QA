'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'

export default function HojaEgresoPage() {
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
    identidad: '',
    fecha_ingreso: '',
    edad: '',
    fecha_egreso: '',
    
    // Estado del paciente al egreso
    estado_paciente: 'asintomatico', // asintomatico o sintomatico
    descripcion_sintomas: '',
    
    // Condición médica/psiquiátrica
    condicion_medica: 'no', // si o no
    descripcion_condicion: '',
    
    // Diagnóstico
    diagnostico_1: '',
    diagnostico_2: '',
    diagnostico_3: '',
    diagnostico_4: '',
    
    // Toxicología
    toxicologia: '',
    
    // Estado vacunal
    covid_1_dosis: false,
    covid_2_dosis: false,
    covid_1er_ref: false,
    covid_2do_ref: false,
    covid_ninguna: false,
    
    influenza_si: false,
    influenza_no: false,
    
    otras_vacunas: '',
    
    // Estado nutricional
    estado_nutricional: 'eutrofico', // desnutricion, eutrofico, sobrepeso, obesidad
    imc_desnutricion: '',
    imc_eutrofico: '',
    imc_sobrepeso: '',
    imc_obesidad: '',
    
    // Tratamiento al egreso
    tratamiento_1: '',
    tratamiento_2: '',
    tratamiento_3: '',
    tratamiento_4: '',
    
    // Citas
    cita_1: '',
    cita_2: '',
    
    // Recomendaciones
    recomendacion_1: '',
    recomendacion_2: '',
    recomendacion_3: '',
    recomendacion_4: '',
    
    // Diagnóstico odontológico
    diagnostico_odontologico_1: '',
    diagnostico_odontologico_2: '',
    diagnostico_odontologico_3: '',
    diagnostico_odontologico_4: '',
    
    // Observaciones
    observacion_1: '',
    observacion_2: '',
    observacion_3: '',
    observacion_4: ''
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
          identidad: jovenData.identidad || '',
          fecha_ingreso: jovenData.fecha_ingreso || '',
          edad: calcularEdad(jovenData.fecha_nacimiento),
          fecha_egreso: new Date().toISOString().slice(0, 10)
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
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
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
          tipo_formulario: 'hoja_egreso',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Hoja de egreso guardada exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving hoja egreso:', error)
      alert('Error al guardar la hoja de egreso')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hoja de Egreso</h1>
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
                  Nombre NNJA *
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
                  Identidad
                </label>
                <input
                  type="text"
                  name="identidad"
                  value={formData.identidad}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de identidad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Ingreso
                </label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formData.fecha_ingreso}
                  onChange={handleChange}
                  className="input-field"
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
                  Fecha Egreso
                </label>
                <input
                  type="date"
                  name="fecha_egreso"
                  value={formData.fecha_egreso}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Estado del Paciente al Egreso */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado del Paciente al Egreso
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado del paciente
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="estado_paciente"
                      value="asintomatico"
                      checked={formData.estado_paciente === 'asintomatico'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Asintomático
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="estado_paciente"
                      value="sintomatico"
                      checked={formData.estado_paciente === 'sintomatico'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sintomático
                  </label>
                </div>
              </div>
              {formData.estado_paciente === 'sintomatico' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de síntomas
                  </label>
                  <textarea
                    name="descripcion_sintomas"
                    value={formData.descripcion_sintomas}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa los síntomas presentes al egreso"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Condición Médica/Psiquiátrica */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Condición Médica/Psiquiátrica
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Presenta condición médica/psiquiátrica?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="condicion_medica"
                      value="si"
                      checked={formData.condicion_medica === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="condicion_medica"
                      value="no"
                      checked={formData.condicion_medica === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              {formData.condicion_medica === 'si' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de la condición
                  </label>
                  <textarea
                    name="descripcion_condicion"
                    value={formData.descripcion_condicion}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa la condición médica o psiquiátrica"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Diagnóstico
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diagnóstico {num}
                  </label>
                  <input
                    type="text"
                    name={`diagnostico_${num}`}
                    value={formData[`diagnostico_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Diagnóstico ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Toxicología */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Toxicología
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resultados toxicológicos
              </label>
              <input
                type="text"
                name="toxicologia"
                value={formData.toxicologia}
                onChange={handleChange}
                className="input-field"
                placeholder="Resultados de pruebas toxicológicas"
              />
            </div>
          </div>

          {/* Estado Vacunal */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado Vacunal
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">COVID-19</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="covid_1_dosis"
                      checked={formData.covid_1_dosis}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    1 Dosis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="covid_2_dosis"
                      checked={formData.covid_2_dosis}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    2 Dosis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="covid_1er_ref"
                      checked={formData.covid_1er_ref}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    1er Ref
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="covid_2do_ref"
                      checked={formData.covid_2do_ref}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    2do Ref
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="covid_ninguna"
                      checked={formData.covid_ninguna}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Ninguna
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">INFLUENZA</h4>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="influenza_si"
                      checked={formData.influenza_si}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="influenza_no"
                      checked={formData.influenza_no}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Otras vacunas
                </label>
                <input
                  type="text"
                  name="otras_vacunas"
                  value={formData.otras_vacunas}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Especifique otras vacunas recibidas"
                />
              </div>
            </div>
          </div>

          {/* Estado Nutricional */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado Nutricional
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado nutricional
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: 'desnutricion', label: 'Desnutrición' },
                    { value: 'eutrofico', label: 'Eutrófico' },
                    { value: 'sobrepeso', label: 'Sobrepeso' },
                    { value: 'obesidad', label: 'Obesidad' }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center">
                      <input
                        type="radio"
                        name="estado_nutricional"
                        value={value}
                        checked={formData.estado_nutricional === value}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMC Desnutrición
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="imc_desnutricion"
                    value={formData.imc_desnutricion}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="IMC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMC Eutrófico
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="imc_eutrofico"
                    value={formData.imc_eutrofico}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="IMC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMC Sobrepeso
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="imc_sobrepeso"
                    value={formData.imc_sobrepeso}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="IMC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMC Obesidad
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="imc_obesidad"
                    value={formData.imc_obesidad}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="IMC"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tratamiento al Egreso */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tratamiento al Egreso
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tratamiento {num}
                  </label>
                  <input
                    type="text"
                    name={`tratamiento_${num}`}
                    value={formData[`tratamiento_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Tratamiento ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Citas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Citas
            </h3>
            <div className="space-y-4">
              {[1, 2].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cita {num}
                  </label>
                  <input
                    type="text"
                    name={`cita_${num}`}
                    value={formData[`cita_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Detalles de la cita ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recomendaciones
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recomendación {num}
                  </label>
                  <input
                    type="text"
                    name={`recomendacion_${num}`}
                    value={formData[`recomendacion_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Recomendación ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Diagnóstico Odontológico */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Diagnóstico Odontológico
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Diagnóstico Odontológico {num}
                  </label>
                  <input
                    type="text"
                    name={`diagnostico_odontologico_${num}`}
                    value={formData[`diagnostico_odontologico_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Diagnóstico odontológico ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observaciones
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observación {num}
                  </label>
                  <input
                    type="text"
                    name={`observacion_${num}`}
                    value={formData[`observacion_${num}` as keyof typeof formData] as string}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={`Observación ${num}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Firma y Sello
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Médico de Turno
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nombre y firma del médico"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Médico CPI
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nombre y firma del médico CPI"
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
              {saving ? 'Guardando...' : 'Guardar Hoja de Egreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
