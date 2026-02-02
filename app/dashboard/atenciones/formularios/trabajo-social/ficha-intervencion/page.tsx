'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import JovenSearchInput from '@/components/JovenSearchInput'

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
  regional: string
  nombre_nnaj: string
  nombre_familiar_responsable: string
  exp_administrativo: string
  exp_judicial: string
  fecha_atencion: string
  hora_atencion: string
  tipo_atencion: 'individual' | 'familiar' | 'grupal' | ''
  objetivo_intervencion: string
  tipo_intervencion: 'consejeria' | 'charla' | 'taller' | 'otro' | ''
  tipo_intervencion_otro: string
  temas_abordaje: string
  desarrollo_intervencion: string
  logros_dificultades: string
  acuerdos_proxima_reunion: string
  recomendaciones: string
  proxima_cita: string
  trabajador_social: string
  nombre_firma_trabajador: string
  nombre_firma_receptor: string
}

export default function FichaIntervencionPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_nnaj: '',
    nombre_familiar_responsable: '',
    exp_administrativo: '',
    exp_judicial: '',
    fecha_atencion: new Date().toISOString().split('T')[0],
    hora_atencion: new Date().toTimeString().slice(0, 5),
    tipo_atencion: '',
    objetivo_intervencion: '',
    tipo_intervencion: '',
    tipo_intervencion_otro: '',
    temas_abordaje: '',
    desarrollo_intervencion: '',
    logros_dificultades: '',
    acuerdos_proxima_reunion: '',
    recomendaciones: '',
    proxima_cita: '',
    trabajador_social: '',
    nombre_firma_trabajador: '',
    nombre_firma_receptor: ''
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
        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
        exp_administrativo: joven.expediente_administrativo || '',
        exp_judicial: joven.expediente_judicial || ''
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

    if (!formData.fecha_atencion) {
      newErrors.fecha_atencion = 'La fecha de atención es requerida'
    }

    if (!formData.tipo_atencion) {
      newErrors.tipo_atencion = 'Debe seleccionar un tipo de atención'
    }

    if (!formData.objetivo_intervencion.trim()) {
      newErrors.objetivo_intervencion = 'El objetivo de la intervención es requerido'
    }

    if (!formData.tipo_intervencion) {
      newErrors.tipo_intervencion = 'Debe seleccionar un tipo de intervención'
    }

    if (!formData.desarrollo_intervencion.trim()) {
      newErrors.desarrollo_intervencion = 'El desarrollo de la intervención es requerido'
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

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.')
      }

      // Obtener el tipo de atención de trabajo social
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

      // Verificar que el usuario tenga perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        throw new Error('Tu usuario no tiene un perfil configurado. Por favor, ejecuta el script crear-perfil-usuario.sql en Supabase.')
      }

      // Crear una nueva atención para que aparezca en la lista de atenciones
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: formData.fecha_atencion,
          motivo: 'Ficha de Intervención',
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

      // Preparar datos para la función stored procedure
      const datosJson = {
        ...formData,
        fecha_intervencion: formData.fecha_atencion,
        hora_intervencion: formData.hora_atencion,
        tipo_intervencion: formData.tipo_atencion,
        modalidad: formData.tipo_intervencion === 'otro' ? formData.tipo_intervencion_otro : 
                   formData.tipo_intervencion === 'consejeria' ? 'Consejería' :
                   formData.tipo_intervencion === 'charla' ? 'Charla' :
                   formData.tipo_intervencion === 'taller' ? 'Taller' : '',
        objetivo_principal: formData.objetivo_intervencion,
        objetivos_especificos: [], // Campo opcional
        actividades_realizadas: formData.desarrollo_intervencion,
        tecnicas_utilizadas: [], // Campo opcional
        materiales_utilizados: [], // Campo opcional
        resultados_obtenidos: formData.logros_dificultades,
        logros_alcanzados: [], // Campo opcional
        dificultades_encontradas: formData.logros_dificultades,
        observaciones_comportamiento: '', // Campo opcional
        nivel_cumplimiento: '', // Campo opcional
        satisfaccion_participante: '', // Campo opcional
        requiere_seguimiento: !!formData.proxima_cita,
        proxima_intervencion: formData.proxima_cita || null,
        compromisos: formData.acuerdos_proxima_reunion ? [formData.acuerdos_proxima_reunion] : [],
        recomendaciones: formData.recomendaciones
      }

      // Usar la función stored procedure para crear el formulario
      const { data: formularioId, error: formularioError } = await supabase
        .rpc('crear_formulario_trabajo_social', {
          p_tipo_formulario: 'ficha_intervencion',
          p_joven_id: formData.joven_id,
          p_atencion_id: atencionId,
          p_trabajador_social: formData.trabajador_social,
          p_datos_json: datosJson,
          p_created_by: user.id
        })

      if (formularioError) {
        console.error('Error al guardar formulario:', formularioError)
        // Si falla la función stored procedure, intentar guardar manualmente
        console.log('Intentando guardar manualmente...')
        
        // Guardar en formularios_atencion
        const { data: formularioData, error: insertError } = await supabase
          .from('formularios_atencion')
          .insert({
            tipo_formulario: 'ficha_intervencion',
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

        // Guardar también en fichas_intervencion
        if (formularioData?.id) {
          const { error: fichaError } = await supabase
            .from('fichas_intervencion')
            .insert({
              formulario_id: formularioData.id,
              joven_id: formData.joven_id,
              atencion_id: atencionId,
              trabajador_social: formData.trabajador_social,
              fecha_intervencion: formData.fecha_atencion,
              hora_intervencion: formData.hora_atencion,
              tipo_intervencion: formData.tipo_atencion,
              modalidad: datosJson.modalidad,
              objetivo_principal: formData.objetivo_intervencion,
              objetivos_especificos: [],
              actividades_realizadas: formData.desarrollo_intervencion,
              tecnicas_utilizadas: [],
              materiales_utilizados: [],
              resultados_obtenidos: formData.logros_dificultades,
              logros_alcanzados: [],
              dificultades_encontradas: formData.logros_dificultades,
              observaciones_comportamiento: null,
              nivel_cumplimiento: null,
              satisfaccion_participante: null,
              requiere_seguimiento: !!formData.proxima_cita,
              proxima_intervencion: formData.proxima_cita || null,
              compromisos: formData.acuerdos_proxima_reunion ? [formData.acuerdos_proxima_reunion] : [],
              recomendaciones: formData.recomendaciones,
              created_by: user.id
            })

          if (fichaError) {
            console.error('Error al guardar en fichas_intervencion:', fichaError)
            // No lanzar error aquí, el formulario ya se guardó en formularios_atencion
          }
        }
      } else {
        console.log('✅ Formulario guardado exitosamente usando stored procedure:', formularioId)
      }

      alert('Ficha de Intervención guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la ficha de intervención: ${error.message || 'Error desconocido'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha de Intervención - Trabajo Social
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Registro de intervenciones sociales
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">PROGRAMA DE ATENCIÓN A MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD</h3>
        <p className="text-md font-medium">REGIONAL: <span className="font-normal">{formData.regional || '________________'}</span></p>
        <h4 className="text-lg font-bold mt-4">FICHA DE INTERVENCIÓN TRABAJO SOCIAL</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información General */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Información General
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Regional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regional
              </label>
              <input
                type="text"
                value={formData.regional}
                onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese la regional"
              />
            </div>

            {/* Selección de Joven */}
            <div>
              <JovenSearchInput
                value={formData.nombre_nnaj}
                onChange={(value) => setFormData(prev => ({ ...prev, nombre_nnaj: value }))}
                onJovenSelect={(joven) => {
                  if (joven.id) {
                    handleJovenChange(joven.id)
                  }
                }}
                label="Nombre del NNAJ"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id}
              />
            </div>

            {/* Nombre del Familiar o Responsable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Familiar o Responsable
              </label>
              <input
                type="text"
                value={formData.nombre_familiar_responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_familiar_responsable: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre completo"
              />
            </div>

            {/* Exp. Administrativo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exp. Administrativo
              </label>
              <input
                type="text"
                value={formData.exp_administrativo}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white"
              />
            </div>

            {/* Exp. Judicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exp. Judicial
              </label>
              <input
                type="text"
                value={formData.exp_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Número de expediente judicial"
              />
            </div>

            {/* Fecha de Atención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Atención <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha_atencion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_atencion: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_atencion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_atencion && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_atencion}</p>
              )}
            </div>

            {/* Hora de Atención */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora de Atención
              </label>
              <input
                type="time"
                value={formData.hora_atencion}
                onChange={(e) => setFormData(prev => ({ ...prev, hora_atencion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Trabajador Social */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trabajador/a Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.trabajador_social ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nombre del trabajador social"
              />
              {errors.trabajador_social && (
                <p className="mt-1 text-sm text-red-600">{errors.trabajador_social}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tipo de Atención */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Tipo de Atención <span className="text-red-500">*</span>
          </h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_atencion"
                value="individual"
                checked={formData.tipo_atencion === 'individual'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_atencion: e.target.value as any }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Individual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_atencion"
                value="grupal"
                checked={formData.tipo_atencion === 'grupal'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_atencion: e.target.value as any }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Grupal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_atencion"
                value="familiar"
                checked={formData.tipo_atencion === 'familiar'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_atencion: e.target.value as any }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Familiar</span>
            </label>
          </div>
          {errors.tipo_atencion && (
            <p className="mt-2 text-sm text-red-600">{errors.tipo_atencion}</p>
          )}
        </div>

        {/* Objetivo de la Intervención */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Objetivo de la Intervención <span className="text-red-500">*</span>
          </h3>
          <textarea
            value={formData.objetivo_intervencion}
            onChange={(e) => setFormData(prev => ({ ...prev, objetivo_intervencion: e.target.value }))}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.objetivo_intervencion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describa el objetivo principal de la intervención"
          />
          {errors.objetivo_intervencion && (
            <p className="mt-1 text-sm text-red-600">{errors.objetivo_intervencion}</p>
          )}
        </div>

        {/* Tipo de Intervención */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Tipo de Intervención <span className="text-red-500">*</span>
          </h3>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_intervencion"
                value="consejeria"
                checked={formData.tipo_intervencion === 'consejeria'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_intervencion: e.target.value as any, tipo_intervencion_otro: '' }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Consejería</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_intervencion"
                value="charla"
                checked={formData.tipo_intervencion === 'charla'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_intervencion: e.target.value as any, tipo_intervencion_otro: '' }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Charla</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_intervencion"
                value="taller"
                checked={formData.tipo_intervencion === 'taller'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_intervencion: e.target.value as any, tipo_intervencion_otro: '' }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Taller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipo_intervencion"
                value="otro"
                checked={formData.tipo_intervencion === 'otro'}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_intervencion: e.target.value as any }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Otro</span>
            </label>
          </div>
          {formData.tipo_intervencion === 'otro' && (
            <div className="mt-2">
              <input
                type="text"
                value={formData.tipo_intervencion_otro}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_intervencion_otro: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Especifique el tipo de intervención"
              />
            </div>
          )}
          {errors.tipo_intervencion && (
            <p className="mt-2 text-sm text-red-600">{errors.tipo_intervencion}</p>
          )}
        </div>

        {/* Tema(s) de Abordaje */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Tema(s) de Abordaje
          </h3>
          <textarea
            value={formData.temas_abordaje}
            onChange={(e) => setFormData(prev => ({ ...prev, temas_abordaje: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los temas abordados durante la intervención"
          />
        </div>

        {/* Desarrollo de la Intervención */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Desarrollo de la Intervención <span className="text-red-500">*</span>
          </h3>
          <textarea
            value={formData.desarrollo_intervencion}
            onChange={(e) => setFormData(prev => ({ ...prev, desarrollo_intervencion: e.target.value }))}
            rows={8}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.desarrollo_intervencion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Describa detalladamente el desarrollo de la intervención"
          />
          {errors.desarrollo_intervencion && (
            <p className="mt-1 text-sm text-red-600">{errors.desarrollo_intervencion}</p>
          )}
        </div>

        {/* Logros y Dificultades */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Logros y Dificultades durante el Proceso del NNAJ
          </h3>
          <textarea
            value={formData.logros_dificultades}
            onChange={(e) => setFormData(prev => ({ ...prev, logros_dificultades: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los logros y dificultades observados durante el proceso"
          />
        </div>

        {/* Acuerdos para la Próxima Reunión */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Acuerdos para la Próxima Reunión
          </h3>
          <textarea
            value={formData.acuerdos_proxima_reunion}
            onChange={(e) => setFormData(prev => ({ ...prev, acuerdos_proxima_reunion: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los acuerdos establecidos para la próxima reunión"
          />
        </div>

        {/* Recomendaciones Brindadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Recomendaciones Brindadas
          </h3>
          <textarea
            value={formData.recomendaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las recomendaciones brindadas durante la intervención"
          />
        </div>

        {/* Próxima Cita */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próxima Cita
          </h3>
          <input
            type="date"
            value={formData.proxima_cita}
            onChange={(e) => setFormData(prev => ({ ...prev, proxima_cita: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Firmas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Firmas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, Firma y Sello del Trabajador/a Social
              </label>
              <input
                type="text"
                value={formData.nombre_firma_trabajador}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_firma_trabajador: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre del trabajador social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, Firma o Huella de quien Recibe la Intervención
              </label>
              <input
                type="text"
                value={formData.nombre_firma_receptor}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_firma_receptor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre de quien recibe la intervención"
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
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </form>
    </div>
  )
}

