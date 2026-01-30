'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, ArrowLeft, User, FileText } from 'lucide-react'
import Link from 'next/link'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad: number
}

interface FormData {
  joven_id: string
  fecha_elaboracion: string
  trabajador_social: string
  
  // Datos generales
  nombre_completo: string
  lugar_nacimiento: string
  fecha_nacimiento: string
  edad: number
  id: string
  sexo: string
  escolaridad: string
  ocupacion: string
  estado_civil: string
  direccion: string
  responsable: string
  parentesco: string
  telefono: string
  
  // Datos legales
  fecha_ingreso: string
  expediente_administrativo: string
  expediente_judicial: string
  juzgado: string
  juez_remitente: string
  infraccion_cometida: string
  medida_socioeducativa: string
  duracion_medida: string
  
  // Escolaridad
  sabe_leer_escribir: boolean
  asistio_escuela: boolean
  esta_estudiando: boolean
  por_que_no_estudia: string
  donde_estudia: string
  descripcion_trayectoria: string
  
  // Situación laboral
  esta_trabajando: boolean
  que_trabaja: string
  donde_trabaja: string
  edad_empezo_trabajar: number
  descripcion_trayectoria_laboral: string
  
  // Situación de salud
  padece_enfermedad: boolean
  describe_enfermedad: string
  recibe_tratamiento: boolean
  donde_recibe_tratamiento: string
  sufrio_accidente: boolean
  describe_accidente: string
  padece_discapacidad: boolean
  tipo_discapacidad: string[]
  describe_discapacidad: string
  
  // Historia familiar
  madre: {
    nombre: string
    lugar_nacimiento: string
    estado_civil: string
    edad: number
    escolaridad: string
    ocupacion: string
    lugar_trabajo: string
    vive_hogar: boolean
    domicilio: string
    telefono: string
    relacion_vivencial: string
  }
  
  padre: {
    nombre: string
    lugar_nacimiento: string
    estado_civil: string
    edad: number
    escolaridad: string
    ocupacion: string
    lugar_trabajo: string
    vive_hogar: boolean
    domicilio: string
    telefono: string
    relacion_vivencial: string
  }
  
  // Estructura familiar
  estructura_familiar: Array<{
    orden: number
    nombre: string
    edad: number
    parentesco: string
    escolaridad: string
    ocupacion: string
  }>
  
  // Situación económica
  ingreso_familiar_total: number
  distribucion_ingresos: Array<{
    parentesco: string
    cantidad: number
    frecuencia: string
    observacion: string
  }>
  otros_ingresos: string
  
  // Egresos mensuales
  total_egreso_familiar: number
  egresos: {
    alimentacion: number
    gas_combustible: number
    renta: number
    agua: number
    electricidad: number
    pago_creditos: number
    telefono_celular: number
    transporte: number
    educacion: number
    gastos_medicos: number
    recreacion: number
    ropa_calzado: number
    fondo_ahorro: number
    cable_internet: number
    otros: number
  }
  
  // Condiciones de vivienda
  tenencia_vivienda: string
  tipo_vivienda: string
  construccion_vivienda: {
    estructura: string
    paredes: string
    techo: string
    piso: string
  }
  numero_pisos: number
  distribucion_vivienda: {
    sala: number
    comedor: number
    cocina: number
    dormitorios: number
    banos: number
  }
  servicios_basicos: string[]
  
  // Situación comunitaria
  tiempo_reside_comunidad: {
    anos: number
    meses: number
  }
  relacion_vecinos: string
  organizaciones_base: string[]
  otros_organizaciones: string
}

export default function FichaSocialPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [jovenSearchTerm, setJovenSearchTerm] = useState('')
  const [showJovenDropdown, setShowJovenDropdown] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    trabajador_social: '',
    nombre_completo: '',
    lugar_nacimiento: '',
    fecha_nacimiento: '',
    edad: 0,
    id: '',
    sexo: '',
    escolaridad: '',
    ocupacion: '',
    estado_civil: '',
    direccion: '',
    responsable: '',
    parentesco: '',
    telefono: '',
    fecha_ingreso: '',
    expediente_administrativo: '',
    expediente_judicial: '',
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
    descripcion_trayectoria: '',
    esta_trabajando: false,
    que_trabaja: '',
    donde_trabaja: '',
    edad_empezo_trabajar: 0,
    descripcion_trayectoria_laboral: '',
    padece_enfermedad: false,
    describe_enfermedad: '',
    recibe_tratamiento: false,
    donde_recibe_tratamiento: '',
    sufrio_accidente: false,
    describe_accidente: '',
    padece_discapacidad: false,
    tipo_discapacidad: [],
    describe_discapacidad: '',
    madre: {
      nombre: '',
      lugar_nacimiento: '',
      estado_civil: '',
      edad: 0,
      escolaridad: '',
      ocupacion: '',
      lugar_trabajo: '',
      vive_hogar: false,
      domicilio: '',
      telefono: '',
      relacion_vivencial: ''
    },
    padre: {
      nombre: '',
      lugar_nacimiento: '',
      estado_civil: '',
      edad: 0,
      escolaridad: '',
      ocupacion: '',
      lugar_trabajo: '',
      vive_hogar: false,
      domicilio: '',
      telefono: '',
      relacion_vivencial: ''
    },
    estructura_familiar: [],
    ingreso_familiar_total: 0,
    distribucion_ingresos: [],
    otros_ingresos: '',
    total_egreso_familiar: 0,
    egresos: {
      alimentacion: 0,
      gas_combustible: 0,
      renta: 0,
      agua: 0,
      electricidad: 0,
      pago_creditos: 0,
      telefono_celular: 0,
      transporte: 0,
      educacion: 0,
      gastos_medicos: 0,
      recreacion: 0,
      ropa_calzado: 0,
      fondo_ahorro: 0,
      cable_internet: 0,
      otros: 0
    },
    tenencia_vivienda: '',
    tipo_vivienda: '',
    construccion_vivienda: {
      estructura: '',
      paredes: '',
      techo: '',
      piso: ''
    },
    numero_pisos: 1,
    distribucion_vivienda: {
      sala: 0,
      comedor: 0,
      cocina: 0,
      dormitorios: 0,
      banos: 0
    },
    servicios_basicos: [],
    tiempo_reside_comunidad: {
      anos: 0,
      meses: 0
    },
    relacion_vecinos: '',
    organizaciones_base: [],
    otros_organizaciones: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      console.log('Iniciando carga de jóvenes...')
      
      // Verificar sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No hay sesión activa')
        return
      }

      console.log('Sesión verificada, llamando API de jóvenes...')

      // Usar la API route para cargar jóvenes (evita problemas de RLS)
      const response = await fetch('/api/jovenes', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      console.log('Respuesta de API:', { status: response.status, ok: response.ok })

      if (!response.ok) {
        console.error('Error cargando jóvenes desde API:', response.status)
        const errorText = await response.text()
        console.error('Error detallado:', errorText)
        return
      }

      const result = await response.json()
      console.log('Resultado de API:', { success: result.success, count: result.jovenes?.length, result })
      
      if (result.success && result.jovenes) {
        console.log('Total de jóvenes recibidos:', result.jovenes.length)
        
        // Filtrar solo los activos y mapear a la estructura esperada
        const jovenesActivos = result.jovenes
          .filter((j: any) => j.estado === 'activo')
          .map((j: any) => ({
            id: j.id,
            nombres: j.nombres || '',
            apellidos: j.apellidos || '',
            fecha_nacimiento: j.fecha_nacimiento || '',
            edad: j.edad || 0
          }))
        
        console.log(`Jóvenes activos filtrados: ${jovenesActivos.length}`)
        console.log('Lista de jóvenes activos:', jovenesActivos.map((j: any) => `${j.nombres} ${j.apellidos}`))
        
        setJovenes(jovenesActivos)
        console.log(`✅ Cargados ${jovenesActivos.length} jóvenes activos exitosamente`)
      } else {
        console.error('Error en respuesta de API:', result)
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
      
      // Buscar en nombre completo, nombre solo, apellido solo
      const matchFullName = fullName.includes(searchLower)
      const matchNombres = nombres.includes(searchLower)
      const matchApellidos = apellidos.includes(searchLower)
      
      // También buscar palabra por palabra si hay espacios
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
      const matchWords = searchWords.length > 0 && searchWords.every(word => 
        nombres.includes(word) || apellidos.includes(word) || fullName.includes(word)
      )
      
      return matchFullName || matchNombres || matchApellidos || matchWords
    }).slice(0, 20) // Limitar a 20 resultados
  }, [jovenes, jovenSearchTerm])
  
  console.log('Filtrado de jóvenes:', {
    totalJovenes: jovenes.length,
    searchTerm: jovenSearchTerm,
    filteredCount: filteredJovenes.length,
    filteredNames: filteredJovenes.map(j => `${j.nombres} ${j.apellidos}`),
    muestraDropdown: showJovenDropdown
  })

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        fecha_nacimiento: joven.fecha_nacimiento,
        edad: joven.edad
      }))
      setJovenSearchTerm(`${joven.nombres} ${joven.apellidos}`)
      setShowJovenDropdown(false)
    }
  }

  // Manejar cambio en el input de búsqueda
  const handleJovenSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setJovenSearchTerm(value)
    
    // Si hay texto, mostrar dropdown
    if (value.trim()) {
      setShowJovenDropdown(true)
    } else {
      // Si se borra el texto, limpiar la selección pero mantener dropdown abierto para mostrar todos
      setFormData(prev => ({
        ...prev,
        joven_id: '',
        nombre_completo: '',
        fecha_nacimiento: '',
        edad: 0
      }))
      // Si hay jóvenes cargados, mostrar el dropdown con todos
      if (jovenes.length > 0) {
        setShowJovenDropdown(true)
      }
    }
  }
  
  // Manejar focus del input para mostrar todos los jóvenes
  const handleJovenInputFocus = () => {
    setShowJovenDropdown(true)
    console.log('Input enfocado, jóvenes disponibles:', jovenes.length)
  }

  // Manejar selección de joven del dropdown
  const handleJovenSelect = (joven: Joven) => {
    handleJovenChange(joven.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar que se haya seleccionado un joven
      if (!formData.joven_id) {
        alert('Por favor, selecciona un joven de la lista')
        setLoading(false)
        return
      }

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
          fecha_atencion: new Date().toISOString(),
          motivo: 'Ficha Social',
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
      // Convertir estructura_familiar y distribucion_ingresos a formato JSONB
      const datosJson = {
        ...formData,
        estructura_familiar: formData.estructura_familiar.map(item => ({
          orden: item.orden,
          nombre: item.nombre,
          edad: item.edad,
          parentesco: item.parentesco,
          escolaridad: item.escolaridad,
          ocupacion: item.ocupacion
        })),
        distribucion_ingresos: formData.distribucion_ingresos.map(item => ({
          parentesco: item.parentesco,
          cantidad: item.cantidad,
          frecuencia: item.frecuencia,
          observacion: item.observacion
        })),
        egresos: formData.egresos, // La función stored procedure espera 'egresos' en el JSONB
        construccion_vivienda: formData.construccion_vivienda,
        distribucion_vivienda: formData.distribucion_vivienda,
        tiempo_reside_comunidad: formData.tiempo_reside_comunidad
      }

      // Usar la función stored procedure para crear el formulario
      const { data: formularioId, error: formularioError } = await supabase
        .rpc('crear_formulario_trabajo_social', {
          p_tipo_formulario: 'ficha_social',
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
            tipo_formulario: 'ficha_social',
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

        // Guardar también en fichas_sociales
        if (formularioData?.id) {
          const { error: fichaError } = await supabase
            .from('fichas_sociales')
            .insert({
              formulario_id: formularioData.id,
              joven_id: formData.joven_id,
              atencion_id: atencionId,
              trabajador_social: formData.trabajador_social,
              fecha_elaboracion: formData.fecha_elaboracion,
              nombre_completo: formData.nombre_completo,
              lugar_nacimiento: formData.lugar_nacimiento,
              fecha_nacimiento: formData.fecha_nacimiento,
              edad: formData.edad,
              identidad: formData.id,
              sexo: formData.sexo,
              escolaridad: formData.escolaridad,
              ocupacion: formData.ocupacion,
              estado_civil: formData.estado_civil,
              direccion: formData.direccion,
              responsable: formData.responsable,
              parentesco: formData.parentesco,
              telefono: formData.telefono,
              fecha_ingreso: formData.fecha_ingreso || null,
              expediente_administrativo: formData.expediente_administrativo || null,
              expediente_judicial: formData.expediente_judicial || null,
              juzgado: formData.juzgado || null,
              juez_remitente: formData.juez_remitente || null,
              infraccion_cometida: formData.infraccion_cometida || null,
              medida_socioeducativa: formData.medida_socioeducativa || null,
              duracion_medida: formData.duracion_medida || null,
              sabe_leer_escribir: formData.sabe_leer_escribir,
              asistio_escuela: formData.asistio_escuela,
              esta_estudiando: formData.esta_estudiando,
              por_que_no_estudia: formData.por_que_no_estudia || null,
              donde_estudia: formData.donde_estudia || null,
              descripcion_trayectoria: formData.descripcion_trayectoria || null,
              esta_trabajando: formData.esta_trabajando,
              que_trabaja: formData.que_trabaja || null,
              donde_trabaja: formData.donde_trabaja || null,
              edad_empezo_trabajar: formData.edad_empezo_trabajar || null,
              descripcion_trayectoria_laboral: formData.descripcion_trayectoria_laboral || null,
              padece_enfermedad: formData.padece_enfermedad,
              describe_enfermedad: formData.describe_enfermedad || null,
              recibe_tratamiento: formData.recibe_tratamiento,
              donde_recibe_tratamiento: formData.donde_recibe_tratamiento || null,
              sufrio_accidente: formData.sufrio_accidente,
              describe_accidente: formData.describe_accidente || null,
              padece_discapacidad: formData.padece_discapacidad,
              tipo_discapacidad: formData.tipo_discapacidad || [],
              describe_discapacidad: formData.describe_discapacidad || null,
              datos_madre: formData.madre,
              datos_padre: formData.padre,
              estructura_familiar: formData.estructura_familiar,
              ingreso_familiar_total: formData.ingreso_familiar_total || null,
              distribucion_ingresos: formData.distribucion_ingresos,
              otros_ingresos: formData.otros_ingresos || null,
              total_egreso_familiar: formData.total_egreso_familiar || null,
              egresos_detalle: formData.egresos,
              tenencia_vivienda: formData.tenencia_vivienda || null,
              tipo_vivienda: formData.tipo_vivienda || null,
              construccion_vivienda: formData.construccion_vivienda,
              numero_pisos: formData.numero_pisos || null,
              distribucion_vivienda: formData.distribucion_vivienda,
              servicios_basicos: formData.servicios_basicos || [],
              tiempo_reside_comunidad: formData.tiempo_reside_comunidad,
              relacion_vecinos: formData.relacion_vecinos || null,
              organizaciones_base: formData.organizaciones_base || [],
              otros_organizaciones: formData.otros_organizaciones || null,
              created_by: user.id
            })

          if (fichaError) {
            console.error('Error al guardar en fichas_sociales:', fichaError)
            // No lanzar error aquí, el formulario ya se guardó en formularios_atencion
          }
        }
      } else {
        console.log('✅ Formulario guardado exitosamente usando stored procedure:', formularioId)
      }

      alert('Ficha social guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la ficha social: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/atenciones" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ficha Social - Área de Trabajo Social
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Formulario de evaluación social integral
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información General */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Información General
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Joven *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={jovenSearchTerm}
                  onChange={handleJovenSearchChange}
                  onFocus={handleJovenInputFocus}
                  onBlur={() => setTimeout(() => setShowJovenDropdown(false), 200)}
                  placeholder="Buscar por nombre o apellido..."
                  className="input-field w-full pr-10"
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
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron jóvenes con "{jovenSearchTerm}"</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total de jóvenes disponibles: {jovenes.length}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nombres disponibles: {jovenes.slice(0, 5).map(j => `${j.nombres} ${j.apellidos}`).join(', ')}...</p>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Elaboración *
              </label>
              <input
                type="date"
                value={formData.fecha_elaboracion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trabajador/a Social *
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
                className="input-field"
                placeholder="Nombre del trabajador social"
                required
              />
            </div>
          </div>
        </div>

        {/* Datos Generales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              I. Datos Generales del NNAJ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lugar y Fecha de Nacimiento
              </label>
              <input
                type="text"
                value={formData.lugar_nacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_nacimiento: e.target.value }))}
                className="input-field"
                placeholder="Lugar de nacimiento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => setFormData(prev => ({ ...prev, edad: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                className="input-field"
                placeholder="Número de identidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Escolaridad
              </label>
              <select
                value={formData.escolaridad}
                onChange={(e) => setFormData(prev => ({ ...prev, escolaridad: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Primaria Incompleta">Primaria Incompleta</option>
                <option value="Primaria Completa">Primaria Completa</option>
                <option value="Secundaria Incompleta">Secundaria Incompleta</option>
                <option value="Secundaria Completa">Secundaria Completa</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="Universitario">Universitario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ocupación
              </label>
              <input
                type="text"
                value={formData.ocupacion}
                onChange={(e) => setFormData(prev => ({ ...prev, ocupacion: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Civil
              </label>
              <select
                value={formData.estado_civil}
                onChange={(e) => setFormData(prev => ({ ...prev, estado_civil: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Soltero">Soltero</option>
                <option value="Casado">Casado</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viudo">Viudo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsable
              </label>
              <input
                type="text"
                value={formData.responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parentesco
              </label>
              <input
                type="text"
                value={formData.parentesco}
                onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Datos Legales */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            II. Datos Legales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exp. Administrativo
              </label>
              <input
                type="text"
                value={formData.expediente_administrativo}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_administrativo: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exp. Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juzgado
              </label>
              <input
                type="text"
                value={formData.juzgado}
                onChange={(e) => setFormData(prev => ({ ...prev, juzgado: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juez/a Remitente
              </label>
              <input
                type="text"
                value={formData.juez_remitente}
                onChange={(e) => setFormData(prev => ({ ...prev, juez_remitente: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Infracción Cometida
              </label>
              <input
                type="text"
                value={formData.infraccion_cometida}
                onChange={(e) => setFormData(prev => ({ ...prev, infraccion_cometida: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medida Socioeducativa
              </label>
              <input
                type="text"
                value={formData.medida_socioeducativa}
                onChange={(e) => setFormData(prev => ({ ...prev, medida_socioeducativa: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de la Medida
              </label>
              <input
                type="text"
                value={formData.duracion_medida}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion_medida: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Escolaridad */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            III. Escolaridad
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sabe_leer_escribir}
                    onChange={(e) => setFormData(prev => ({ ...prev, sabe_leer_escribir: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span>Sabe leer y escribir</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.asistio_escuela}
                    onChange={(e) => setFormData(prev => ({ ...prev, asistio_escuela: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span>Asistió a la escuela</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.esta_estudiando}
                    onChange={(e) => setFormData(prev => ({ ...prev, esta_estudiando: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span>¿Está estudiando actualmente?</span>
                </label>
              </div>
            </div>

            {!formData.esta_estudiando && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Si su respuesta es No, ¿Por qué no está estudiando actualmente?
                </label>
                <input
                  type="text"
                  value={formData.por_que_no_estudia}
                  onChange={(e) => setFormData(prev => ({ ...prev, por_que_no_estudia: e.target.value }))}
                  className="input-field"
                />
              </div>
            )}

            {formData.esta_estudiando && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Si su respuesta es Sí, ¿Dónde estudia y en qué modalidad?
                </label>
                <input
                  type="text"
                  value={formData.donde_estudia}
                  onChange={(e) => setFormData(prev => ({ ...prev, donde_estudia: e.target.value }))}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción de su trayectoria escolar
              </label>
              <textarea
                value={formData.descripcion_trayectoria}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion_trayectoria: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Describa su trayectoria escolar..."
              />
            </div>
          </div>
        </div>

        {/* Situación Laboral */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            IV. Situación Laboral
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.esta_trabajando}
                  onChange={(e) => setFormData(prev => ({ ...prev, esta_trabajando: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>¿Está trabajando actualmente?</span>
              </label>
            </div>

            {formData.esta_trabajando && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿De qué está trabajando?
                  </label>
                  <input
                    type="text"
                    value={formData.que_trabaja}
                    onChange={(e) => setFormData(prev => ({ ...prev, que_trabaja: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿Dónde está trabajando?
                  </label>
                  <input
                    type="text"
                    value={formData.donde_trabaja}
                    onChange={(e) => setFormData(prev => ({ ...prev, donde_trabaja: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ¿A qué edad empezó a trabajar?
                  </label>
                  <input
                    type="number"
                    value={formData.edad_empezo_trabajar}
                    onChange={(e) => setFormData(prev => ({ ...prev, edad_empezo_trabajar: parseInt(e.target.value) || 0 }))}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción de su trayectoria laboral
              </label>
              <textarea
                value={formData.descripcion_trayectoria_laboral}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion_trayectoria_laboral: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Describa su trayectoria laboral..."
              />
            </div>
          </div>
        </div>

        {/* Situación de Salud */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            V. Situación de Salud
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.padece_enfermedad}
                  onChange={(e) => setFormData(prev => ({ ...prev, padece_enfermedad: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>¿Padece de alguna enfermedad (Física o mental)?</span>
              </label>
            </div>

            {formData.padece_enfermedad && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describa la enfermedad
                  </label>
                  <textarea
                    value={formData.describe_enfermedad}
                    onChange={(e) => setFormData(prev => ({ ...prev, describe_enfermedad: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Describa la enfermedad..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.recibe_tratamiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, recibe_tratamiento: e.target.checked }))}
                      className="form-checkbox"
                    />
                    <span>¿Recibe algún tratamiento?</span>
                  </label>
                </div>

                {formData.recibe_tratamiento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ¿Dónde recibe el tratamiento?
                    </label>
                    <input
                      type="text"
                      value={formData.donde_recibe_tratamiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, donde_recibe_tratamiento: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sufrio_accidente}
                  onChange={(e) => setFormData(prev => ({ ...prev, sufrio_accidente: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>¿Ha sufrido algún accidente?</span>
              </label>
            </div>

            {formData.sufrio_accidente && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describa el accidente
                </label>
                <textarea
                  value={formData.describe_accidente}
                  onChange={(e) => setFormData(prev => ({ ...prev, describe_accidente: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Describa el accidente..."
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.padece_discapacidad}
                  onChange={(e) => setFormData(prev => ({ ...prev, padece_discapacidad: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>¿Padece alguna discapacidad?</span>
              </label>
            </div>

            {formData.padece_discapacidad && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de discapacidad
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Física', 'Visual', 'Auditiva', 'Otra'].map(tipo => (
                      <label key={tipo} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.tipo_discapacidad.includes(tipo)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                tipo_discapacidad: [...prev.tipo_discapacidad, tipo]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                tipo_discapacidad: prev.tipo_discapacidad.filter(t => t !== tipo)
                              }))
                            }
                          }}
                          className="form-checkbox"
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Describa la discapacidad
                  </label>
                  <textarea
                    value={formData.describe_discapacidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, describe_discapacidad: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Describa la discapacidad..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/atenciones" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Ficha Social'}
          </button>
        </div>
      </form>
    </div>
  )
}