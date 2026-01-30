'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Plus, Trash2, Home, Users } from 'lucide-react'
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

interface EstructuraFamiliar {
  nombre: string
  edad: string
  parentesco: string
  escolaridad: string
  estado_civil: string
  ocupacion: string
}

interface DistribucionIngresos {
  parentesco: string
  cantidad: string
  frecuencia: string
  observacion: string
}

interface FormData {
  joven_id: string
  centro_pedagogico: string
  
  // DATOS GENERALES DE NNAJ
  nombre: string
  edad: number
  exp_administrativo: string
  exp_judicial: string
  contacto_referencia: string
  fecha_visita: string
  persona_atendio_visita: string
  
  // DATOS DE IDENTIFICACIÓN DOMICILIARIA
  aldea_colonia_barrio: string
  calle_avenida: string
  bloque: string
  numero_casa: string
  referencias: string
  medios_transporte: string
  
  // SITUACIÓN DE LA VIVIENDA
  tipo_tenencia: string
  tipo_vivienda: string
  distribucion_vivienda: {
    dormitorios: string
    sala: boolean
    comedor: boolean
    cocina: boolean
    bano_privado: boolean
    bano_colectivo: boolean
  }
  servicios_publicos: {
    agua: boolean
    energia_electrica: boolean
    alcantarillado: boolean
    telefono_fijo: boolean
    cable: boolean
    internet: boolean
    datos: boolean
    wifi: boolean
  }
  material_construccion: string
  material_construccion_otro: string
  techo: string
  techo_otro: string
  pisos: string
  pisos_otro: string
  mobiliario: {
    television: boolean
    estereo: boolean
    computadora: boolean
    dvd: boolean
    estufa: boolean
    microondas: boolean
    lavadora: boolean
    refrigerador: boolean
    plancha: boolean
  }
  mobiliario_otros: string
  observaciones_vivienda: string
  
  // SITUACIÓN DE LA COMUNIDAD
  nivel_riesgo_comunidad: string
  instituciones_comunidad: {
    kinder: boolean
    centros_salud: boolean
    escuelas: boolean
    postas_policiales: boolean
    colegios: boolean
    iglesias: boolean
  }
  grupos_ilicitos: {
    venta_drogas: boolean
    expendios: boolean
  }
  acceso_vivienda: string
  ambiente_comunidad: {
    grafitis: boolean
    organizaciones_base: boolean
  }
  
  // SITUACIÓN FAMILIAR
  estructura_familiar: EstructuraFamiliar[]
  dinamica_familiar: {
    organizacion_funcionamiento: string
    comunicacion: string
    roles: string
    autoridad: string
    disciplina: string
    expresion_afecto: string
  }
  
  // SITUACIÓN ECONÓMICA
  ingreso_familiar_total: string
  distribucion_ingresos: DistribucionIngresos[]
  otros_ingresos: string
  total_egreso_familiar: string
  egresos: {
    alimentacion: string
    transporte: string
    gas_combustible: string
    educacion: string
    renta: string
    gastos_medicos: string
    agua: string
    recreacion: string
    electricidad: string
    ropa_calzado: string
    pago_creditos: string
    fondo_ahorro: string
    telefono_celular: string
    cable_internet: string
    otros: string
  }
  
  // DIAGNÓSTICO Y RECOMENDACIONES
  diagnostico_social_visita: string
  recomendaciones: string
  
  // FIRMA
  lugar_fecha: string
  trabajador_social: string
  
  // ANEXOS
  anexos_fotografias: string
}

export default function FichaVisitaDomiciliariaCPIPage() {
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
    exp_administrativo: '',
    exp_judicial: '',
    contacto_referencia: '',
    fecha_visita: new Date().toISOString().split('T')[0],
    persona_atendio_visita: '',
    aldea_colonia_barrio: '',
    calle_avenida: '',
    bloque: '',
    numero_casa: '',
    referencias: '',
    medios_transporte: '',
    tipo_tenencia: '',
    tipo_vivienda: '',
    distribucion_vivienda: {
      dormitorios: '',
      sala: false,
      comedor: false,
      cocina: false,
      bano_privado: false,
      bano_colectivo: false
    },
    servicios_publicos: {
      agua: false,
      energia_electrica: false,
      alcantarillado: false,
      telefono_fijo: false,
      cable: false,
      internet: false,
      datos: false,
      wifi: false
    },
    material_construccion: '',
    material_construccion_otro: '',
    techo: '',
    techo_otro: '',
    pisos: '',
    pisos_otro: '',
    mobiliario: {
      television: false,
      estereo: false,
      computadora: false,
      dvd: false,
      estufa: false,
      microondas: false,
      lavadora: false,
      refrigerador: false,
      plancha: false
    },
    mobiliario_otros: '',
    observaciones_vivienda: '',
    nivel_riesgo_comunidad: '',
    instituciones_comunidad: {
      kinder: false,
      centros_salud: false,
      escuelas: false,
      postas_policiales: false,
      colegios: false,
      iglesias: false
    },
    grupos_ilicitos: {
      venta_drogas: false,
      expendios: false
    },
    acceso_vivienda: '',
    ambiente_comunidad: {
      grafitis: false,
      organizaciones_base: false
    },
    estructura_familiar: [],
    dinamica_familiar: {
      organizacion_funcionamiento: '',
      comunicacion: '',
      roles: '',
      autoridad: '',
      disciplina: '',
      expresion_afecto: ''
    },
    ingreso_familiar_total: '',
    distribucion_ingresos: [],
    otros_ingresos: '',
    total_egreso_familiar: '',
    egresos: {
      alimentacion: '',
      transporte: '',
      gas_combustible: '',
      educacion: '',
      renta: '',
      gastos_medicos: '',
      agua: '',
      recreacion: '',
      electricidad: '',
      ropa_calzado: '',
      pago_creditos: '',
      fondo_ahorro: '',
      telefono_celular: '',
      cable_internet: '',
      otros: ''
    },
    diagnostico_social_visita: '',
    recomendaciones: '',
    lugar_fecha: '',
    trabajador_social: '',
    anexos_fotografias: ''
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
        edad: joven.edad,
        exp_administrativo: joven.expediente_administrativo || '',
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
        estado_civil: '',
        ocupacion: ''
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

      // Obtener perfil del usuario
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

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
      const fechaAtencion = formData.fecha_visita ? new Date(formData.fecha_visita).toISOString() : new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha de Visita Domiciliaria CPI',
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
        fecha_visita: formData.fecha_visita
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_visita_domiciliaria_cpi',
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

      alert('Ficha de Visita Domiciliaria CPI guardada exitosamente')
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
            Ficha de Visita Domiciliaria
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">FICHA VISITA DOMICILIARIA</h3>
        <p className="text-md font-medium">CENTRO PEDAGÓGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">ÁREA DE TRABAJO SOCIAL</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DE NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES DE NNAJ
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Administrativo</label>
              <input type="text" value={formData.exp_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Expediente Judicial</label>
              <input type="text" value={formData.exp_judicial} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contacto de Referencia</label>
              <input type="text" value={formData.contacto_referencia} onChange={(e) => setFormData(prev => ({ ...prev, contacto_referencia: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de la Visita</label>
              <input type="date" value={formData.fecha_visita} onChange={(e) => setFormData(prev => ({ ...prev, fecha_visita: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persona que atendió la visita</label>
              <input type="text" value={formData.persona_atendio_visita} onChange={(e) => setFormData(prev => ({ ...prev, persona_atendio_visita: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aldea, Colonia o Barrio</label>
              <input type="text" value={formData.aldea_colonia_barrio} onChange={(e) => setFormData(prev => ({ ...prev, aldea_colonia_barrio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calle, Avenida</label>
              <input type="text" value={formData.calle_avenida} onChange={(e) => setFormData(prev => ({ ...prev, calle_avenida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <textarea value={formData.referencias} onChange={(e) => setFormData(prev => ({ ...prev, referencias: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medios de transporte para ingreso</label>
              <input type="text" value={formData.medios_transporte} onChange={(e) => setFormData(prev => ({ ...prev, medios_transporte: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN DE LA VIVIENDA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN DE LA VIVIENDA</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de tenencia</label>
              <div className="flex flex-wrap gap-4">
                {['Propia', 'Alquilada', 'Prestada', 'Familiar', 'Invadida', 'Otro'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_tenencia"
                      value={tipo}
                      checked={formData.tipo_tenencia === tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_tenencia: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de vivienda</label>
              <div className="flex flex-wrap gap-4">
                {['Casa sola', 'Apartamento', 'Cuartería', 'Campamento', 'Albergue', 'Otro'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipo_vivienda"
                      value={tipo}
                      checked={formData.tipo_vivienda === tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_vivienda: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distribución de la vivienda</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Dormitorios</label>
                  <input type="text" value={formData.distribucion_vivienda.dormitorios} onChange={(e) => setFormData(prev => ({ ...prev, distribucion_vivienda: { ...prev.distribucion_vivienda, dormitorios: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distribucion_vivienda.sala}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribucion_vivienda: {
                          ...prev.distribucion_vivienda,
                          sala: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Sala</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distribucion_vivienda.comedor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribucion_vivienda: {
                          ...prev.distribucion_vivienda,
                          comedor: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Comedor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distribucion_vivienda.cocina}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribucion_vivienda: {
                          ...prev.distribucion_vivienda,
                          cocina: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Cocina</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distribucion_vivienda.bano_privado}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribucion_vivienda: {
                          ...prev.distribucion_vivienda,
                          bano_privado: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Baño privado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distribucion_vivienda.bano_colectivo}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        distribucion_vivienda: {
                          ...prev.distribucion_vivienda,
                          bano_colectivo: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Baño colectivo</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Servicios Públicos</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'agua', label: 'Agua' },
                  { key: 'energia_electrica', label: 'Energía Eléctrica' },
                  { key: 'alcantarillado', label: 'Alcantarillado' },
                  { key: 'telefono_fijo', label: 'Teléfono fijo' },
                  { key: 'cable', label: 'Cable' },
                  { key: 'internet', label: 'Internet' },
                  { key: 'datos', label: 'Datos' },
                  { key: 'wifi', label: 'Wifi' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.servicios_publicos[item.key as keyof typeof formData.servicios_publicos]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        servicios_publicos: {
                          ...prev.servicios_publicos,
                          [item.key]: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Material de construcción</label>
              <div className="flex flex-wrap gap-4 mb-2">
                {['Bloque', 'Ladrillo', 'Madera', 'Cartón'].map((material) => (
                  <label key={material} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="material_construccion"
                      value={material}
                      checked={formData.material_construccion === material}
                      onChange={(e) => setFormData(prev => ({ ...prev, material_construccion: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{material}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="material_construccion"
                    value="Otros"
                    checked={formData.material_construccion === 'Otros'}
                    onChange={(e) => setFormData(prev => ({ ...prev, material_construccion: e.target.value }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Otros. Especificar</span>
                </label>
              </div>
              {formData.material_construccion === 'Otros' && (
                <input type="text" value={formData.material_construccion_otro} onChange={(e) => setFormData(prev => ({ ...prev, material_construccion_otro: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Especifique" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Techo</label>
              <div className="flex flex-wrap gap-4 mb-2">
                {['Concreto', 'Lamina de zinc', 'Lamina de aluzinc', 'Lámina de asbesto', 'Lámina de cartón'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="techo"
                      value={tipo}
                      checked={formData.techo === tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, techo: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{tipo}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="techo"
                    value="Otros"
                    checked={formData.techo === 'Otros'}
                    onChange={(e) => setFormData(prev => ({ ...prev, techo: e.target.value }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Otros. Especificar</span>
                </label>
              </div>
              {formData.techo === 'Otros' && (
                <input type="text" value={formData.techo_otro} onChange={(e) => setFormData(prev => ({ ...prev, techo_otro: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Especifique" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pisos</label>
              <div className="flex flex-wrap gap-4 mb-2">
                {['Mosaico', 'Cerámica', 'Plancha de cemento', 'Tierra apisonada', 'Madera'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pisos"
                      value={tipo}
                      checked={formData.pisos === tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, pisos: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{tipo}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pisos"
                    value="Otros"
                    checked={formData.pisos === 'Otros'}
                    onChange={(e) => setFormData(prev => ({ ...prev, pisos: e.target.value }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Otros. Especificar</span>
                </label>
              </div>
              {formData.pisos === 'Otros' && (
                <input type="text" value={formData.pisos_otro} onChange={(e) => setFormData(prev => ({ ...prev, pisos_otro: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Especifique" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mobiliario</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'television', label: 'Televisión' },
                  { key: 'estereo', label: 'Estéreo' },
                  { key: 'computadora', label: 'Computadora' },
                  { key: 'dvd', label: 'DVD' },
                  { key: 'estufa', label: 'Estufa' },
                  { key: 'microondas', label: 'Microondas' },
                  { key: 'lavadora', label: 'Lavadora' },
                  { key: 'refrigerador', label: 'Refrigerador' },
                  { key: 'plancha', label: 'Plancha' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mobiliario[item.key as keyof typeof formData.mobiliario]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        mobiliario: {
                          ...prev.mobiliario,
                          [item.key]: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros. Especifique</label>
                <input type="text" value={formData.mobiliario_otros} onChange={(e) => setFormData(prev => ({ ...prev, mobiliario_otros: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
              <textarea value={formData.observaciones_vivienda} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_vivienda: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN DE LA COMUNIDAD */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN DE LA COMUNIDAD</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nivel de riesgo en la comunidad</label>
              <div className="flex flex-wrap gap-4">
                {['P. Extrema', 'Pobre', 'Media', 'Alta'].map((nivel) => (
                  <label key={nivel} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="nivel_riesgo_comunidad"
                      value={nivel}
                      checked={formData.nivel_riesgo_comunidad === nivel}
                      onChange={(e) => setFormData(prev => ({ ...prev, nivel_riesgo_comunidad: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{nivel}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instituciones existentes en la comunidad</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'kinder', label: 'Kínder' },
                  { key: 'centros_salud', label: 'Centros de salud' },
                  { key: 'escuelas', label: 'Escuelas' },
                  { key: 'postas_policiales', label: 'Postas policiales' },
                  { key: 'colegios', label: 'Colegios' },
                  { key: 'iglesias', label: 'Iglesias' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.instituciones_comunidad[item.key as keyof typeof formData.instituciones_comunidad]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        instituciones_comunidad: {
                          ...prev.instituciones_comunidad,
                          [item.key]: e.target.checked
                        }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grupos ilícitos</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.grupos_ilicitos.venta_drogas}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      grupos_ilicitos: {
                        ...prev.grupos_ilicitos,
                        venta_drogas: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Venta de drogas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.grupos_ilicitos.expendios}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      grupos_ilicitos: {
                        ...prev.grupos_ilicitos,
                        expendios: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Expendios</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acceso a la vivienda</label>
              <div className="flex flex-wrap gap-4">
                {['Accesible', 'Inaccesible'].map((tipo) => (
                  <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="acceso_vivienda"
                      value={tipo}
                      checked={formData.acceso_vivienda === tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, acceso_vivienda: e.target.value }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ambiente en la comunidad</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ambiente_comunidad.grafitis}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ambiente_comunidad: {
                        ...prev.ambiente_comunidad,
                        grafitis: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Grafitis</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ambiente_comunidad.organizaciones_base}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ambiente_comunidad: {
                        ...prev.ambiente_comunidad,
                        organizaciones_base: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Organizaciones de base</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SITUACIÓN FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            SITUACIÓN FAMILIAR
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estructura Familiar</label>
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
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">N°</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Nombre</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Edad</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Parentesco</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Escolaridad</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Estado civil</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Ocupación</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.estructura_familiar.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-xs">{index + 1}</td>
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
                          <input type="text" value={item.estado_civil} onChange={(e) => updateEstructuraFamiliar(index, 'estado_civil', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                          <input type="text" value={item.ocupacion} onChange={(e) => updateEstructuraFamiliar(index, 'ocupacion', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
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
                        <td colSpan={8} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No hay miembros agregados. Haga clic en "Agregar" para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dinámica Familiar</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Organización y funcionamiento</label>
                  <textarea value={formData.dinamica_familiar.organizacion_funcionamiento} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, organizacion_funcionamiento: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Comunicación</label>
                  <textarea value={formData.dinamica_familiar.comunicacion} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, comunicacion: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Roles</label>
                  <textarea value={formData.dinamica_familiar.roles} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, roles: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Autoridad</label>
                  <textarea value={formData.dinamica_familiar.autoridad} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, autoridad: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Disciplina</label>
                  <textarea value={formData.dinamica_familiar.disciplina} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, disciplina: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Expresión de afecto</label>
                  <textarea value={formData.dinamica_familiar.expresion_afecto} onChange={(e) => setFormData(prev => ({ ...prev, dinamica_familiar: { ...prev.dinamica_familiar, expresion_afecto: e.target.value } }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SITUACIÓN ECONÓMICA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN ECONÓMICA</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingreso familiar total</label>
              <input type="text" value={formData.ingreso_familiar_total} onChange={(e) => setFormData(prev => ({ ...prev, ingreso_familiar_total: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distribución de ingresos</label>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Otros Ingresos (Especifique)</label>
              <input type="text" value={formData.otros_ingresos} onChange={(e) => setFormData(prev => ({ ...prev, otros_ingresos: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total, Egreso Familiar Mensual</label>
              <input type="text" value={formData.total_egreso_familiar} onChange={(e) => setFormData(prev => ({ ...prev, total_egreso_familiar: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Egresos Mensuales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Alimentación</label>
                  <input type="text" value={formData.egresos.alimentacion} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, alimentacion: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Transporte</label>
                  <input type="text" value={formData.egresos.transporte} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, transporte: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Gas o combustible</label>
                  <input type="text" value={formData.egresos.gas_combustible} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, gas_combustible: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Educación</label>
                  <input type="text" value={formData.egresos.educacion} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, educacion: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Renta</label>
                  <input type="text" value={formData.egresos.renta} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, renta: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Gastos médicos</label>
                  <input type="text" value={formData.egresos.gastos_medicos} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, gastos_medicos: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Agua</label>
                  <input type="text" value={formData.egresos.agua} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, agua: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Recreación</label>
                  <input type="text" value={formData.egresos.recreacion} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, recreacion: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Electricidad</label>
                  <input type="text" value={formData.egresos.electricidad} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, electricidad: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Ropa y Calzado</label>
                  <input type="text" value={formData.egresos.ropa_calzado} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, ropa_calzado: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Pago Créditos</label>
                  <input type="text" value={formData.egresos.pago_creditos} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, pago_creditos: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fondo de ahorro</label>
                  <input type="text" value={formData.egresos.fondo_ahorro} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, fondo_ahorro: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Teléfono/Celular</label>
                  <input type="text" value={formData.egresos.telefono_celular} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, telefono_celular: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cable/Internet</label>
                  <input type="text" value={formData.egresos.cable_internet} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, cable_internet: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Otros</label>
                  <input type="text" value={formData.egresos.otros} onChange={(e) => setFormData(prev => ({ ...prev, egresos: { ...prev.egresos, otros: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIAGNÓSTICO SOCIAL DE LA VISITA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">DIAGNÓSTICO SOCIAL DE LA VISITA</h3>
          <textarea
            value={formData.diagnostico_social_visita}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnostico_social_visita: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* RECOMENDACIONES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">RECOMENDACIONES</h3>
          <textarea
            value={formData.recomendaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar y fecha</label>
              <input
                type="text"
                value={formData.lugar_fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, firma y sello Trabajador/a Social <span className="text-red-500">*</span>
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
        </div>

        {/* ANEXOS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ANEXOS</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fotografías</label>
            <textarea
              value={formData.anexos_fotografias}
              onChange={(e) => setFormData(prev => ({ ...prev, anexos_fotografias: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción de fotografías adjuntas"
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
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

