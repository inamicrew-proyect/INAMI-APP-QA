'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  cantidad: string
  frecuencia: string
  observacion: string
}

interface ConsumoDrogas {
  tipo_sustancia: string
  edad_inicio: string
  tiempo_consumo: string
  frecuencia_consumo: string
  observaciones: string
}

interface FormData {
  joven_id: string
  regional: string
  
  // DATOS GENERALES DEL NNAJ
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
  exp_interno: string
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
  
  // SITUACIÓN LABORAL
  detalle_laboral: string
  
  // SITUACIÓN FAMILIAR
  historia_familiar: string
  convivencia_familiar: string
  estructura_familiar: EstructuraFamiliar[]
  distribucion_ingresos: DistribucionIngresos[]
  total_ingreso_mensual: string
  descripcion_economica: string
  descripcion_vivienda: string
  
  // SITUACIÓN COMUNITARIA
  descripcion_comunitaria: string
  
  // SITUACIÓN CONDUCTUAL
  situacion_salud: string
  consumo_drogas: ConsumoDrogas[]
  descripcion_consumo: string
  actividades_intereses: string
  pertenencia_organizaciones: string
  actitud_entrevista: string
  
  // HISTORIAL
  historial_justicia_juvenil: string
  
  // VALORACIÓN TÉCNICA
  impresion_individual: string
  impresion_familiar: string
  impresion_comunitario: string
  pronostico_social: string
  recomendaciones: string
  
  // FUENTES DE REFERENCIA
  ficha_social: boolean
  observacion: boolean
  expediente_administrativo_ref: boolean
  
  // FIRMA
  trabajador_social: string
}

export default function InformeSocialInicialPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [jovenSearchTerm, setJovenSearchTerm] = useState('')
  const [showJovenDropdown, setShowJovenDropdown] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
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
    exp_interno: '',
    exp_judicial: '',
    fecha_ingreso: '',
    infraccion: '',
    medida_aplicada: '',
    juez_causa: '',
    juzgado_causa: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    motivo_remision: '',
    detalle_escolaridad: '',
    detalle_laboral: '',
    historia_familiar: '',
    convivencia_familiar: '',
    estructura_familiar: [],
    distribucion_ingresos: [],
    total_ingreso_mensual: '',
    descripcion_economica: '',
    descripcion_vivienda: '',
    descripcion_comunitaria: '',
    situacion_salud: '',
    consumo_drogas: [],
    descripcion_consumo: '',
    actividades_intereses: '',
    pertenencia_organizaciones: '',
    actitud_entrevista: '',
    historial_justicia_juvenil: '',
    impresion_individual: '',
    impresion_familiar: '',
    impresion_comunitario: '',
    pronostico_social: '',
    recomendaciones: '',
    ficha_social: false,
    observacion: false,
    expediente_administrativo_ref: false,
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      // Verificar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No hay sesión activa')
        return
      }

      // Usar la API route para cargar jóvenes (evita problemas de RLS)
      const response = await fetch('/api/jovenes', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error('Error cargando jóvenes desde API:', response.status)
        return
      }

      const result = await response.json()
      
      if (result.success && result.jovenes) {
        // Filtrar solo los activos y mapear a la estructura esperada
        const jovenesActivos = result.jovenes
          .filter((j: any) => j.estado === 'activo')
          .map((j: any) => ({
            id: j.id,
            nombres: j.nombres || '',
            apellidos: j.apellidos || '',
            fecha_nacimiento: j.fecha_nacimiento || '',
            edad: j.edad || 0,
            identidad: j.identidad || '',
            expediente_administrativo: j.expediente_administrativo || '',
            expediente_judicial: j.expediente_judicial || ''
          }))
        
        setJovenes(jovenesActivos)
      } else {
        setJovenes([])
      }
    } catch (error) {
      console.error('Error loading jovenes:', error)
      setJovenes([])
    }
  }

  // Filtrar jóvenes según el término de búsqueda
  const filteredJovenes = useMemo(() => {
    if (!jovenSearchTerm || jovenSearchTerm.trim() === '') {
      return jovenes.slice(0, 20) // Mostrar solo los primeros 20 si no hay término de búsqueda
    }
    
    const searchLower = jovenSearchTerm.toLowerCase().trim()
    
    return jovenes.filter(joven => {
      const nombres = (joven.nombres || '').toLowerCase().trim()
      const apellidos = (joven.apellidos || '').toLowerCase().trim()
      const fullName = `${nombres} ${apellidos}`.trim()
      
      return fullName.includes(searchLower) || 
             nombres.includes(searchLower) || 
             apellidos.includes(searchLower)
    }).slice(0, 20) // Limitar a 20 resultados
  }, [jovenes, jovenSearchTerm])

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        lugar_fecha_nacimiento: joven.fecha_nacimiento || '',
        exp_interno: joven.expediente_administrativo || '',
        exp_judicial: joven.expediente_judicial || ''
      }))
      setJovenSearchTerm(`${joven.nombres} ${joven.apellidos}`)
      setShowJovenDropdown(false)
    }
  }

  // Manejar cambio en el input de búsqueda
  const handleJovenSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setJovenSearchTerm(value)
    
    if (value.trim()) {
      setShowJovenDropdown(true)
    } else {
      setFormData(prev => ({
        ...prev,
        joven_id: '',
        nombre: ''
      }))
      if (jovenes.length > 0) {
        setShowJovenDropdown(true)
      }
    }
  }

  // Manejar selección de joven del dropdown
  const handleJovenSelect = (joven: Joven) => {
    handleJovenChange(joven.id)
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
        cantidad: '',
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

  const addConsumoDrogas = () => {
    setFormData(prev => ({
      ...prev,
      consumo_drogas: [...prev.consumo_drogas, {
        tipo_sustancia: '',
        edad_inicio: '',
        tiempo_consumo: '',
        frecuencia_consumo: '',
        observaciones: ''
      }]
    }))
  }

  const updateConsumoDrogas = (index: number, field: keyof ConsumoDrogas, value: string) => {
    setFormData(prev => ({
      ...prev,
      consumo_drogas: prev.consumo_drogas.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeConsumoDrogas = (index: number) => {
    setFormData(prev => ({
      ...prev,
      consumo_drogas: prev.consumo_drogas.filter((_, i) => i !== index)
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
          motivo: 'Informe Social - Inicial',
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
          tipo_formulario: 'informe_social_inicial',
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

      alert('Informe Social - Inicial guardado exitosamente')
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
            Informe Social - Inicial
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
        <h5 className="text-lg font-bold mt-2">INFORME SOCIAL - INICIAL</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DEL NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES DEL NNAJ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joven <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jovenSearchTerm}
                  onChange={handleJovenSearchChange}
                  onFocus={() => setShowJovenDropdown(true)}
                  onBlur={() => setTimeout(() => setShowJovenDropdown(false), 200)}
                  placeholder="Buscar por nombre o apellido..."
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.joven_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required={!formData.joven_id}
                />
                {showJovenDropdown && filteredJovenes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredJovenes.map(joven => (
                      <div
                        key={joven.id}
                        onClick={() => handleJovenSelect(joven)}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {joven.nombres} {joven.apellidos}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {joven.edad} años
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showJovenDropdown && jovenSearchTerm.trim() && filteredJovenes.length === 0 && jovenes.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron jóvenes</p>
                  </div>
                )}
                {showJovenDropdown && jovenes.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No hay jóvenes disponibles. Cargando...</p>
                  </div>
                )}
              </div>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Interno</label>
              <input type="text" value={formData.exp_interno} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Elaboración de informe</label>
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

        {/* SITUACIÓN LABORAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN LABORAL</h3>
          <textarea
            value={formData.detalle_laboral}
            onChange={(e) => setFormData(prev => ({ ...prev, detalle_laboral: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Detalle información laboral"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6.1 Historia Familiar</label>
              <textarea
                value={formData.historia_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, historia_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6.2 Convivencia Familiar</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">6.3 Estructura Familiar</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">6.4 Distribución de Ingresos y egresos Familiares</label>
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
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Cantidad</th>
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
                          <input type="text" value={item.cantidad} onChange={(e) => updateDistribucionIngresos(index, 'cantidad', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
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
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Ingreso Mensual (Aproximado)</label>
                <input type="text" value={formData.total_ingreso_mensual} onChange={(e) => setFormData(prev => ({ ...prev, total_ingreso_mensual: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6.5 Descripción de situación económica de la familia (Ingresos Vs Egresos)</label>
              <textarea
                value={formData.descripcion_economica}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion_economica: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">6.6 Descripción de la vivienda/residencia</label>
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

        {/* SITUACIÓN CONDUCTUAL DEL NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN CONDUCTUAL DEL NNAJ</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">8.1 Situación de Salud del NNAJ</label>
              <textarea
                value={formData.situacion_salud}
                onChange={(e) => setFormData(prev => ({ ...prev, situacion_salud: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
              />

              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consumo de Drogas</label>
                <button
                  type="button"
                  onClick={addConsumoDrogas}
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
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">No.</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Tipo de sustancia</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Edad de inicio</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Tiempo que la lleva</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Frecuencia</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Observaciones</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.consumo_drogas.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{index + 1}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.tipo_sustancia} onChange={(e) => updateConsumoDrogas(index, 'tipo_sustancia', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.edad_inicio} onChange={(e) => updateConsumoDrogas(index, 'edad_inicio', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.tiempo_consumo} onChange={(e) => updateConsumoDrogas(index, 'tiempo_consumo', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.frecuencia_consumo} onChange={(e) => updateConsumoDrogas(index, 'frecuencia_consumo', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.observaciones} onChange={(e) => updateConsumoDrogas(index, 'observaciones', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <button type="button" onClick={() => removeConsumoDrogas(index)} className="p-1 text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.consumo_drogas.length === 0 && (
                      <tr>
                        <td colSpan={7} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No hay registros de consumo. Haga clic en "Agregar" para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción de situación de consumo de drogas</label>
                <textarea
                  value={formData.descripcion_consumo}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion_consumo: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">8.2 Actividades e Intereses Del NNAJ</label>
              <textarea
                value={formData.actividades_intereses}
                onChange={(e) => setFormData(prev => ({ ...prev, actividades_intereses: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción de intereses"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">8.3 Pertenencia a Organizaciones Ilícitas</label>
              <textarea
                value={formData.pertenencia_organizaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, pertenencia_organizaciones: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Descripción de pertenencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">7.4 Actitud del NNAJ al momento de la Entrevista</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impresión Técnica Social</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Individual</label>
                  <textarea
                    value={formData.impresion_individual}
                    onChange={(e) => setFormData(prev => ({ ...prev, impresion_individual: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Familiar</label>
                  <textarea
                    value={formData.impresion_familiar}
                    onChange={(e) => setFormData(prev => ({ ...prev, impresion_familiar: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Comunitario</label>
                  <textarea
                    value={formData.impresion_comunitario}
                    onChange={(e) => setFormData(prev => ({ ...prev, impresion_comunitario: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pronostico Social</label>
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
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lic. Trabajador/a Social PAMS-PL <span className="text-red-500">*</span>
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

