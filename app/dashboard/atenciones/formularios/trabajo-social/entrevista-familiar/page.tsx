'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Save, ArrowLeft, User, Users } from 'lucide-react'
import Link from 'next/link'
import JovenSearchInput from '@/components/JovenSearchInput'

interface Joven {
  id: string
  nombres: string
  apellidos: string
  expediente_administrativo?: string
}

interface FormData {
  joven_id: string
  regional: string
  
  // DATOS GENERALES DEL NNAJ
  nombre_completo_nnaj: string
  exp_administrativo: string
  
  // DATOS DEL ENTREVISTADO/A
  nombre_completo_entrevistado: string
  parentesco: string
  edad_entrevistado: string
  ocupacion_entrevistado: string
  direccion_entrevistado: string
  telefono_entrevistado: string
  
  // III. SITUACIÓN INDIVIDUAL
  comportamiento_nnaj: string[]
  comportamiento_nnaj_otro: string
  comportamiento_nnaj_explicacion: string
  virtudes_talentos_nnaj: string
  acontecimiento_influido_vida: string
  reportes_mal_comportamiento: string[]
  reportes_mal_comportamiento_otro: string
  reportes_mal_comportamiento_explicacion: string
  comportamiento_crisis_dificultades: string
  estado_centros_proteccion: 'si' | 'no' | ''
  estado_centros_proteccion_explicacion: string
  padece_enfermedad: 'si' | 'no' | ''
  padece_enfermedad_explicacion: string
  historial_psiquiatrico_familia: 'si' | 'no' | ''
  historial_psiquiatrico_familia_explicacion: string
  conocimiento_consumo_drogas: 'si' | 'no' | ''
  cuales_drogas: string
  que_hizo_respecto_drogas: string
  recibio_ayuda_profesional: 'si' | 'no' | ''
  recibio_ayuda_profesional_explicacion: string
  informacion_salud_sexual: 'si' | 'no' | ''
  informacion_salud_sexual_por_quien: string
  informacion_salud_sexual_explicacion: string
  
  // IV. SITUACIÓN FAMILIAR
  convive_pareja: 'si' | 'no' | ''
  convive_pareja_explicacion: string
  relacion_padre_madre_nnaj: string
  relacion_padrastro_madrasta: string
  relacion_miembros_hogar: string[]
  relacion_miembros_hogar_otro: string
  relacion_miembros_hogar_explicacion: string
  familiares_mayor_cercania: string[]
  familiares_mayor_cercania_otro: string
  familiares_mayor_conflictividad: string[]
  familiares_mayor_conflictividad_otro: string
  familiares_mayor_conflictividad_explicacion: string
  actitud_familia_nnaj: string
  nnaj_habla_intereses_preocupaciones: 'si' | 'no' | ''
  nnaj_habla_intereses_preocupaciones_explicacion: string
  actividades_tiempo_libre_familia: 'si' | 'no' | ''
  actividades_tiempo_libre_familia_explicacion: string
  
  // V. SITUACIÓN COMUNITARIA
  personas_relaciona_comunidad: string[]
  personas_relaciona_comunidad_otro: string
  actividades_grupo: string
  conoce_actitudes_amigos: 'si' | 'no' | ''
  conoce_actitudes_amigos_explicacion: string
  controla_supervisa_amistades: 'si' | 'no' | ''
  controla_supervisa_amistades_explicacion: string
  participado_proyectos_programas: 'si' | 'no' | ''
  participado_proyectos_programas_explicacion: string
  
  // VI. OBSERVACIONES GENERALES
  observaciones_generales: string
  
  // FIRMA
  trabajador_social: string
}

export default function EntrevistaFamiliarPMSPLPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_completo_nnaj: '',
    exp_administrativo: '',
    nombre_completo_entrevistado: '',
    parentesco: '',
    edad_entrevistado: '',
    ocupacion_entrevistado: '',
    direccion_entrevistado: '',
    telefono_entrevistado: '',
    comportamiento_nnaj: [],
    comportamiento_nnaj_otro: '',
    comportamiento_nnaj_explicacion: '',
    virtudes_talentos_nnaj: '',
    acontecimiento_influido_vida: '',
    reportes_mal_comportamiento: [],
    reportes_mal_comportamiento_otro: '',
    reportes_mal_comportamiento_explicacion: '',
    comportamiento_crisis_dificultades: '',
    estado_centros_proteccion: '',
    estado_centros_proteccion_explicacion: '',
    padece_enfermedad: '',
    padece_enfermedad_explicacion: '',
    historial_psiquiatrico_familia: '',
    historial_psiquiatrico_familia_explicacion: '',
    conocimiento_consumo_drogas: '',
    cuales_drogas: '',
    que_hizo_respecto_drogas: '',
    recibio_ayuda_profesional: '',
    recibio_ayuda_profesional_explicacion: '',
    informacion_salud_sexual: '',
    informacion_salud_sexual_por_quien: '',
    informacion_salud_sexual_explicacion: '',
    convive_pareja: '',
    convive_pareja_explicacion: '',
    relacion_padre_madre_nnaj: '',
    relacion_padrastro_madrasta: '',
    relacion_miembros_hogar: [],
    relacion_miembros_hogar_otro: '',
    relacion_miembros_hogar_explicacion: '',
    familiares_mayor_cercania: [],
    familiares_mayor_cercania_otro: '',
    familiares_mayor_conflictividad: [],
    familiares_mayor_conflictividad_otro: '',
    familiares_mayor_conflictividad_explicacion: '',
    actitud_familia_nnaj: '',
    nnaj_habla_intereses_preocupaciones: '',
    nnaj_habla_intereses_preocupaciones_explicacion: '',
    actividades_tiempo_libre_familia: '',
    actividades_tiempo_libre_familia_explicacion: '',
    personas_relaciona_comunidad: [],
    personas_relaciona_comunidad_otro: '',
    actividades_grupo: '',
    conoce_actitudes_amigos: '',
    conoce_actitudes_amigos_explicacion: '',
    controla_supervisa_amistades: '',
    controla_supervisa_amistades_explicacion: '',
    participado_proyectos_programas: '',
    participado_proyectos_programas_explicacion: '',
    observaciones_generales: '',
    trabajador_social: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      setLoading(true)
      
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
            expediente_administrativo: j.expediente_administrativo || ''
          }))
        
        setJovenes(jovenesActivos)
        console.log(`✅ Cargados ${jovenesActivos.length} jóvenes activos exitosamente`)
      } else {
        setJovenes([])
      }
    } catch (error) {
      console.error('Error loading jovenes:', error)
      setJovenes([])
    } finally {
      setLoading(false)
    }
  }

  // Filtrar jóvenes según el término de búsqueda
  const filteredJovenes = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      return jovenes.slice(0, 20) // Mostrar solo los primeros 20 si no hay término de búsqueda
    }
    
    const searchLower = searchTerm.toLowerCase().trim()
    
    return jovenes.filter(joven => {
      const nombres = (joven.nombres || '').toLowerCase().trim()
      const apellidos = (joven.apellidos || '').toLowerCase().trim()
      const fullName = `${nombres} ${apellidos}`.trim()
      const expAdmin = (joven.expediente_administrativo || '').toLowerCase().trim()
      
      return fullName.includes(searchLower) || 
             nombres.includes(searchLower) || 
             apellidos.includes(searchLower) ||
             expAdmin.includes(searchLower)
    }).slice(0, 20) // Limitar a 20 resultados
  }, [jovenes, searchTerm])
  
  console.log('Filtrado de jóvenes:', {
    totalJovenes: jovenes.length,
    searchTerm: searchTerm,
    filteredCount: filteredJovenes.length,
    filteredNames: filteredJovenes.map(j => `${j.nombres} ${j.apellidos}`)
  })

  const handleJovenSelect = (joven: Joven) => {
    setFormData(prev => ({
      ...prev,
      joven_id: joven.id,
      nombre_completo_nnaj: `${joven.nombres} ${joven.apellidos}`,
      exp_administrativo: joven.expediente_administrativo || ''
    }))
    setSearchTerm(`${joven.nombres} ${joven.apellidos}`)
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof FormData] as string[] || []
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) }
      }
    })
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
        throw new Error('Tu usuario no tiene un perfil configurado.')
      }

      // Crear una nueva atención
      const fechaAtencion = new Date().toISOString()
      
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Entrevista Familiar PMSPL',
          estado: 'completada'
        })
        .select()
        .single()

      if (atencionError) {
        throw new Error(`Error al crear la atención: ${atencionError.message}`)
      }

      const atencionId = nuevaAtencion.id

      // Preparar datos para guardar
      const datosJson = {
        ...formData
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'entrevista_familiar_pmspl',
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

      alert('Entrevista Familiar PMSPL guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar la entrevista: ${error.message || 'Error desconocido'}`)
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
            Ficha de Entrevista Familiar
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Programa de Atención a Medidas Sustitutivas a la Privación de Libertad
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">PROGRAMA DE ATENCIÓN A MEDIDAS SUSTITUTIVAS A LA PRIVACIÓN DE LIBERTAD</h3>
        <p className="text-md font-medium">REGIONAL: <input type="text" value={formData.regional} onChange={(e) => setFormData(prev => ({ ...prev, regional: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">AREA DE TRABAJO SOCIAL</h4>
        <h5 className="text-md font-bold mt-2">FICHA DE ENTREVISTA FAMILIAR</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DEL NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES DEL NNAJ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <JovenSearchInput
                value={formData.nombre_completo_nnaj}
                onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo_nnaj: value }))}
                onJovenSelect={(joven) => {
                  if (joven.id) {
                    handleJovenSelect(joven)
                  }
                }}
                label="Seleccionar Joven"
                required
                placeholder="Buscar por nombre o expediente administrativo..."
                error={errors.joven_id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exp. administrativo</label>
              <input type="text" value={formData.exp_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>
          </div>
        </div>

        {/* DATOS DEL ENTREVISTADO/A */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            DATOS DEL ENTREVISTADO/A
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
              <input type="text" value={formData.nombre_completo_entrevistado} onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo_entrevistado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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

        {/* III. SITUACIÓN INDIVIDUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">III. SITUACIÓN INDIVIDUAL</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo describe el comportamiento del NNAJ durante su niñez y adolescencia?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {['Tranquilo', 'Pasivo', 'Sociable', 'Agresivo', 'Alegre', 'Triste', 'Rebelde', 'Obediente', 'Desobediente'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.comportamiento_nnaj.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('comportamiento_nnaj', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otros"
                  value={formData.comportamiento_nnaj_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_nnaj_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.comportamiento_nnaj_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_nnaj_explicacion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Qué virtudes y talentos observa en su NNAJ?
              </label>
              <textarea
                value={formData.virtudes_talentos_nnaj}
                onChange={(e) => setFormData(prev => ({ ...prev, virtudes_talentos_nnaj: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Ha habido algún acontecimiento que pueda haber influido, especialmente, en la vida del NNAJ?
              </label>
              <textarea
                value={formData.acontecimiento_influido_vida}
                onChange={(e) => setFormData(prev => ({ ...prev, acontecimiento_influido_vida: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿En alguna ocasión tuvo reportes el NNAJ por mal comportamiento?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {['Amigos', 'Escuela', 'Vecinos'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.reportes_mal_comportamiento.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('reportes_mal_comportamiento', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otros"
                  value={formData.reportes_mal_comportamiento_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportes_mal_comportamiento_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.reportes_mal_comportamiento_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportes_mal_comportamiento_explicacion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Cómo se comporta el NNAJ ante situaciones de crisis o dificultades?
              </label>
              <textarea
                value={formData.comportamiento_crisis_dificultades}
                onChange={(e) => setFormData(prev => ({ ...prev, comportamiento_crisis_dificultades: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿El NNAJ ha estado en alguna ocasión en centros de protección de menores o similares?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="estado_centros_proteccion"
                    value="si"
                    checked={formData.estado_centros_proteccion === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_centros_proteccion: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="estado_centros_proteccion"
                    value="no"
                    checked={formData.estado_centros_proteccion === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_centros_proteccion: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              {formData.estado_centros_proteccion === 'si' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                  <textarea
                    value={formData.estado_centros_proteccion_explicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_centros_proteccion_explicacion: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Padece el NNAJ de alguna enfermedad física o mental?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="padece_enfermedad"
                    value="si"
                    checked={formData.padece_enfermedad === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, padece_enfermedad: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="padece_enfermedad"
                    value="no"
                    checked={formData.padece_enfermedad === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, padece_enfermedad: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              {formData.padece_enfermedad === 'si' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                  <textarea
                    value={formData.padece_enfermedad_explicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, padece_enfermedad_explicacion: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Existe historial psiquiátrico o de padecer alguna enfermedad en particular dentro de su familia?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="historial_psiquiatrico_familia"
                    value="si"
                    checked={formData.historial_psiquiatrico_familia === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, historial_psiquiatrico_familia: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="historial_psiquiatrico_familia"
                    value="no"
                    checked={formData.historial_psiquiatrico_familia === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, historial_psiquiatrico_familia: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              {formData.historial_psiquiatrico_familia === 'si' && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                  <textarea
                    value={formData.historial_psiquiatrico_familia_explicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, historial_psiquiatrico_familia_explicacion: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Tiene conocimiento si el NNAJ ha consumido algún tipo de drogas?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="conocimiento_consumo_drogas"
                    value="si"
                    checked={formData.conocimiento_consumo_drogas === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, conocimiento_consumo_drogas: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="conocimiento_consumo_drogas"
                    value="no"
                    checked={formData.conocimiento_consumo_drogas === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, conocimiento_consumo_drogas: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              {formData.conocimiento_consumo_drogas === 'si' && (
                <>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cuáles?</label>
                    <input
                      type="text"
                      value={formData.cuales_drogas}
                      onChange={(e) => setFormData(prev => ({ ...prev, cuales_drogas: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Qué hizo usted al respecto?</label>
                    <textarea
                      value={formData.que_hizo_respecto_drogas}
                      onChange={(e) => setFormData(prev => ({ ...prev, que_hizo_respecto_drogas: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Ha recibido ayuda profesional?</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="recibio_ayuda_profesional"
                          value="si"
                          checked={formData.recibio_ayuda_profesional === 'si'}
                          onChange={(e) => setFormData(prev => ({ ...prev, recibio_ayuda_profesional: e.target.value as 'si' | 'no' }))}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="recibio_ayuda_profesional"
                          value="no"
                          checked={formData.recibio_ayuda_profesional === 'no'}
                          onChange={(e) => setFormData(prev => ({ ...prev, recibio_ayuda_profesional: e.target.value as 'si' | 'no' }))}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                      </label>
                    </div>
                    {formData.recibio_ayuda_profesional === 'si' && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                        <textarea
                          value={formData.recibio_ayuda_profesional_explicacion}
                          onChange={(e) => setFormData(prev => ({ ...prev, recibio_ayuda_profesional_explicacion: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Le han brindado información en salud sexual y reproductiva al NNAJ?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="informacion_salud_sexual"
                    value="si"
                    checked={formData.informacion_salud_sexual === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, informacion_salud_sexual: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Si</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="informacion_salud_sexual"
                    value="no"
                    checked={formData.informacion_salud_sexual === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, informacion_salud_sexual: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              {formData.informacion_salud_sexual === 'si' && (
                <>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Por quién (es)?</label>
                    <input
                      type="text"
                      value={formData.informacion_salud_sexual_por_quien}
                      onChange={(e) => setFormData(prev => ({ ...prev, informacion_salud_sexual_por_quien: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                    <textarea
                      value={formData.informacion_salud_sexual_explicacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, informacion_salud_sexual_explicacion: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* IV. SITUACIÓN FAMILIAR */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">IV. SITUACIÓN FAMILIAR</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Actualmente convive con alguna pareja?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="convive_pareja"
                    value="si"
                    checked={formData.convive_pareja === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, convive_pareja: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sí</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="convive_pareja"
                    value="no"
                    checked={formData.convive_pareja === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, convive_pareja: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.convive_pareja_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, convive_pareja_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Cómo es su relación con el padre/madre del NNAJ?
              </label>
              <textarea
                value={formData.relacion_padre_madre_nnaj}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_padre_madre_nnaj: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿En caso de que sea padrastro o madrasta como es la relación con el NNAJ?
              </label>
              <textarea
                value={formData.relacion_padrastro_madrasta}
                onChange={(e) => setFormData(prev => ({ ...prev, relacion_padrastro_madrasta: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Cómo es la relación entre los miembros del hogar?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                {['Apoyo', 'Conflictiva', 'Amorosa', 'Respetuosa', 'Distante', 'Indiferente'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.relacion_miembros_hogar.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('relacion_miembros_hogar', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otro"
                  value={formData.relacion_miembros_hogar_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, relacion_miembros_hogar_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.relacion_miembros_hogar_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, relacion_miembros_hogar_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Con qué familiares tienen mayor cercanía y afectividad el NNAJ?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {['Padre', 'Madre', 'Hermano/a', 'Tío/a', 'Abuelo/a', 'Primo/a'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.familiares_mayor_cercania.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('familiares_mayor_cercania', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otro"
                  value={formData.familiares_mayor_cercania_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, familiares_mayor_cercania_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Con qué familiares tienen mayor conflictividad el NNAJ?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {['Padre', 'Madre', 'Hermano/a', 'Tío/a', 'Abuelo/a', 'Primo/a'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.familiares_mayor_conflictividad.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('familiares_mayor_conflictividad', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otro"
                  value={formData.familiares_mayor_conflictividad_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, familiares_mayor_conflictividad_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.familiares_mayor_conflictividad_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, familiares_mayor_conflictividad_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Qué actitud hay en la familia respecto al NNAJ?
              </label>
              <textarea
                value={formData.actitud_familia_nnaj}
                onChange={(e) => setFormData(prev => ({ ...prev, actitud_familia_nnaj: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Suele el NNAJ hablar con usted de lo que le interesa o le preocupa?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="nnaj_habla_intereses_preocupaciones"
                    value="si"
                    checked={formData.nnaj_habla_intereses_preocupaciones === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, nnaj_habla_intereses_preocupaciones: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="nnaj_habla_intereses_preocupaciones"
                    value="no"
                    checked={formData.nnaj_habla_intereses_preocupaciones === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, nnaj_habla_intereses_preocupaciones: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.nnaj_habla_intereses_preocupaciones_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, nnaj_habla_intereses_preocupaciones_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Realizan actividades en tiempo libre como familia?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="actividades_tiempo_libre_familia"
                    value="si"
                    checked={formData.actividades_tiempo_libre_familia === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre_familia: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="actividades_tiempo_libre_familia"
                    value="no"
                    checked={formData.actividades_tiempo_libre_familia === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre_familia: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.actividades_tiempo_libre_familia_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, actividades_tiempo_libre_familia_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* V. SITUACIÓN COMUNITARIA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">V. SITUACIÓN COMUNITARIA</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Quiénes son las personas con las que más se relaciona el NNAJ en la comunidad?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {['Amigos', 'Vecinos', 'Familiares', 'Compañeros de escuela', 'De trabajo', 'Sentimental', 'Grupos comunitarios', 'Grupos deportivos', 'Grupo Religioso'].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.personas_relaciona_comunidad.includes(opcion)}
                      onChange={(e) => handleCheckboxChange('personas_relaciona_comunidad', opcion, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opcion}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Otro"
                  value={formData.personas_relaciona_comunidad_otro}
                  onChange={(e) => setFormData(prev => ({ ...prev, personas_relaciona_comunidad_otro: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ¿Qué actividades realiza con el grupo?
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
              <textarea
                value={formData.actividades_grupo}
                onChange={(e) => setFormData(prev => ({ ...prev, actividades_grupo: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Conoce las actitudes y comportamientos de los amigos/as del NNAJ en el barrio o colonia?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="conoce_actitudes_amigos"
                    value="si"
                    checked={formData.conoce_actitudes_amigos === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, conoce_actitudes_amigos: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="conoce_actitudes_amigos"
                    value="no"
                    checked={formData.conoce_actitudes_amigos === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, conoce_actitudes_amigos: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.conoce_actitudes_amigos_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, conoce_actitudes_amigos_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Controla o supervisa el tipo de amistades que el NNAJ tiene en la comunidad?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="controla_supervisa_amistades"
                    value="si"
                    checked={formData.controla_supervisa_amistades === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, controla_supervisa_amistades: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="controla_supervisa_amistades"
                    value="no"
                    checked={formData.controla_supervisa_amistades === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, controla_supervisa_amistades: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.controla_supervisa_amistades_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, controla_supervisa_amistades_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ¿Ha participado el NNAJ en proyectos, programas o metodologías participativas juveniles desarrolladas por instituciones de gobierno u ONG´S?
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="participado_proyectos_programas"
                    value="si"
                    checked={formData.participado_proyectos_programas === 'si'}
                    onChange={(e) => setFormData(prev => ({ ...prev, participado_proyectos_programas: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SI</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="participado_proyectos_programas"
                    value="no"
                    checked={formData.participado_proyectos_programas === 'no'}
                    onChange={(e) => setFormData(prev => ({ ...prev, participado_proyectos_programas: e.target.value as 'si' | 'no' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
                </label>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explique:</label>
                <textarea
                  value={formData.participado_proyectos_programas_explicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, participado_proyectos_programas_explicacion: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VI. OBSERVACIONES GENERALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VI. OBSERVACIONES GENERALES</h3>
          <textarea
            value={formData.observaciones_generales}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones_generales: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Firma y sello del/la Trabajador/a Social <span className="text-red-500">*</span>
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
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

