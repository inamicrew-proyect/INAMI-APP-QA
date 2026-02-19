'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
  expediente_administrativo?: string
  expediente_judicial?: string
}

interface FormData {
  joven_id: string
  centro_pedagogico: string
  
  // DATOS DE IDENTIFICACIÓN DEL NIÑO
  nombre: string
  edad: number
  fecha_ingreso: string
  fecha_egreso: string
  fecha_elaboracion: string
  
  // SITUACIÓN INDIVIDUAL
  situacion_encontrada_ingreso: string
  cambios_conductuales: string
  que_cambios_considera: string
  como_contribuyo_intervencion: string
  comportamiento_centro: string
  actividades_participo: string
  actividades_tiempo_libre: string
  
  // SITUACIÓN FAMILIAR
  situacion_actual_familia: string
  participacion_familia_procesos: string
  logros_familia_proceso: string
  obstaculos_familia_proceso: string
  
  // SITUACIÓN COMUNITARIA
  relacion_personas_comunidad: string
  comportamiento_actual_amigos: string
  personas_comunidad_apoyaron: string
  personas_factor_positivo_reinsercion: string
  actividades_comunitarias_participara: string
  
  // FACTORES DE RIESGO COMUNITARIOS
  problemas_nivel_familiar: string
  relaciones_pares_grupos_ilicitos: string
  falta_apoyo_organizaciones_base: string
  
  // INTERPRETACIÓN TÉCNICA SOCIAL
  factores_individuales_alcanzados: string
  disminucion_factores_riesgo: string
  metas_objetivos_vida: string
  
  // FIRMA
  trabajador_social: string
}

export default function FichaEntrevistaEgresoCPIPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre: '',
    edad: 0,
    fecha_ingreso: '',
    fecha_egreso: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    situacion_encontrada_ingreso: '',
    cambios_conductuales: '',
    que_cambios_considera: '',
    como_contribuyo_intervencion: '',
    comportamiento_centro: '',
    actividades_participo: '',
    actividades_tiempo_libre: '',
    situacion_actual_familia: '',
    participacion_familia_procesos: '',
    logros_familia_proceso: '',
    obstaculos_familia_proceso: '',
    relacion_personas_comunidad: '',
    comportamiento_actual_amigos: '',
    personas_comunidad_apoyaron: '',
    personas_factor_positivo_reinsercion: '',
    actividades_comunitarias_participara: '',
    problemas_nivel_familiar: '',
    relaciones_pares_grupos_ilicitos: '',
    falta_apoyo_organizaciones_base: '',
    factores_individuales_alcanzados: '',
    disminucion_factores_riesgo: '',
    metas_objetivos_vida: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad, expediente_administrativo, expediente_judicial')
        .eq('estado', 'activo')
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
    } catch (error) {
      console.error('Error loading jovenes:', error)
      alert('Error al cargar los jóvenes')
    } finally {
      setLoading(false)
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) {
      newErrors.joven_id = 'Debe seleccionar un joven'
    }
    if (!formData.trabajador_social.trim()) {
      newErrors.trabajador_social = 'El nombre del trabajador social es requerido'
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

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Obtener tipo de atención para trabajador social
      const { data: tipoAtencion } = await supabase
        .from('tipos_atencion')
        .select('id')
        .eq('profesional_responsable', 'trabajador_social')
        .limit(1)
        .maybeSingle()

      let tipoAtencionId = tipoAtencion?.id
      
      if (!tipoAtencionId) {
        const { data: anyTipo } = await supabase
          .from('tipos_atencion')
          .select('id')
          .limit(1)
          .maybeSingle()
        
        tipoAtencionId = anyTipo?.id
      }

      // Crear fecha de atención en formato ISO
      const fechaAtencion = formData.fecha_elaboracion ? new Date(formData.fecha_elaboracion).toISOString() : new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha Entrevista de Egreso CPI',
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      const atencionId = atencion.id

      // Preparar datos JSON
      const datosJson = {
        ...formData,
        fecha_ingreso: formData.fecha_ingreso,
        fecha_egreso: formData.fecha_egreso,
        fecha_elaboracion: formData.fecha_elaboracion
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_entrevista_egreso_cpi',
          joven_id: formData.joven_id,
          atencion_id: atencionId,
          datos_json: datosJson,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Error al guardar el formulario: ${insertError.message}`)
      }

      alert('Ficha Entrevista de Egreso CPI guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la ficha: ${error.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha Entrevista de Egreso CPI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">FICHA DE ENTREVISTA FINAL DE CIERRE O EGRESO</h3>
        <p className="text-md font-medium mt-4">Centro Pedagógico de Internamiento: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN DEL NIÑO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DEL NIÑO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joven <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.joven_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Seleccione un joven</option>
                {jovenes.map((joven) => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
              {errors.joven_id && <p className="mt-1 text-sm text-red-600">{errors.joven_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input type="text" value={formData.nombre} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de ingreso</label>
              <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de egreso</label>
              <input type="date" value={formData.fecha_egreso} onChange={(e) => setFormData(prev => ({ ...prev, fecha_egreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de elaboración de la entrevista</label>
              <input type="date" value={formData.fecha_elaboracion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN INDIVIDUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN INDIVIDUAL</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Situación encontrada al momento de ingresar al Centro.
              </label>
              <textarea
                value={formData.situacion_encontrada_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_encontrada_ingreso: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cambios Conductuales.
              </label>
              <textarea
                value={formData.cambios_conductuales}
                onChange={(e) => setFormData(prev => ({ ...prev, cambios_conductuales: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué cambios considera ha tenido durante ha permanecido en el Centro?
              </label>
              <textarea
                value={formData.que_cambios_considera}
                onChange={(e) => setFormData(prev => ({ ...prev, que_cambios_considera: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo le ha contribuido la intervención recibida en el Centro?
              </label>
              <textarea
                value={formData.como_contribuyo_intervencion}
                onChange={(e) => setFormData(prev => ({ ...prev, como_contribuyo_intervencion: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">c. Comportamiento en el Centro</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cuál ha sido el comportamiento que el NNAJ durante ha estado en el centro?
                  </label>
                  <textarea
                    value={formData.comportamiento_centro}
                    onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_centro: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿En qué actividades ha participado durante estuvo en el centro?
                  </label>
                  <textarea
                    value={formData.actividades_participo}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_participo: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Qué actividades ha realizado en su tiempo libre?
                  </label>
                  <textarea
                    value={formData.actividades_tiempo_libre}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SITUACIÓN FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN FAMILIAR</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Situación actual de la familia
              </label>
              <textarea
                value={formData.situacion_actual_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_actual_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿De qué manera ha participado la familia en los procesos de reeducación con el NNAJ?
              </label>
              <textarea
                value={formData.participacion_familia_procesos}
                onChange={(e) => setFormData(prev => ({ ...prev, participacion_familia_procesos: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué logros ha tenido la familia durante este proceso?
              </label>
              <textarea
                value={formData.logros_familia_proceso}
                onChange={(e) => setFormData(prev => ({ ...prev, logros_familia_proceso: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué obstáculos ha tenido la familia durante este proceso?
              </label>
              <textarea
                value={formData.obstaculos_familia_proceso}
                onChange={(e) => setFormData(prev => ({ ...prev, obstaculos_familia_proceso: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SITUACIÓN COMUNITARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN COMUNITARIA</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Factores protectores comunitarios</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cómo es la relación con las personas que viven en su comunidad?
                  </label>
                  <textarea
                    value={formData.relacion_personas_comunidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, relacion_personas_comunidad: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Cómo es el comportamiento actual de sus amigos?
                  </label>
                  <textarea
                    value={formData.comportamiento_actual_amigos}
                    onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_actual_amigos: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Durante este proceso que personas de su comunidad le apoyaron?
                  </label>
                  <textarea
                    value={formData.personas_comunidad_apoyaron}
                    onChange={(e) => setFormData(prev => ({ ...prev, personas_comunidad_apoyaron: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Qué personas de la comunidad son un factor positivo para la reinserción del NNAJ?
                  </label>
                  <textarea
                    value={formData.personas_factor_positivo_reinsercion}
                    onChange={(e) => setFormData(prev => ({ ...prev, personas_factor_positivo_reinsercion: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿En que actividades comunitarias participará?
                  </label>
                  <textarea
                    value={formData.actividades_comunitarias_participara}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_comunitarias_participara: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">b-Factores de riesgo comunitarios</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Problemas a nivel familiar:
                  </label>
                  <textarea
                    value={formData.problemas_nivel_familiar}
                    onChange={(e) => setFormData(prev => ({ ...prev, problemas_nivel_familiar: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relaciones con pares pertenecientes a grupos de Asociación Ilícita:
                  </label>
                  <textarea
                    value={formData.relaciones_pares_grupos_ilicitos}
                    onChange={(e) => setFormData(prev => ({ ...prev, relaciones_pares_grupos_ilicitos: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Falta de apoyo de organizaciones de base:
                  </label>
                  <textarea
                    value={formData.falta_apoyo_organizaciones_base}
                    onChange={(e) => setFormData(prev => ({ ...prev, falta_apoyo_organizaciones_base: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERPRETACIÓN TÉCNICA SOCIAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">INTERPRETACIÓN TÉCNICA SOCIAL</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Factores individuales alcanzados
              </label>
              <textarea
                value={formData.factores_individuales_alcanzados}
                onChange={(e) => setFormData(prev => ({ ...prev, factores_individuales_alcanzados: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Disminución de factores de riesgo
              </label>
              <textarea
                value={formData.disminucion_factores_riesgo}
                onChange={(e) => setFormData(prev => ({ ...prev, disminucion_factores_riesgo: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metas y objetivos de vida
              </label>
              <textarea
                value={formData.metas_objetivos_vida}
                onChange={(e) => setFormData(prev => ({ ...prev, metas_objetivos_vida: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre, firma y sello del/a Trabajador/a Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.trabajador_social}
              onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.trabajador_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.trabajador_social && <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/atenciones"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

