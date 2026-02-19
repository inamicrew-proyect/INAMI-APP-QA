'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Heart, GraduationCap, Briefcase, AlertTriangle, Users } from 'lucide-react'
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

interface FormData {
  joven_id: string
  centro_pedagogico: string
  
  // DATOS GENERALES
  nombre_completo: string
  lugar_fecha_nacimiento: string
  edad: number
  sexo: string
  id: string
  escolaridad: string
  ocupacion: string
  estado_civil: string
  domicilio: string
  responsable: string
  parentesco: string
  telefono: string
  celular: string
  tiene_hijos: boolean
  cantidad_hijos: string
  
  // DATOS LEGALES
  fecha_ingreso: string
  infraccion: string
  tipo_medida: string
  duracion_medida: string
  juzgado_remitente: string
  juez_remitente: string
  expediente_judicial: string
  
  // SITUACIÓN DE SALUD
  antecedentes_salud: string
  situacion_salud_ingreso: string
  situacion_emocional_ingreso: string
  consume_drogas: boolean
  tipo_drogas: string
  desde_cuando_consume: string
  
  // SITUACIÓN EDUCATIVA
  sabe_leer_escribir: boolean
  asistio_escuela: boolean
  asistia_centro_educativo: boolean
  ultimo_grado_aprobado: string
  ano_aprobacion: string
  centro_educativo_ultimo_ano: string
  motivos_rendimiento_escolar: string
  
  // EXPERIENCIAS LABORALES
  ha_trabajado: boolean
  que_ha_trabajado: string
  ha_aprendido_oficio: boolean
  cual_oficio: string
  se_desempena_oficio: boolean
  otro_oficio: string
  
  // PERTENENCIA A ORGANIZACIONES ILÍCITAS
  pertenece_organizacion: string // 'Pertenece', 'Simpatiza', 'Ninguna'
  nombre_grupo: string
  tiempo_frecuentar: { anos: string, meses: string }
  observaciones_organizacion: string
  
  // DATOS FAMILIARES
  nombre_madre: string
  edad_madre: string
  telefono_madre: string
  celular_madre: string
  domicilio_madre: string
  estado_civil_madre: string
  ocupacion_madre: string
  trabaja_madre: boolean
  donde_trabaja_madre: string
  relacion_madre: string
  
  nombre_padre: string
  edad_padre: string
  telefono_padre: string
  celular_padre: string
  domicilio_padre: string
  estado_civil_padre: string
  ocupacion_padre: string
  trabaja_padre: boolean
  donde_trabaja_padre: string
  relacion_padre: string
  
  nombre_conyuge: string
  edad_conyuge: string
  telefono_conyuge: string
  celular_conyuge: string
  domicilio_conyuge: string
  ocupacion_conyuge: string
  trabaja_conyuge: boolean
  donde_trabaja_conyuge: string
  tiempo_relacion: { anos: string, meses: string }
  hijos_comun: boolean
  cantidad_hijos_comun: string
  con_quien_convivia: string
  
  // CONDUCTA DEL NNAJ
  conducta_entrevista: string[]
  observaciones_generales: string
  
  // SITUACIÓN PRESENTADA
  situacion_presentada: string
  
  // RECOMENDACIONES
  recomendaciones_plan: string
  
  // PROPUESTA
  propuesta_intervenciones: string
  
  // FIRMA
  lugar_fecha: string
  trabajador_social: string
}

export default function FichaSocialFaseIngresoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre_completo: '',
    lugar_fecha_nacimiento: '',
    edad: 0,
    sexo: '',
    id: '',
    escolaridad: '',
    ocupacion: '',
    estado_civil: '',
    domicilio: '',
    responsable: '',
    parentesco: '',
    telefono: '',
    celular: '',
    tiene_hijos: false,
    cantidad_hijos: '',
    fecha_ingreso: '',
    infraccion: '',
    tipo_medida: '',
    duracion_medida: '',
    juzgado_remitente: '',
    juez_remitente: '',
    expediente_judicial: '',
    antecedentes_salud: '',
    situacion_salud_ingreso: '',
    situacion_emocional_ingreso: '',
    consume_drogas: false,
    tipo_drogas: '',
    desde_cuando_consume: '',
    sabe_leer_escribir: false,
    asistio_escuela: false,
    asistia_centro_educativo: false,
    ultimo_grado_aprobado: '',
    ano_aprobacion: '',
    centro_educativo_ultimo_ano: '',
    motivos_rendimiento_escolar: '',
    ha_trabajado: false,
    que_ha_trabajado: '',
    ha_aprendido_oficio: false,
    cual_oficio: '',
    se_desempena_oficio: false,
    otro_oficio: '',
    pertenece_organizacion: 'Ninguna',
    nombre_grupo: '',
    tiempo_frecuentar: { anos: '', meses: '' },
    observaciones_organizacion: '',
    nombre_madre: '',
    edad_madre: '',
    telefono_madre: '',
    celular_madre: '',
    domicilio_madre: '',
    estado_civil_madre: '',
    ocupacion_madre: '',
    trabaja_madre: false,
    donde_trabaja_madre: '',
    relacion_madre: '',
    nombre_padre: '',
    edad_padre: '',
    telefono_padre: '',
    celular_padre: '',
    domicilio_padre: '',
    estado_civil_padre: '',
    ocupacion_padre: '',
    trabaja_padre: false,
    donde_trabaja_padre: '',
    relacion_padre: '',
    nombre_conyuge: '',
    edad_conyuge: '',
    telefono_conyuge: '',
    celular_conyuge: '',
    domicilio_conyuge: '',
    ocupacion_conyuge: '',
    trabaja_conyuge: false,
    donde_trabaja_conyuge: '',
    tiempo_relacion: { anos: '', meses: '' },
    hijos_comun: false,
    cantidad_hijos_comun: '',
    con_quien_convivia: '',
    conducta_entrevista: [],
    observaciones_generales: '',
    situacion_presentada: '',
    recomendaciones_plan: '',
    propuesta_intervenciones: '',
    lugar_fecha: '',
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
      const fechaNac = joven.fecha_nacimiento ? new Date(joven.fecha_nacimiento).toLocaleDateString() : ''
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad,
        expediente_judicial: joven.expediente_judicial || '',
        lugar_fecha_nacimiento: fechaNac
      }))
    }
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

      // Usar la fecha de ingreso o la fecha actual en formato ISO
      let fechaAtencion = new Date().toISOString()
      if (formData.fecha_ingreso) {
        fechaAtencion = new Date(formData.fecha_ingreso + 'T00:00:00').toISOString()
      }

      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha Social Fase de Ingreso',
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
        ...formData
      }

      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_social_fase_ingreso',
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

      alert('Ficha Social Fase de Ingreso guardada exitosamente')
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
            01 - Ficha Social Fase de Ingreso
          </h1>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN DE MENORES INFRACTORES</h2>
        <h3 className="text-lg font-semibold mb-2">CENTRO PEDAGÓGICO DE INTERNAMIENTO</h3>
        <p className="text-md font-medium">CENTRO PEDAGÓGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="_____________________________" /></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Joven <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccione un joven</option>
                {jovenes.map((joven) => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
              <select value={formData.sexo} onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                <option value="">Seleccione</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID</label>
              <input type="text" value={formData.id} onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
              <textarea value={formData.domicilio} onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
              <input type="text" value={formData.celular} onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiene hijos</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.tiene_hijos === true} onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: true }))} className="w-4 h-4" />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.tiene_hijos === false} onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.tiene_hijos && (
                <input type="text" value={formData.cantidad_hijos} onChange={(e) => setFormData(prev => ({ ...prev, cantidad_hijos: e.target.value }))} placeholder="¿Cuántos?" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              )}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infracción por la que se le acusa</label>
              <input type="text" value={formData.infraccion} onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Medida</label>
              <input type="text" value={formData.tipo_medida} onChange={(e) => setFormData(prev => ({ ...prev, tipo_medida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración de la Medida</label>
              <input type="text" value={formData.duracion_medida} onChange={(e) => setFormData(prev => ({ ...prev, duracion_medida: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juzgado remitente</label>
              <input type="text" value={formData.juzgado_remitente} onChange={(e) => setFormData(prev => ({ ...prev, juzgado_remitente: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juez/a remitente</label>
              <input type="text" value={formData.juez_remitente} onChange={(e) => setFormData(prev => ({ ...prev, juez_remitente: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expediente Judicial</label>
              <input type="text" value={formData.expediente_judicial} onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Antecedentes de salud</label>
              <textarea value={formData.antecedentes_salud} onChange={(e) => setFormData(prev => ({ ...prev, antecedentes_salud: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Situación de salud al momento del ingreso</label>
              <textarea value={formData.situacion_salud_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, situacion_salud_ingreso: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Situación emocional al momento del ingreso</label>
              <textarea value={formData.situacion_emocional_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, situacion_emocional_ingreso: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Consume algún tipo de droga?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.consume_drogas === true} onChange={() => setFormData(prev => ({ ...prev, consume_drogas: true }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.consume_drogas === false} onChange={() => setFormData(prev => ({ ...prev, consume_drogas: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.consume_drogas && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Qué tipo de droga(s)?</label>
                    <textarea value={formData.tipo_drogas} onChange={(e) => setFormData(prev => ({ ...prev, tipo_drogas: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Desde cuándo consume?</label>
                    <textarea value={formData.desde_cuando_consume} onChange={(e) => setFormData(prev => ({ ...prev, desde_cuando_consume: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SITUACIÓN EDUCATIVA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            SITUACIÓN EDUCATIVA
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sabe leer y escribir</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.sabe_leer_escribir === true} onChange={() => setFormData(prev => ({ ...prev, sabe_leer_escribir: true }))} className="w-4 h-4" />
                    <span>si</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.sabe_leer_escribir === false} onChange={() => setFormData(prev => ({ ...prev, sabe_leer_escribir: false }))} className="w-4 h-4" />
                    <span>no</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asistió a la escuela</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.asistio_escuela === true} onChange={() => setFormData(prev => ({ ...prev, asistio_escuela: true }))} className="w-4 h-4" />
                    <span>si</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.asistio_escuela === false} onChange={() => setFormData(prev => ({ ...prev, asistio_escuela: false }))} className="w-4 h-4" />
                    <span>no</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asistía a un centro educativo al momento de su aprehensión</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.asistia_centro_educativo === true} onChange={() => setFormData(prev => ({ ...prev, asistia_centro_educativo: true }))} className="w-4 h-4" />
                    <span>si</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={formData.asistia_centro_educativo === false} onChange={() => setFormData(prev => ({ ...prev, asistia_centro_educativo: false }))} className="w-4 h-4" />
                    <span>no</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Último grado aprobado</label>
                <input type="text" value={formData.ultimo_grado_aprobado} onChange={(e) => setFormData(prev => ({ ...prev, ultimo_grado_aprobado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año de aprobación</label>
                <input type="text" value={formData.ano_aprobacion} onChange={(e) => setFormData(prev => ({ ...prev, ano_aprobacion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Centro educativo donde curso el último año</label>
                <input type="text" value={formData.centro_educativo_ultimo_ano} onChange={(e) => setFormData(prev => ({ ...prev, centro_educativo_ultimo_ano: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivos del rendimiento escolar</label>
              <textarea value={formData.motivos_rendimiento_escolar} onChange={(e) => setFormData(prev => ({ ...prev, motivos_rendimiento_escolar: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* EXPERIENCIAS LABORALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            EXPERIENCIAS LABORALES
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Ha trabajado alguna vez?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.ha_trabajado === true} onChange={() => setFormData(prev => ({ ...prev, ha_trabajado: true }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.ha_trabajado === false} onChange={() => setFormData(prev => ({ ...prev, ha_trabajado: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.ha_trabajado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿De qué ha trabajado?</label>
                  <input type="text" value={formData.que_ha_trabajado} onChange={(e) => setFormData(prev => ({ ...prev, que_ha_trabajado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Ha aprendido algún oficio?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.ha_aprendido_oficio === true} onChange={() => setFormData(prev => ({ ...prev, ha_aprendido_oficio: true }))} className="w-4 h-4" />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.ha_aprendido_oficio === false} onChange={() => setFormData(prev => ({ ...prev, ha_aprendido_oficio: false }))} className="w-4 h-4" />
                  <span>No</span>
                </label>
              </div>
              {formData.ha_aprendido_oficio && (
                <>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cuál?</label>
                    <input type="text" value={formData.cual_oficio} onChange={(e) => setFormData(prev => ({ ...prev, cual_oficio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Se desempeña en ese oficio?</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={formData.se_desempena_oficio === true} onChange={() => setFormData(prev => ({ ...prev, se_desempena_oficio: true }))} className="w-4 h-4" />
                        <span>Si</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" checked={formData.se_desempena_oficio === false} onChange={() => setFormData(prev => ({ ...prev, se_desempena_oficio: false }))} className="w-4 h-4" />
                        <span>No</span>
                      </label>
                    </div>
                    {!formData.se_desempena_oficio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">o en otro ¿Cuál?</label>
                        <input type="text" value={formData.otro_oficio} onChange={(e) => setFormData(prev => ({ ...prev, otro_oficio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PERTENENCIA A ORGANIZACIONES ILÍCITAS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            PERTENENCIA A ORGANIZACIONES ILÍCITAS
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pertenece o simpatiza a un grupo o asociación</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.pertenece_organizacion === 'Pertenece'} onChange={() => setFormData(prev => ({ ...prev, pertenece_organizacion: 'Pertenece' }))} className="w-4 h-4" />
                  <span>Si Pertenece</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.pertenece_organizacion === 'Simpatiza'} onChange={() => setFormData(prev => ({ ...prev, pertenece_organizacion: 'Simpatiza' }))} className="w-4 h-4" />
                  <span>Si Simpatiza</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={formData.pertenece_organizacion === 'Ninguna'} onChange={() => setFormData(prev => ({ ...prev, pertenece_organizacion: 'Ninguna' }))} className="w-4 h-4" />
                  <span>Ninguna</span>
                </label>
              </div>
            </div>
            {(formData.pertenece_organizacion === 'Pertenece' || formData.pertenece_organizacion === 'Simpatiza') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del grupo</label>
                  <input type="text" value={formData.nombre_grupo} onChange={(e) => setFormData(prev => ({ ...prev, nombre_grupo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo de frecuentar al grupo - Años</label>
                    <input type="text" value={formData.tiempo_frecuentar.anos} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_frecuentar: { ...prev.tiempo_frecuentar, anos: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meses</label>
                    <input type="text" value={formData.tiempo_frecuentar.meses} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_frecuentar: { ...prev.tiempo_frecuentar, meses: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                  <textarea value={formData.observaciones_organizacion} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_organizacion: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* DATOS FAMILIARES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            DATOS FAMILIARES
          </h3>
          
          <div className="space-y-6">
            {/* MADRE */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Nombre de la madre</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre_madre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
                  <input type="text" value={formData.edad_madre} onChange={(e) => setFormData(prev => ({ ...prev, edad_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono_madre} onChange={(e) => setFormData(prev => ({ ...prev, telefono_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
                  <input type="text" value={formData.celular_madre} onChange={(e) => setFormData(prev => ({ ...prev, celular_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
                  <textarea value={formData.domicilio_madre} onChange={(e) => setFormData(prev => ({ ...prev, domicilio_madre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado Civil</label>
                  <input type="text" value={formData.estado_civil_madre} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion_madre} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trabaja</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_madre === true} onChange={() => setFormData(prev => ({ ...prev, trabaja_madre: true }))} className="w-4 h-4" />
                      <span>Si</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_madre === false} onChange={() => setFormData(prev => ({ ...prev, trabaja_madre: false }))} className="w-4 h-4" />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                {formData.trabaja_madre && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Dónde?</label>
                    <input type="text" value={formData.donde_trabaja_madre} onChange={(e) => setFormData(prev => ({ ...prev, donde_trabaja_madre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cómo es la relación con su madre?</label>
                  <textarea value={formData.relacion_madre} onChange={(e) => setFormData(prev => ({ ...prev, relacion_madre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>

            {/* PADRE */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Nombre del padre</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre_padre} onChange={(e) => setFormData(prev => ({ ...prev, nombre_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
                  <input type="text" value={formData.edad_padre} onChange={(e) => setFormData(prev => ({ ...prev, edad_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono_padre} onChange={(e) => setFormData(prev => ({ ...prev, telefono_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
                  <input type="text" value={formData.celular_padre} onChange={(e) => setFormData(prev => ({ ...prev, celular_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
                  <textarea value={formData.domicilio_padre} onChange={(e) => setFormData(prev => ({ ...prev, domicilio_padre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado Civil</label>
                  <input type="text" value={formData.estado_civil_padre} onChange={(e) => setFormData(prev => ({ ...prev, estado_civil_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion_padre} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trabaja</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_padre === true} onChange={() => setFormData(prev => ({ ...prev, trabaja_padre: true }))} className="w-4 h-4" />
                      <span>Si</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_padre === false} onChange={() => setFormData(prev => ({ ...prev, trabaja_padre: false }))} className="w-4 h-4" />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                {formData.trabaja_padre && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Dónde?</label>
                    <input type="text" value={formData.donde_trabaja_padre} onChange={(e) => setFormData(prev => ({ ...prev, donde_trabaja_padre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Cómo es la relación con su padre?</label>
                  <textarea value={formData.relacion_padre} onChange={(e) => setFormData(prev => ({ ...prev, relacion_padre: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>

            {/* CÓNYUGE */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Nombre de Conyugue</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, nombre_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
                  <input type="text" value={formData.edad_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, edad_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="text" value={formData.telefono_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, telefono_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Celular</label>
                  <input type="text" value={formData.celular_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, celular_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
                  <textarea value={formData.domicilio_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, domicilio_conyuge: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, ocupacion_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trabaja</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_conyuge === true} onChange={() => setFormData(prev => ({ ...prev, trabaja_conyuge: true }))} className="w-4 h-4" />
                      <span>Sí</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.trabaja_conyuge === false} onChange={() => setFormData(prev => ({ ...prev, trabaja_conyuge: false }))} className="w-4 h-4" />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                {formData.trabaja_conyuge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Dónde?</label>
                    <input type="text" value={formData.donde_trabaja_conyuge} onChange={(e) => setFormData(prev => ({ ...prev, donde_trabaja_conyuge: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo de relación - Años</label>
                    <input type="text" value={formData.tiempo_relacion.anos} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_relacion: { ...prev.tiempo_relacion, anos: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meses</label>
                    <input type="text" value={formData.tiempo_relacion.meses} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_relacion: { ...prev.tiempo_relacion, meses: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hijos en común</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.hijos_comun === true} onChange={() => setFormData(prev => ({ ...prev, hijos_comun: true }))} className="w-4 h-4" />
                      <span>Si</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={formData.hijos_comun === false} onChange={() => setFormData(prev => ({ ...prev, hijos_comun: false }))} className="w-4 h-4" />
                      <span>No</span>
                    </label>
                  </div>
                  {formData.hijos_comun && (
                    <input type="text" value={formData.cantidad_hijos_comun} onChange={(e) => setFormData(prev => ({ ...prev, cantidad_hijos_comun: e.target.value }))} placeholder="¿Cuántos?" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">¿Con quién convivía antes de la aprehensión?</label>
                  <textarea value={formData.con_quien_convivia} onChange={(e) => setFormData(prev => ({ ...prev, con_quien_convivia: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONDUCTA DEL NNAJ AL MOMENTO DE LA ENTREVISTA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">CONDUCTA DEL NNAJ AL MOMENTO DE LA ENTREVISTA</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Agresiva', 'Cordial', 'Pasiva', 'Introvertida', 'Extrovertida', 'Respetuosa', 'Obediente'].map((conducta) => (
              <label key={conducta} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.conducta_entrevista.includes(conducta)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, conducta_entrevista: [...prev.conducta_entrevista, conducta] }))
                    } else {
                      setFormData(prev => ({ ...prev, conducta_entrevista: prev.conducta_entrevista.filter(c => c !== conducta) }))
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{conducta}</span>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones Generales</label>
            <textarea value={formData.observaciones_generales} onChange={(e) => setFormData(prev => ({ ...prev, observaciones_generales: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        {/* SITUACIÓN PRESENTADA AL MOMENTO DE SU DETENCIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN PRESENTADA AL MOMENTO DE SU DETENCIÓN</h3>
          <textarea value={formData.situacion_presentada} onChange={(e) => setFormData(prev => ({ ...prev, situacion_presentada: e.target.value }))} rows={8} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>

        {/* RECOMENDACIONES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">RECOMENDACIONES PARA LA ELABORACIÓN DE PLAN DE ATENCION CAUTELAR</h3>
          <textarea value={formData.recomendaciones_plan} onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones_plan: e.target.value }))} rows={6} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>

        {/* PROPUESTA DE INTERVENCIONES PROFESIONALES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">PROPUESTA DE INTERVENCIONES PROFESIONALES</h3>
          <textarea value={formData.propuesta_intervenciones} onChange={(e) => setFormData(prev => ({ ...prev, propuesta_intervenciones: e.target.value }))} rows={6} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lugar y fecha</label>
              <input type="text" value={formData.lugar_fecha} onChange={(e) => setFormData(prev => ({ ...prev, lugar_fecha: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre, firma y sello. Trabajador/a Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, trabajador_social: e.target.value }))}
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
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Ficha'}
          </button>
        </div>
      </form>
    </div>
  )
}

