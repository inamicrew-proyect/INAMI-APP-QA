'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Home, Users, Paperclip } from 'lucide-react'
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
  
  // DATOS DE IDENTIFICACIÓN NNAJ
  nombre: string
  edad: number
  exp_interno: string
  exp_judicial: string
  nombre_responsable: string
  parentesco: string
  telefono: string
  fecha_elaboracion: string
  
  // DATOS DE IDENTIFICACIÓN DOMICILIARIA
  departamento: string
  municipio: string
  aldea_colonia_barrio: string
  calle_avenida_sector: string
  bloque: string
  numero_casa: string
  referencias: string
  medios_transporte: string
  
  // OBJETIVO DEL INFORME
  objetivo_informe: string
  
  // SITUACIÓN ACTUAL DE NNAJ
  situacion_actual_nnaj: string
  
  // CONDICIÓN DE LA VIVIENDA
  condicion_vivienda: string
  
  // SITUACIÓN ECONÓMICA FAMILIAR
  estructura_familiar: string
  dinamica_familiar: string
  ingresos_familiares: string
  egresos_familiares: string
  
  // SITUACIÓN COMUNITARIA
  situacion_comunitaria: string
  
  // IMPRESIÓN TÉCNICA
  impresion_tecnica: string
  
  // RECOMENDACIONES
  recomendaciones: string
  
  // FUENTES DE REFERENCIA
  ficha_estudio_socioeconomico: boolean
  informe_social_inicial: boolean
  expediente_administrativo_ref: boolean
  
  // ANEXOS
  anexos_descripcion: string
  
  // FIRMA
  trabajador_social: string
}

export default function InformeSocioeconomicoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre: '',
    edad: 0,
    exp_interno: '',
    exp_judicial: '',
    nombre_responsable: '',
    parentesco: '',
    telefono: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    departamento: '',
    municipio: '',
    aldea_colonia_barrio: '',
    calle_avenida_sector: '',
    bloque: '',
    numero_casa: '',
    referencias: '',
    medios_transporte: '',
    objetivo_informe: '',
    situacion_actual_nnaj: '',
    condicion_vivienda: '',
    estructura_familiar: '',
    dinamica_familiar: '',
    ingresos_familiares: '',
    egresos_familiares: '',
    situacion_comunitaria: '',
    impresion_tecnica: '',
    recomendaciones: '',
    ficha_estudio_socioeconomico: false,
    informe_social_inicial: false,
    expediente_administrativo_ref: false,
    anexos_descripcion: '',
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
        exp_interno: joven.expediente_administrativo || '',
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

    if (!formData.fecha_elaboracion) {
      newErrors.fecha_elaboracion = 'La fecha de elaboración es requerida'
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

      // Crear una nueva atención
      const fechaAtencion = formData.fecha_elaboracion || new Date().toISOString().split('T')[0]
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Informe Socio-Económico',
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

      // Preparar datos para guardar
      const datosJson = {
        ...formData,
        fecha_elaboracion: formData.fecha_elaboracion || new Date().toISOString().split('T')[0]
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'informe_socioeconomico',
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

      alert('Informe Socio-Económico guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar el informe: ${error.message || 'Error desconocido'}`)
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
            Informe Socio-Económico
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Área de Trabajo Social
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">PROGRAMA DE ATENCIÓN A MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD</h3>
        <p className="text-md font-medium">REGIONAL: <span className="font-normal">{formData.regional || '________________'}</span></p>
        <h4 className="text-lg font-bold mt-4">ÁREA DE TRABAJO SOCIAL</h4>
        <h5 className="text-lg font-bold mt-2">INFORME SOCIO-ECONÓMICO</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN NNAJ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <JovenSearchInput
                value={formData.nombre}
                onChange={(value) => setFormData(prev => ({ ...prev, nombre: value }))}
                onJovenSelect={(joven) => {
                  if (joven && joven.id) {
                    handleJovenChange(joven.id)
                  }
                }}
                label="Joven"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id}
              />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Interno</label>
              <input type="text" value={formData.exp_interno} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Judicial</label>
              <input type="text" value={formData.exp_judicial} onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del responsable</label>
              <input type="text" value={formData.nombre_responsable} onChange={(e) => setFormData(prev => ({ ...prev, nombre_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parentesco</label>
              <input type="text" value={formData.parentesco} onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha elaboración de informe <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha_elaboracion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_elaboracion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_elaboracion && <p className="mt-1 text-sm text-red-600">{errors.fecha_elaboracion}</p>}
            </div>
          </div>
        </div>

        {/* DATOS DE IDENTIFICACIÓN DOMICILIARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DOMICILIARIA
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departamento</label>
              <input type="text" value={formData.departamento} onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Municipio</label>
              <input type="text" value={formData.municipio} onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aldea, colonia o barrio</label>
              <input type="text" value={formData.aldea_colonia_barrio} onChange={(e) => setFormData(prev => ({ ...prev, aldea_colonia_barrio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calle, avenida o sector</label>
              <input type="text" value={formData.calle_avenida_sector} onChange={(e) => setFormData(prev => ({ ...prev, calle_avenida_sector: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bloque</label>
              <input type="text" value={formData.bloque} onChange={(e) => setFormData(prev => ({ ...prev, bloque: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. De Casa</label>
              <input type="text" value={formData.numero_casa} onChange={(e) => setFormData(prev => ({ ...prev, numero_casa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencias</label>
              <textarea
                value={formData.referencias}
                onChange={(e) => setFormData(prev => ({ ...prev, referencias: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medios de transporte para ingreso</label>
              <input type="text" value={formData.medios_transporte} onChange={(e) => setFormData(prev => ({ ...prev, medios_transporte: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* OBJETIVO DEL INFORME */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">OBJETIVO DEL INFORME</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Detallar el o los objetivos del informe socioeconómico.
          </p>
          <textarea
            value={formData.objetivo_informe}
            onChange={(e) => setFormData(prev => ({ ...prev, objetivo_informe: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los objetivos del informe"
          />
        </div>

        {/* SITUACIÓN ACTUAL DE NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN ACTUAL DE NNAJ</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Justificar la realización del informe, según situación identificada en informe inicial e incidencias.
          </p>
          <textarea
            value={formData.situacion_actual_nnaj}
            onChange={(e) => setFormData(prev => ({ ...prev, situacion_actual_nnaj: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa la situación actual del NNAJ"
          />
        </div>

        {/* CONDICIÓN DE LA VIVIENDA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">CONDICIÓN DE LA VIVIENDA</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Detallar situación de la vivienda y su mobiliario.
          </p>
          <textarea
            value={formData.condicion_vivienda}
            onChange={(e) => setFormData(prev => ({ ...prev, condicion_vivienda: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa la condición de la vivienda"
          />
        </div>

        {/* SITUACIÓN ECONÓMICA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            SITUACIÓN ECONÓMICA FAMILIAR
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Detallar situación familiar en los diferentes aspectos:
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estructura Familiar</label>
              <textarea
                value={formData.estructura_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, estructura_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describa la estructura familiar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dinámica familiar</label>
              <textarea
                value={formData.dinamica_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describa la dinámica familiar"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ingresos Familiares</label>
              <textarea
                value={formData.ingresos_familiares}
                onChange={(e) => setFormData(prev => ({ ...prev, ingresos_familiares: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describa los ingresos familiares"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Egresos Familiares</label>
              <textarea
                value={formData.egresos_familiares}
                onChange={(e) => setFormData(prev => ({ ...prev, egresos_familiares: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Describa los egresos familiares"
              />
            </div>
          </div>
        </div>

        {/* SITUACIÓN COMUNITARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5" />
            SITUACIÓN COMUNITARIA
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Detallar situación comunitaria.
          </p>
          <textarea
            value={formData.situacion_comunitaria}
            onChange={(e) => setFormData(prev => ({ ...prev, situacion_comunitaria: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa la situación comunitaria"
          />
        </div>

        {/* IMPRESIÓN TÉCNICA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">IMPRESIÓN TÉCNICA</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Establecer las valoraciones identificadas por el/la TS, en relación a la situación socioeconómica encontrada.
          </p>
          <textarea
            value={formData.impresion_tecnica}
            onChange={(e) => setFormData(prev => ({ ...prev, impresion_tecnica: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa la impresión técnica"
          />
        </div>

        {/* RECOMENDACIONES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">RECOMENDACIONES</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Señalar las recomendaciones.
          </p>
          <textarea
            value={formData.recomendaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las recomendaciones"
          />
        </div>

        {/* FUENTES DE REFERENCIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FUENTES DE REFERENCIA</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ficha_estudio_socioeconomico}
                onChange={(e) => setFormData(prev => ({ ...prev, ficha_estudio_socioeconomico: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Ficha de estudio socioeconómico</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.informe_social_inicial}
                onChange={(e) => setFormData(prev => ({ ...prev, informe_social_inicial: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Informe Social Inicial</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.expediente_administrativo_ref}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_administrativo_ref: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Expediente administrativo</span>
            </label>
          </div>
        </div>

        {/* ANEXOS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            ANEXOS
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Anexar documentos o soporte necesario (Fotografías).
          </p>
          <textarea
            value={formData.anexos_descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, anexos_descripcion: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los anexos adjuntos o documentación de soporte"
          />
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lic. Trabajador/a Social INAMI / PAMS-PL <span className="text-red-500">*</span>
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
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Informe'}
          </button>
        </div>
      </form>
    </div>
  )
}

