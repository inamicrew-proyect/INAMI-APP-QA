'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, FileText, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
}

interface FormData {
  joven_id: string
  fecha_ingreso: string
  hora_ingreso: string
  supervisor_seguridad: string
  
  // Datos personales del adolescente
  nombre_completo: string
  expediente_administrativo: string
  edad: number
  fecha_nacimiento: string
  originario: string
  residente: string
  dni: string
  alias: string
  simpatizante: string
  estado_civil: string
  grado_escolaridad: string
  responsable: string
  telefono_responsable: string
  
  // Datos judiciales
  juzgado_remitente: string
  juez_remite: string
  expediente_judicial: string
  oficio_ingreso: string
  infraccion_penal: string
  es_reincidente: boolean
  ha_estado_centro_pedagogico: boolean
  ha_estado_proceso_judicial: boolean
  
  // Forma de ingreso
  forma_ingreso: string
  
  // Estado físico al momento del ingreso
  golpes: boolean
  heridas: boolean
  cicatrices: boolean
  enfermedad: boolean
  impedimentos_fisicos: boolean
  ansiedad: boolean
  personal_medico_atendio: string
  
  // Aprehensión y traslado
  fecha_aprehension: string
  quien_aprehendio: string
  fue_golpeado_aprehension: boolean
  fue_golpeado_traslado: boolean
  por_quien_trasladado: string
  
  // Observaciones
  observaciones: string
}

export default function FichaIngresoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    hora_ingreso: new Date().toTimeString().slice(0, 5),
    supervisor_seguridad: '',
    nombre_completo: '',
    expediente_administrativo: '',
    edad: 0,
    fecha_nacimiento: '',
    originario: '',
    residente: '',
    dni: '',
    alias: '',
    simpatizante: '',
    estado_civil: '',
    grado_escolaridad: '',
    responsable: '',
    telefono_responsable: '',
    juzgado_remitente: '',
    juez_remite: '',
    expediente_judicial: '',
    oficio_ingreso: '',
    infraccion_penal: '',
    es_reincidente: false,
    ha_estado_centro_pedagogico: false,
    ha_estado_proceso_judicial: false,
    forma_ingreso: '',
    golpes: false,
    heridas: false,
    cicatrices: false,
    enfermedad: false,
    impedimentos_fisicos: false,
    ansiedad: false,
    personal_medico_atendio: '',
    fecha_aprehension: '',
    quien_aprehendio: '',
    fue_golpeado_aprehension: false,
    fue_golpeado_traslado: false,
    por_quien_trasladado: '',
    observaciones: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad')
        .eq('estado', 'activo')
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
    } catch (error) {
      console.error('Error loading jovenes:', error)
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        fecha_nacimiento: joven.fecha_nacimiento,
        edad: joven.edad
      }))
    }
  }

  // Función para obtener el ID del tipo de atención de seguridad
  const getTipoAtencionId = async (): Promise<string> => {
    const { data, error } = await supabase
      .from('tipos_atencion')
      .select('id')
      .eq('profesional_responsable', 'seguridad')
      .single()

    if (error || !data) {
      console.warn('No se encontró tipo de atención para seguridad, intentando crear...')
      // Intentar crear uno si no existe
      const { data: newTipo, error: createError } = await supabase
        .from('tipos_atencion')
        .insert({
          nombre: 'Registro de Seguridad',
          descripcion: 'Ficha de ingreso del área de seguridad',
          profesional_responsable: 'seguridad'
        })
        .select()
        .single()
      
      if (createError || !newTipo) {
        throw new Error('No se pudo obtener o crear el tipo de atención de seguridad')
      }
      return newTipo.id
    }

    return data.id
  }

  // Función para obtener el usuario actual
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión.')
    }
    return user
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones básicas
    if (!formData.joven_id) {
      alert('Por favor selecciona un joven')
      return
    }

    if (!formData.fecha_ingreso) {
      alert('Por favor ingresa la fecha de ingreso')
      return
    }

    if (!formData.supervisor_seguridad) {
      alert('Por favor ingresa el nombre del supervisor de seguridad')
      return
    }

    setLoading(true)

    try {
      console.log('📤 Iniciando guardado de ficha de ingreso...')

      // 1. Obtener usuario actual
      const currentUser = await getCurrentUser()
      console.log('✅ Usuario actual obtenido:', currentUser.id)

      // 2. Obtener ID del tipo de atención
      const tipoAtencionId = await getTipoAtencionId()
      console.log('✅ Tipo de atención obtenido:', tipoAtencionId)

      // 3. Crear la atención de seguridad
      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: currentUser.id,
          fecha_atencion: new Date().toISOString(),
          motivo: 'Ficha de Ingreso - Área de Seguridad',
          observaciones: formData.observaciones || null,
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        console.error('❌ Error creando atención:', atencionError)
        throw new Error(`Error al crear atención: ${atencionError.message}`)
      }

      if (!atencionData) {
        throw new Error('No se recibió datos de la atención creada')
      }

      console.log('✅ Atención creada:', atencionData.id)

      // 4. Crear el formulario de atención
      const { data: formularioData, error: formularioError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_ingreso_seguridad',
          joven_id: formData.joven_id,
          atencion_id: atencionData.id,
          datos_json: formData // Guardar todos los datos como JSON también
        })
        .select()
        .single()

      if (formularioError) {
        console.error('❌ Error creando formulario:', formularioError)
        throw new Error(`Error al crear formulario: ${formularioError.message}`)
      }

      console.log('✅ Formulario creado:', formularioData.id)

      // 5. Crear la ficha de ingreso de seguridad en la tabla específica
      const { data: fichaData, error: fichaError } = await supabase
        .from('fichas_ingreso_seguridad')
        .insert({
          joven_id: formData.joven_id,
          formulario_id: formularioData.id,
          atencion_id: atencionData.id,
          trabajador_social: formData.supervisor_seguridad,
          fecha_ingreso: formData.fecha_ingreso,
          hora_ingreso: formData.hora_ingreso || null,
          // Datos personales
          originario_de: formData.originario || null,
          residente_en: formData.residente || null,
          alias: formData.alias || null,
          simpatizante_grupo: formData.simpatizante || null,
          grado_escolaridad: formData.grado_escolaridad || null,
          estado_civil: formData.estado_civil || null,
          nombre_responsable: formData.responsable || null,
          telefono_responsable: formData.telefono_responsable || null,
          // Datos judiciales
          expediente_judicial: formData.expediente_judicial || null,
          infraccion_penal: formData.infraccion_penal || null,
          es_reincidente: formData.es_reincidente || false,
          ha_estado_otro_centro: formData.ha_estado_centro_pedagogico || false,
          ha_estado_sometido_proceso_judicial: formData.ha_estado_proceso_judicial || false,
          juzgado_remitente: formData.juzgado_remitente || null,
          juez_remitente: formData.juez_remite || null,
          numero_oficio_ingreso: formData.oficio_ingreso || null,
          // Forma de ingreso
          forma_ingreso: formData.forma_ingreso || null,
          // Estado físico (son boolean en la tabla)
          golpes: formData.golpes || false,
          heridas: formData.heridas || false,
          cicatrices: formData.cicatrices || false,
          enfermedad: formData.enfermedad || false,
          impedimentos_fisicos: formData.impedimentos_fisicos || false,
          ansiedad: formData.ansiedad || false,
          personal_medico_atendio: formData.personal_medico_atendio || null,
          // Aprehensión y traslado
          fecha_aprehension: formData.fecha_aprehension || null,
          quien_aprehendio: formData.quien_aprehendio || null,
          golpeado_durante_aprehension: formData.fue_golpeado_aprehension || false,
          golpeado_durante_traslado: formData.fue_golpeado_traslado || false,
          por_quien_trasladado: formData.por_quien_trasladado || null,
          // Observaciones
          observaciones_generales: formData.observaciones || null,
          // Auditoría
          created_by: currentUser.id
        })
        .select()
        .single()

      if (fichaError) {
        console.error('❌ Error creando ficha de ingreso:', fichaError)
        throw new Error(`Error al crear ficha de ingreso: ${fichaError.message}`)
      }

      console.log('✅ Ficha de ingreso creada exitosamente:', fichaData)
      alert('Ficha de ingreso guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('❌ Error completo:', error)
      alert(`Error al guardar la ficha: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha de Ingreso - Área de Seguridad
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Formulario de ingreso para adolescentes en el centro
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información General */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información General
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Joven *
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Seleccionar joven</option>
                {jovenes.map(joven => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de Ingreso *
              </label>
              <input
                type="time"
                value={formData.hora_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, hora_ingreso: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Supervisor de Seguridad *
              </label>
              <input
                type="text"
                value={formData.supervisor_seguridad}
                onChange={(e) => setFormData(prev => ({ ...prev, supervisor_seguridad: e.target.value }))}
                className="input-field"
                placeholder="Nombre del supervisor"
                required
              />
            </div>
          </div>
        </div>

        {/* Datos Personales del Adolescente */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Datos Personales del Adolescente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                No. de Expediente Administrativo
              </label>
              <input
                type="text"
                value={formData.expediente_administrativo}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_administrativo: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => setFormData(prev => ({ ...prev, edad: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Originario de
              </label>
              <input
                type="text"
                value={formData.originario}
                onChange={(e) => setFormData(prev => ({ ...prev, originario: e.target.value }))}
                className="input-field"
                placeholder="Lugar de origen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Residente en
              </label>
              <input
                type="text"
                value={formData.residente}
                onChange={(e) => setFormData(prev => ({ ...prev, residente: e.target.value }))}
                className="input-field"
                placeholder="Lugar de residencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de DNI
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                className="input-field"
                placeholder="Número de identidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alias
              </label>
              <input
                type="text"
                value={formData.alias}
                onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                className="input-field"
                placeholder="Apodo o alias"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Simpatizante
              </label>
              <input
                type="text"
                value={formData.simpatizante}
                onChange={(e) => setFormData(prev => ({ ...prev, simpatizante: e.target.value }))}
                className="input-field"
                placeholder="Grupo o pandilla"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Civil
              </label>
              <select
                value={formData.estado_civil}
                onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Soltero">Soltero</option>
                <option value="Casado">Casado</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viudo">Viudo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grado de Escolaridad
              </label>
              <select
                value={formData.grado_escolaridad}
                onChange={(e) => setFormData(prev => ({ ...prev, grado_escolaridad: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Primaria Incompleta">Primaria Incompleta</option>
                <option value="Primaria Completa">Primaria Completa</option>
                <option value="Secundaria Incompleta">Secundaria Incompleta</option>
                <option value="Secundaria Completa">Secundaria Completa</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Universitario">Universitario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Responsable
              </label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                className="input-field"
                placeholder="Padre, madre o tutor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono del Responsable
              </label>
              <input
                type="text"
                value={formData.telefono_responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono_responsable: e.target.value }))}
                className="input-field"
                placeholder="Número de teléfono"
              />
            </div>
          </div>
        </div>

        {/* Datos Judiciales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Datos Judiciales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juzgado Remitente
              </label>
              <input
                type="text"
                value={formData.juzgado_remitente}
                onChange={(e) => setFormData(prev => ({ ...prev, juzgado_remitente: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juez que Remite al Adolescente
              </label>
              <input
                type="text"
                value={formData.juez_remite}
                onChange={(e) => setFormData(prev => ({ ...prev, juez_remite: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expediente Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                No. de Oficio de Ingreso
              </label>
              <input
                type="text"
                value={formData.oficio_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, oficio_ingreso: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Infracción Penal por la que Ingresa
              </label>
              <input
                type="text"
                value={formData.infraccion_penal}
                onChange={(e) => setFormData(prev => ({ ...prev, infraccion_penal: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.es_reincidente}
                      onChange={(e) => setFormData(prev => ({ ...prev, es_reincidente: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>Es reincidente</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ha_estado_centro_pedagogico}
                      onChange={(e) => setFormData(prev => ({ ...prev, ha_estado_centro_pedagogico: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>Ha estado en Otro Centro Pedagógico de Internamiento</span>
                  </label>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.ha_estado_proceso_judicial}
                      onChange={(e) => setFormData(prev => ({ ...prev, ha_estado_proceso_judicial: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>Ha estado sometido a otro Proceso Judicial</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forma de Ingreso */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Forma de Ingreso
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forma_ingreso"
                  value="cumplimiento_medida_cautelar"
                  checked={formData.forma_ingreso === 'cumplimiento_medida_cautelar'}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_ingreso: e.target.value }))}
                  className="form-radio"
                />
                <span>Cumplimiento de Medida Cautelar</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forma_ingreso"
                  value="sancion_privativa_libertad"
                  checked={formData.forma_ingreso === 'sancion_privativa_libertad'}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_ingreso: e.target.value }))}
                  className="form-radio"
                />
                <span>Sanción Privativa de Libertad</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="forma_ingreso"
                  value="traslado"
                  checked={formData.forma_ingreso === 'traslado'}
                  onChange={(e) => setFormData(prev => ({ ...prev, forma_ingreso: e.target.value }))}
                  className="form-radio"
                />
                <span>Traslado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Estado Físico al Momento del Ingreso */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estado Físico al Momento del Ingreso
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.golpes}
                  onChange={(e) => setFormData(prev => ({ ...prev, golpes: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Golpes</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.heridas}
                  onChange={(e) => setFormData(prev => ({ ...prev, heridas: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Heridas</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.cicatrices}
                  onChange={(e) => setFormData(prev => ({ ...prev, cicatrices: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Cicatrices</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enfermedad}
                  onChange={(e) => setFormData(prev => ({ ...prev, enfermedad: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Enfermedad</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.impedimentos_fisicos}
                  onChange={(e) => setFormData(prev => ({ ...prev, impedimentos_fisicos: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Impedimentos Físicos</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.ansiedad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ansiedad: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Ansiedad</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal del Área Médica que lo Atendió
              </label>
              <input
                type="text"
                value={formData.personal_medico_atendio}
                onChange={(e) => setFormData(prev => ({ ...prev, personal_medico_atendio: e.target.value }))}
                className="input-field"
                placeholder="Nombre del personal médico"
              />
            </div>
          </div>
        </div>

        {/* Aprehensión y Traslado al CPI */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Aprehensión y Traslado al CPI
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Aprehensión
              </label>
              <input
                type="date"
                value={formData.fecha_aprehension}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_aprehension: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quién lo Aprehendió
              </label>
              <input
                type="text"
                value={formData.quien_aprehendio}
                onChange={(e) => setFormData(prev => ({ ...prev, quien_aprehendio: e.target.value }))}
                className="input-field"
                placeholder="Autoridad que realizó la aprehensión"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.fue_golpeado_aprehension}
                  onChange={(e) => setFormData(prev => ({ ...prev, fue_golpeado_aprehension: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Fue golpeado o maltratado durante su Aprehensión</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.fue_golpeado_traslado}
                  onChange={(e) => setFormData(prev => ({ ...prev, fue_golpeado_traslado: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Fue golpeado o maltratado durante su traslado al CPI</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Por Quién fue Trasladado al CPI
              </label>
              <input
                type="text"
                value={formData.por_quien_trasladado}
                onChange={(e) => setFormData(prev => ({ ...prev, por_quien_trasladado: e.target.value }))}
                className="input-field"
                placeholder="Autoridad responsable del traslado"
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Observaciones
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Observaciones adicionales sobre el ingreso..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/atenciones" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Ficha de Ingreso'}
          </button>
        </div>
      </form>
    </div>
  )
}