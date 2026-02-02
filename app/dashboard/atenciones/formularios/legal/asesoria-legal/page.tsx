'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, Scale } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function AsesoriaLegalPage() {
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
    fecha_asesoria: '',
    hora_asesoria: '',
    
    // Datos del NNAJ
    nombre_nnaj: '',
    edad: '',
    centro: '',
    identidad: '',
    
    // Motivo de la asesoría
    motivo_asesoria: '',
    tipo_asesoria: '',
    urgencia_asesoria: '',
    
    // Situación legal actual
    situacion_legal_actual: '',
    estado_proceso: '',
    fecha_ultima_audiencia: '',
    proxima_audiencia: '',
    juzgado_competente: '',
    juez_competente: '',
    
    // Representación legal
    representacion_legal: '',
    abogado_defensor: '',
    telefono_abogado: '',
    email_abogado: '',
    
    // Derechos del NNAJ
    derechos_explicados: '',
    derechos_entendidos: '',
    preguntas_realizadas: '',
    
    // Asesoría proporcionada
    asesoria_proporcionada: '',
    recomendaciones_legales: '',
    estrategia_defensiva: '',
    
    // Documentos requeridos
    documentos_requeridos: '',
    documentos_proporcionados: '',
    documentos_pendientes: '',
    
    // Seguimiento legal
    seguimiento_requerido: '',
    proxima_cita_legal: '',
    acciones_inmediatas: '',
    
    // Observaciones legales
    observaciones_legales: '',
    
    // Recomendaciones finales
    recomendaciones_finales: ''
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
          fecha_asesoria: new Date().toISOString().slice(0, 10),
          hora_asesoria: new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
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
          tipo_formulario: 'asesoria_legal',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Asesoría legal guardada exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving asesoria legal:', error)
      alert('Error al guardar la asesoría legal')
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
              Asesoría Legal
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Abogado/a que realiza la Asesoría *
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
                  Fecha de Asesoría
                </label>
                <input
                  type="date"
                  name="fecha_asesoria"
                  value={formData.fecha_asesoria}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Asesoría
                </label>
                <input
                  type="time"
                  name="hora_asesoria"
                  value={formData.hora_asesoria}
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
                        edad: joven.edad?.toString() || prev.edad,
                        identidad: joven.identidad || prev.identidad
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

          {/* Motivo de la Asesoría */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Motivo de la Asesoría
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo de la Asesoría
                </label>
                <textarea
                  name="motivo_asesoria"
                  value={formData.motivo_asesoria}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa el motivo de la asesoría legal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Asesoría
                </label>
                <select
                  name="tipo_asesoria"
                  value={formData.tipo_asesoria}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="consulta_inicial">Consulta Inicial</option>
                  <option value="seguimiento">Seguimiento</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="preparacion_audiencia">Preparación de Audiencia</option>
                  <option value="revision_caso">Revisión de Caso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgencia de la Asesoría
                </label>
                <select
                  name="urgencia_asesoria"
                  value={formData.urgencia_asesoria}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="inmediata">Inmediata</option>
                  <option value="urgente">Urgente</option>
                  <option value="normal">Normal</option>
                  <option value="programada">Programada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Situación Legal Actual */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Situación Legal Actual
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Situación Legal Actual
                </label>
                <textarea
                  name="situacion_legal_actual"
                  value={formData.situacion_legal_actual}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa la situación legal actual del NNAJ"
                />
              </div>
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
                    Fecha Última Audiencia
                  </label>
                  <input
                    type="date"
                    name="fecha_ultima_audiencia"
                    value={formData.fecha_ultima_audiencia}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Próxima Audiencia
                  </label>
                  <input
                    type="date"
                    name="proxima_audiencia"
                    value={formData.proxima_audiencia}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Representación Legal */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Representación Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Representación Legal
                </label>
                <select
                  name="representacion_legal"
                  value={formData.representacion_legal}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="defensor_publico">Defensor Público</option>
                  <option value="abogado_particular">Abogado Particular</option>
                  <option value="sin_representacion">Sin Representación</option>
                  <option value="procurador">Procurador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Abogado Defensor
                </label>
                <input
                  type="text"
                  name="abogado_defensor"
                  value={formData.abogado_defensor}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nombre del abogado defensor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teléfono del Abogado
                </label>
                <input
                  type="text"
                  name="telefono_abogado"
                  value={formData.telefono_abogado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Teléfono del abogado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email del Abogado
                </label>
                <input
                  type="email"
                  name="email_abogado"
                  value={formData.email_abogado}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Email del abogado"
                />
              </div>
            </div>
          </div>

          {/* Derechos del NNAJ */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Derechos del NNAJ
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Derechos Explicados
                </label>
                <textarea
                  name="derechos_explicados"
                  value={formData.derechos_explicados}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa los derechos que se explicaron al NNAJ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Derechos Entendidos
                </label>
                <textarea
                  name="derechos_entendidos"
                  value={formData.derechos_entendidos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa si el NNAJ entendió sus derechos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preguntas Realizadas
                </label>
                <textarea
                  name="preguntas_realizadas"
                  value={formData.preguntas_realizadas}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las preguntas que realizó el NNAJ"
                />
              </div>
            </div>
          </div>

          {/* Asesoría Proporcionada */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Asesoría Proporcionada
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asesoría Proporcionada
                </label>
                <textarea
                  name="asesoria_proporcionada"
                  value={formData.asesoria_proporcionada}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Describa detalladamente la asesoría proporcionada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recomendaciones Legales
                </label>
                <textarea
                  name="recomendaciones_legales"
                  value={formData.recomendaciones_legales}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las recomendaciones legales"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estrategia Defensiva
                </label>
                <textarea
                  name="estrategia_defensiva"
                  value={formData.estrategia_defensiva}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa la estrategia defensiva recomendada"
                />
              </div>
            </div>
          </div>

          {/* Documentos Requeridos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Documentos Requeridos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documentos Requeridos
                </label>
                <textarea
                  name="documentos_requeridos"
                  value={formData.documentos_requeridos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los documentos requeridos para el caso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documentos Proporcionados
                </label>
                <textarea
                  name="documentos_proporcionados"
                  value={formData.documentos_proporcionados}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los documentos que ya se han proporcionado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documentos Pendientes
                </label>
                <textarea
                  name="documentos_pendientes"
                  value={formData.documentos_pendientes}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los documentos que aún están pendientes"
                />
              </div>
            </div>
          </div>

          {/* Seguimiento Legal */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Seguimiento Legal
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seguimiento Requerido
                </label>
                <textarea
                  name="seguimiento_requerido"
                  value={formData.seguimiento_requerido}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa el seguimiento legal requerido"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Próxima Cita Legal
                  </label>
                  <input
                    type="datetime-local"
                    name="proxima_cita_legal"
                    value={formData.proxima_cita_legal}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acciones Inmediatas
                  </label>
                  <input
                    type="text"
                    name="acciones_inmediatas"
                    value={formData.acciones_inmediatas}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Acciones que se deben tomar inmediatamente"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones Legales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Observaciones Legales
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

          {/* Recomendaciones Finales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Recomendaciones Finales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones Finales
              </label>
              <textarea
                name="recomendaciones_finales"
                value={formData.recomendaciones_finales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones finales para el caso"
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
              {saving ? 'Guardando...' : 'Guardar Asesoría Legal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
