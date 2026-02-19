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
  
  // DATOS DE IDENTIFICACIÓN DEL NIÑO, ADOLESCENTE O JOVEN
  nombre: string
  edad: number
  fecha_ingreso: string
  exp_judicial: string
  infraccion: string
  medida_sancion_aplicada: string
  tiempo_internamiento: string
  juzgado_causa: string
  nombre_responsable: string
  parentesco: string
  telefono: string
  domicilio: string
  periodo_comprendido: string
  fecha_elaboracion: string
  
  // SITUACIÓN ACTUAL
  area_individual: string
  area_convivencia_grupal: string
  area_familiar: string
  area_educativa: string
  area_salud: string
  
  // ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN
  actitud_cumplimiento_sancion: string
  
  // VALORACIÓN TÉCNICA
  pronostico: string
  recomendaciones: string
  
  // MEDIOS DE VERIFICACIÓN
  entrevista_avance: boolean
  expediente_administrativo: boolean
  expediente_medico: boolean
  expediente_educativo: boolean
  
  // FIRMA
  trabajador_social: string
}

export default function InformeEvaluacionSeguimientoCPIPage() {
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
    fecha_ingreso: '',
    exp_judicial: '',
    infraccion: '',
    medida_sancion_aplicada: '',
    tiempo_internamiento: '',
    juzgado_causa: '',
    nombre_responsable: '',
    parentesco: '',
    telefono: '',
    domicilio: '',
    periodo_comprendido: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    area_individual: '',
    area_convivencia_grupal: '',
    area_familiar: '',
    area_educativa: '',
    area_salud: '',
    actitud_cumplimiento_sancion: '',
    pronostico: '',
    recomendaciones: '',
    entrevista_avance: false,
    expediente_administrativo: false,
    expediente_medico: false,
    expediente_educativo: false,
    trabajador_social: ''
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
      const fechaAtencion = formData.fecha_elaboracion ? new Date(formData.fecha_elaboracion).toISOString() : new Date().toISOString()

      // Crear o actualizar atención
      const { data: atencion, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: fechaAtencion,
          motivo: 'Informe de Evaluación y Seguimiento CPI',
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
        fecha_ingreso: formData.fecha_ingreso,
        fecha_elaboracion: formData.fecha_elaboracion
      }

      // Guardar en formularios_atencion
      const { error: insertError } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'informe_evaluacion_seguimiento_cpi',
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

      alert('Informe de Evaluación y Seguimiento CPI guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error: any) {
      console.error('Error saving form:', error)
      alert(`Error al guardar el informe: ${error.message || 'Error desconocido'}`)
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
            Informe de Evaluación y Seguimiento CPI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Centro Pedagógico de Internamiento
          </p>
        </div>
      </div>

      {/* Encabezado del Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 text-center border-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-2">INSTITUTO NACIONAL PARA LA ATENCIÓN A MENORES INFRACTORES</h2>
        <h3 className="text-lg font-bold mb-2">CENTRO PEDAGÓGICO DE INTERNAMIENTO</h3>
        <p className="text-md font-medium">CENTRO PEDAGÓGICO DE INTERNAMIENTO: <input type="text" value={formData.centro_pedagogico} onChange={(e) => setFormData(prev => ({ ...prev, centro_pedagogico: e.target.value }))} className="border-b border-gray-400 dark:border-gray-600 bg-transparent text-center focus:outline-none focus:border-blue-500 dark:text-white" placeholder="________________" /></p>
        <h4 className="text-lg font-bold mt-4">INFORME SOCIAL DE EVALUACIÓN Y SEGUIMIENTO</h4>
        <h5 className="text-md font-semibold mt-2">ÁREA DE TRABAJO SOCIAL</h5>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DE IDENTIFICACIÓN DEL NIÑO, ADOLESCENTE O JOVEN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            DATOS DE IDENTIFICACIÓN DEL NIÑO, ADOLESCENTE O JOVEN
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de ingreso</label>
              <input type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData(prev => ({ ...prev, fecha_ingreso: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expediente judicial</label>
              <input type="text" value={formData.exp_judicial} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infracción</label>
              <input type="text" value={formData.infraccion} onChange={(e) => setFormData(prev => ({ ...prev, infraccion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medida o Sanción Aplicada</label>
              <input type="text" value={formData.medida_sancion_aplicada} onChange={(e) => setFormData(prev => ({ ...prev, medida_sancion_aplicada: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo de Internamiento</label>
              <input type="text" value={formData.tiempo_internamiento} onChange={(e) => setFormData(prev => ({ ...prev, tiempo_internamiento: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Juzgado que conoce la causa</label>
              <input type="text" value={formData.juzgado_causa} onChange={(e) => setFormData(prev => ({ ...prev, juzgado_causa: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input type="text" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicilio</label>
              <input type="text" value={formData.domicilio} onChange={(e) => setFormData(prev => ({ ...prev, domicilio: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Periodo comprendido</label>
              <input type="text" value={formData.periodo_comprendido} onChange={(e) => setFormData(prev => ({ ...prev, periodo_comprendido: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Ej: Enero - Marzo 2024" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Elaboración de informe</label>
              <input type="date" value={formData.fecha_elaboracion} onChange={(e) => setFormData(prev => ({ ...prev, fecha_elaboracion: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        {/* SITUACIÓN ACTUAL */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">SITUACIÓN ACTUAL</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área Individual:</label>
              <textarea
                value={formData.area_individual}
                onChange={(e) => setFormData(prev => ({ ...prev, area_individual: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área de Convivencia Grupal</label>
              <textarea
                value={formData.area_convivencia_grupal}
                onChange={(e) => setFormData(prev => ({ ...prev, area_convivencia_grupal: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área Familiar</label>
              <textarea
                value={formData.area_familiar}
                onChange={(e) => setFormData(prev => ({ ...prev, area_familiar: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área Educativa</label>
              <textarea
                value={formData.area_educativa}
                onChange={(e) => setFormData(prev => ({ ...prev, area_educativa: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área de Salud</label>
              <textarea
                value={formData.area_salud}
                onChange={(e) => setFormData(prev => ({ ...prev, area_salud: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ACTITUD HACIA EL CUMPLIMIENTO DE LA SANCIÓN</h3>
          <textarea
            value={formData.actitud_cumplimiento_sancion}
            onChange={(e) => setFormData(prev => ({ ...prev, actitud_cumplimiento_sancion: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* VALORACIÓN TÉCNICA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">VALORACIÓN TÉCNICA</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pronóstico</label>
              <textarea
                value={formData.pronostico}
                onChange={(e) => setFormData(prev => ({ ...prev, pronostico: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recomendaciones</label>
              <textarea
                value={formData.recomendaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* MEDIOS DE VERIFICACIÓN */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">MEDIOS DE VERIFICACIÓN</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entrevista_avance}
                onChange={(e) => setFormData(prev => ({ ...prev, entrevista_avance: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Entrevista de avance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.expediente_administrativo}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_administrativo: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Expediente administrativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.expediente_medico}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_medico: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Expediente médico</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.expediente_educativo}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_educativo: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Expediente educativo</span>
            </label>
          </div>
        </div>

        {/* FIRMA */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">FIRMA</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trabajador/a Social - Nombre, firma y sello <span className="text-red-500">*</span>
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

