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

export default function InformeFinalPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Header Section
    region: '',
    direccion: '',
    fecha_elaboracion_informe: '',
    
    // I. Datos Identificativos
    nombre_completo: '',
    ocupacion_actual: '',
    edad: '',
    numero_expediente_administrativo: '',
    numero_expediente_judicial: '',
    otras_medidas_judiciales: '',
    
    // II. Síntesis de Impresión Diagnóstica
    sintesis_impresion_diagnostica: '',
    
    // III. Desarrollo de la Intervención
    desarrollo_intervencion: '',
    
    // IV. Logros alcanzados
    logros_alcanzados: '',
    
    // V. Obstáculos presentados
    obstaculos_presentados: '',
    
    // VI. Coordinación Interna y/o Externa
    coordinacion_interna_externa: '',
    
    // VII. Conclusiones
    conclusiones: '',
    
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
        TIPOS_FORMULARIOS.INFORME_FINAL_PMSPL
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_completo: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_elaboracion_informe: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          ocupacion_actual: jovenData.ocupacion || '',
          numero_expediente_administrativo: jovenData.expediente_administrativo || '',
          numero_expediente_judicial: jovenData.expediente_judicial || ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      await saveOrUpdateFormulario(
        jovenId,
        TIPOS_FORMULARIOS.INFORME_FINAL_PMSPL,
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
              INFORME PSICOLÓGICO FINAL
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              PROGRAMA DE MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD (PMSPL)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Región
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
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
                  Fecha de Elaboración de informe *
                </label>
                <input
                  type="date"
                  name="fecha_elaboracion_informe"
                  value={formData.fecha_elaboracion_informe}
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
                <JovenSearchInput
                  value={formData.nombre_completo}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                    }
                  }}
                  label="Nombre completo"
                  required
                  placeholder="Buscar joven por nombre..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ocupación actual
                </label>
                <input
                  type="text"
                  name="ocupacion_actual"
                  value={formData.ocupacion_actual}
                  onChange={handleChange}
                  className="input-field"
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
                  N.º de Expediente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Administrativo
                    </label>
                    <input
                      type="text"
                      name="numero_expediente_administrativo"
                      value={formData.numero_expediente_administrativo}
                      onChange={handleChange}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Judicial
                    </label>
                    <input
                      type="text"
                      name="numero_expediente_judicial"
                      value={formData.numero_expediente_judicial}
                      onChange={handleChange}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Otra/s medida/s judicial/es en cumplimiento o por cumplir o Egreso del Sistema de Justicia
                </label>
                <textarea
                  name="otras_medidas_judiciales"
                  value={formData.otras_medidas_judiciales}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa otras medidas judiciales o egreso del sistema..."
                />
              </div>
            </div>
          </div>

          {/* II. Síntesis de Impresión Diagnóstica */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              II. Síntesis de Impresión Diagnóstica
            </h3>
            <textarea
              name="sintesis_impresion_diagnostica"
              value={formData.sintesis_impresion_diagnostica}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa la síntesis de la impresión diagnóstica..."
            />
          </div>

          {/* III. Desarrollo de la Intervención */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              III. Desarrollo de la Intervención
            </h3>
            <textarea
              name="desarrollo_intervencion"
              value={formData.desarrollo_intervencion}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa el desarrollo de la intervención..."
            />
          </div>

          {/* IV. Logros alcanzados */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              IV. Logros alcanzados
            </h3>
            <textarea
              name="logros_alcanzados"
              value={formData.logros_alcanzados}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa los logros alcanzados..."
            />
          </div>

          {/* V. Obstáculos presentados */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              V. Obstáculos presentados
            </h3>
            <textarea
              name="obstaculos_presentados"
              value={formData.obstaculos_presentados}
              onChange={handleChange}
              className="input-field"
              rows={10}
              placeholder="Describa los obstáculos presentados..."
            />
          </div>

          {/* VI. Coordinación Interna y/o Externa */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VI. Coordinación Interna y/o Externa
            </h3>
            <textarea
              name="coordinacion_interna_externa"
              value={formData.coordinacion_interna_externa}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa la coordinación interna y/o externa..."
            />
          </div>

          {/* VII. Conclusiones */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              VII. Conclusiones
            </h3>
            <textarea
              name="conclusiones"
              value={formData.conclusiones}
              onChange={handleChange}
              className="input-field"
              rows={8}
              placeholder="Describa las conclusiones..."
            />
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

