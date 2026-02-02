'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Briefcase } from 'lucide-react'
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
  infraccion: string
  exp_interno: string
  exp_judicial: string
  lugar_trabajo_comunitario: string
  persona_supervisa: string
  cargo_desempena: string
  domicilio: string
  lugar_supervision: string
  fecha_supervision: string
  funciones_realizadas: string
  actitud_trabajo_comunitario: string
  logros_limitaciones: string
  recomendaciones: string
  trabajador_social: string
  firma_trabajador_social: string
  firma_persona_entrevistada: string
}

export default function InformeServicioComunitarioPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    regional: '',
    nombre_nnaj: '',
    infraccion: '',
    exp_interno: '',
    exp_judicial: '',
    lugar_trabajo_comunitario: '',
    persona_supervisa: '',
    cargo_desempena: '',
    domicilio: '',
    lugar_supervision: '',
    fecha_supervision: new Date().toISOString().split('T')[0],
    funciones_realizadas: '',
    actitud_trabajo_comunitario: '',
    logros_limitaciones: '',
    recomendaciones: '',
    trabajador_social: '',
    firma_trabajador_social: '',
    firma_persona_entrevistada: ''
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

    if (!formData.fecha_supervision) {
      newErrors.fecha_supervision = 'La fecha de supervisión es requerida'
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
      const { data: nuevaAtencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: formData.fecha_supervision,
          motivo: 'Informe Social - Servicio Comunitario',
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

      // Preparar datos para guardar
      const datosJson = {
        ...formData,
        fecha_elaboracion: formData.fecha_supervision
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'informe_servicio_comunitario',
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

      alert('Informe Social - Servicio Comunitario guardado exitosamente')
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
            Informe Social - Servicio Comunitario
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
        <h5 className="text-lg font-bold mt-2">INFORME SOCIAL – SERVICIO COMUNITARIO</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS GENERALES DE NNAJ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS GENERALES DE NNAJ
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
                label="Nombre"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id}
              />
            </div>

            {/* Infracción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Infracción
              </label>
              <input
                type="text"
                value={formData.infraccion}
                onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Tipo de infracción"
              />
            </div>

            {/* No. Expediente Interno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                No. Expediente Interno
              </label>
              <input
                type="text"
                value={formData.exp_interno}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white"
              />
            </div>

            {/* Expediente Judicial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expediente Judicial No.
              </label>
              <input
                type="text"
                value={formData.exp_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, exp_judicial: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Número de expediente judicial"
              />
            </div>

            {/* Lugar donde se realiza el trabajo comunitario */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lugar donde se realiza el trabajo comunitario
              </label>
              <input
                type="text"
                value={formData.lugar_trabajo_comunitario}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_trabajo_comunitario: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dirección o lugar del trabajo comunitario"
              />
            </div>

            {/* Persona que supervisa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Persona que supervisa
              </label>
              <input
                type="text"
                value={formData.persona_supervisa}
                onChange={(e) => setFormData(prev => ({ ...prev, persona_supervisa: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre completo"
              />
            </div>

            {/* Cargo que desempeña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cargo que desempeña
              </label>
              <input
                type="text"
                value={formData.cargo_desempena}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo_desempena: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Cargo o puesto"
              />
            </div>

            {/* Domicilio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domicilio
              </label>
              <input
                type="text"
                value={formData.domicilio}
                onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Dirección completa"
              />
            </div>

            {/* Lugar de supervisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lugar de supervisión
              </label>
              <input
                type="text"
                value={formData.lugar_supervision}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_supervision: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Lugar donde se realiza la supervisión"
              />
            </div>

            {/* Fecha de supervisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de supervisión <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.fecha_supervision}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_supervision: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_supervision ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_supervision && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_supervision}</p>
              )}
            </div>

            {/* Trabajador/a Social */}
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

        {/* FUNCIONES REALIZADAS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            FUNCIONES REALIZADAS
          </h3>
          <textarea
            value={formData.funciones_realizadas}
            onChange={(e) => setFormData(prev => ({ ...prev, funciones_realizadas: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa detalladamente las funciones realizadas en el servicio comunitario"
          />
        </div>

        {/* Actitud al momento de realizar el trabajo comunitario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Actitud al momento de realizar el trabajo comunitario
          </h3>
          <textarea
            value={formData.actitud_trabajo_comunitario}
            onChange={(e) => setFormData(prev => ({ ...prev, actitud_trabajo_comunitario: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa la actitud del NNAJ durante el trabajo comunitario"
          />
        </div>

        {/* Logros y limitaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Logros y limitaciones
          </h3>
          <textarea
            value={formData.logros_limitaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, logros_limitaciones: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa los logros alcanzados y las limitaciones encontradas"
          />
        </div>

        {/* Recomendaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Recomendaciones
          </h3>
          <textarea
            value={formData.recomendaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Describa las recomendaciones"
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
                Lic. Trabajador/a Social INAMI - PMS
              </label>
              <input
                type="text"
                value={formData.firma_trabajador_social}
                onChange={(e) => setFormData(prev => ({ ...prev, firma_trabajador_social: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre del trabajador social"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Firma y sello de persona entrevistada
              </label>
              <input
                type="text"
                value={formData.firma_persona_entrevistada}
                onChange={(e) => setFormData(prev => ({ ...prev, firma_persona_entrevistada: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre de la persona entrevistada"
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
            {saving ? 'Guardando...' : 'Guardar Informe'}
          </button>
        </div>
      </form>
    </div>
  )
}

