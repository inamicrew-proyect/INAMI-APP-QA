'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, ArrowLeft, User, Plus, Trash2, Users, Heart } from 'lucide-react'
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
  orden: number
  nombre: string
  edad: string
  parentesco: string
  escolaridad: string
  ocupacion: string
}

interface DistribucionIngresos {
  parentesco: string
  cantidad: string
  frecuencia: string
  observacion: string
}

interface ConsumoDrogas {
  tipo_droga: string
  inicio_consumo: string
  tiempo_consumo: string
  frecuencia_consumo: string
  observaciones: string
}

interface HistorialJusticia {
  nombre_cpi_regional: string
  fecha_ingreso: string
  motivo_remision: string
  medida_aplicada: string
  juzgado_remitente: string
  duracion_medida: string
}

interface FormData {
  joven_id: string
  servicio_regional: string
  fecha_elaboracion: string
  trabajador_social: string
  
  // DATOS GENERALES
  nombre_completo: string
  lugar_fecha_nacimiento: string
  edad: number
  id: string
  sexo: string
  escolaridad: string
  ocupacion: string
  estado_civil: string
  direccion: string
  responsable: string
  parentesco: string
  telefonos: string
  
  // DATOS LEGALES
  fecha_ingreso: string
  exp_administrativo: string
  exp_judicial: string
  juzgado: string
  juez_remitente: string
  infraccion_cometida: string
  medida_socioeducativa: string
  duracion_medida: string
  
  // ESCOLARIDAD
  sabe_leer_escribir: boolean
  asistio_escuela: boolean
  esta_estudiando: boolean
  por_que_no_estudia: string
  donde_estudia: string
  descripcion_trayectoria_escolar: string
  
  // SITUACIÓN LABORAL
  esta_trabajando: boolean
  que_trabaja: string
  donde_trabaja: string
  edad_empezo_trabajar: string
  descripcion_trayectoria_laboral: string
  
  // SITUACIÓN DE SALUD
  padece_enfermedad: boolean
  describe_enfermedad: string
  recibe_tratamiento: boolean
  describe_tratamiento: string
  donde_recibe_tratamiento: string
  sufrio_accidente: boolean
  describe_accidente: string
  padece_discapacidad: boolean
  tipo_discapacidad: string[]
  describe_discapacidad: string
  
  // HISTORIA FAMILIAR
  nombre_madre: string
  lugar_nacimiento_madre: string
  estado_civil_madre: string
  edad_madre: string
  escolaridad_madre: string
  ocupacion_madre: string
  lugar_trabajo_madre: string
  vive_hogar_madre: boolean
  domicilio_madre: string
  telefono_madre: string
  relacion_vivencial_madre: string
  
  nombre_padre: string
  lugar_nacimiento_padre: string
  estado_civil_padre: string
  edad_padre: string
  escolaridad_padre: string
  ocupacion_padre: string
  lugar_trabajo_padre: string
  vive_hogar_padre: boolean
  domicilio_padre: string
  telefono_padre: string
  relacion_vivencial_padre: string
  
  // CONVIVENCIA FAMILIAR
  situacion_nucleo_familiar: string[]
  detalle_situacion_familia: string
  cuenta_apoyo_padres: boolean
  explica_apoyo_padres: string
  trato_padres: string
  relacion_hermanos: string
  existen_normas: boolean
  cuales_normas: string
  tipo_disciplina: string
  tiene_pareja: boolean
  conviven_juntos: boolean
  tiempo_convivir: { anos: string, meses: string }
  tiene_hijos: boolean
  describe_convivencia_hijos: string
  ambiente_relaciones_familiares: string
  necesita_mejorar_relaciones: boolean
  explica_mejorar_relaciones: string
  familiares_antecedentes_delictivos: boolean
  especifica_antecedentes: string
  
  // ESTRUCTURA FAMILIAR
  estructura_familiar: EstructuraFamiliar[]
  observaciones_estructura: string
  
  // SITUACIÓN ECONÓMICA
  ingreso_familiar_total: string
  distribucion_ingresos: DistribucionIngresos[]
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
  observaciones_economicas: string
  
  // CONDICIONES DE VIVIENDA
  tenencia_vivienda: string
  tipo_vivienda: string
  construccion_vivienda: {
    estructura: string
    tipo_material: string
    paredes: string
    techo: string
    piso: string
  }
  numero_pisos: string
  distribucion_vivienda: {
    sala: string
    comedor: string
    cocina: string
    dormitorios: string
    banos: string
  }
  servicios_basicos: string[]
  observaciones_vivienda: string
  
  // SITUACIÓN COMUNITARIA
  tiempo_reside_comunidad: { anos: string, meses: string }
  relacion_vecinos: string
  organizaciones_base: string[]
  otros_organizaciones: string
  pertenece_grupo_organizado: boolean
  cual_grupo: string
  cuenta_areas_recreacion: boolean
  cuales_areas_recreacion: string[]
  nivel_riesgo_comunidad: string[]
  instituciones_comunidad: string[]
  observaciones_comunitaria: string
  
  // SITUACIÓN CONDUCTUAL - RELACIÓN SEXUAL
  ha_tenido_relaciones_sexuales: boolean
  edad_primera_relacion: string
  con_quien_primera_relacion: string
  edad_persona_primera_relacion: string
  ha_sido_abusado_sexual: boolean
  por_quien_abusado: string
  relaciones_sexuales_multiples: boolean
  cuantas_personas: string
  utiliza_metodos_preventivos: string
  ha_recibido_educacion_sexual: boolean
  donde_educacion_sexual: string
  observaciones_sexual: string
  
  // SITUACIÓN CONDUCTUAL - DROGAS
  ha_utilizado_drogas: boolean
  consumo_drogas: ConsumoDrogas[]
  motivo_consumo_drogas: string
  considera_problema_consumo: boolean
  explica_problema_consumo: string
  ha_buscado_tratamiento: boolean
  explica_tratamiento: string
  familia_sabe_consumo: boolean
  quienes_saben: string
  que_hicieron: string
  tipo_apoyo: string
  familiares_consumen: boolean
  quien_familia_consume: string
  
  // SITUACIÓN CONDUCTUAL - INTERESES
  actividades_tiempo_libre: string
  actividades_destrezas: string
  metas_corto_plazo: boolean
  cuales_metas: string
  gustaria_aprender_oficio: string
  motivacion_trabajo: string
  frustraciones_satisfacciones: string
  
  // SITUACIÓN CONDUCTUAL - PERTENENCIA ORGANIZACIONES ILÍCITAS
  pertenece_organizacion_ilicita: boolean
  nombre_grupo: string
  tiempo_pertenencia: { anos: string, meses: string }
  edad_inicio_involucramiento: string
  motivo_participacion: string
  funcion_organizacion: string
  beneficios_obtenidos: string
  familia_sabe_organizacion: boolean
  detalle_familia_organizacion: string
  observaciones_organizacion: string
  
  // SITUACIÓN CONDUCTUAL - ACTITUD
  actitud_entrevista: string[]
  comentarios_actitud: string
  
  // HISTORIAL JUSTICIA JUVENIL
  historial_justicia: HistorialJusticia[]
  observaciones_historial: string
  causas_llega_pams: string
  
  // OBSERVACIONES GENERALES
  observaciones_generales: string
  lugar_fecha: string
}

export default function FichaSocialAreaTrabajoSocialPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [jovenSearchTerm, setJovenSearchTerm] = useState('')
  const [showJovenDropdown, setShowJovenDropdown] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    servicio_regional: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    trabajador_social: '',
    nombre_completo: '',
    lugar_fecha_nacimiento: '',
    edad: 0,
    id: '',
    sexo: '',
    escolaridad: '',
    ocupacion: '',
    estado_civil: '',
    direccion: '',
    responsable: '',
    parentesco: '',
    telefonos: '',
    fecha_ingreso: '',
    exp_administrativo: '',
    exp_judicial: '',
    juzgado: '',
    juez_remitente: '',
    infraccion_cometida: '',
    medida_socioeducativa: '',
    duracion_medida: '',
    sabe_leer_escribir: false,
    asistio_escuela: false,
    esta_estudiando: false,
    por_que_no_estudia: '',
    donde_estudia: '',
    descripcion_trayectoria_escolar: '',
    esta_trabajando: false,
    que_trabaja: '',
    donde_trabaja: '',
    edad_empezo_trabajar: '',
    descripcion_trayectoria_laboral: '',
    padece_enfermedad: false,
    describe_enfermedad: '',
    recibe_tratamiento: false,
    describe_tratamiento: '',
    donde_recibe_tratamiento: '',
    sufrio_accidente: false,
    describe_accidente: '',
    padece_discapacidad: false,
    tipo_discapacidad: [],
    describe_discapacidad: '',
    nombre_madre: '',
    lugar_nacimiento_madre: '',
    estado_civil_madre: '',
    edad_madre: '',
    escolaridad_madre: '',
    ocupacion_madre: '',
    lugar_trabajo_madre: '',
    vive_hogar_madre: false,
    domicilio_madre: '',
    telefono_madre: '',
    relacion_vivencial_madre: '',
    nombre_padre: '',
    lugar_nacimiento_padre: '',
    estado_civil_padre: '',
    edad_padre: '',
    escolaridad_padre: '',
    ocupacion_padre: '',
    lugar_trabajo_padre: '',
    vive_hogar_padre: false,
    domicilio_padre: '',
    telefono_padre: '',
    relacion_vivencial_padre: '',
    situacion_nucleo_familiar: [],
    detalle_situacion_familia: '',
    cuenta_apoyo_padres: false,
    explica_apoyo_padres: '',
    trato_padres: '',
    relacion_hermanos: '',
    existen_normas: false,
    cuales_normas: '',
    tipo_disciplina: '',
    tiene_pareja: false,
    conviven_juntos: false,
    tiempo_convivir: { anos: '', meses: '' },
    tiene_hijos: false,
    describe_convivencia_hijos: '',
    ambiente_relaciones_familiares: '',
    necesita_mejorar_relaciones: false,
    explica_mejorar_relaciones: '',
    familiares_antecedentes_delictivos: false,
    especifica_antecedentes: '',
    estructura_familiar: [],
    observaciones_estructura: '',
    ingreso_familiar_total: '',
    distribucion_ingresos: [],
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
    observaciones_economicas: '',
    tenencia_vivienda: '',
    tipo_vivienda: '',
    construccion_vivienda: {
      estructura: '',
      tipo_material: '',
      paredes: '',
      techo: '',
      piso: ''
    },
    numero_pisos: '',
    distribucion_vivienda: {
      sala: '',
      comedor: '',
      cocina: '',
      dormitorios: '',
      banos: ''
    },
    servicios_basicos: [],
    observaciones_vivienda: '',
    tiempo_reside_comunidad: { anos: '', meses: '' },
    relacion_vecinos: '',
    organizaciones_base: [],
    otros_organizaciones: '',
    pertenece_grupo_organizado: false,
    cual_grupo: '',
    cuenta_areas_recreacion: false,
    cuales_areas_recreacion: [],
    nivel_riesgo_comunidad: [],
    instituciones_comunidad: [],
    observaciones_comunitaria: '',
    ha_tenido_relaciones_sexuales: false,
    edad_primera_relacion: '',
    con_quien_primera_relacion: '',
    edad_persona_primera_relacion: '',
    ha_sido_abusado_sexual: false,
    por_quien_abusado: '',
    relaciones_sexuales_multiples: false,
    cuantas_personas: '',
    utiliza_metodos_preventivos: '',
    ha_recibido_educacion_sexual: false,
    donde_educacion_sexual: '',
    observaciones_sexual: '',
    ha_utilizado_drogas: false,
    consumo_drogas: [],
    motivo_consumo_drogas: '',
    considera_problema_consumo: false,
    explica_problema_consumo: '',
    ha_buscado_tratamiento: false,
    explica_tratamiento: '',
    familia_sabe_consumo: false,
    quienes_saben: '',
    que_hicieron: '',
    tipo_apoyo: '',
    familiares_consumen: false,
    quien_familia_consume: '',
    actividades_tiempo_libre: '',
    actividades_destrezas: '',
    metas_corto_plazo: false,
    cuales_metas: '',
    gustaria_aprender_oficio: '',
    motivacion_trabajo: '',
    frustraciones_satisfacciones: '',
    pertenece_organizacion_ilicita: false,
    nombre_grupo: '',
    tiempo_pertenencia: { anos: '', meses: '' },
    edad_inicio_involucramiento: '',
    motivo_participacion: '',
    funcion_organizacion: '',
    beneficios_obtenidos: '',
    familia_sabe_organizacion: false,
    detalle_familia_organizacion: '',
    observaciones_organizacion: '',
    actitud_entrevista: [],
    comentarios_actitud: '',
    historial_justicia: [],
    observaciones_historial: '',
    causas_llega_pams: '',
    observaciones_generales: '',
    lugar_fecha: ''
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
      const fechaNac = joven.fecha_nacimiento ? new Date(joven.fecha_nacimiento).toLocaleDateString() : ''
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        exp_administrativo: joven.expediente_administrativo || '',
        exp_judicial: joven.expediente_judicial || '',
        lugar_fecha_nacimiento: fechaNac
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
        nombre_completo: ''
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
    const nextOrden = formData.estructura_familiar.length + 1
    setFormData(prev => ({
      ...prev,
      estructura_familiar: [...prev.estructura_familiar, {
        orden: nextOrden,
        nombre: '',
        edad: '',
        parentesco: '',
        escolaridad: '',
        ocupacion: ''
      }]
    }))
  }

  const updateEstructuraFamiliar = (index: number, field: keyof EstructuraFamiliar, value: string | number) => {
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
      estructura_familiar: prev.estructura_familiar.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        orden: i + 1
      }))
    }))
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
        // Convertir la fecha del formulario (YYYY-MM-DD) a ISO
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
          motivo: 'Ficha Social - Área de Trabajo Social',
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
          tipo_formulario: 'ficha_social_area_trabajo_social',
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

      alert('Ficha Social - Área de Trabajo Social guardada exitosamente')
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
            Ficha Social - Área de Trabajo Social
          </h1>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">PROGRAMA DE ATENCIÓN A MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD</h3>
        <p className="text-md font-medium">SERVICIO REGIONAL: <input type="text" value={formData.servicio_regional} onChange={(e) => setFormData(prev => ({ ...prev, servicio_regional: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="_________________________" /></p>
        <h4 className="text-lg font-bold mt-4">FICHA SOCIAL - ÁREA DE TRABAJO SOCIAL</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
              <input type="text" value={formData.nombre_completo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar y fecha de nacimiento</label>
              <input type="text" value={formData.lugar_fecha_nacimiento} onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha_nacimiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
              <input type="number" value={formData.edad} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
              <input type="text" value={formData.id} onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
              <select value={formData.sexo} onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                <option value="">Seleccione</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escolaridad</label>
              <input type="text" value={formData.escolaridad} onChange={(e) => setFormData(prev => ({ ...prev, escolaridad: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
              <input type="text" value={formData.ocupacion} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado Civil</label>
              <select value={formData.estado_civil} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                <option value="">Seleccione</option>
                <option value="Soltero">Soltero</option>
                <option value="Casado">Casado</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viudo">Viudo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
              <textarea value={formData.direccion} onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable</label>
              <input type="text" value={formData.responsable} onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parentesco</label>
              <input type="text" value={formData.parentesco} onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono (s)</label>
              <input type="text" value={formData.telefonos} onChange={(e) => setFormData(prev => ({ ...prev, telefonos: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS LEGALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">DATOS LEGALES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de ingreso</label>
              <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exp. Administrativo</label>
              <input type="text" value={formData.exp_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exp. Judicial</label>
              <input type="text" value={formData.exp_judicial} onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juzgado</label>
              <input type="text" value={formData.juzgado} onChange={(e) => setFormData(prev => ({ ...prev, juzgado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juez/a remitente</label>
              <input type="text" value={formData.juez_remitente} onChange={(e) => setFormData(prev => ({ ...prev, juez_remitente: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infracción cometida</label>
              <input type="text" value={formData.infraccion_cometida} onChange={(e) => setFormData(prev => ({ ...prev, infraccion_cometida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medida Socioeducativa</label>
              <input type="text" value={formData.medida_socioeducativa} onChange={(e) => setFormData(prev => ({ ...prev, medida_socioeducativa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración de la medida</label>
              <input type="text" value={formData.duracion_medida} onChange={(e) => setFormData(prev => ({ ...prev, duracion_medida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* ESCOLARIDAD */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ESCOLARIDAD</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sabe leer y escribir</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.sabe_leer_escribir === true} onChange={() => setFormData(prev => ({ ...prev, sabe_leer_escribir: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.sabe_leer_escribir === false} onChange={() => setFormData(prev => ({ ...prev, sabe_leer_escribir: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asistió a la escuela</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.asistio_escuela === true} onChange={() => setFormData(prev => ({ ...prev, asistio_escuela: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.asistio_escuela === false} onChange={() => setFormData(prev => ({ ...prev, asistio_escuela: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Está estudiando actualmente?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.esta_estudiando === true} onChange={() => setFormData(prev => ({ ...prev, esta_estudiando: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.esta_estudiando === false} onChange={() => setFormData(prev => ({ ...prev, esta_estudiando: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
            </div>
          </div>
          {!formData.esta_estudiando && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Si su respuesta es No, ¿Por qué no está estudiando actualmente?</label>
              <textarea value={formData.por_que_no_estudia} onChange={(e) => setFormData(prev => ({ ...prev, por_que_no_estudia: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          )}
          {formData.esta_estudiando && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Si su respuesta es Si, ¿Dónde estudia y en qué modalidad?</label>
              <input type="text" value={formData.donde_estudia} onChange={(e) => setFormData(prev => ({ ...prev, donde_estudia: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción de su trayectoria escolar</label>
            <textarea value={formData.descripcion_trayectoria_escolar} onChange={(e) => setFormData(prev => ({ ...prev, descripcion_trayectoria_escolar: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        {/* SITUACIÓN LABORAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN LABORAL</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Está Trabajando actualmente?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.esta_trabajando === true} onChange={() => setFormData(prev => ({ ...prev, esta_trabajando: true }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.esta_trabajando === false} onChange={() => setFormData(prev => ({ ...prev, esta_trabajando: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
            </div>
            {formData.esta_trabajando && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿De qué está trabajando?</label>
                  <input type="text" value={formData.que_trabaja} onChange={(e) => setFormData(prev => ({ ...prev, que_trabaja: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Dónde está trabajando?</label>
                  <input type="text" value={formData.donde_trabaja} onChange={(e) => setFormData(prev => ({ ...prev, donde_trabaja: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿A qué edad empezó a trabajar?</label>
              <input type="text" value={formData.edad_empezo_trabajar} onChange={(e) => setFormData(prev => ({ ...prev, edad_empezo_trabajar: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción de su trayectoria laboral</label>
              <textarea value={formData.descripcion_trayectoria_laboral} onChange={(e) => setFormData(prev => ({ ...prev, descripcion_trayectoria_laboral: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN DE SALUD */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5" />
            SITUACIÓN DE SALUD
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Padece de alguna enfermedad (Física o mental)?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.padece_enfermedad === true} onChange={() => setFormData(prev => ({ ...prev, padece_enfermedad: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.padece_enfermedad === false} onChange={() => setFormData(prev => ({ ...prev, padece_enfermedad: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
              <textarea value={formData.describe_enfermedad} onChange={(e) => setFormData(prev => ({ ...prev, describe_enfermedad: e.target.value }))} rows={2} placeholder="Describa" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            {formData.padece_enfermedad && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Si su respuesta es SI, ¿Recibe algún tratamiento?</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.recibe_tratamiento === true} onChange={() => setFormData(prev => ({ ...prev, recibe_tratamiento: true }))} className="w-4 h-4" />
                      <span>SI</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.recibe_tratamiento === false} onChange={() => setFormData(prev => ({ ...prev, recibe_tratamiento: false }))} className="w-4 h-4" />
                      <span>NO</span>
                    </label>
                  </div>
                  <textarea value={formData.describe_tratamiento} onChange={(e) => setFormData(prev => ({ ...prev, describe_tratamiento: e.target.value }))} rows={2} placeholder="Describa" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Dónde recibe el tratamiento?</label>
                  <input type="text" value={formData.donde_recibe_tratamiento} onChange={(e) => setFormData(prev => ({ ...prev, donde_recibe_tratamiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Ha sufrido algún accidente?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.sufrio_accidente === true} onChange={() => setFormData(prev => ({ ...prev, sufrio_accidente: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.sufrio_accidente === false} onChange={() => setFormData(prev => ({ ...prev, sufrio_accidente: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
              <textarea value={formData.describe_accidente} onChange={(e) => setFormData(prev => ({ ...prev, describe_accidente: e.target.value }))} rows={2} placeholder="Describa" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Padece alguna discapacidad?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.padece_discapacidad === true} onChange={() => setFormData(prev => ({ ...prev, padece_discapacidad: true }))} className="w-4 h-4" />
                  <span>SI</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.padece_discapacidad === false} onChange={() => setFormData(prev => ({ ...prev, padece_discapacidad: false }))} className="w-4 h-4" />
                  <span>NO</span>
                </label>
              </div>
              {formData.padece_discapacidad && (
                <>
                  <div className="flex flex-wrap gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.tipo_discapacidad.includes('Física')} onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: [...prev.tipo_discapacidad, 'Física'] }))
                        } else {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: prev.tipo_discapacidad.filter(t => t !== 'Física') }))
                        }
                      }} className="w-4 h-4" />
                      <span>Física</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.tipo_discapacidad.includes('Visual')} onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: [...prev.tipo_discapacidad, 'Visual'] }))
                        } else {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: prev.tipo_discapacidad.filter(t => t !== 'Visual') }))
                        }
                      }} className="w-4 h-4" />
                      <span>Visual</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={formData.tipo_discapacidad.includes('Auditiva')} onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: [...prev.tipo_discapacidad, 'Auditiva'] }))
                        } else {
                          setFormData(prev => ({ ...prev, tipo_discapacidad: prev.tipo_discapacidad.filter(t => t !== 'Auditiva') }))
                        }
                      }} className="w-4 h-4" />
                      <span>Auditiva</span>
                    </label>
                  </div>
                  <textarea value={formData.describe_discapacidad} onChange={(e) => setFormData(prev => ({ ...prev, describe_discapacidad: e.target.value }))} rows={2} placeholder="Describir" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* HISTORIA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            HISTORIA FAMILIAR
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Nombre de la madre</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre_madre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de nacimiento</label>
                  <input type="text" value={formData.lugar_nacimiento_madre} onChange={(e) => setFormData(prev => ({ ...prev, lugar_nacimiento_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado civil</label>
                  <input type="text" value={formData.estado_civil_madre} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
                  <input type="text" value={formData.edad_madre} onChange={(e) => setFormData(prev => ({ ...prev, edad_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escolaridad</label>
                  <input type="text" value={formData.escolaridad_madre} onChange={(e) => setFormData(prev => ({ ...prev, escolaridad_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion_madre} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de trabajo</label>
                  <input type="text" value={formData.lugar_trabajo_madre} onChange={(e) => setFormData(prev => ({ ...prev, lugar_trabajo_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vive en el hogar</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.vive_hogar_madre === true} onChange={() => setFormData(prev => ({ ...prev, vive_hogar_madre: true }))} className="w-4 h-4" />
                      <span>SI</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.vive_hogar_madre === false} onChange={() => setFormData(prev => ({ ...prev, vive_hogar_madre: false }))} className="w-4 h-4" />
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
                  <input type="text" value={formData.domicilio_madre} onChange={(e) => setFormData(prev => ({ ...prev, domicilio_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono_madre} onChange={(e) => setFormData(prev => ({ ...prev, telefono_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relación Vivencial con NNAJ</label>
                  <textarea value={formData.relacion_vivencial_madre} onChange={(e) => setFormData(prev => ({ ...prev, relacion_vivencial_madre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Nombre del padre</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre_padre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de nacimiento</label>
                  <input type="text" value={formData.lugar_nacimiento_padre} onChange={(e) => setFormData(prev => ({ ...prev, lugar_nacimiento_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado civil</label>
                  <input type="text" value={formData.estado_civil_padre} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
                  <input type="text" value={formData.edad_padre} onChange={(e) => setFormData(prev => ({ ...prev, edad_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Escolaridad</label>
                  <input type="text" value={formData.escolaridad_padre} onChange={(e) => setFormData(prev => ({ ...prev, escolaridad_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion_padre} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar de trabajo</label>
                  <input type="text" value={formData.lugar_trabajo_padre} onChange={(e) => setFormData(prev => ({ ...prev, lugar_trabajo_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vive en el hogar</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.vive_hogar_padre === true} onChange={() => setFormData(prev => ({ ...prev, vive_hogar_padre: true }))} className="w-4 h-4" />
                      <span>SI</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.vive_hogar_padre === false} onChange={() => setFormData(prev => ({ ...prev, vive_hogar_padre: false }))} className="w-4 h-4" />
                      <span>NO</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
                  <input type="text" value={formData.domicilio_padre} onChange={(e) => setFormData(prev => ({ ...prev, domicilio_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono_padre} onChange={(e) => setFormData(prev => ({ ...prev, telefono_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relación Vivencial con NNAJ</label>
                  <textarea value={formData.relacion_vivencial_padre} onChange={(e) => setFormData(prev => ({ ...prev, relacion_vivencial_padre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONVIVENCIA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">6.1 CONVIVENCIA FAMILIAR</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SITUACIÓN ACTUAL DEL NÚCLEO FAMILIAR</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Hogar integrado', 'Funcional', 'Hijos solos', 'Hogar desintegrado', 'Disfuncional', 'Otros familiares', 'Madre soltera', 'Padre soltero', 'Nueva pareja'].map((opcion) => (
                  <label key={opcion} className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.situacion_nucleo_familiar.includes(opcion)} onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, situacion_nucleo_familiar: [...prev.situacion_nucleo_familiar, opcion] }))
                      } else {
                        setFormData(prev => ({ ...prev, situacion_nucleo_familiar: prev.situacion_nucleo_familiar.filter(s => s !== opcion) }))
                      }
                    }} className="w-4 h-4" />
                    <span className="text-sm">{opcion}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detallar situación de la familia de NNAJ</label>
              <textarea value={formData.detalle_situacion_familia} onChange={(e) => setFormData(prev => ({ ...prev, detalle_situacion_familia: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Cuenta con el apoyo de sus padres o responsable?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.cuenta_apoyo_padres === true} onChange={() => setFormData(prev => ({ ...prev, cuenta_apoyo_padres: true }))} className="w-4 h-4" />
                    <span>Si</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.cuenta_apoyo_padres === false} onChange={() => setFormData(prev => ({ ...prev, cuenta_apoyo_padres: false }))} className="w-4 h-4" />
                    <span>No</span>
                  </label>
                </div>
                <textarea value={formData.explica_apoyo_padres} onChange={(e) => setFormData(prev => ({ ...prev, explica_apoyo_padres: e.target.value }))} rows={2} placeholder="Explique" className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cómo ha sido el trato que le dan sus padres?</label>
                <textarea value={formData.trato_padres} onChange={(e) => setFormData(prev => ({ ...prev, trato_padres: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cómo es la relación con sus hermanos?</label>
                <textarea value={formData.relacion_hermanos} onChange={(e) => setFormData(prev => ({ ...prev, relacion_hermanos: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Existen normas o reglas en su hogar?</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.existen_normas === true} onChange={() => setFormData(prev => ({ ...prev, existen_normas: true }))} className="w-4 h-4" />
                    <span>Si</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.existen_normas === false} onChange={() => setFormData(prev => ({ ...prev, existen_normas: false }))} className="w-4 h-4" />
                    <span>No</span>
                  </label>
                </div>
                <textarea value={formData.cuales_normas} onChange={(e) => setFormData(prev => ({ ...prev, cuales_normas: e.target.value }))} rows={2} placeholder="¿Cuáles?" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Qué tipo de disciplina le aplican sus padres cuando no se cumplen las reglas de su hogar? ¿Quién la aplica?</label>
                <textarea value={formData.tipo_disciplina} onChange={(e) => setFormData(prev => ({ ...prev, tipo_disciplina: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Actualmente tiene pareja?</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.tiene_pareja === true} onChange={() => setFormData(prev => ({ ...prev, tiene_pareja: true }))} className="w-4 h-4" />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.tiene_pareja === false} onChange={() => setFormData(prev => ({ ...prev, tiene_pareja: false }))} className="w-4 h-4" />
                    <span>No</span>
                  </label>
                </div>
                {formData.tiene_pareja && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">¿Conviven juntos?</label>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={formData.conviven_juntos === true} onChange={() => setFormData(prev => ({ ...prev, conviven_juntos: true }))} className="w-3 h-3" />
                          <span className="text-xs">Sí</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={formData.conviven_juntos === false} onChange={() => setFormData(prev => ({ ...prev, conviven_juntos: false }))} className="w-3 h-3" />
                          <span className="text-xs">No</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tiempo de convivir</label>
                      <div className="flex gap-2">
                        <input type="text" value={formData.tiempo_convivir.anos} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_convivir: { ...prev.tiempo_convivir, anos: e.target.value } }))} placeholder="Años" className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                        <input type="text" value={formData.tiempo_convivir.meses} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_convivir: { ...prev.tiempo_convivir, meses: e.target.value } }))} placeholder="Meses" className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">¿Tiene Hijos/as?</label>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={formData.tiene_hijos === true} onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: true }))} className="w-3 h-3" />
                          <span className="text-xs">Sí</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="radio" checked={formData.tiene_hijos === false} onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: false }))} className="w-3 h-3" />
                          <span className="text-xs">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                {formData.tiene_hijos && (
                  <textarea value={formData.describe_convivencia_hijos} onChange={(e) => setFormData(prev => ({ ...prev, describe_convivencia_hijos: e.target.value }))} rows={2} placeholder="Describa la convivencia con sus hijos/as" className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Describa brevemente como ha sido su ambiente y relaciones familiares en su niñez y adolescencia</label>
              <textarea value={formData.ambiente_relaciones_familiares} onChange={(e) => setFormData(prev => ({ ...prev, ambiente_relaciones_familiares: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Qué cree usted que necesita hacer para mejorar las relaciones con su familia?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.necesita_mejorar_relaciones === true} onChange={() => setFormData(prev => ({ ...prev, necesita_mejorar_relaciones: true }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.necesita_mejorar_relaciones === false} onChange={() => setFormData(prev => ({ ...prev, necesita_mejorar_relaciones: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.explica_mejorar_relaciones} onChange={(e) => setFormData(prev => ({ ...prev, explica_mejorar_relaciones: e.target.value }))} rows={2} placeholder="Explique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Alguien de sus familiares tiene antecedentes delictivos?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.familiares_antecedentes_delictivos === true} onChange={() => setFormData(prev => ({ ...prev, familiares_antecedentes_delictivos: true }))} className="w-4 h-4" />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.familiares_antecedentes_delictivos === false} onChange={() => setFormData(prev => ({ ...prev, familiares_antecedentes_delictivos: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              <textarea value={formData.especifica_antecedentes} onChange={(e) => setFormData(prev => ({ ...prev, especifica_antecedentes: e.target.value }))} rows={2} placeholder="Especifique" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* ESTRUCTURA FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">6.2 ESTRUCTURA FAMILIAR</h3>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estructura Familiar</label>
            <button type="button" onClick={addEstructuraFamiliar} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Orden</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Nombre</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Edad</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Parentesco</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Escolaridad</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Ocupación</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {formData.estructura_familiar.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">{item.orden}</td>
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
                      <button type="button" onClick={() => removeEstructuraFamiliar(index)} className="p-1 text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {formData.estructura_familiar.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 dark:border-gray-600 px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No hay registros. Haga clic en "Agregar" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
            <textarea value={formData.observaciones_estructura} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_estructura: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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

