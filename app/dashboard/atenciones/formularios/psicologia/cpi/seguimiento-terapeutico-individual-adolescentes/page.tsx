'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function SeguimientoTerapeuticoIndividualAdolescentesPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Header Section
    nombre_cpi: '',
    psicologo_intervencion: '',
    fecha: '',
    
    // I. Datos Personales y de Intervención
    nombre_apellidos: '',
    fecha_nacimiento_edad: '',
    tipo_modalidad_intervencion: '',
    fecha_sesion: '',
    numero_sesion: '',
    
    // Session Content
    contenido_sesion: '',
    aspectos_trabajados: '',
    tecnicas_empleadas: '',
    actitud_grado_implicacion: '',
    logros_sesion: '',
    
    // Other observations and obstacles
    otras_observaciones: '',
    obstaculos_encontrados: '',
    
    // Next session
    proxima_sesion: '',
    
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
          fecha: new Date().toISOString().slice(0, 10),
          fecha_sesion: new Date().toISOString().slice(0, 10),
          fecha_nacimiento_edad: jovenData.fecha_nacimiento 
            ? `${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}, ${jovenData.edad || ''} años`
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
          tipo_formulario: 'seguimiento_terapeutico_individual_adolescentes_cpi',
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
              FICHA DE SEGUIMIENTO TERAPÉUTICO INDIVIDUAL CPI ADOLESCENTES/JÓVENES
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Psicólogo/a que realiza la Intervención *
                </label>
                <input
                  type="text"
                  name="psicologo_intervencion"
                  value={formData.psicologo_intervencion}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* I. Datos Personales y de Intervención */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Personales y de Intervención
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
                    Fecha de nacimiento y edad
                  </label>
                  <input
                    type="text"
                    name="fecha_nacimiento_edad"
                    value={formData.fecha_nacimiento_edad}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: 15/03/2005, 18 años"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo o Modalidad de Intervención
                  </label>
                  <input
                    type="text"
                    name="tipo_modalidad_intervencion"
                    value={formData.tipo_modalidad_intervencion}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ej: Terapia individual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha de la Sesión *
                  </label>
                  <input
                    type="date"
                    name="fecha_sesion"
                    value={formData.fecha_sesion}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nº de Sesión
                  </label>
                  <input
                    type="text"
                    name="numero_sesion"
                    value={formData.numero_sesion}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Content Section */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Contenido de la Sesión
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspectos trabajados
                </label>
                <textarea
                  name="aspectos_trabajados"
                  value={formData.aspectos_trabajados}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa los aspectos trabajados..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Técnicas empleadas
                </label>
                <textarea
                  name="tecnicas_empleadas"
                  value={formData.tecnicas_empleadas}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa las técnicas empleadas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actitud y grado de implicación
                </label>
                <textarea
                  name="actitud_grado_implicacion"
                  value={formData.actitud_grado_implicacion}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa la actitud y grado de implicación..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logros de la sesión
                </label>
                <textarea
                  name="logros_sesion"
                  value={formData.logros_sesion}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa los logros de la sesión..."
                />
              </div>
            </div>
          </div>

          {/* Other observations and obstacles */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Otras observaciones: (estado anímico, aspecto físico, comunicación no verbal, etc).
                </label>
                <textarea
                  name="otras_observaciones"
                  value={formData.otras_observaciones}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa otras observaciones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Obstáculos encontrados:
                </label>
                <textarea
                  name="obstaculos_encontrados"
                  value={formData.obstaculos_encontrados}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa los obstáculos encontrados..."
                />
              </div>
            </div>
          </div>

          {/* Next session */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Próxima sesión:
                </label>
                <input
                  type="text"
                  name="proxima_sesion"
                  value={formData.proxima_sesion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Describa detalles de la próxima sesión..."
                />
              </div>
            </div>
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

