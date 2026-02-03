'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Shield, User, Calendar, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function FormularioSeguridadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [profesionales, setProfesionales] = useState<Profile[]>([])
  
  const [formData, setFormData] = useState({
    joven_id: '',
    profesional_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    
    // DATOS PERSONALES DEL ADOLESCENTE
    nombre: '',
    numero_expediente_administrativo: '',
    edad: '',
    fecha_nacimiento: '',
    originario: '',
    residente: '',
    
    // DATOS DE INGRESO
    fecha_ingreso: '',
    hora_ingreso: '',
    numero_dni: '',
    alias: '',
    simpatizante: '',
    estado_civil: '',
    grado_escolaridad: '',
    nombre_responsable: '',
    telefono_responsable: '',
    
    // DATOS JUDICIALES
    juzgado_remitente: '',
    juez_remite: '',
    expediente_judicial: '',
    numero_oficio_ingreso: '',
    infraccion_penal: '',
    es_reincidente: false,
    ha_estado_otro_centro: false,
    ha_estado_proceso_judicial: false,
    
    // FORMA DE INGRESO
    cumplimiento_medida_cautelar: false,
    sancion_privativa_libertad: false,
    traslado: false,
    
    // ESTADO FÍSICO AL MOMENTO DE INGRESO
    golpes: '',
    heridas: '',
    cicatrices: '',
    enfermedad: '',
    impedimentos_fisicos: '',
    ansiedad: '',
    personal_medico_atendio: '',
    
    // APREHENSIÓN Y TRASLADO
    fecha_aprehension: '',
    quien_aprehendio: '',
    fue_golpeado_aprehension: '',
    fue_golpeado_traslado: '',
    por_quien_trasladado: '',
    
    // OBSERVACIONES
    observaciones: '',
    
    // FIRMAS
    nombre_supervisor_seguridad: '',
    fecha_entrevista: '',
    firma_nna: '',
    firma_supervisor: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar profesionales de seguridad
      const { data: profesionalesData, error: profesionalesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'seguridad')
        .order('full_name')

      if (profesionalesError) throw profesionalesError

      setProfesionales(profesionalesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) newErrors.joven_id = 'Debe seleccionar un joven'
    if (!formData.profesional_id) newErrors.profesional_id = 'Debe seleccionar un profesional'
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.numero_expediente_administrativo.trim()) newErrors.numero_expediente_administrativo = 'El número de expediente es requerido'
    if (!formData.fecha_ingreso) newErrors.fecha_ingreso = 'La fecha de ingreso es requerida'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      // Crear la atención de seguridad
      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: 'seguridad', // ID del tipo de atención de seguridad
          profesional_id: formData.profesional_id,
          fecha_atencion: new Date().toISOString(),
          motivo: 'Ficha de Ingreso - Área de Seguridad',
          observaciones: formData.observaciones,
          estado: 'completada'
        })
        .select()

      if (atencionError) throw atencionError

      // Guardar el formulario específico
      if (atencionData?.[0]) {
        const { error: formularioError } = await supabase
          .from('formularios_atencion')
          .insert({
            atencion_id: atencionData[0].id,
            datos_json: {
              tipo_formulario: 'ficha_ingreso_seguridad',
              datos_personales: {
                nombre: formData.nombre,
                numero_expediente_administrativo: formData.numero_expediente_administrativo,
                edad: formData.edad,
                fecha_nacimiento: formData.fecha_nacimiento,
                originario: formData.originario,
                residente: formData.residente
              },
              datos_ingreso: {
                fecha_ingreso: formData.fecha_ingreso,
                hora_ingreso: formData.hora_ingreso,
                numero_dni: formData.numero_dni,
                alias: formData.alias,
                simpatizante: formData.simpatizante,
                estado_civil: formData.estado_civil,
                grado_escolaridad: formData.grado_escolaridad,
                nombre_responsable: formData.nombre_responsable,
                telefono_responsable: formData.telefono_responsable
              },
              datos_judiciales: {
                juzgado_remitente: formData.juzgado_remitente,
                juez_remite: formData.juez_remite,
                expediente_judicial: formData.expediente_judicial,
                numero_oficio_ingreso: formData.numero_oficio_ingreso,
                infraccion_penal: formData.infraccion_penal,
                es_reincidente: formData.es_reincidente,
                ha_estado_otro_centro: formData.ha_estado_otro_centro,
                ha_estado_proceso_judicial: formData.ha_estado_proceso_judicial
              },
              forma_ingreso: {
                cumplimiento_medida_cautelar: formData.cumplimiento_medida_cautelar,
                sancion_privativa_libertad: formData.sancion_privativa_libertad,
                traslado: formData.traslado
              },
              estado_fisico: {
                golpes: formData.golpes,
                heridas: formData.heridas,
                cicatrices: formData.cicatrices,
                enfermedad: formData.enfermedad,
                impedimentos_fisicos: formData.impedimentos_fisicos,
                ansiedad: formData.ansiedad,
                personal_medico_atendio: formData.personal_medico_atendio
              },
              aprehension_traslado: {
                fecha_aprehension: formData.fecha_aprehension,
                quien_aprehendio: formData.quien_aprehendio,
                fue_golpeado_aprehension: formData.fue_golpeado_aprehension,
                fue_golpeado_traslado: formData.fue_golpeado_traslado,
                por_quien_trasladado: formData.por_quien_trasladado
              },
              firmas: {
                nombre_supervisor_seguridad: formData.nombre_supervisor_seguridad,
                fecha_entrevista: formData.fecha_entrevista,
                firma_nna: formData.firma_nna,
                firma_supervisor: formData.firma_supervisor
              }
            }
          })

        if (formularioError) throw formularioError
      }

      alert('Ficha de Ingreso registrada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error) {
      console.error('Error creating formulario:', error)
      alert('Error al registrar la ficha. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FICHA DE INGRESO - ÁREA DE SEGURIDAD</h1>
          <p className="text-gray-600 mt-2">Centro Pedagógico de Internamiento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información Básica</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <JovenSearchInput
                value={formData.nombre}
                onChange={(value) => handleInputChange('nombre', value)}
                onJovenSelect={(joven) => {
                  if (joven && joven.id) {
                    handleInputChange('joven_id', joven.id)
                    handleInputChange('nombre', `${joven.nombres} ${joven.apellidos}`)
                    if (joven.edad) handleInputChange('edad', joven.edad.toString())
                    if (joven.fecha_nacimiento) handleInputChange('fecha_nacimiento', joven.fecha_nacimiento)
                    if (joven.expediente_administrativo) handleInputChange('numero_expediente_administrativo', joven.expediente_administrativo)
                  }
                }}
                label="Joven"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profesional Responsable *
              </label>
              <select
                value={formData.profesional_id}
                onChange={(e) => handleInputChange('profesional_id', e.target.value)}
                className={`input-field ${errors.profesional_id ? 'border-red-500' : ''}`}
              >
                <option value="">Seleccionar profesional</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name}
                  </option>
                ))}
              </select>
              {errors.profesional_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.profesional_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Elaboración
              </label>
              <input
                type="date"
                value={formData.fecha_elaboracion}
                onChange={(e) => handleInputChange('fecha_elaboracion', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* DATOS PERSONALES DEL ADOLESCENTE */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">DATOS PERSONALES DEL ADOLESCENTE</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={`input-field ${errors.nombre ? 'border-red-500' : ''}`}
                placeholder="Nombre completo del adolescente"
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.nombre}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Expediente Administrativo *
              </label>
              <input
                type="text"
                value={formData.numero_expediente_administrativo}
                onChange={(e) => handleInputChange('numero_expediente_administrativo', e.target.value)}
                className={`input-field ${errors.numero_expediente_administrativo ? 'border-red-500' : ''}`}
                placeholder="Número de expediente"
              />
              {errors.numero_expediente_administrativo && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.numero_expediente_administrativo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                className="input-field"
                placeholder="Edad en años"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Originario
              </label>
              <input
                type="text"
                value={formData.originario}
                onChange={(e) => handleInputChange('originario', e.target.value)}
                className="input-field"
                placeholder="Lugar de origen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Residente
              </label>
              <input
                type="text"
                value={formData.residente}
                onChange={(e) => handleInputChange('residente', e.target.value)}
                className="input-field"
                placeholder="Lugar de residencia"
              />
            </div>
          </div>
        </div>

        {/* DATOS DE INGRESO */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">DATOS DE INGRESO</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                className={`input-field ${errors.fecha_ingreso ? 'border-red-500' : ''}`}
              />
              {errors.fecha_ingreso && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.fecha_ingreso}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Ingreso
              </label>
              <input
                type="time"
                value={formData.hora_ingreso}
                onChange={(e) => handleInputChange('hora_ingreso', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de DNI
              </label>
              <input
                type="text"
                value={formData.numero_dni}
                onChange={(e) => handleInputChange('numero_dni', e.target.value)}
                className="input-field"
                placeholder="Número de identidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alias
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => handleInputChange('alias', e.target.value)}
                className="input-field"
                placeholder="Apodo o alias"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Simpatizante
              </label>
              <input
                type="text"
                value={formData.simpatizante}
                onChange={(e) => handleInputChange('simpatizante', e.target.value)}
                className="input-field"
                placeholder="Simpatizante de"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Civil
              </label>
              <select
                value={formData.estado_civil}
                onChange={(e) => handleInputChange('estado_civil', e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar estado civil</option>
                <option value="soltero">Soltero</option>
                <option value="casado">Casado</option>
                <option value="union_libre">Unión Libre</option>
                <option value="divorciado">Divorciado</option>
                <option value="viudo">Viudo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grado de Escolaridad
              </label>
              <select
                value={formData.grado_escolaridad}
                onChange={(e) => handleInputChange('grado_escolaridad', e.target.value)}
                className="input-field"
              >
                <option value="">Seleccionar grado</option>
                <option value="ninguno">Ninguno</option>
                <option value="primaria_incompleta">Primaria Incompleta</option>
                <option value="primaria_completa">Primaria Completa</option>
                <option value="secundaria_incompleta">Secundaria Incompleta</option>
                <option value="secundaria_completa">Secundaria Completa</option>
                <option value="bachillerato">Bachillerato</option>
                <option value="universitario">Universitario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Responsable
              </label>
              <input
                type="text"
                value={formData.nombre_responsable}
                onChange={(e) => handleInputChange('nombre_responsable', e.target.value)}
                className="input-field"
                placeholder="Nombre del responsable legal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono del Responsable
              </label>
              <input
                type="tel"
                value={formData.telefono_responsable}
                onChange={(e) => handleInputChange('telefono_responsable', e.target.value)}
                className="input-field"
                placeholder="Número de teléfono"
              />
            </div>
          </div>
        </div>

        {/* DATOS JUDICIALES */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">DATOS JUDICIALES</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Juzgado Remitente
              </label>
              <input
                type="text"
                value={formData.juzgado_remitente}
                onChange={(e) => handleInputChange('juzgado_remitente', e.target.value)}
                className="input-field"
                placeholder="Nombre del juzgado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Juez que Remite
              </label>
              <input
                type="text"
                value={formData.juez_remite}
                onChange={(e) => handleInputChange('juez_remite', e.target.value)}
                className="input-field"
                placeholder="Nombre del juez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expediente Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => handleInputChange('expediente_judicial', e.target.value)}
                className="input-field"
                placeholder="Número de expediente judicial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Oficio de Ingreso
              </label>
              <input
                type="text"
                value={formData.numero_oficio_ingreso}
                onChange={(e) => handleInputChange('numero_oficio_ingreso', e.target.value)}
                className="input-field"
                placeholder="Número de oficio"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Infracción Penal por la que Ingresó
              </label>
              <textarea
                value={formData.infraccion_penal}
                onChange={(e) => handleInputChange('infraccion_penal', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Descripción de la infracción"
              />
            </div>

            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.es_reincidente}
                      onChange={(e) => handleInputChange('es_reincidente', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Es Reincidente</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ha_estado_otro_centro}
                      onChange={(e) => handleInputChange('ha_estado_otro_centro', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Ha estado en Otro Centro Pedagógico de Internamiento</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ha_estado_proceso_judicial}
                      onChange={(e) => handleInputChange('ha_estado_proceso_judicial', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Ha estado sometido a otro Proceso Judicial</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMA DE INGRESO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">FORMA DE INGRESO</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.cumplimiento_medida_cautelar}
                  onChange={(e) => handleInputChange('cumplimiento_medida_cautelar', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">1. Cumplimiento de Medida Cautelar</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sancion_privativa_libertad}
                  onChange={(e) => handleInputChange('sancion_privativa_libertad', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">2. Sanción Privativa de Libertad</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.traslado}
                  onChange={(e) => handleInputChange('traslado', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">3. Traslado</span>
              </label>
            </div>
          </div>
        </div>

        {/* ESTADO FÍSICO AL MOMENTO DE INGRESO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">ESTADO FÍSICO AL MOMENTO DE SU INGRESO</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Golpes
              </label>
              <input
                type="text"
                value={formData.golpes}
                onChange={(e) => handleInputChange('golpes', e.target.value)}
                className="input-field"
                placeholder="Descripción de golpes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heridas
              </label>
              <input
                type="text"
                value={formData.heridas}
                onChange={(e) => handleInputChange('heridas', e.target.value)}
                className="input-field"
                placeholder="Descripción de heridas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cicatrices
              </label>
              <input
                type="text"
                value={formData.cicatrices}
                onChange={(e) => handleInputChange('cicatrices', e.target.value)}
                className="input-field"
                placeholder="Descripción de cicatrices"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enfermedad
              </label>
              <input
                type="text"
                value={formData.enfermedad}
                onChange={(e) => handleInputChange('enfermedad', e.target.value)}
                className="input-field"
                placeholder="Enfermedades presentes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impedimentos Físicos
              </label>
              <input
                type="text"
                value={formData.impedimentos_fisicos}
                onChange={(e) => handleInputChange('impedimentos_fisicos', e.target.value)}
                className="input-field"
                placeholder="Impedimentos físicos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ansiedad
              </label>
              <input
                type="text"
                value={formData.ansiedad}
                onChange={(e) => handleInputChange('ansiedad', e.target.value)}
                className="input-field"
                placeholder="Estado de ansiedad"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal del Área Médica que lo Atendió
              </label>
              <input
                type="text"
                value={formData.personal_medico_atendio}
                onChange={(e) => handleInputChange('personal_medico_atendio', e.target.value)}
                className="input-field"
                placeholder="Nombre del personal médico"
              />
            </div>
          </div>
        </div>

        {/* APREHENSIÓN Y TRASLADO AL CPI */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">APREHENSIÓN Y TRASLADO AL CPI</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Aprehensión
              </label>
              <input
                type="date"
                value={formData.fecha_aprehension}
                onChange={(e) => handleInputChange('fecha_aprehension', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quién lo Aprehendió
              </label>
              <input
                type="text"
                value={formData.quien_aprehendio}
                onChange={(e) => handleInputChange('quien_aprehendio', e.target.value)}
                className="input-field"
                placeholder="Autoridad que realizó la aprehensión"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fue Golpeado o Maltratado Durante su Aprehensión
              </label>
              <input
                type="text"
                value={formData.fue_golpeado_aprehension}
                onChange={(e) => handleInputChange('fue_golpeado_aprehension', e.target.value)}
                className="input-field"
                placeholder="Descripción de maltrato durante aprehensión"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fue Golpeado o Maltratado Durante su Traslado al CPI
              </label>
              <input
                type="text"
                value={formData.fue_golpeado_traslado}
                onChange={(e) => handleInputChange('fue_golpeado_traslado', e.target.value)}
                className="input-field"
                placeholder="Descripción de maltrato durante traslado"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Por Quién Fue Trasladado al CPI
              </label>
              <input
                type="text"
                value={formData.por_quien_trasladado}
                onChange={(e) => handleInputChange('por_quien_trasladado', e.target.value)}
                className="input-field"
                placeholder="Personal responsable del traslado"
              />
            </div>
          </div>
        </div>

        {/* OBSERVACIONES */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">OBSERVACIONES</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Observaciones adicionales sobre el ingreso"
            />
          </div>
        </div>

        {/* FIRMAS */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">FIRMAS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Supervisor de Seguridad
              </label>
              <input
                type="text"
                value={formData.nombre_supervisor_seguridad}
                onChange={(e) => handleInputChange('nombre_supervisor_seguridad', e.target.value)}
                className="input-field"
                placeholder="Nombre completo del supervisor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de la Entrevista
              </label>
              <input
                type="date"
                value={formData.fecha_entrevista}
                onChange={(e) => handleInputChange('fecha_entrevista', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma del NNA
              </label>
              <input
                type="text"
                value={formData.firma_nna}
                onChange={(e) => handleInputChange('firma_nna', e.target.value)}
                className="input-field"
                placeholder="Firma del menor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma Supervisor de Seguridad
              </label>
              <input
                type="text"
                value={formData.firma_supervisor}
                onChange={(e) => handleInputChange('firma_supervisor', e.target.value)}
                className="input-field"
                placeholder="Firma del supervisor"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
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
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Ficha de Ingreso'}
          </button>
        </div>
      </form>
    </div>
  )
}

