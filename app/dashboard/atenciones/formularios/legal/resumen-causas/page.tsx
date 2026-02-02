'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, Scale } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function ResumenCausasPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.jovenId as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Datos del abogado
    abogado_informe: '',
    fecha_informe: '',
    
    // Datos del NNAJ
    nombre_nnaj: '',
    edad: '',
    centro: '',
    identidad: '',
    
    // Información de la causa
    numero_expediente: '',
    juzgado_competente: '',
    juez_competente: '',
    fiscal_competente: '',
    
    // Delito/Infracción
    delito_infraccion: '',
    articulo_violado: '',
    codigo_penal: '',
    descripcion_hechos: '',
    
    // Fechas importantes
    fecha_hechos: '',
    fecha_detencion: '',
    fecha_audiencia_inicial: '',
    fecha_audiencia_intermedia: '',
    fecha_audiencia_juicio: '',
    
    // Estado del proceso
    estado_proceso: '',
    fase_proceso: '',
    medidas_cautelares: '',
    medidas_sustitutivas: '',
    
    // Representación legal
    defensor_publico: '',
    abogado_particular: '',
    procurador: '',
    
    // Testigos
    testigos_favor: '',
    testigos_contra: '',
    peritos: '',
    
    // Evidencias
    evidencias_favor: '',
    evidencias_contra: '',
    evidencias_neutras: '',
    
    // Sentencia
    fecha_sentencia: '',
    tipo_sentencia: '',
    condena_absolucion: '',
    tiempo_condena: '',
    medidas_accesorias: '',
    
    // Recursos
    recursos_interpuestos: '',
    fecha_recursos: '',
    estado_recursos: '',
    
    // Cumplimiento
    estado_cumplimiento: '',
    tiempo_cumplido: '',
    tiempo_restante: '',
    beneficios_obtenidos: '',
    
    // Observaciones
    observaciones_legales: '',
    
    // Recomendaciones
    recomendaciones_legales: ''
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

    if (!formData.abogado_informe.trim()) {
      newErrors.abogado_informe = 'El nombre del abogado es requerido'
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

      // Guardar en la tabla de formularios legales
      const { error } = await supabase
        .from('formularios_legales')
        .insert([{
          joven_id: jovenId,
          tipo_formulario: 'resumen_causas',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Resumen de causas guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving resumen causas:', error)
      alert('Error al guardar el resumen de causas')
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
              <Scale className="w-6 h-6" />
              Resumen de Causas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Programa de Medidas Sustitutivas a la Privación de Libertad (PMSPL)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos del Abogado */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Datos del Abogado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Abogado/a que realiza el Informe *
                </label>
                <input
                  type="text"
                  name="abogado_informe"
                  value={formData.abogado_informe}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del abogado"
                />
                {errors.abogado_informe && (
                  <p className="text-red-500 text-sm mt-1">{errors.abogado_informe}</p>
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
                <JovenSearchInput
                  value={formData.nombre_nnaj}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_nnaj: value }))}
                  onJovenSelect={(joven) => {
                    if (joven.id) {
                      setFormData(prev => ({
                        ...prev,
                        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
                        edad: calcularEdad(joven.fecha_nacimiento),
                        centro: joven.centros?.nombre || prev.centro,
                        identidad: joven.identidad || prev.identidad,
                        delito_infraccion: joven.delito_infraccion || prev.delito_infraccion
                      }))
                    }
                  }}
                  label="Nombre del NNAJ"
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

          {/* Información de la Causa */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Información de la Causa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Expediente
                </label>
                <input
                  type="text"
                  name="numero_expediente"
                  value={formData.numero_expediente}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Número de expediente judicial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juzgado Competente
                </label>
                <input
                  type="text"
                  name="juzgado_competente"
                  value={formData.juzgado_competente}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del juzgado competente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Juez Competente
                </label>
                <input
                  type="text"
                  name="juez_competente"
                  value={formData.juez_competente}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del juez competente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fiscal Competente
                </label>
                <input
                  type="text"
                  name="fiscal_competente"
                  value={formData.fiscal_competente}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del fiscal competente"
                />
              </div>
            </div>
          </div>

          {/* Delito/Infracción */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Delito/Infracción
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="Artículo del código penal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código Penal
                  </label>
                  <input
                    type="text"
                    name="codigo_penal"
                    value={formData.codigo_penal}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Código penal aplicable"
                  />
                </div>
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
                  placeholder="Describa detalladamente los hechos que motivaron la causa"
                />
              </div>
            </div>
          </div>

          {/* Fechas Importantes */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Fechas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de los Hechos
                </label>
                <input
                  type="date"
                  name="fecha_hechos"
                  value={formData.fecha_hechos}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Detención
                </label>
                <input
                  type="date"
                  name="fecha_detencion"
                  value={formData.fecha_detencion}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Audiencia Inicial
                </label>
                <input
                  type="date"
                  name="fecha_audiencia_inicial"
                  value={formData.fecha_audiencia_inicial}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Audiencia Intermedia
                </label>
                <input
                  type="date"
                  name="fecha_audiencia_intermedia"
                  value={formData.fecha_audiencia_intermedia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha Audiencia de Juicio
                </label>
                <input
                  type="date"
                  name="fecha_audiencia_juicio"
                  value={formData.fecha_audiencia_juicio}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Estado del Proceso */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Estado del Proceso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado del Proceso
                </label>
                <select
                  name="estado_proceso"
                  value={formData.estado_proceso}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="en_tramite">En Trámite</option>
                  <option value="sentenciado">Sentenciado</option>
                  <option value="absuelto">Absuelto</option>
                  <option value="sobreseido">Sobreseído</option>
                  <option value="archivado">Archivado</option>
                  <option value="apelacion">En Apelación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fase del Proceso
                </label>
                <select
                  name="fase_proceso"
                  value={formData.fase_proceso}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="investigacion">Investigación</option>
                  <option value="imputacion">Imputación</option>
                  <option value="intermedia">Audiencia Intermedia</option>
                  <option value="juicio">Juicio</option>
                  <option value="sentencia">Sentencia</option>
                  <option value="apelacion">Apelación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medidas Cautelares
                </label>
                <input
                  type="text"
                  name="medidas_cautelares"
                  value={formData.medidas_cautelares}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Medidas cautelares aplicadas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medidas Sustitutivas
                </label>
                <input
                  type="text"
                  name="medidas_sustitutivas"
                  value={formData.medidas_sustitutivas}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Medidas sustitutivas aplicadas"
                />
              </div>
            </div>
          </div>

          {/* Representación Legal */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Representación Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Defensor Público
                </label>
                <input
                  type="text"
                  name="defensor_publico"
                  value={formData.defensor_publico}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del defensor público"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Abogado Particular
                </label>
                <input
                  type="text"
                  name="abogado_particular"
                  value={formData.abogado_particular}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del abogado particular"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Procurador
                </label>
                <input
                  type="text"
                  name="procurador"
                  value={formData.procurador}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del procurador"
                />
              </div>
            </div>
          </div>

          {/* Testigos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Testigos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Testigos a Favor
                </label>
                <textarea
                  name="testigos_favor"
                  value={formData.testigos_favor}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los testigos a favor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Testigos en Contra
                </label>
                <textarea
                  name="testigos_contra"
                  value={formData.testigos_contra}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los testigos en contra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peritos
                </label>
                <textarea
                  name="peritos"
                  value={formData.peritos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los peritos del caso"
                />
              </div>
            </div>
          </div>

          {/* Evidencias */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Evidencias
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidencias a Favor
                </label>
                <textarea
                  name="evidencias_favor"
                  value={formData.evidencias_favor}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las evidencias a favor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidencias en Contra
                </label>
                <textarea
                  name="evidencias_contra"
                  value={formData.evidencias_contra}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las evidencias en contra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidencias Neutras
                </label>
                <textarea
                  name="evidencias_neutras"
                  value={formData.evidencias_neutras}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las evidencias neutras"
                />
              </div>
            </div>
          </div>

          {/* Sentencia */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Sentencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Sentencia
                </label>
                <input
                  type="date"
                  name="fecha_sentencia"
                  value={formData.fecha_sentencia}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Sentencia
                </label>
                <select
                  name="tipo_sentencia"
                  value={formData.tipo_sentencia}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="condena">Condena</option>
                  <option value="absolucion">Absolución</option>
                  <option value="sobreseimiento">Sobreseimiento</option>
                  <option value="archivo">Archivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condena/Absolución
                </label>
                <input
                  type="text"
                  name="condena_absolucion"
                  value={formData.condena_absolucion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Detalle de la condena o absolución"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo de Condena
                </label>
                <input
                  type="text"
                  name="tiempo_condena"
                  value={formData.tiempo_condena}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tiempo de condena (años, meses, días)"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medidas Accesorias
                </label>
                <textarea
                  name="medidas_accesorias"
                  value={formData.medidas_accesorias}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las medidas accesorias aplicadas"
                />
              </div>
            </div>
          </div>

          {/* Recursos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Recursos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recursos Interpuestos
                </label>
                <textarea
                  name="recursos_interpuestos"
                  value={formData.recursos_interpuestos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa los recursos interpuestos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Recursos
                </label>
                <input
                  type="date"
                  name="fecha_recursos"
                  value={formData.fecha_recursos}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado de Recursos
                </label>
                <select
                  name="estado_recursos"
                  value={formData.estado_recursos}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="admitido">Admitido</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="resuelto">Resuelto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cumplimiento */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XI. Cumplimiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado de Cumplimiento
                </label>
                <select
                  name="estado_cumplimiento"
                  value={formData.estado_cumplimiento}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="cumpliendo">Cumpliendo</option>
                  <option value="cumplido">Cumplido</option>
                  <option value="incumplimiento">En Incumplimiento</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo Cumplido
                </label>
                <input
                  type="text"
                  name="tiempo_cumplido"
                  value={formData.tiempo_cumplido}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tiempo ya cumplido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo Restante
                </label>
                <input
                  type="text"
                  name="tiempo_restante"
                  value={formData.tiempo_restante}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tiempo restante por cumplir"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beneficios Obtenidos
                </label>
                <input
                  type="text"
                  name="beneficios_obtenidos"
                  value={formData.beneficios_obtenidos}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Beneficios obtenidos durante el cumplimiento"
                />
              </div>
            </div>
          </div>

          {/* Observaciones Legales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XII. Observaciones Legales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones Legales
              </label>
              <textarea
                name="observaciones_legales"
                value={formData.observaciones_legales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa cualquier observación legal relevante"
              />
            </div>
          </div>

          {/* Recomendaciones Legales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XIII. Recomendaciones Legales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones Legales
              </label>
              <textarea
                name="recomendaciones_legales"
                value={formData.recomendaciones_legales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones legales para el caso"
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
                Nombre y firma del abogado/a
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nombre y firma del abogado"
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
              {saving ? 'Guardando...' : 'Guardar Resumen de Causas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
