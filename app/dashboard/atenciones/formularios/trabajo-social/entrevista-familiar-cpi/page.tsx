'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Users } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
  identidad?: string
  expediente_administrativo?: string
  expediente_judicial?: string
}

interface FormData {
  joven_id: string
  centro_pedagogico: string
  
  // DATOS GENERALES DEL NNAJ
  nombre_completo: string
  exp_administrativo: string
  numero_identidad: string
  edad: number
  
  // DATOS DEL ENTREVISTADO/A
  nombre_entrevistado: string
  parentesco: string
  edad_entrevistado: string
  ocupacion_entrevistado: string
  direccion_entrevistado: string
  telefono_entrevistado: string
  
  // CONVIVENCIA FAMILIAR
  a_que_se_dedica: string
  convive_padre_madre: 'si' | 'no' | ''
  relacion_pareja: string
  relacion_padrastro_madrasta: string
  relacion_familia: string
  familiares_mayor_cercania: string
  familiares_mayor_conflictividad: string
  comportamiento_niñez_adolescencia: string
  responsabilidades_hogar: string
  virtudes_talentos: string
  acontecimientos_influyeron: string
  actitud_familia_situacion_actual: string
  nnaj_habla_intereses: 'si' | 'no' | ''
  explica_nnaj_habla: string
  miembros_antecedentes_delincuenciales: string
  
  // SITUACIÓN SOCIO-EDUCATIVA
  recibio_estimulacion_temprana: 'si' | 'no' | ''
  comportamiento_procesos_educativos: string
  tuvo_reportes_mal_comportamiento: 'si' | 'no' | ''
  desercion_escolar: 'si' | 'no' | ''
  rendimiento_academico: string
  estado_centros_proteccion: 'si' | 'no' | ''
  relacion_pares_fuera_familia: string
  comportamiento_situaciones_crisis: string
  
  // ENTORNO COMUNITARIO
  zona_rural_urbana: 'rural' | 'urbana' | ''
  organizaciones_servicios_sociales: string
  existen_asociaciones_ilicitas: 'si' | 'no' | ''
  existe_venta_drogas: 'si' | 'no' | ''
  conoce_actitudes_amigos: 'si' | 'no' | ''
  controla_supervisa_amistades: 'si' | 'no' | ''
  
  // ASPECTOS DE SALUD
  padece_enfermedad: 'si' | 'no' | ''
  historial_psiquiatrico_familia: string
  ha_observado_consumo_drogas: 'si' | 'no' | ''
  cuales_drogas: string
  recibio_ayuda_profesional: 'si' | 'no' | ''
  utilizo_drogas_embarazo: 'si' | 'no' | ''
  consumo_drogas_familia: 'si' | 'no' | ''
  
  // CONCLUSIONES
  conclusiones_factores_protectores_riesgo: string
  
  // FIRMAS
  trabajador_social: string
  familiar_entrevistado: string
}

export default function EntrevistaFamiliarCPIPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre_completo: '',
    exp_administrativo: '',
    numero_identidad: '',
    edad: 0,
    nombre_entrevistado: '',
    parentesco: '',
    edad_entrevistado: '',
    ocupacion_entrevistado: '',
    direccion_entrevistado: '',
    telefono_entrevistado: '',
    a_que_se_dedica: '',
    convive_padre_madre: '',
    relacion_pareja: '',
    relacion_padrastro_madrasta: '',
    relacion_familia: '',
    familiares_mayor_cercania: '',
    familiares_mayor_conflictividad: '',
    comportamiento_niñez_adolescencia: '',
    responsabilidades_hogar: '',
    virtudes_talentos: '',
    acontecimientos_influyeron: '',
    actitud_familia_situacion_actual: '',
    nnaj_habla_intereses: '',
    explica_nnaj_habla: '',
    miembros_antecedentes_delincuenciales: '',
    recibio_estimulacion_temprana: '',
    comportamiento_procesos_educativos: '',
    tuvo_reportes_mal_comportamiento: '',
    desercion_escolar: '',
    rendimiento_academico: '',
    estado_centros_proteccion: '',
    relacion_pares_fuera_familia: '',
    comportamiento_situaciones_crisis: '',
    zona_rural_urbana: '',
    organizaciones_servicios_sociales: '',
    existen_asociaciones_ilicitas: '',
    existe_venta_drogas: '',
    conoce_actitudes_amigos: '',
    controla_supervisa_amistades: '',
    padece_enfermedad: '',
    historial_psiquiatrico_familia: '',
    ha_observado_consumo_drogas: '',
    cuales_drogas: '',
    recibio_ayuda_profesional: '',
    utilizo_drogas_embarazo: '',
    consumo_drogas_familia: '',
    conclusiones_factores_protectores_riesgo: '',
    trabajador_social: '',
    familiar_entrevistado: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad, identidad, expediente_administrativo, expediente_judicial')
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
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        exp_administrativo: joven.expediente_administrativo || '',
        numero_identidad: joven.identidad || ''
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
      const fechaAtencion = new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha Entrevista Familiar CPI',
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
        ...formData
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'entrevista_familiar_cpi',
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

      alert('Ficha Entrevista Familiar CPI guardada exitosamente')
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
            Ficha Entrevista Familiar CPI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCION A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">CENTRO PEDAGOGICO DE INTERNAMIENTO</h3>
        <p className="text-md font-medium">CENTRO PEDAGOGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">AREA DE TRABAJO SOCIAL</h4>
        <h5 className="text-md font-semibold mt-2">ENTREVISTA FAMILIAR</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DEL NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Datos Generales del NNAJ
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
              <input type="text" value={formData.nombre_completo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. de expediente administrativo</label>
              <input type="text" value={formData.exp_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. de identidad</label>
              <input type="text" value={formData.numero_identidad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS DEL ENTREVISTADO/A */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Datos del entrevistado/a
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
              <input type="text" value={formData.nombre_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, nombre_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parentesco</label>
              <input type="text" value={formData.parentesco} onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="text" value={formData.edad_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, edad_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
              <input type="text" value={formData.ocupacion_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <input type="text" value={formData.direccion_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, direccion_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, telefono_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* CONVIVENCIA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">III. Convivencia familiar</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿A qué se dedica usted actualmente?
              </label>
              <textarea
                value={formData.a_que_se_dedica}
                onChange={(e) => setFormData(prev => ({ ...prev, a_que_se_dedica: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Actualmente convive con el padre/madre del NNAJ?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="convive_padre_madre"
                    value="si"
                    checked={formData.convive_padre_madre === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, convive_padre_madre: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="convive_padre_madre"
                    value="no"
                    checked={formData.convive_padre_madre === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, convive_padre_madre: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es su relación de pareja?
              </label>
              <textarea
                value={formData.relacion_pareja}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_pareja: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En caso de que sea padrastro o madrasta como es la relación con el NNAJ?
              </label>
              <textarea
                value={formData.relacion_padrastro_madrasta}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_padrastro_madrasta: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la relación entre familia/ hermanos, madre, padre y otros?
              </label>
              <textarea
                value={formData.relacion_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Con qué familiares tienen mayor cercanía y afectividad el NNAJ?
              </label>
              <textarea
                value={formData.familiares_mayor_cercania}
                onChange={(e) => setFormData(prev => ({ ...prev, familiares_mayor_cercania: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Con qué familiares tienen mayor conflictividad el NNAJ?
              </label>
              <textarea
                value={formData.familiares_mayor_conflictividad}
                onChange={(e) => setFormData(prev => ({ ...prev, familiares_mayor_conflictividad: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo describe el comportamiento del NNAJ durante su niñez y adolescencia?
              </label>
              <textarea
                value={formData.comportamiento_niñez_adolescencia}
                onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_niñez_adolescencia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Tenía responsabilidades o asignaciones el NNAJ en el hogar?
              </label>
              <textarea
                value={formData.responsabilidades_hogar}
                onChange={(e) => setFormData(prev => ({ ...prev, responsabilidades_hogar: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué virtudes y talentos observa en su NNAJ?
              </label>
              <textarea
                value={formData.virtudes_talentos}
                onChange={(e) => setFormData(prev => ({ ...prev, virtudes_talentos: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha habido algún acontecimiento que pueda haber influido, especialmente, en la vida del NNAJ? (enfermedades, muerte de un familiar, ausencia del padre, dificultades económicas, separación, divorcio de los padres, abuso de algún familiar o maltrato físico, verbal o psicológico).
              </label>
              <textarea
                value={formData.acontecimientos_influyeron}
                onChange={(e) => setFormData(prev => ({ ...prev, acontecimientos_influyeron: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué actitud hay en la familia respecto a la situación actual NNAJ?
              </label>
              <textarea
                value={formData.actitud_familia_situacion_actual}
                onChange={(e) => setFormData(prev => ({ ...prev, actitud_familia_situacion_actual: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Suele el NNAJ hablar con usted de lo que le interesa o le preocupa?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nnaj_habla_intereses"
                    value="si"
                    checked={formData.nnaj_habla_intereses === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, nnaj_habla_intereses: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="nnaj_habla_intereses"
                    value="no"
                    checked={formData.nnaj_habla_intereses === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, nnaj_habla_intereses: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explique:</label>
              <textarea
                value={formData.explica_nnaj_habla}
                onChange={(e) => setFormData(prev => ({ ...prev, explica_nnaj_habla: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existen miembros con antecedentes delincuenciales dentro de la familia del NNAJ?
              </label>
              <textarea
                value={formData.miembros_antecedentes_delincuenciales}
                onChange={(e) => setFormData(prev => ({ ...prev, miembros_antecedentes_delincuenciales: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SITUACIÓN SOCIO-EDUCATIVA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">IV. Situación Socio-educativa</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Recibió servicios de estimulación temprana, educación preescolar en su infancia el NNAJ?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recibio_estimulacion_temprana"
                    value="si"
                    checked={formData.recibio_estimulacion_temprana === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, recibio_estimulacion_temprana: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recibio_estimulacion_temprana"
                    value="no"
                    checked={formData.recibio_estimulacion_temprana === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, recibio_estimulacion_temprana: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo ha sido el comportamiento del NNAJ en los diferentes procesos educativos en los que ha participado?
              </label>
              <textarea
                value={formData.comportamiento_procesos_educativos}
                onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_procesos_educativos: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En alguna ocasión tuvo reportes el NNAJ por mal comportamiento?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tuvo_reportes_mal_comportamiento"
                    value="si"
                    checked={formData.tuvo_reportes_mal_comportamiento === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, tuvo_reportes_mal_comportamiento: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tuvo_reportes_mal_comportamiento"
                    value="no"
                    checked={formData.tuvo_reportes_mal_comportamiento === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, tuvo_reportes_mal_comportamiento: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha presentado el NNAJ deserción escolar?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="desercion_escolar"
                    value="si"
                    checked={formData.desercion_escolar === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, desercion_escolar: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="desercion_escolar"
                    value="no"
                    checked={formData.desercion_escolar === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, desercion_escolar: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo ha sido el rendimiento académico del NNAJ?
              </label>
              <textarea
                value={formData.rendimiento_academico}
                onChange={(e) => setFormData(prev => ({ ...prev, rendimiento_academico: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿El NNAJ ha estado en alguna ocasión en centros de protección de menores o similares?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="estado_centros_proteccion"
                    value="si"
                    checked={formData.estado_centros_proteccion === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, estado_centros_proteccion: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="estado_centros_proteccion"
                    value="no"
                    checked={formData.estado_centros_proteccion === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, estado_centros_proteccion: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la relación de pares del NNAJ fuera de su familia?
              </label>
              <textarea
                value={formData.relacion_pares_fuera_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_pares_fuera_familia: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo se comporta el NNAJ ante situaciones de crisis o dificultades?
              </label>
              <textarea
                value={formData.comportamiento_situaciones_crisis}
                onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_situaciones_crisis: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* ENTORNO COMUNITARIO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">V. Entorno Comunitario</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿la comunidad, barrio o colonia donde ha convivido el NNAJ pertenece a la zona rural o urbana?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="zona_rural_urbana"
                    value="rural"
                    checked={formData.zona_rural_urbana === 'rural'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, zona_rural_urbana: 'rural' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Rural</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="zona_rural_urbana"
                    value="urbana"
                    checked={formData.zona_rural_urbana === 'urbana'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, zona_rural_urbana: 'urbana' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Urbana</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Qué organizaciones prestadoras de servicios sociales existen en su comunidad y si el NNAJ a participado en alguna de ellas? (Iglesias, patronatos, deportivas, educativas, artísticas, juveniles)
              </label>
              <textarea
                value={formData.organizaciones_servicios_sociales}
                onChange={(e) => setFormData(prev => ({ ...prev, organizaciones_servicios_sociales: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existen Asociaciones ilícitas en su comunidad?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="existen_asociaciones_ilicitas"
                    value="si"
                    checked={formData.existen_asociaciones_ilicitas === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, existen_asociaciones_ilicitas: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="existen_asociaciones_ilicitas"
                    value="no"
                    checked={formData.existen_asociaciones_ilicitas === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, existen_asociaciones_ilicitas: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existe venta de drogas en su comunidad?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="existe_venta_drogas"
                    value="si"
                    checked={formData.existe_venta_drogas === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, existe_venta_drogas: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="existe_venta_drogas"
                    value="no"
                    checked={formData.existe_venta_drogas === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, existe_venta_drogas: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Conoce las actitudes y comportamientos de los amigos/as del NNAJ en el barrio o colonia?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="conoce_actitudes_amigos"
                    value="si"
                    checked={formData.conoce_actitudes_amigos === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, conoce_actitudes_amigos: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="conoce_actitudes_amigos"
                    value="no"
                    checked={formData.conoce_actitudes_amigos === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, conoce_actitudes_amigos: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Controla o supervisa el tipo de amistades que el NNAJ tiene en la comunidad?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="controla_supervisa_amistades"
                    value="si"
                    checked={formData.controla_supervisa_amistades === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, controla_supervisa_amistades: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="controla_supervisa_amistades"
                    value="no"
                    checked={formData.controla_supervisa_amistades === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, controla_supervisa_amistades: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ASPECTOS DE SALUD */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VI. Aspectos de salud</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Padece el NNAJ de alguna enfermedad física o mental?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="padece_enfermedad"
                    value="si"
                    checked={formData.padece_enfermedad === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, padece_enfermedad: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="padece_enfermedad"
                    value="no"
                    checked={formData.padece_enfermedad === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, padece_enfermedad: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existe historial psiquiátrico o de padecer alguna enfermedad en particular dentro de su familia? ¿Describa?
              </label>
              <textarea
                value={formData.historial_psiquiatrico_familia}
                onChange={(e) => setFormData(prev => ({ ...prev, historial_psiquiatrico_familia: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha observado si el NNAJ ha consumido algún tipo de drogas?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ha_observado_consumo_drogas"
                    value="si"
                    checked={formData.ha_observado_consumo_drogas === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, ha_observado_consumo_drogas: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ha_observado_consumo_drogas"
                    value="no"
                    checked={formData.ha_observado_consumo_drogas === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, ha_observado_consumo_drogas: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cuáles?</label>
                  <input
                    type="text"
                    value={formData.cuales_drogas}
                    onChange={(e) => setFormData(prev => ({ ...prev, cuales_drogas: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿ha recibido ayuda profesional?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibio_ayuda_profesional"
                        value="si"
                        checked={formData.recibio_ayuda_profesional === 'si'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibio_ayuda_profesional: 'si' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">SI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recibio_ayuda_profesional"
                        value="no"
                        checked={formData.recibio_ayuda_profesional === 'no'}
                        onChange={(_e) => setFormData(prev => ({ ...prev, recibio_ayuda_profesional: 'no' }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">NO</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Utilizó usted drogas durante el embarazo del NNAJ?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="utilizo_drogas_embarazo"
                    value="si"
                    checked={formData.utilizo_drogas_embarazo === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, utilizo_drogas_embarazo: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="utilizo_drogas_embarazo"
                    value="no"
                    checked={formData.utilizo_drogas_embarazo === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, utilizo_drogas_embarazo: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existe consumo de drogas por parte de otros miembros de la familia?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consumo_drogas_familia"
                    value="si"
                    checked={formData.consumo_drogas_familia === 'si'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, consumo_drogas_familia: 'si' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consumo_drogas_familia"
                    value="no"
                    checked={formData.consumo_drogas_familia === 'no'}
                    onChange={(_e) => setFormData(prev => ({ ...prev, consumo_drogas_familia: 'no' }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* CONCLUSIONES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VII. Conclusiones / Factores protectores y Factores de riesgo</h3>
          <textarea
            value={formData.conclusiones_factores_protectores_riesgo}
            onChange={(e) => setFormData(prev => ({ ...prev, conclusiones_factores_protectores_riesgo: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* FIRMAS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMAS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, Firma y sello Trabajador/a Social <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, Firma o Huella Familiar Entrevistado
              </label>
              <input
                type="text"
                value={formData.familiar_entrevistado}
                onChange={(e) => setFormData(prev => ({ ...prev, familiar_entrevistado: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
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

