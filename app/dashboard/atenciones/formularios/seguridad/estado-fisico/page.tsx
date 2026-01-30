'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'

export default function EstadoFisicoSeguridadPage() {
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
    fecha_evaluacion: '',
    hora_evaluacion: '',
    
    // Datos del NNAJ
    nombre_nnaj: '',
    edad: '',
    centro: '',
    identidad: '',
    
    // Evaluación física general
    estado_fisico_general: '',
    apariencia_general: '',
    higiene_personal: '',
    vestimenta: '',
    
    // Signos vitales
    presion_arterial: '',
    frecuencia_cardiaca: '',
    frecuencia_respiratoria: '',
    temperatura: '',
    saturacion_oxigeno: '',
    
    // Evaluación por sistemas
    sistema_nervioso: '',
    sistema_cardiovascular: '',
    sistema_respiratorio: '',
    sistema_digestivo: '',
    sistema_urinario: '',
    sistema_musculoesqueletico: '',
    sistema_integumentario: '',
    
    // Lesiones y traumatismos
    lesiones_presentes: 'no', // si o no
    descripcion_lesiones: '',
    localizacion_lesiones: '',
    tipo_lesiones: '',
    gravedad_lesiones: '',
    
    // Estado mental
    estado_mental: '',
    nivel_conciencia: '',
    orientacion: '',
    memoria: '',
    lenguaje: '',
    comportamiento: '',
    
    // Estado emocional
    estado_emocional: '',
    ansiedad: '',
    depresion: '',
    irritabilidad: '',
    agresividad: '',
    
    // Consumo de sustancias
    consumo_sustancias: 'no', // si o no
    tipo_sustancias: '',
    cantidad_consumida: '',
    efectos_observados: '',
    
    // Medicamentos
    medicamentos_actuales: '',
    alergias_medicamentos: '',
    
    // Observaciones especiales
    observaciones_especiales: '',
    
    // Recomendaciones médicas
    recomendaciones_medicas: '',
    
    // Seguimiento requerido
    seguimiento_requerido: '',
    urgencia_atencion: ''
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
          fecha_evaluacion: new Date().toISOString().slice(0, 10),
          hora_evaluacion: new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })
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
          tipo_formulario: 'estado_fisico',
          datos_json: formData,
          fecha_creacion: new Date().toISOString()
        }])

      if (error) throw error

      alert('Estado físico de seguridad guardado exitosamente')
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)
    } catch (error) {
      console.error('Error saving estado fisico:', error)
      alert('Error al guardar el estado físico de seguridad')
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
              Estado Físico de Seguridad
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Fecha de Evaluación
                </label>
                <input
                  type="date"
                  name="fecha_evaluacion"
                  value={formData.fecha_evaluacion}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Evaluación
                </label>
                <input
                  type="time"
                  name="hora_evaluacion"
                  value={formData.hora_evaluacion}
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

          {/* Evaluación Física General */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              II. Evaluación Física General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Físico General
                </label>
                <select
                  name="estado_fisico_general"
                  value={formData.estado_fisico_general}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="excelente">Excelente</option>
                  <option value="bueno">Bueno</option>
                  <option value="regular">Regular</option>
                  <option value="malo">Malo</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apariencia General
                </label>
                <select
                  name="apariencia_general"
                  value={formData.apariencia_general}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                  <option value="descuidada">Descuidada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Higiene Personal
                </label>
                <select
                  name="higiene_personal"
                  value={formData.higiene_personal}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                  <option value="deficiente">Deficiente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vestimenta
                </label>
                <select
                  name="vestimenta"
                  value={formData.vestimenta}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="adecuada">Adecuada</option>
                  <option value="inadecuada">Inadecuada</option>
                  <option value="sucia">Sucia</option>
                  <option value="rota">Rota</option>
                </select>
              </div>
            </div>
          </div>

          {/* Signos Vitales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              III. Signos Vitales
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  P/A (mmHg)
                </label>
                <input
                  type="text"
                  name="presion_arterial"
                  value={formData.presion_arterial}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FC (lpm)
                </label>
                <input
                  type="number"
                  name="frecuencia_cardiaca"
                  value={formData.frecuencia_cardiaca}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FR (rpm)
                </label>
                <input
                  type="number"
                  name="frecuencia_respiratoria"
                  value={formData.frecuencia_respiratoria}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temp. (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperatura"
                  value={formData.temperatura}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="37.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SatO2 (%)
                </label>
                <input
                  type="number"
                  name="saturacion_oxigeno"
                  value={formData.saturacion_oxigeno}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="98"
                />
              </div>
            </div>
          </div>

          {/* Evaluación por Sistemas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IV. Evaluación por Sistemas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Nervioso
                </label>
                <input
                  type="text"
                  name="sistema_nervioso"
                  value={formData.sistema_nervioso}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado del sistema nervioso"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Cardiovascular
                </label>
                <input
                  type="text"
                  name="sistema_cardiovascular"
                  value={formData.sistema_cardiovascular}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado cardiovascular"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Respiratorio
                </label>
                <input
                  type="text"
                  name="sistema_respiratorio"
                  value={formData.sistema_respiratorio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado respiratorio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Digestivo
                </label>
                <input
                  type="text"
                  name="sistema_digestivo"
                  value={formData.sistema_digestivo}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado digestivo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Urinario
                </label>
                <input
                  type="text"
                  name="sistema_urinario"
                  value={formData.sistema_urinario}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado urinario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Musculoesquelético
                </label>
                <input
                  type="text"
                  name="sistema_musculoesqueletico"
                  value={formData.sistema_musculoesqueletico}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado musculoesquelético"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sistema Integumentario
                </label>
                <input
                  type="text"
                  name="sistema_integumentario"
                  value={formData.sistema_integumentario}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Estado de la piel"
                />
              </div>
            </div>
          </div>

          {/* Lesiones y Traumatismos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              V. Lesiones y Traumatismos
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Presenta lesiones?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="lesiones_presentes"
                      value="si"
                      checked={formData.lesiones_presentes === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="lesiones_presentes"
                      value="no"
                      checked={formData.lesiones_presentes === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.lesiones_presentes === 'si' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción de Lesiones
                    </label>
                    <textarea
                      name="descripcion_lesiones"
                      value={formData.descripcion_lesiones}
                      onChange={handleChange}
                      className="input-field"
                      rows={3}
                      placeholder="Describa las lesiones observadas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Localización de Lesiones
                    </label>
                    <input
                      type="text"
                      name="localizacion_lesiones"
                      value={formData.localizacion_lesiones}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Parte del cuerpo afectada"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Lesiones
                    </label>
                    <select
                      name="tipo_lesiones"
                      value={formData.tipo_lesiones}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Seleccionar</option>
                      <option value="contusion">Contusión</option>
                      <option value="laceracion">Laceración</option>
                      <option value="abrasion">Abrasión</option>
                      <option value="hematoma">Hematoma</option>
                      <option value="fractura">Fractura</option>
                      <option value="herida">Herida</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gravedad de Lesiones
                    </label>
                    <select
                      name="gravedad_lesiones"
                      value={formData.gravedad_lesiones}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="">Seleccionar</option>
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="grave">Grave</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estado Mental */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VI. Estado Mental
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Mental
                </label>
                <select
                  name="estado_mental"
                  value={formData.estado_mental}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="lucido">Lúcido</option>
                  <option value="confuso">Confuso</option>
                  <option value="agitado">Agitado</option>
                  <option value="deprimido">Deprimido</option>
                  <option value="agresivo">Agresivo</option>
                  <option value="tranquilo">Tranquilo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de Conciencia
                </label>
                <select
                  name="nivel_conciencia"
                  value={formData.nivel_conciencia}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="consciente">Consciente</option>
                  <option value="somnoliento">Somnoliento</option>
                  <option value="estuporoso">Estuporoso</option>
                  <option value="comatoso">Comatoso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientación
                </label>
                <select
                  name="orientacion"
                  value={formData.orientacion}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="orientado">Orientado</option>
                  <option value="desorientado">Desorientado</option>
                  <option value="parcialmente_orientado">Parcialmente Orientado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Memoria
                </label>
                <select
                  name="memoria"
                  value={formData.memoria}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="deficiente">Deficiente</option>
                  <option value="amnesia">Amnesia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lenguaje
                </label>
                <select
                  name="lenguaje"
                  value={formData.lenguaje}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="fluido">Fluido</option>
                  <option value="lento">Lento</option>
                  <option value="confuso">Confuso</option>
                  <option value="incoherente">Incoherente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comportamiento
                </label>
                <select
                  name="comportamiento"
                  value={formData.comportamiento}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="cooperativo">Cooperativo</option>
                  <option value="resistente">Resistente</option>
                  <option value="agresivo">Agresivo</option>
                  <option value="pasivo">Pasivo</option>
                  <option value="errático">Errático</option>
                </select>
              </div>
            </div>
          </div>

          {/* Estado Emocional */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VII. Estado Emocional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Emocional
                </label>
                <select
                  name="estado_emocional"
                  value={formData.estado_emocional}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ansiedad
                </label>
                <select
                  name="ansiedad"
                  value={formData.ansiedad}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Depresión
                </label>
                <select
                  name="depresion"
                  value={formData.depresion}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Irritabilidad
                </label>
                <select
                  name="irritabilidad"
                  value={formData.irritabilidad}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agresividad
                </label>
                <select
                  name="agresividad"
                  value={formData.agresividad}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="ninguna">Ninguna</option>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consumo de Sustancias */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              VIII. Consumo de Sustancias
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Consumió sustancias?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="consumo_sustancias"
                      value="si"
                      checked={formData.consumo_sustancias === 'si'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Sí
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="consumo_sustancias"
                      value="no"
                      checked={formData.consumo_sustancias === 'no'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              
              {formData.consumo_sustancias === 'si' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Sustancias
                    </label>
                    <input
                      type="text"
                      name="tipo_sustancias"
                      value={formData.tipo_sustancias}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Alcohol, drogas, medicamentos, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cantidad Consumida
                    </label>
                    <input
                      type="text"
                      name="cantidad_consumida"
                      value={formData.cantidad_consumida}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Cantidad aproximada"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Efectos Observados
                    </label>
                    <textarea
                      name="efectos_observados"
                      value={formData.efectos_observados}
                      onChange={handleChange}
                      className="input-field"
                      rows={3}
                      placeholder="Describa los efectos observados"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medicamentos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              IX. Medicamentos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Medicamentos Actuales
                </label>
                <textarea
                  name="medicamentos_actuales"
                  value={formData.medicamentos_actuales}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Liste los medicamentos que está tomando"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alergias a Medicamentos
                </label>
                <textarea
                  name="alergias_medicamentos"
                  value={formData.alergias_medicamentos}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="Describa las alergias conocidas"
                />
              </div>
            </div>
          </div>

          {/* Observaciones Especiales */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              X. Observaciones Especiales
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observaciones Especiales
              </label>
              <textarea
                name="observaciones_especiales"
                value={formData.observaciones_especiales}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa cualquier observación especial relevante"
              />
            </div>
          </div>

          {/* Recomendaciones Médicas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XI. Recomendaciones Médicas
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recomendaciones Médicas
              </label>
              <textarea
                name="recomendaciones_medicas"
                value={formData.recomendaciones_medicas}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Describa las recomendaciones médicas para el NNAJ"
              />
            </div>
          </div>

          {/* Seguimiento Requerido */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              XII. Seguimiento Requerido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Describa el seguimiento requerido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgencia de Atención
                </label>
                <select
                  name="urgencia_atencion"
                  value={formData.urgencia_atencion}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Seleccionar</option>
                  <option value="inmediata">Inmediata</option>
                  <option value="urgente">Urgente</option>
                  <option value="prioritaria">Prioritaria</option>
                  <option value="normal">Normal</option>
                  <option value="no_requerida">No Requerida</option>
                </select>
              </div>
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
              {saving ? 'Guardando...' : 'Guardar Estado Físico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
