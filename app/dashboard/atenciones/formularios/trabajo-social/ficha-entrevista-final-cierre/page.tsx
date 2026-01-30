'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Home, Users } from 'lucide-react'
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
  region: string
  
  // DATOS DE IDENTIFICACIÓN DEL NNAJ
  nombre: string
  edad: number
  fecha_ingreso: string
  fecha_egreso: string
  expediente_administrativo: string
  expediente_judicial: string
  infraccion: string
  tipo_medida_sancion: string
  juzgado_conoce_causa: string
  nombre_responsable: string
  nombre_conyuge: string
  telefono: string
  residencia: string
  fecha_elaboracion: string
  
  // SITUACIÓN INDIVIDUAL
  situacion_encontrada_llegada: string
  cambios_conductuales: string
  como_ayudo_intervencion: string
  comportamiento_pmspl: string
  actividades_participado: string
  actividades_tiempo_libre: string
  
  // SITUACIÓN FAMILIAR
  situacion_actual_familia: string
  participacion_familia: string
  logros_familia: string
  obstaculos_familia: string
  
  // SITUACIÓN COMUNITARIA
  relacion_personas_comunidad: string
  comportamiento_amigos: string
  personas_apoyaron: string
  personas_factor_positivo: string
  actividades_comunitarias: string
  
  // INTERPRETACIÓN TÉCNICA SOCIAL
  factores_individuales_alcanzados: string
  disminucion_factores_riesgo: string
  metas_objetivos_vida: string
  
  // FIRMA
  trabajador_social: string
}

export default function FichaEntrevistaFinalCierrePage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    region: '',
    nombre: '',
    edad: 0,
    fecha_ingreso: '',
    fecha_egreso: '',
    expediente_administrativo: '',
    expediente_judicial: '',
    infraccion: '',
    tipo_medida_sancion: '',
    juzgado_conoce_causa: '',
    nombre_responsable: '',
    nombre_conyuge: '',
    telefono: '',
    residencia: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    situacion_encontrada_llegada: '',
    cambios_conductuales: '',
    como_ayudo_intervencion: '',
    comportamiento_pmspl: '',
    actividades_participado: '',
    actividades_tiempo_libre: '',
    situacion_actual_familia: '',
    participacion_familia: '',
    logros_familia: '',
    obstaculos_familia: '',
    relacion_personas_comunidad: '',
    comportamiento_amigos: '',
    personas_apoyaron: '',
    personas_factor_positivo: '',
    actividades_comunitarias: '',
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
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        expediente_administrativo: joven.expediente_administrativo || '',
        expediente_judicial: joven.expediente_judicial || ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.joven_id) {
        alert('Por favor, selecciona un joven de la lista')
        setSaving(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.')
      }

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

      if (!tipoAtencionId) {
        throw new Error('No se encontró ningún tipo de atención en la base de datos.')
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('Tu usuario no tiene un perfil configurado.')
      }

      // Usar la fecha de elaboración o la fecha actual en formato ISO
      let fechaAtencion = new Date().toISOString()
      if (formData.fecha_elaboracion) {
        fechaAtencion = new Date(formData.fecha_elaboracion + 'T00:00:00').toISOString()
      } else if (formData.fecha_ingreso) {
        fechaAtencion = new Date(formData.fecha_ingreso + 'T00:00:00').toISOString()
      }

      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha Entrevista Final Cierre',
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        console.error('Error al crear atención:', atencionError)
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      if (!nuevaAtencion) {
        throw new Error('No se pudo crear la atención')
      }

      const atencionId = nuevaAtencion.id
      console.log('✅ Atención creada exitosamente:', atencionId)

      const datosJson = {
        ...formData,
        fecha_elaboracion: formData.fecha_elaboracion || new Date().toISOString().split('T')[0]
      }

      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_entrevista_final_cierre',
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

      alert('Ficha Entrevista Final Cierre guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la ficha: ${error.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha Entrevista Final Cierre
          </h1>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">Programa Medidas Sustitutivas a la Privación de Libertad</h3>
        <p className="text-md font-medium">Región: <input type="text" value={formData.region} onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="___________________" /></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN DEL NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DEL NNAJ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joven <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccione un joven</option>
                {jovenes.map((joven) => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expediente administrativo</label>
              <input type="text" value={formData.expediente_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expediente judicial</label>
              <input type="text" value={formData.expediente_judicial} onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infracción</label>
              <input type="text" value={formData.infraccion} onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Medida o sanción aplicada</label>
              <input type="text" value={formData.tipo_medida_sancion} onChange={(e) => setFormData(prev => ({ ...prev, tipo_medida_sancion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juzgado que conoce la causa</label>
              <input type="text" value={formData.juzgado_conoce_causa} onChange={(e) => setFormData(prev => ({ ...prev, juzgado_conoce_causa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del responsable</label>
              <input type="text" value={formData.nombre_responsable} onChange={(e) => setFormData(prev => ({ ...prev, nombre_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del cónyuge</label>
              <input type="text" value={formData.nombre_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, nombre_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Residencia</label>
              <textarea value={formData.residencia} onChange={(e) => setFormData(prev => ({ ...prev, residencia: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de elaboración de la entrevista</label>
              <input type="date" value={formData.fecha_elaboracion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN INDIVIDUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Situación Individual</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Situación encontrada al momento de llegar al Programa. (Diagnostico encontrada fase II).
              </label>
              <textarea
                value={formData.situacion_encontrada_llegada}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_encontrada_llegada: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describa la situación encontrada al momento de llegar al Programa"
              />
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Cambios Conductuales</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Qué cambios considera ha tenido durante ha estado en el Programa?
                </label>
                <textarea
                  value={formData.cambios_conductuales}
                  onChange={(e) => setFormData(prev => ({ ...prev, cambios_conductuales: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cómo le ha ayudado la intervención recibida en el Programa?
                </label>
                <textarea
                  value={formData.como_ayudo_intervencion}
                  onChange={(e) => setFormData(prev => ({ ...prev, como_ayudo_intervencion: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Comportamiento en el PMSPL</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿Cuál ha sido el comportamiento que el NNAJ ha mostrado durante su estadía en el Programa?
                </label>
                <textarea
                  value={formData.comportamiento_pmspl}
                  onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_pmspl: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ¿En qué actividades ha participado durante estuvo en el Programa?
                </label>
                <textarea
                  value={formData.actividades_participado}
                  onChange={(e) => setFormData(prev => ({ ...prev, actividades_participado: e.target.value }))}
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

        {/* SITUACIÓN FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Situación Familiar
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Situación actual de la familia
              </label>
              <textarea
                value={formData.situacion_actual_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_actual_familia: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿De qué manera ha participado la familia en estos procesos de reeducación con el joven?
              </label>
              <textarea
                value={formData.participacion_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, participacion_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué logros que ha tenido la familia durante este proceso?
              </label>
              <textarea
                value={formData.logros_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, logros_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué obstáculos que ha tenido la familia durante este proceso?
              </label>
              <textarea
                value={formData.obstaculos_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, obstaculos_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SITUACIÓN COMUNITARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5" />
            Situación Comunitaria
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Factores protectores comunitarios</p>
          
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
                value={formData.comportamiento_amigos}
                onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_amigos: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Durante este proceso que personas de su comunidad le apoyaron?
              </label>
              <textarea
                value={formData.personas_apoyaron}
                onChange={(e) => setFormData(prev => ({ ...prev, personas_apoyaron: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué personas de la comunidad son un factor positivo para la reinserción del NNAJ?
              </label>
              <textarea
                value={formData.personas_factor_positivo}
                onChange={(e) => setFormData(prev => ({ ...prev, personas_factor_positivo: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En que actividades comunitarias participa?
              </label>
              <textarea
                value={formData.actividades_comunitarias}
                onChange={(e) => setFormData(prev => ({ ...prev, actividades_comunitarias: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* INTERPRETACIÓN TÉCNICA SOCIAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Interpretación Técnica Social</h3>
          
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
              Lic. Trabajador/a Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.trabajador_social}
              onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
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
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </form>
    </div>
  )
}

