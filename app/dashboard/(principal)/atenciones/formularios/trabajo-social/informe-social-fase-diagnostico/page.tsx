'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Plus, Trash2, Users, Home } from 'lucide-react'
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

interface EstructuraFamiliar {
  nombre: string
  edad: string
  parentesco: string
  escolaridad: string
  ocupacion: string
  observaciones: string
}

interface DistribucionIngresos {
  parentesco: string
  ingresos_economicos: string
  frecuencia: string
  observacion: string
}

interface FormData {
  joven_id: string
  centro_pedagogico: string
  
  // DATOS GENERALES DEL NAJ
  nombre: string
  lugar_fecha_nacimiento: string
  edad: number
  numero_acta_nacimiento: string
  escolaridad: string
  estado_civil: string
  ocupacion: string
  nombre_responsable: string
  parentesco: string
  nombre_madre: string
  nombre_padre: string
  telefono_celular: string
  residencia: string
  
  // DATOS LEGALES
  exp_judicial: string
  fecha_ingreso: string
  infraccion: string
  medida_aplicada: string
  juez_causa: string
  juzgado_causa: string
  fecha_elaboracion: string
  
  // MOTIVO DE REMISIÓN
  motivo_remision: string
  
  // ESCOLARIDAD
  detalle_escolaridad: string
  
  // SITUACIÓN FAMILIAR
  historia_familiar: string
  convivencia_familiar: string
  estructura_familiar: EstructuraFamiliar[]
  distribucion_ingresos: DistribucionIngresos[]
  descripcion_vivienda: string
  
  // SITUACIÓN COMUNITARIA
  descripcion_comunitaria: string
  
  // SITUACIÓN CONDUCTUAL
  situacion_salud: string
  actividades_intereses: string
  pertenencia_organizaciones: string
  actitud_entrevista: string
  
  // HISTORIAL
  historial_justicia_juvenil: string
  
  // VALORACIÓN TÉCNICA
  diagnostico_individual: string
  diagnostico_familiar: string
  diagnostico_comunitario: string
  pronostico_social: string
  recomendaciones: string
  
  // FUENTES DE REFERENCIA
  ficha_social: boolean
  observacion: boolean
  expediente_administrativo_ref: boolean
  otros_fuentes: string
  
  // FIRMA
  trabajador_social: string
}

export default function InformeSocialFaseDiagnosticoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre: '',
    lugar_fecha_nacimiento: '',
    edad: 0,
    numero_acta_nacimiento: '',
    escolaridad: '',
    estado_civil: '',
    ocupacion: '',
    nombre_responsable: '',
    parentesco: '',
    nombre_madre: '',
    nombre_padre: '',
    telefono_celular: '',
    residencia: '',
    exp_judicial: '',
    fecha_ingreso: '',
    infraccion: '',
    medida_aplicada: '',
    juez_causa: '',
    juzgado_causa: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    motivo_remision: '',
    detalle_escolaridad: '',
    historia_familiar: '',
    convivencia_familiar: '',
    estructura_familiar: [],
    distribucion_ingresos: [],
    descripcion_vivienda: '',
    descripcion_comunitaria: '',
    situacion_salud: '',
    actividades_intereses: '',
    pertenencia_organizaciones: '',
    actitud_entrevista: '',
    historial_justicia_juvenil: '',
    diagnostico_individual: '',
    diagnostico_familiar: '',
    diagnostico_comunitario: '',
    pronostico_social: '',
    recomendaciones: '',
    ficha_social: false,
    observacion: false,
    expediente_administrativo_ref: false,
    otros_fuentes: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
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
        lugar_fecha_nacimiento: joven.fecha_nacimiento || '',
        exp_judicial: joven.expediente_judicial || ''
      }))
    }
  }

  const addEstructuraFamiliar = () => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: [...prev.estructura_familiar, {
        nombre: '',
        edad: '',
        parentesco: '',
        escolaridad: '',
        ocupacion: '',
        observaciones: ''
      }]
    }))
  }

  const updateEstructuraFamiliar = (index: number, field: keyof EstructuraFamiliar, value: string) => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: prev.estructura_familiar.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeEstructuraFamiliar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estructura_familiar: prev.estructura_familiar.filter((_, i) => i !== index)
    }))
  }

  const addDistribucionIngresos = () => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: [...prev.distribucion_ingresos, {
        parentesco: '',
        ingresos_economicos: '',
        frecuencia: '',
        observacion: ''
      }]
    }))
  }

  const updateDistribucionIngresos = (index: number, field: keyof DistribucionIngresos, value: string) => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: prev.distribucion_ingresos.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeDistribucionIngresos = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distribucion_ingresos: prev.distribucion_ingresos.filter((_, i) => i !== index)
    }))
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
          motivo: 'Formato Informe Social Fase Diagnóstico',
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
          tipo_formulario: 'informe_social_fase_diagnostico',
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

      alert('Formato Informe Social Fase Diagnóstico guardado exitosamente')
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
            Formato Informe Social Fase Diagnóstico
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">CENTRO PEDAGÓGICO DE INTERNAMIENTO</h3>
        <p className="text-md font-medium">CENTRO PEDAGÓGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">INFORME SOCIAL – TRABAJO SOCIAL</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DEL NAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES DEL NAJ
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar y Fecha de Nacimiento</label>
              <input type="text" value={formData.lugar_fecha_nacimiento} onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha_nacimiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. De Acta de Nacimiento</label>
              <input type="text" value={formData.numero_acta_nacimiento} onChange={(e) => setFormData(prev => ({ ...prev, numero_acta_nacimiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escolaridad</label>
              <input type="text" value={formData.escolaridad} onChange={(e) => setFormData(prev => ({ ...prev, escolaridad: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado Civil</label>
              <input type="text" value={formData.estado_civil} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
              <input type="text" value={formData.ocupacion} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Madre</label>
              <input type="text" value={formData.nombre_madre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Padre</label>
              <input type="text" value={formData.nombre_padre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono / Celular</label>
              <input type="text" value={formData.telefono_celular} onChange={(e) => setFormData(prev => ({ ...prev, telefono_celular: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Residencia</label>
              <input type="text" value={formData.residencia} onChange={(e) => setFormData(prev => ({ ...prev, residencia: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS LEGALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">DATOS LEGALES</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Judicial</label>
              <input type="text" value={formData.exp_judicial} onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de ingreso</label>
              <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infracción</label>
              <input type="text" value={formData.infraccion} onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medida aplicada</label>
              <input type="text" value={formData.medida_aplicada} onChange={(e) => setFormData(prev => ({ ...prev, medida_aplicada: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juez/a que conoce la causa</label>
              <input type="text" value={formData.juez_causa} onChange={(e) => setFormData(prev => ({ ...prev, juez_causa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juzgado que conoce la causa</label>
              <input type="text" value={formData.juzgado_causa} onChange={(e) => setFormData(prev => ({ ...prev, juzgado_causa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Elaboración de informe</label>
              <input type="date" value={formData.fecha_elaboracion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* MOTIVO DE REMISIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">MOTIVO DE REMISIÓN</h3>
          <textarea
            value={formData.motivo_remision}
            onChange={(e) => setFormData(prev => ({ ...prev, motivo_remision: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Se remite al Juzgado de Ejecución de Sanción por Infracción Penal en Materia de Niñez..."
          />
        </div>

        {/* ESCOLARIDAD */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ESCOLARIDAD</h3>
          <textarea
            value={formData.detalle_escolaridad}
            onChange={(e) => setFormData(prev => ({ ...prev, detalle_escolaridad: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Detalle información educativa"
          />
        </div>

        {/* SITUACIÓN FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            SITUACIÓN FAMILIAR
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">5.1 Historia Familiar</label>
              <textarea
                value={formData.historia_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, historia_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">5.2 Convivencia Familiar</label>
              <textarea
                value={formData.convivencia_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, convivencia_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Estructura Familiar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">5.3 Estructura Familiar</label>
                <button
                  type="button"
                  onClick={addEstructuraFamiliar}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">NOMBRE</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">EDAD</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">PARENTESCO</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">ESCOLARIDAD</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">OCUPACIÓN</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">OBSERVACIONES</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.estructura_familiar.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.nombre} onChange={(e) => updateEstructuraFamiliar(index, 'nombre', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.edad} onChange={(e) => updateEstructuraFamiliar(index, 'edad', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.parentesco} onChange={(e) => updateEstructuraFamiliar(index, 'parentesco', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.escolaridad} onChange={(e) => updateEstructuraFamiliar(index, 'escolaridad', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.ocupacion} onChange={(e) => updateEstructuraFamiliar(index, 'ocupacion', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.observaciones} onChange={(e) => updateEstructuraFamiliar(index, 'observaciones', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <button type="button" onClick={() => removeEstructuraFamiliar(index)} className="p-1 text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.estructura_familiar.length === 0 && (
                      <tr>
                        <td colSpan={7} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No hay miembros agregados. Haga clic en "Agregar" para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Distribución de Ingresos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">5.4 Distribución de Ingresos Familiares</label>
                <button
                  type="button"
                  onClick={addDistribucionIngresos}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Parentesco</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Ingresos económicos</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Frecuencia</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Observación</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.distribucion_ingresos.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.parentesco} onChange={(e) => updateDistribucionIngresos(index, 'parentesco', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.ingresos_economicos} onChange={(e) => updateDistribucionIngresos(index, 'ingresos_economicos', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.frecuencia} onChange={(e) => updateDistribucionIngresos(index, 'frecuencia', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.observacion} onChange={(e) => updateDistribucionIngresos(index, 'observacion', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <button type="button" onClick={() => removeDistribucionIngresos(index)} className="p-1 text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.distribucion_ingresos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No hay ingresos agregados. Haga clic en "Agregar" para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">5.5 Descripción de la vivienda/residencia</label>
              <textarea
                value={formData.descripcion_vivienda}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion_vivienda: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
          <textarea
            value={formData.descripcion_comunitaria}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion_comunitaria: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Descripción de situación comunitaria"
          />
        </div>

        {/* SITUACIÓN CONDUCTUAL DEL NAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN CONDUCTUAL DEL NAJ</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">7.1 Situación de Salud del NAJ</label>
              <textarea
                value={formData.situacion_salud}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_salud: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">7.2 Actividades e Intereses Del NAJ</label>
              <textarea
                value={formData.actividades_intereses}
                onChange={(e) => setFormData(prev => ({ ...prev, actividades_intereses: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción de intereses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">7.3 Pertenencia a Organizaciones Ilícitas</label>
              <textarea
                value={formData.pertenencia_organizaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, pertenencia_organizaciones: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción de pertenencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">7.4 Actitud del NAJ al momento de la Entrevista</label>
              <textarea
                value={formData.actitud_entrevista}
                onChange={(e) => setFormData(prev => ({ ...prev, actitud_entrevista: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">HISTORIAL DE INGRESO AL SISTEMA DE JUSTICIA JUVENIL</h3>
          <textarea
            value={formData.historial_justicia_juvenil}
            onChange={(e) => setFormData(prev => ({ ...prev, historial_justicia_juvenil: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Descripción de la situación de historial delictivo"
          />
        </div>

        {/* VALORACIÓN TÉCNICA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VALORACIÓN TÉCNICA</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">9.1 Diagnóstico Social</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dx Individual</label>
                  <textarea
                    value={formData.diagnostico_individual}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_individual: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dx Familiar</label>
                  <textarea
                    value={formData.diagnostico_familiar}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_familiar: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dx Comunitario</label>
                  <textarea
                    value={formData.diagnostico_comunitario}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_comunitario: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">9.2 Pronóstico Social</label>
              <textarea
                value={formData.pronostico_social}
                onChange={(e) => setFormData(prev => ({ ...prev, pronostico_social: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendaciones</label>
              <textarea
                value={formData.recomendaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* FUENTES DE REFERENCIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FUENTES DE REFERENCIA</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ficha_social}
                onChange={(e) => setFormData(prev => ({ ...prev, ficha_social: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Ficha Social</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.observacion}
                onChange={(e) => setFormData(prev => ({ ...prev, observacion: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Observación</span>
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
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros (que se utilicen)</label>
            <input
              type="text"
              value={formData.otros_fuentes}
              onChange={(e) => setFormData(prev => ({ ...prev, otros_fuentes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Especifique otras fuentes de referencia"
            />
          </div>
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trabajador/a Social CPI <span className="text-red-500">*</span>
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

