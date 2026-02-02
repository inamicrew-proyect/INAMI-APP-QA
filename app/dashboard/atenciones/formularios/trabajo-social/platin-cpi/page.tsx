'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Plus, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import JovenSearchInput from '@/components/JovenSearchInput'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
  identidad?: string
  sexo?: string
  expediente_administrativo?: string
  expediente_judicial?: string
  direccion?: string
  telefono?: string
  centro_id?: string
}

interface Centro {
  id: string
  nombre: string
  tipo: string
  ubicacion: string
}

interface AreaIntervencion {
  area_atencion: string
  valoracion_tecnica: string
  objetivos: string
  actividades: string
  nombre_tecnico: string
  tipo_responsable: string
}

interface FormData {
  joven_id: string
  centro_pedagogico: string
  juez_dirigido: string
  seccion_judicial: string
  
  // DATOS PERSONALES
  exp_administrativo: string
  nombre_completo: string
  lugar_fecha_nacimiento: string
  edad: number
  documento_identidad: string
  genero: string
  escolaridad: string
  estado_civil: string
  numero_hijos: string
  procedencia: string
  direccion_previa_ingreso: string
  
  // DATOS DE FAMILIARES/RESPONSABLES
  responsables: string
  parentesco: string
  direccion_responsable: string
  telefonos_contacto: string
  correos_electronicos: string
  
  // DATOS JUDICIALES
  juzgado_remitente: string
  nombre_juez: string
  exp_judicial: string
  infraccion: string
  tipo_medida_socioeducativa: string
  fecha_ingreso_cpi: string
  fecha_inicio_medida: string
  fecha_finalizacion_medida: string
  
  // PLAN DE ATENCIÓN
  fecha_inicio_plan: string
  fecha_finalizacion_plan: string
  areas_intervencion: AreaIntervencion[]
  
  // FIRMAS
  lugar_fecha: string
  firma_adolescente: string
  firma_responsable: string
  nombre_director: string
  trabajador_social: string
}

export default function PlatinCPIPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [centros, setCentros] = useState<Centro[]>([])
  const [centroSeleccionado, setCentroSeleccionado] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    juez_dirigido: '',
    seccion_judicial: '',
    exp_administrativo: '',
    nombre_completo: '',
    lugar_fecha_nacimiento: '',
    edad: 0,
    documento_identidad: '',
    genero: '',
    escolaridad: '',
    estado_civil: '',
    numero_hijos: '',
    procedencia: '',
    direccion_previa_ingreso: '',
    responsables: '',
    parentesco: '',
    direccion_responsable: '',
    telefonos_contacto: '',
    correos_electronicos: '',
    juzgado_remitente: '',
    nombre_juez: '',
    exp_judicial: '',
    infraccion: '',
    tipo_medida_socioeducativa: '',
    fecha_ingreso_cpi: '',
    fecha_inicio_medida: '',
    fecha_finalizacion_medida: '',
    fecha_inicio_plan: '',
    fecha_finalizacion_plan: '',
    areas_intervencion: [],
    lugar_fecha: '',
    firma_adolescente: '',
    firma_responsable: '',
    nombre_director: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadCentros()
  }, [])

  useEffect(() => {
    if (centroSeleccionado && centros.length > 0) {
      loadJovenes()
    } else {
      setJovenes([])
      setFormData(prev => ({ ...prev, joven_id: '', centro_pedagogico: '' }))
    }
  }, [centroSeleccionado, centros])

  const loadCentros = async () => {
    try {
      const { data, error } = await supabase
        .from('centros')
        .select('*')
        .order('nombre')

      if (error) throw error
      setCentros(data || [])
    } catch (error) {
      console.error('Error loading centros:', error)
      alert('Error al cargar los centros')
    }
  }

  const loadJovenes = async () => {
    if (!centroSeleccionado) {
      setJovenes([])
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad, identidad, sexo, expediente_administrativo, expediente_judicial, direccion, telefono, centro_id')
        .eq('estado', 'activo')
        .eq('centro_id', centroSeleccionado)
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
      
      // Si hay un centro seleccionado, actualizar el campo centro_pedagogico con el nombre del centro
      if (centroSeleccionado && data && data.length > 0) {
        const centro = centros.find(c => c.id === centroSeleccionado)
        if (centro) {
          setFormData(prev => ({ ...prev, centro_pedagogico: centro.nombre }))
        }
      }
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
        documento_identidad: joven.identidad || '',
        genero: joven.sexo || '',
        exp_administrativo: joven.expediente_administrativo || '',
        exp_judicial: joven.expediente_judicial || '',
        direccion_previa_ingreso: joven.direccion || '',
        lugar_fecha_nacimiento: joven.fecha_nacimiento ? `${joven.fecha_nacimiento}` : ''
      }))
    }
  }

  const addAreaIntervencion = () => {
    setFormData(prev => ({
      ...prev,
      areas_intervencion: [...prev.areas_intervencion, {
        area_atencion: '',
        valoracion_tecnica: '',
        objetivos: '',
        actividades: '',
        nombre_tecnico: '',
        tipo_responsable: ''
      }]
    }))
  }

  const updateAreaIntervencion = (index: number, field: keyof AreaIntervencion, value: string) => {
    setFormData(prev => ({
      ...prev,
      areas_intervencion: prev.areas_intervencion.map((area, i) => 
        i === index ? { ...area, [field]: value } : area
      )
    }))
  }

  const removeAreaIntervencion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      areas_intervencion: prev.areas_intervencion.filter((_, i) => i !== index)
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
      const fechaAtencion = formData.fecha_inicio_plan || formData.fecha_ingreso_cpi || new Date().toISOString()
      const fechaAtencionISO = new Date(fechaAtencion).toISOString()
      
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencionISO,
          motivo: 'Plan de Atención Individual (PLATIN) CPI',
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
        fecha_elaboracion: new Date().toISOString()
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'platin_cpi',
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

      alert('Plan de Atención Individual (PLATIN) CPI guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar el PLATIN: ${error.message || 'Error desconocido'}`)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Plan de Atención Individual (PLATIN)
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento (CPI)
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES (INAMI)</h2>
        <p className="text-md font-medium mt-4">CENTRO PEDAGÓGICO DE INTERNAMIENTO (CPI): <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">PLAN DE ATENCIÓN INDIVIDUAL (PLATIN)</h4>
        <p className="text-sm mt-2">
          Dirigido a el/la Juez/a: <input type="text" value={formData.juez_dirigido} onChange={(e) => setFormData(prev => ({ ...prev, juez_dirigido: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white mx-2" placeholder="________________" /> de la Sección Judicial <input type="text" value={formData.seccion_judicial} onChange={(e) => setFormData(prev => ({ ...prev, seccion_judicial: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white mx-2" placeholder="________________" /> para su respectiva revisión y aprobación.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS PERSONALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS PERSONALES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Centro <span className="text-red-500">*</span>
              </label>
              <select
                value={centroSeleccionado}
                onChange={(e) => {
                  setCentroSeleccionado(e.target.value)
                  setFormData(prev => ({ ...prev, joven_id: '' }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Seleccione un centro</option>
                {centros.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centro.nombre} ({centro.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              {!centroSeleccionado ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Joven <span className="text-red-500">*</span>
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    Seleccione un centro primero
                  </div>
                </div>
              ) : (
                <JovenSearchInput
                  value={formData.nombre_completo}
                  onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo: value }))}
                  onJovenSelect={(joven) => {
                    if (joven && joven.id) {
                      handleJovenChange(joven.id)
                    }
                  }}
                  label="Joven"
                  required
                  placeholder={loading ? 'Cargando jóvenes...' : 'Buscar joven por nombre...'}
                  error={errors.joven_id}
                  disabled={loading}
                />
              )}
              {centroSeleccionado && jovenes.length === 0 && !loading && (
                <p className="mt-1 text-sm text-yellow-600">No hay jóvenes activos en este centro</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Expediente Administrativo</label>
              <input type="text" value={formData.exp_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
              <input type="text" value={formData.nombre_completo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.3 Lugar y fecha de nacimiento</label>
              <input type="text" value={formData.lugar_fecha_nacimiento} onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha_nacimiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.4 Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.5 Documento de Identidad</label>
              <input type="text" value={formData.documento_identidad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Género</label>
              <input type="text" value={formData.genero} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.7 Escolaridad</label>
              <input type="text" value={formData.escolaridad} onChange={(e) => setFormData(prev => ({ ...prev, escolaridad: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.8 Estado Civil</label>
              <input type="text" value={formData.estado_civil} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de hijos/as y edad/es: (si aplica)</label>
              <input type="text" value={formData.numero_hijos} onChange={(e) => setFormData(prev => ({ ...prev, numero_hijos: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.10 Procedencia</label>
              <input type="text" value={formData.procedencia} onChange={(e) => setFormData(prev => ({ ...prev, procedencia: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1.11 Dirección previa al ingreso en el CPI</label>
              <input type="text" value={formData.direccion_previa_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, direccion_previa_ingreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS DE FAMILIARES/RESPONSABLES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            II. DATOS DE LOS/AS FAMILIARES/RESPONSABLES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2.1 Responsable/s de el/la adolescente</label>
              <input type="text" value={formData.responsables} onChange={(e) => setFormData(prev => ({ ...prev, responsables: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2.2 Parentesco</label>
              <input type="text" value={formData.parentesco} onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2.3 Dirección</label>
              <input type="text" value={formData.direccion_responsable} onChange={(e) => setFormData(prev => ({ ...prev, direccion_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono/s de contacto</label>
              <input type="text" value={formData.telefonos_contacto} onChange={(e) => setFormData(prev => ({ ...prev, telefonos_contacto: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo/s electrónico/s</label>
              <input type="text" value={formData.correos_electronicos} onChange={(e) => setFormData(prev => ({ ...prev, correos_electronicos: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS JUDICIALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">III. DATOS JUDICIALES</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.1 Juzgado Remitente</label>
              <input type="text" value={formData.juzgado_remitente} onChange={(e) => setFormData(prev => ({ ...prev, juzgado_remitente: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.2 Nombre de el/la Juez/a</label>
              <input type="text" value={formData.nombre_juez} onChange={(e) => setFormData(prev => ({ ...prev, nombre_juez: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.3 N.º de Expediente Judicial</label>
              <input type="text" value={formData.exp_judicial} onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.4 Infracción</label>
              <input type="text" value={formData.infraccion} onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.5 Tipo de Medida Socioeducativa</label>
              <input type="text" value={formData.tipo_medida_socioeducativa} onChange={(e) => setFormData(prev => ({ ...prev, tipo_medida_socioeducativa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.6 Fecha de ingreso en el CPI</label>
              <input type="date" value={formData.fecha_ingreso_cpi} onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso_cpi: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.7 Fecha de inicio de la medida socioeducativa</label>
              <input type="date" value={formData.fecha_inicio_medida} onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio_medida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3.8 Fecha de previsión de finalización de la medida socioeducativa</label>
              <input type="date" value={formData.fecha_finalizacion_medida} onChange={(e) => setFormData(prev => ({ ...prev, fecha_finalizacion_medida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* PLAN DE ATENCIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">PLAN DE ATENCIÓN INDIVIDUAL</h3>
          
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Considerando la documentación penal recibida en el Centro Pedagógico de Internamiento <strong>{formData.centro_pedagogico || '________________'}</strong>.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Considerando las evaluaciones técnicas realizadas por los/as profesionales de este Centro, investigando los aspectos biopsicosocial, educativo y legal de el/la adolescente y su entorno familiar y social y los informes técnicos interdisciplinares, vistos, analizados y debatidos adjuntos, correspondientes a las Áreas de Psicología, Pedagogía, Trabajo Social, Legal, Médica y de la Salud (Laboral y de Ocio y Tiempo Libre: opcional si se realiza evaluación por parte de o en relación a estas áreas,) realizados a efectos del PLATIN.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Como medio para dar cumplimiento a la resolución jurídica estipulada en los artículos 245, 246, 255 y 257 del Código de la Niñez y la Adolescencia reformado sobre la elaboración del plan de atención individual, y en cumplimiento de lo dispuesto en los tratados internacionales ratificados por Honduras, la Dirección del Centro Pedagógico de Internamiento <strong>{formData.centro_pedagogico || '________________'}</strong> propone lo siguiente:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Desarrollar un modelo psicosocial y educativo de intervención con el/la adolescente, orientado a su formación integral a través de un proceso reeducativo pedagógico, restaurativo, sistémico, continuo e integral que vincule su entorno familiar y social, cuyo fin es lograr un cambio en la personalidad, conducta gradual y progresiva que permita la adaptación personal, la reinserción social y la prevención de la reincidencia en la comisión de infracciones a la ley.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                En la elaboración del plan de intervención individual que se propone desarrollar, se ha contado con la activa participación de el/la adolescente y con la participación de su madre, padre o encargado/s como responsable/s.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de inicio de la implementación del Plan
                </label>
                <input type="date" value={formData.fecha_inicio_plan} onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio_plan: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de previsión de finalización del desarrollo del Plan
                </label>
                <input type="date" value={formData.fecha_finalizacion_plan} onChange={(e) => setFormData(prev => ({ ...prev, fecha_finalizacion_plan: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Tabla de Áreas de Intervención */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Plan de Intervención Interdisciplinar: (incluir breve descripción en cada recuadro).</h4>
              <button
                type="button"
                onClick={addAreaIntervencion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Área
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área de Atención</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Valoración Técnica</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Objetivos</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actividades</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Técnico/a</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo Responsable</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.areas_intervencion.map((area, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <input
                          type="text"
                          value={area.area_atencion}
                          onChange={(e) => updateAreaIntervencion(index, 'area_atencion', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Ej: Psicología"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <textarea
                          value={area.valoracion_tecnica}
                          onChange={(e) => updateAreaIntervencion(index, 'valoracion_tecnica', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Valoración"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <textarea
                          value={area.objetivos}
                          onChange={(e) => updateAreaIntervencion(index, 'objetivos', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Objetivos"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <textarea
                          value={area.actividades}
                          onChange={(e) => updateAreaIntervencion(index, 'actividades', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Actividades"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <input
                          type="text"
                          value={area.nombre_tecnico}
                          onChange={(e) => updateAreaIntervencion(index, 'nombre_tecnico', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Nombre"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <input
                          type="text"
                          value={area.tipo_responsable}
                          onChange={(e) => updateAreaIntervencion(index, 'tipo_responsable', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          placeholder="Centro/Externo"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeAreaIntervencion(index)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.areas_intervencion.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        No hay áreas agregadas. Haga clic en "Agregar Área" para comenzar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">* Todas las áreas descritas en este plan se incorporarán a un trabajo integral con el/la adolescente.</p>
              <p className="mb-2">Se realizará una evaluación técnica interdisciplinar de seguimiento del plan, previa emisión de los informes de evaluación y seguimiento del PLATIN y de revisión de la medida socioeducativa, que se emitirán en función de los avances, limitaciones, incidencias, etc., que surjan en relación a el/la adolescente y/o al cumplimiento del plan.</p>
              <p>Este Plan de Atención Individual estará supervisado por el Equipo Técnico asignado del Centro, al mismo tiempo, se encargará de la ejecución de las tareas e informará de los avances de el/la adolescente durante su tiempo de internamiento.</p>
            </div>
          </div>
        </div>

        {/* FIRMAS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMAS</h3>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Al momento de la socialización del PLATIN se encontraba el/la adolescente y sus responsables legales, por quienes este documento ha sido firmado en muestra de su acuerdo con el mismo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar y Fecha</label>
              <input type="text" value={formData.lugar_fecha} onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma de el/la Adolescente</label>
                <input type="text" value={formData.firma_adolescente} onChange={(e) => setFormData(prev => ({ ...prev, firma_adolescente: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Firma de el/la adolescente</p>
                <div className="h-16 border-b-2 border-gray-400 dark:border-gray-500"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Firma de el/la Responsable</label>
                <input type="text" value={formData.firma_responsable} onChange={(e) => setFormData(prev => ({ ...prev, firma_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Firma del responsable o pariente</p>
                <div className="h-16 border-b-2 border-gray-400 dark:border-gray-500"></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre, Firma y sello de el/la Director/a del CPI
            </label>
            <input type="text" value={formData.nombre_director} onChange={(e) => setFormData(prev => ({ ...prev, nombre_director: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-2" />
            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <div className="h-16 border-b-2 border-gray-400 dark:border-gray-500"></div>
            </div>
          </div>

          <div className="mt-4">
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
            {saving ? 'Guardando...' : 'Guardar PLATIN'}
          </button>
        </div>
      </form>
    </div>
  )
}

