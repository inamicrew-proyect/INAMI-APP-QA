'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function RemisionInternaPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Top Section - CPI Information
    nombre_cpi: '',
    direccion_cpi: '',
    
    // Referral Details Section
    psicologo_remision: '',
    fecha_remision: '',
    area_atencion_deriva: '',
    profesional_deriva: '',
    
    // I. Datos Generales de el/la Adolescente o Joven
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    familiares_adultos_referencia: '',
    direccion: '',
    telefono: '',
    
    // II. Motivo de la Derivación y Atención Solicitada
    motivo_derivacion_atencion: '',
    
    // III. Observaciones
    observaciones: '',
    
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
          telefono: jovenData.telefono || ''
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
          tipo_formulario: 'remision_interna_cpi',
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
              FICHA DE REMISIÓN INTERNA CPI
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Section - CPI Information */}
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
            </div>
          </div>

          {/* Referral Details Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Área de Atención a la que deriva
                </label>
                <input
                  type="text"
                  name="area_atencion_deriva"
                  value={formData.area_atencion_deriva}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Trabajo Social, Educación, Salud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profesional a el/la que deriva
                </label>
                <input
                  type="text"
                  name="profesional_deriva"
                  value={formData.profesional_deriva}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del profesional"
                />
              </div>
            </div>
          </div>

          {/* I. Datos Generales de el/la Adolescente o Joven */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Generales de el/la Adolescente o Joven
            </h3>
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
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* II. Motivo de la Derivación y Atención Solicitada */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Motivo de la Derivación y Atención Solicitada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Demanda de intervención, problemáticas que se han detectado en el/la adolescente y/o joven atención requerida, etc.
            </p>
            <textarea
              name="motivo_derivacion_atencion"
              value={formData.motivo_derivacion_atencion}
              onChange={handleChange}
              className="input-field"
              rows={5}
              placeholder="Describa el motivo de la derivación y la atención solicitada..."
            />
          </div>

          {/* III. Observaciones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Observaciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
              Ejemplo: Observaciones relevantes en relación al adolescente o joven y su familia.
            </p>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              className="input-field"
              rows={6}
              placeholder="Describa las observaciones relevantes..."
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

