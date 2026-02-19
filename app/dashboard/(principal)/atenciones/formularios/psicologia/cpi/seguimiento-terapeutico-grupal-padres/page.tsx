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

export default function SeguimientoTerapeuticoGrupalPadresPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // General Information
    nombre_cpi: '',
    psicologo_intervencion: '',
    fecha: '',
    
    // I. Datos Identificativos Personales, Judiciales y Familiares
    joven_id: jovenId || '',
    nombre_apellidos: '',
    fecha_nacimiento_edad: '',
    nombre_madre_padre_responsables: '',
    
    // Session Details
    tipo_grupo: '',
    tema_sesion: '',
    numero_sesion: '',
    fecha_sesion: '',
    
    // Observation and Evaluation
    descripcion_actividad: '',
    actitud_grado_implicacion: '',
    avances_mostrados: '',
    obstaculos_encontrados: '',
    otras_observaciones: '',
    
    // Recommendations and next session
    recomendaciones: '',
    proxima_sesion: '',
    
    // Firma
    nombre_firma_psicologo: '',
    numero_colegiado: ''
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
        TIPOS_FORMULARIOS.SEGUIMIENTO_TERAPEUTICO_GRUPAL_PADRES
      )

      if (jovenData) {
        const datosIniciales: any = {
          nombre_apellidos: `${jovenData.nombres} ${jovenData.apellidos}`,
          fecha: new Date().toISOString().slice(0, 10),
          fecha_sesion: new Date().toISOString().slice(0, 10),
          fecha_nacimiento_edad: jovenData.fecha_nacimiento 
            ? `${new Date(jovenData.fecha_nacimiento).toLocaleDateString('es-HN')}, ${jovenData.edad || ''} años`
            : ''
        }

        // Si hay un formulario existente, cargar sus datos
        if (formularioExistente && formularioExistente.datos_json) {
          const datosCargados = formularioExistente.datos_json as any
          setFormData({
            ...datosIniciales,
            ...datosCargados,
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
      const tipoFormulario = TIPOS_FORMULARIOS.SEGUIMIENTO_TERAPEUTICO_GRUPAL_PADRES
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
              FICHA DE SEGUIMIENTO TERAPÉUTICO GRUPAL CPI MADRES/PADRES/OTROS/AS FAMILIARES O ENCARGADOS
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Information Section */}
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

          {/* I. Datos Identificativos Personales, Judiciales y Familiares */}
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2 border-blue-200 dark:border-blue-700 bg-blue-100 dark:bg-blue-800/50 px-4 py-2 -mx-4 -mt-4 rounded-t-lg">
              I. Datos Identificativos Personales, Judiciales y Familiares
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
                        fecha_nacimiento_edad: joven.fecha_nacimiento 
                          ? `${new Date(joven.fecha_nacimiento).toLocaleDateString('es-HN')}, ${joven.edad || ''} años`
                          : prev.fecha_nacimiento_edad
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la madre/padre o Responsables
                </label>
                <input
                  type="text"
                  name="nombre_madre_padre_responsables"
                  value={formData.nombre_madre_padre_responsables}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Detalles de la Sesión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Grupo
                </label>
                <input
                  type="text"
                  name="tipo_grupo"
                  value={formData.tipo_grupo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Describa el tipo de grupo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tema de la Sesión
                </label>
                <input
                  type="text"
                  name="tema_sesion"
                  value={formData.tema_sesion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Describa el tema de la sesión..."
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
            </div>
          </div>

          {/* Observation and Evaluation Section */}
          <div className="card">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Observación y Evaluación
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción de la actividad, principales objetivos, aspectos trabajados y técnicas empleadas en su desarrollo:
                </label>
                <textarea
                  name="descripcion_actividad"
                  value={formData.descripcion_actividad}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la actividad, objetivos, aspectos trabajados y técnicas empleadas..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Actitud y grado de implicación de la madre/padre/encargado-a:
                </label>
                <textarea
                  name="actitud_grado_implicacion"
                  value={formData.actitud_grado_implicacion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa la actitud y grado de implicación..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Avances mostrados:
                </label>
                <textarea
                  name="avances_mostrados"
                  value={formData.avances_mostrados}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa los avances mostrados..."
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
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recomendaciones:
                </label>
                <textarea
                  name="recomendaciones"
                  value={formData.recomendaciones}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
                  placeholder="Describa las recomendaciones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Próxima sesión:
                </label>
                <textarea
                  name="proxima_sesion"
                  value={formData.proxima_sesion}
                  onChange={handleChange}
                  className="input-field"
                  rows={6}
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

