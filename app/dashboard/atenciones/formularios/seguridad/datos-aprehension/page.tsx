'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'

export default function DatosAprehensionPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Datos del personal de seguridad
    personal_seguridad: '',
    fecha_informe: '',
    
    // Datos del NNAJ
    nombre_nnaj: '',
    edad: '',
    centro: '',
    identidad: '',
    
    // Datos de la aprehensión
    fecha_aprehension: '',
    hora_aprehension: '',
    lugar_aprehension: '',
    autoridad_aprehension: '',
    funcionario_aprehension: '',
    numero_orden: '',
    
    // Motivo de la aprehensión
    motivo_aprehension: '',
    delito_infraccion: '',
    articulo_violado: '',
    descripcion_hechos: '',
    
    // Testigos
    testigos_presentes: 'no', // si o no
    datos_testigos: '',
    
    // Evidencias
    evidencias_incautadas: 'no', // si o no
    descripcion_evidencias: '',
    
    // Circunstancias de la aprehensión
    circunstancias_aprehension: '',
    resistencia_arresto: 'no', // si o no
    descripcion_resistencia: '',
    
    // Estado al momento de la aprehensión
    estado_fisico_aprehension: '',
    estado_mental_aprehension: '',
    estado_emocional_aprehension: '',
    
    // Objetos incautados
    objetos_incautados: '',
    objetos_peligrosos: 'no', // si o no
    descripcion_objetos_peligrosos: '',
    
    // Traslado
    lugar_traslado: '',
    hora_traslado: '',
    autoridad_traslado: '',
    
    // Observaciones
    observaciones_aprehension: '',
    
    // Recomendaciones
    recomendaciones_seguridad: ''
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
          identidad: jovenData.identidad || '',
          delito_infraccion: jovenData.delito_infraccion || '',
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

    if (!formData.personal_seguridad.trim()) {
      newErrors.personal_seguridad = 'El nombre del personal de seguridad es requerido'
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

      // Guardar en la tabla de formularios de seguridad
      const { error } = await supabase
        .from('formularios_seguridad')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'datos_aprehension',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Datos de aprehensión guardados exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving datos aprehension:', error)
      alert('Error al guardar los datos de aprehensión')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Datos de Aprehensión
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Programa de Medidas Sustitutivas a la Privación de Libertad (PMSPL)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos del Personal de Seguridad */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Datos del Personal de Seguridad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal de Seguridad *
                </label>
                <input
                  type="text"
                  name="personal_seguridad"
                  value={formData.personal_seguridad}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del personal de seguridad"
                />
                {errors.personal_seguridad && (
                  <p className="text-red-500 text-sm mt-1">{errors.personal_seguridad}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del NNAJ *
                </label>
                <input
                  type="text"
                  name="nombre_nnaj"
                  value={formData.nombre_nnaj}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre completo del NNAJ"
                  disabled
                />
                {errors.nombre_nnaj && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre_nnaj}</p>
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
                  Centro
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
            </div>
          </div>

          {/* Datos de la Aprehensión */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Datos de la Aprehensión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Aprehensión
                </label>
                <input
                  type="date"
                  name="fecha_aprehension"
                  value={formData.fecha_aprehension}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Aprehensión
                </label>
                <input
                  type="time"
                  name="hora_aprehension"
                  value={formData.hora_aprehension}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lugar de Aprehensión
                </label>
                <input
                  type="text"
                  name="lugar_aprehension"
                  value={formData.lugar_aprehension}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Lugar donde fue aprehendido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autoridad que Aprehendió
                </label>
                <select
                  name="autoridad_aprehension"
                  value={formData.autoridad_aprehension}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="policia_nacional">Policía Nacional</option>
                  <option value="policia_militar">Policía Militar</option>
                  <option value="fuerzas_armadas">Fuerzas Armadas</option>
                  <option value="policia_municipal">Policía Municipal</option>
                  <option value="otra">Otra</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funcionario que Aprehendió
                </label>
                <input
                  type="text"
                  name="funcionario_aprehension"
                  value={formData.funcionario_aprehension}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del funcionario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Orden
                </label>
                <input
                  type="text"
                  name="numero_orden"
                  value={formData.numero_orden}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de orden de aprehensión"
                />
              </div>
            </div>
          </div>

          {/* Motivo de la Aprehensión */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Motivo de la Aprehensión
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo de Aprehensión
                </label>
                <textarea
                  name="motivo_aprehension"
                  value={formData.motivo_aprehension}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa el motivo de la aprehensión"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delito/Infracción
                </label>
                <input
                  type="text"
                  name="delito_infraccion"
                  value={formData.delito_infraccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Delito o infracción cometida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Artículo Violado
                </label>
                <input
                  type="text"
                  name="articulo_violado"
                  value={formData.articulo_violado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Artículo del código penal violado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción de los Hechos
                </label>
                <textarea
                  name="descripcion_hechos"
                  value={formData.descripcion_hechos}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa detalladamente los hechos que motivaron la aprehensión"
                />
              </div>
            </div>
          </div>

          {/* Testigos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Testigos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Hubo testigos presentes?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="testigos_presentes"
                      value="si"
                      checked={formData.testigos_presentes === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="testigos_presentes"
                      value="no"
                      checked={formData.testigos_presentes === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.testigos_presentes === 'si' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Datos de los Testigos
                  </label>
                  <textarea
                    name="datos_testigos"
                    value={formData.datos_testigos}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa los datos de los testigos presentes"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Evidencias */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Evidencias
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Se incautaron evidencias?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="evidencias_incautadas"
                      value="si"
                      checked={formData.evidencias_incautadas === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="evidencias_incautadas"
                      value="no"
                      checked={formData.evidencias_incautadas === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.evidencias_incautadas === 'si' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de Evidencias
                  </label>
                  <textarea
                    name="descripcion_evidencias"
                    value={formData.descripcion_evidencias}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa las evidencias incautadas"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Circunstancias de la Aprehensión */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Circunstancias de la Aprehensión
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Circunstancias de la Aprehensión
                </label>
                <textarea
                  name="circunstancias_aprehension"
                  value={formData.circunstancias_aprehension}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las circunstancias en que se realizó la aprehensión"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Hubo resistencia al arresto?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resistencia_arresto"
                      value="si"
                      checked={formData.resistencia_arresto === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="resistencia_arresto"
                      value="no"
                      checked={formData.resistencia_arresto === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.resistencia_arresto === 'si' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de la Resistencia
                  </label>
                  <textarea
                    name="descripcion_resistencia"
                    value={formData.descripcion_resistencia}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa la resistencia ofrecida al arresto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Estado al Momento de la Aprehensión */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Estado al Momento de la Aprehensión
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Físico
                </label>
                <select
                  name="estado_fisico_aprehension"
                  value={formData.estado_fisico_aprehension}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                  <option value="lesionado">Lesionado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Mental
                </label>
                <select
                  name="estado_mental_aprehension"
                  value={formData.estado_mental_aprehension}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="lucido">Lúcido</option>
                  <option value="confuso">Confuso</option>
                  <option value="agitado">Agitado</option>
                  <option value="deprimido">Deprimido</option>
                  <option value="agresivo">Agresivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Emocional
                </label>
                <select
                  name="estado_emocional_aprehension"
                  value={formData.estado_emocional_aprehension}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="estable">Estable</option>
                  <option value="ansioso">Ansioso</option>
                  <option value="triste">Triste</option>
                  <option value="enojado">Enojado</option>
                  <option value="tranquilo">Tranquilo</option>
                  <option value="indiferente">Indiferente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Objetos Incautados */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Objetos Incautados
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objetos Incautados
                </label>
                <textarea
                  name="objetos_incautados"
                  value={formData.objetos_incautados}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los objetos incautados al NNAJ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Se incautaron objetos peligrosos?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="objetos_peligrosos"
                      value="si"
                      checked={formData.objetos_peligrosos === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="objetos_peligrosos"
                      value="no"
                      checked={formData.objetos_peligrosos === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.objetos_peligrosos === 'si' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de Objetos Peligrosos
                  </label>
                  <textarea
                    name="descripcion_objetos_peligrosos"
                    value={formData.descripcion_objetos_peligrosos}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                    placeholder="Describa los objetos peligrosos incautados"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Traslado */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Traslado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lugar de Traslado
                </label>
                <input
                  type="text"
                  name="lugar_traslado"
                  value={formData.lugar_traslado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Lugar al que fue trasladado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Traslado
                </label>
                <input
                  type="time"
                  name="hora_traslado"
                  value={formData.hora_traslado}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autoridad de Traslado
                </label>
                <input
                  type="text"
                  name="autoridad_traslado"
                  value={formData.autoridad_traslado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Autoridad que realizó el traslado"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Observaciones
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones de la Aprehensión
              </label>
              <textarea
                name="observaciones_aprehension"
                value={formData.observaciones_aprehension}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa cualquier observación relevante sobre la aprehensión"
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
                Recomendaciones de Seguridad
              </label>
              <textarea
                name="recomendaciones_seguridad"
                value={formData.recomendaciones_seguridad}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones de seguridad para el NNAJ"
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
                Nombre y firma del personal de seguridad
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nombre y firma del personal de seguridad"
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
              {saving ? 'Guardando...' : 'Guardar Datos de Aprehensión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
