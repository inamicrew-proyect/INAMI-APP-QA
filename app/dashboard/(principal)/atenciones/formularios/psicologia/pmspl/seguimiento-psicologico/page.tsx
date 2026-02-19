'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  getUltimoFormulario, 
  saveOrUpdateFormulario,
  TIPOS_FORMULARIOS 
} from '@/lib/formularios-psicologicos'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function SeguimientoPsicologicoPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Top Section
    region: '',
    fecha_atencion: '',
    
    // I. Datos Identificativos
    nombre_nnaj: '',
    modalidad_intervencion: '',
    numero_sesion: '',
    
    // I. Contenido de la Sesión
    contenido_sesion: '',
    
    // II. Actitud y grado de implicación
    actitud_grado_implicacion: '',
    
    // III. Avances mostrados
    avances_mostrados: '',
    
    // IV. Obstáculos encontrados
    obstaculos_encontrados: '',
    
    // Próxima sesión
    proxima_sesion: '',
    
    // Firma
    nombre_firma_psicologo: '',
    colegiacion: ''
  })

  useEffect(() => {
    if (jovenId) {
      loadData()
    }
  }, [jovenId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos del joven
      const { data: jovenData, error: jovenError } = await supabase
        .from('jovenes')
        .select(`
          *,
          centros!inner(nombre)
        `)
        .eq('id', jovenId)
        .single()

      if (jovenError) throw jovenError

      // Cargar formulario existente si existe
      const formularioExistente = await getUltimoFormulario(
        jovenId,
        TIPOS_FORMULARIOS.SEGUIMIENTO_PSICOLOGICO
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_nnaj: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_atencion: new Date().toISOString().slice(0, 10)
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          setFormData({
            ...datosIniciales,
            ...formularioExistente.datos_json
          })
        } else {
          setFormData(prev => ({
            ...prev,
            ...datosIniciales
          }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
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

  const handleModalidadChange = (modalidad: string) => {
    setFormData(prev => ({ ...prev, modalidad_intervencion: modalidad }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      await saveOrUpdateFormulario(
        jovenId,
        TIPOS_FORMULARIOS.SEGUIMIENTO_PSICOLOGICO,
        formData
      )
      
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(error.message || 'Error al guardar el formulario')
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
              FICHA DE SEGUIMIENTO PSICOLÓGICO
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              PROGRAMA DE MEDIDAS SUSTITUTIVAS (PMSPL)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Región
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Atención *
                </label>
                <input
                  type="date"
                  name="fecha_atencion"
                  value={formData.fecha_atencion}
                  onChange={handleChange}
                  className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* I. Datos Identificativos */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700">
              I. Datos Identificativos
            </h3>
            <div className="space-y-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_nnaj}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_nnaj: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`
                      }))
                    }
                  }}
                  label="Nombre de NNAJ"
                  required
                  placeholder="Buscar joven por nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalidad de Intervención
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modalidad_intervencion"
                      value="individual"
                      checked={formData.modalidad_intervencion === 'individual'}
                      onChange={() => handleModalidadChange('individual')}
                      className="mr-2"
                    />
                    <span className="text-sm">Individual</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modalidad_intervencion"
                      value="familiar"
                      checked={formData.modalidad_intervencion === 'familiar'}
                      onChange={() => handleModalidadChange('familiar')}
                      className="mr-2"
                    />
                    <span className="text-sm">Familiar</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modalidad_intervencion"
                      value="grupal"
                      checked={formData.modalidad_intervencion === 'grupal'}
                      onChange={() => handleModalidadChange('grupal')}
                      className="mr-2"
                    />
                    <span className="text-sm">Grupal</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="modalidad_intervencion"
                      value="crisis"
                      checked={formData.modalidad_intervencion === 'crisis'}
                      onChange={() => handleModalidadChange('crisis')}
                      className="mr-2"
                    />
                    <span className="text-sm">Crisis</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  N.º de Sesión
                </label>
                <input
                  type="text"
                  name="numero_sesion"
                  value={formData.numero_sesion}
                  onChange={handleChange}
                  className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* I. Contenido de la Sesión */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700">
              I. Contenido de la Sesión
            </h3>
            <textarea
              name="contenido_sesion"
              value={formData.contenido_sesion}
              onChange={handleChange}
              className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              rows={12}
              placeholder="Describa el contenido de la sesión..."
            />
          </div>

          {/* II. Actitud y grado de implicación */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700">
              II. Actitud y grado de implicación
            </h3>
            <textarea
              name="actitud_grado_implicacion"
              value={formData.actitud_grado_implicacion}
              onChange={handleChange}
              className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              rows={4}
              placeholder="Describa la actitud y grado de implicación del NNAJ..."
            />
          </div>

          {/* III. Avances mostrados */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700">
              III. Avances mostrados
            </h3>
            <textarea
              name="avances_mostrados"
              value={formData.avances_mostrados}
              onChange={handleChange}
              className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              rows={3}
              placeholder="Describa los avances mostrados..."
            />
          </div>

          {/* IV. Obstáculos encontrados */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700">
              IV. Obstáculos encontrados
            </h3>
            <textarea
              name="obstaculos_encontrados"
              value={formData.obstaculos_encontrados}
              onChange={handleChange}
              className="input-field border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              rows={4}
              placeholder="Describa los obstáculos encontrados..."
            />
          </div>

          {/* Próxima sesión */}
          <div className="card border-orange-300">
            <div className="flex items-center gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Próxima sesión:
              </label>
              <input
                type="text"
                name="proxima_sesion"
                value={formData.proxima_sesion}
                onChange={handleChange}
                className="input-field flex-1 border-orange-300 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Fecha y detalles de la próxima sesión..."
              />
            </div>
          </div>

          {/* Firma */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firma y Sello</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre y firma del psicólogo/a
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
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Programa de Medidas Sustitutivas a la Privación de Libertad
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                INAMI
              </p>
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

