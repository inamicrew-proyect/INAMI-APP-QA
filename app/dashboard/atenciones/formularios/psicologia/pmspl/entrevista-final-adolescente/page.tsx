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

export default function EntrevistaFinalAdolescentePage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Header Section
    pmspl_region: '',
    direccion: '',
    psicologo: '',
    fecha_entrevista: '',
    
    // I. Datos Identificativos
    joven_id: jovenId || '',
    nombre_apellidos: '',
    lugar_fecha_nacimiento: '',
    edad: '',
    numero_expediente_administrativo: '',
    numero_expediente_judicial: '',
    
    // Preguntas
    cambios_considera_tenido: '',
    como_programa_ha_ayudado: '',
    situacion_actual_nnaj: '',
    cumplimiento_medidas_estipuladas: '',
    logros_obtenidos: '',
    obstaculos_presentados: '',
    valoracion_profesional: '',
    
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
        TIPOS_FORMULARIOS.ENTREVISTA_FINAL_ADOLESCENTE_PMSPL
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_apellidos: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha_entrevista: new Date().toISOString().slice(0, 10),
          edad: jovenData.edad?.toString() || '',
          lugar_fecha_nacimiento: jovenData.fecha_nacimiento 
            ? `${jovenData.lugar_nacimiento || ''}, ${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}`
            : '',
          numero_expediente_administrativo: jovenData.numero_expediente_administrativo || '',
          numero_expediente_judicial: jovenData.numero_expediente_judicial || ''
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          setFormData({
            ...datosIniciales,
            ...formularioExistente.datos_json,
            joven_id: formularioExistente.joven_id || jovenId || ''
          })
        } else {
          setFormData(prev => ({
            ...prev,
            ...datosIniciales,
            joven_id: jovenId || prev.joven_id || ''
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
      
      console.log('FormData completo:', formData)
      console.log('joven_id en formData:', formData.joven_id)
      console.log('Tipo de joven_id:', typeof formData.joven_id)
      
      // Validar que se haya seleccionado un joven
      if (!formData.joven_id) {
        console.error('Error: joven_id no está definido en formData')
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre y apellidos" es obligatorio.')
        setSaving(false)
        return
      }

      // Convertir joven_id a string si es necesario
      const joven_id = String(formData.joven_id).trim()
      
      if (joven_id === '' || joven_id === 'undefined' || joven_id === 'null') {
        console.error('Error: joven_id está vacío o inválido:', joven_id)
        alert('Por favor, seleccione un joven desde el buscador. El campo "Nombre y apellidos" es obligatorio.')
        setSaving(false)
        return
      }

      // Validar que el tipo de formulario esté definido
      const tipoFormulario = TIPOS_FORMULARIOS.ENTREVISTA_FINAL_ADOLESCENTE_PMSPL
      if (!tipoFormulario) {
        alert('Error: Tipo de formulario no definido')
        setSaving(false)
        return
      }
      
      // Extraer joven_id del formData para no incluirlo en datos_json
      const { joven_id: _, ...datosFormulario } = formData
      
      // Preparar los datos del formulario
      const datosJson = {
        ...datosFormulario
      }

      // Validar que haya datos para guardar
      if (Object.keys(datosJson).length === 0) {
        alert('Error: No hay datos para guardar')
        setSaving(false)
        return
      }

      console.log('Guardando formulario:', {
        joven_id,
        tipo_formulario: tipoFormulario,
        datos_keys: Object.keys(datosJson),
        joven_id_type: typeof joven_id,
        joven_id_length: joven_id.length
      })
      
      await saveOrUpdateFormulario(
        joven_id,
        tipoFormulario,
        datosJson
      )
      
      alert('Formulario guardado exitosamente')
      router.push(`/dashboard/jovenes/${joven_id}/expediente`)
    } catch (error: any) {
      console.error('Error saving form:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      })
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
              ENTREVISTA PSICOLÓGICA FINAL PMSPL ADOLESCENTES Y JÓVENES
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Section */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PMSPL/Región
                </label>
                <input
                  type="text"
                  name="pmspl_region"
                  value={formData.pmspl_region}
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
                  Psicólogo/a *
                </label>
                <input
                  type="text"
                  name="psicologo"
                  value={formData.psicologo}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de la Entrevista *
                </label>
                <input
                  type="date"
                  name="fecha_entrevista"
                  value={formData.fecha_entrevista}
                  onChange={handleChange}
                  className="input-field"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <JovenSearchInput
                  value={formData.nombre_apellidos}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_apellidos: value }))}
                  onJovenSelect={(joven) => {
                    console.log('Joven seleccionado:', joven)
                    if (joven && joven.id) {
                      console.log('Estableciendo joven_id:', joven.id)
                      setFormData(prev => ({
                        ...prev,
                        joven_id: joven.id,
                        nombre_apellidos: `${joven.nombres} ${joven.apellidos}`,
                        edad: joven.edad?.toString() || prev.edad
                      }))
                      console.log('joven_id establecido en formData')
                    } else {
                      console.warn('Joven seleccionado sin ID:', joven)
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
                  className="input-field bg-blue-50 dark:bg-blue-900/30"
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
                  N° de Expediente
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
            </div>
          </div>

          {/* Preguntas de la Entrevista */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Preguntas de la Entrevista
            </h3>
            <div className="space-y-6">
              {/* Pregunta 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  1. Considerando su situación al ingresar al programa, hasta el día de hoy, ¿qué cambios considera que ha tenido?
                </label>
                <textarea
                  name="cambios_considera_tenido"
                  value={formData.cambios_considera_tenido}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los cambios que ha experimentado desde su ingreso al programa..."
                />
              </div>

              {/* Pregunta 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2. ¿Como cree usted que el programa le ha ayudado en el cumplimiento de este proceso?
                </label>
                <textarea
                  name="como_programa_ha_ayudado"
                  value={formData.como_programa_ha_ayudado}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa cómo el programa le ha ayudado..."
                />
              </div>

              {/* Pregunta 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3. Situación Actual del NNAJ:
                </label>
                <textarea
                  name="situacion_actual_nnaj"
                  value={formData.situacion_actual_nnaj}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa la situación actual del NNAJ..."
                />
              </div>

              {/* Pregunta 4 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  4. Cumplimiento en relación a las medidas estipuladas:
                </label>
                <textarea
                  name="cumplimiento_medidas_estipuladas"
                  value={formData.cumplimiento_medidas_estipuladas}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa el cumplimiento de las medidas estipuladas..."
                />
              </div>

              {/* Pregunta 5 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  5. Logros obtenidos:
                </label>
                <textarea
                  name="logros_obtenidos"
                  value={formData.logros_obtenidos}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los logros obtenidos durante el proceso..."
                />
              </div>

              {/* Pregunta 6 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  6. Obstáculos presentados durante el cumplimiento de las medidas:
                </label>
                <textarea
                  name="obstaculos_presentados"
                  value={formData.obstaculos_presentados}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa los obstáculos encontrados durante el cumplimiento de las medidas..."
                />
              </div>

              {/* Pregunta 7 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  7. Valoración profesional:
                </label>
                <textarea
                  name="valoracion_profesional"
                  value={formData.valoracion_profesional}
                  onChange={handleChange}
                  className="input-field"
                  rows={7}
                  placeholder="Describa la valoración profesional del caso..."
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
                  Psicólogo/a
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

