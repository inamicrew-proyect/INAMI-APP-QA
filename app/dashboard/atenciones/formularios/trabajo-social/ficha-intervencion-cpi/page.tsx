'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User } from 'lucide-react'
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
  nombre_nnaj: string
  nombre_familiar_responsable: string
  exp_judicial_administrativo: string
  fecha_atencion: string
  motivo_atencion: {
    individual: boolean
    grupal: boolean
    familiar: boolean
  }
  
  // OBJETIVO DE LA INTERVENCION
  objetivo_intervencion: string
  
  // DESARROLLO DE LA INTERVENCION
  desarrollo_intervencion: string
  
  // LOGROS Y DIFICULTADES
  logros_dificultades: string
  
  // RECOMENDACIONES Y ACUERDOS
  recomendaciones_acuerdos: string
  
  // PROXIMA CITA
  proxima_cita: string
  
  // FIRMAS
  trabajador_social: string
  nombre_firma_receptor: string
}

export default function FichaIntervencionCPIPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    centro_pedagogico: '',
    nombre_nnaj: '',
    nombre_familiar_responsable: '',
    exp_judicial_administrativo: '',
    fecha_atencion: new Date().toISOString().split('T')[0],
    motivo_atencion: {
      individual: false,
      grupal: false,
      familiar: false
    },
    objetivo_intervencion: '',
    desarrollo_intervencion: '',
    logros_dificultades: '',
    recomendaciones_acuerdos: '',
    proxima_cita: '',
    trabajador_social: '',
    nombre_firma_receptor: ''
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
      const expJudicial = joven.expediente_judicial || ''
      const expAdministrativo = joven.expediente_administrativo || ''
      const expCombinado = expJudicial && expAdministrativo 
        ? `${expJudicial} / ${expAdministrativo}` 
        : expJudicial || expAdministrativo || ''
      
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId,
        nombre_nnaj: `${joven.nombres} ${joven.apellidos}`,
        exp_judicial_administrativo: expCombinado
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
    if (!formData.fecha_atencion) {
      newErrors.fecha_atencion = 'La fecha de atención es requerida'
    }
    if (!formData.motivo_atencion.individual && !formData.motivo_atencion.grupal && !formData.motivo_atencion.familiar) {
      newErrors.motivo_atencion = 'Debe seleccionar al menos un motivo de atención'
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
      const fechaAtencion = formData.fecha_atencion ? new Date(formData.fecha_atencion).toISOString() : new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Ficha de Intervención Trabajo Social CPI',
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
        fecha_atencion: formData.fecha_atencion
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'ficha_intervencion_cpi',
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

      alert('Ficha de Intervención Trabajo Social CPI guardada exitosamente')
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
            Ficha de Intervención Trabajo Social CPI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN DE MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">CENTRO PEDAGOGICO DE INTERNAMIENTO</h3>
        <p className="text-md font-medium">CENTRO PEDAGOGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">FICHA DE INTERVENCIÓN TRABAJO SOCIAL</h4>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del NNAJ</label>
              <input type="text" value={formData.nombre_nnaj} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Familiar o Responsable</label>
              <input type="text" value={formData.nombre_familiar_responsable} onChange={(e) => setFormData(prev => ({ ...prev, nombre_familiar_responsable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exp. Judicial y Administrativo</label>
              <input type="text" value={formData.exp_judicial_administrativo} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Atención <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={formData.fecha_atencion} 
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_atencion: e.target.value }))} 
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.fecha_atencion ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.fecha_atencion && <p className="mt-1 text-sm text-red-600">{errors.fecha_atencion}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motivo de la Atención <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.motivo_atencion.individual}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivo_atencion: {
                        ...prev.motivo_atencion,
                        individual: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Individual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.motivo_atencion.grupal}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivo_atencion: {
                        ...prev.motivo_atencion,
                        grupal: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Grupal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.motivo_atencion.familiar}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      motivo_atencion: {
                        ...prev.motivo_atencion,
                        familiar: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Familiar</span>
                </label>
              </div>
              {errors.motivo_atencion && <p className="mt-1 text-sm text-red-600">{errors.motivo_atencion}</p>}
            </div>
          </div>
        </div>

        {/* OBJETIVO DE LA INTERVENCION */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">OBJETIVO DE LA INTERVENCION</h3>
          <textarea
            value={formData.objetivo_intervencion}
            onChange={(e) => setFormData(prev => ({ ...prev, objetivo_intervencion: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* DESARROLLO DE LA INTERVENCION */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">DESARROLLO DE LA INTERVENCION</h3>
          <textarea
            value={formData.desarrollo_intervencion}
            onChange={(e) => setFormData(prev => ({ ...prev, desarrollo_intervencion: e.target.value }))}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* LOGROS Y DIFICULTADES */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">LOGROS Y DIFICULTADES DURANTE EL PROCESO DEL NNAJ</h3>
          <textarea
            value={formData.logros_dificultades}
            onChange={(e) => setFormData(prev => ({ ...prev, logros_dificultades: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* RECOMENDACIONES Y ACUERDOS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">RECOMENDACIONES BRINDADAS Y ACUERDOS PARA LA PRÓXIMA REUNIÓN</h3>
          <textarea
            value={formData.recomendaciones_acuerdos}
            onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones_acuerdos: e.target.value }))}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* PROXIMA CITA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">PRÓXIMA CITA</h3>
          <input
            type="text"
            value={formData.proxima_cita}
            onChange={(e) => setFormData(prev => ({ ...prev, proxima_cita: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ej: 15 de marzo de 2024 a las 10:00 AM"
          />
        </div>

        {/* FIRMAS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMAS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NOMBRE, FIRMA Y SELLO TRABAJADOR/A SOCIAL <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NOMBRE, FIRMA O HUELLA DE QUIEN RECIBE LA ATENCION
              </label>
              <input
                type="text"
                value={formData.nombre_firma_receptor}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_firma_receptor: e.target.value }))}
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
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}

