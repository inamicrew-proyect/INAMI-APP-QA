'use client'

import { actualizarAtencionYFormularioJson } from '@/lib/formulario-atencion-update'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeIncidenciasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const atencionIdEdicion = searchParams.get('atencion_id')
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [fichaEncontrada, setFichaEncontrada] = useState<boolean | null>(null)
  
  const [formData, setFormData] = useState({
    joven_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    trabajador_social: '',
    
    // DATOS DEL CASO
    nombre_completo_nnaj: '',
    medida: '',
    expediente_interno: '',
    expediente_judicial: '',
    
    // SITUACIÓN PRESENTADA
    situacion_presentada: '',
    
    // ACCIONES REALIZADAS
    acciones_realizadas: '',
    
    // RECOMENDACIONES
    recomendaciones: '',
    
    // MEDIOS DE VERIFICACIÓN
    medios_verificacion: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const loadExisting = async () => {
      if (!atencionIdEdicion) {
        setFichaEncontrada(false)
        return
      }
      try {
        setLoadingExisting(true)
        setFichaEncontrada(null)
        const { data, error } = await supabase
          .from('formularios_atencion')
          .select('datos_json, joven_id')
          .eq('atencion_id', atencionIdEdicion)
          .eq('tipo_formulario', 'informe_incidencias')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)
        if (!data?.datos_json) {
          setFichaEncontrada(false)
          return
        }

        const raw = data.datos_json as Record<string, unknown>
        const datosCaso = raw.datos_caso as Record<string, string> | undefined
        if (datosCaso) {
          setFormData((prev) => ({
            ...prev,
            joven_id: (typeof raw.joven_id === 'string' ? raw.joven_id : data.joven_id) || prev.joven_id,
            nombre_completo_nnaj: datosCaso.nombre_completo_nnaj ?? prev.nombre_completo_nnaj,
            medida: datosCaso.medida ?? prev.medida,
            expediente_interno: datosCaso.expediente_interno ?? prev.expediente_interno,
            expediente_judicial: datosCaso.expediente_judicial ?? prev.expediente_judicial,
            situacion_presentada: (raw.situacion_presentada as string) ?? prev.situacion_presentada,
            acciones_realizadas: (raw.acciones_realizadas as string) ?? prev.acciones_realizadas,
            recomendaciones: (raw.recomendaciones as string) ?? prev.recomendaciones,
            medios_verificacion: Array.isArray(raw.medios_verificacion)
              ? (raw.medios_verificacion as string[])
              : prev.medios_verificacion,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            ...(raw as Record<string, unknown>),
            joven_id: (typeof raw.joven_id === 'string' ? raw.joven_id : data.joven_id) || prev.joven_id,
            medios_verificacion: Array.isArray(raw.medios_verificacion)
              ? (raw.medios_verificacion as string[])
              : prev.medios_verificacion,
          }))
        }
        setFichaEncontrada(true)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        alert(`Error al cargar la ficha para edición: ${msg}`)
        router.push(`/dashboard/atenciones/${atencionIdEdicion}`)
      } finally {
        setLoadingExisting(false)
      }
    }
    void loadExisting()
  }, [atencionIdEdicion, router])

  const loadData = async () => {
    try {
      // Obtener el usuario actual (trabajador social)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setFormData(prev => ({ ...prev, trabajador_social: profile.full_name }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) newErrors.joven_id = 'Debe seleccionar un joven'
    if (!formData.nombre_completo_nnaj.trim()) newErrors.nombre_completo_nnaj = 'El nombre del NNAJ es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const { data: tipoAtencion } = await supabase
        .from('tipos_atencion')
        .select('id')
        .eq('profesional_responsable', 'trabajador_social')
        .limit(1)
        .maybeSingle()

      let tipoAtencionId = tipoAtencion?.id
      if (!tipoAtencionId) {
        const { data: anyTipo } = await supabase.from('tipos_atencion').select('id').limit(1).maybeSingle()
        tipoAtencionId = anyTipo?.id
      }
      if (!tipoAtencionId) throw new Error('No se encontró ningún tipo de atención en la base de datos.')

      const datosJson = {
        tipo_formulario: 'informe_incidencias',
        datos_caso: {
          nombre_completo_nnaj: formData.nombre_completo_nnaj,
          medida: formData.medida,
          expediente_interno: formData.expediente_interno,
          expediente_judicial: formData.expediente_judicial,
        },
        situacion_presentada: formData.situacion_presentada,
        acciones_realizadas: formData.acciones_realizadas,
        recomendaciones: formData.recomendaciones,
        medios_verificacion: formData.medios_verificacion,
      }

      if (atencionIdEdicion && fichaEncontrada === true) {
        await actualizarAtencionYFormularioJson(supabase, {
          atencionId: atencionIdEdicion,
          tipoFormulario: 'informe_incidencias',
          jovenId: formData.joven_id,
          tipoAtencionId: tipoAtencionId,
          datosJson: datosJson as Record<string, unknown>,
        })
        alert('Informe de Incidencias actualizado exitosamente')
        router.push(`/dashboard/atenciones/${atencionIdEdicion}`)
        return
      }

      if (atencionIdEdicion && fichaEncontrada === false) {
        const { error: attUpdErr } = await supabase
          .from('atenciones')
          .update({
            joven_id: formData.joven_id,
            tipo_atencion_id: tipoAtencionId,
            profesional_id: user.id,
          })
          .eq('id', atencionIdEdicion)
        if (attUpdErr) throw attUpdErr
        const { error: formularioError } = await supabase.from('formularios_atencion').insert({
          tipo_formulario: 'informe_incidencias',
          joven_id: formData.joven_id,
          atencion_id: atencionIdEdicion,
          datos_json: datosJson,
        })
        if (formularioError) throw formularioError
        alert('Informe de Incidencias registrado exitosamente')
        router.push(`/dashboard/atenciones/${atencionIdEdicion}`)
        return
      }

      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: tipoAtencionId,
          profesional_id: user.id,
          fecha_atencion: new Date().toISOString(),
          motivo: 'Informe de Incidencias',
          observaciones: formData.situacion_presentada,
          estado: 'completada',
        })
        .select()

      if (atencionError) throw atencionError

      if (atencionData?.[0]) {
        const { error: formularioError } = await supabase.from('formularios_atencion').insert({
          tipo_formulario: 'informe_incidencias',
          joven_id: formData.joven_id,
          atencion_id: atencionData[0].id,
          datos_json: datosJson,
        })

        if (formularioError) throw formularioError
      }

      alert('Informe de Incidencias registrado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error) {
      console.error('Error creating formulario:', error)
      alert('Error al registrar el informe. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof typeof formData] as string[]
    if (checked) {
      handleInputChange(field, [...currentValues, value])
    } else {
      handleInputChange(field, currentValues.filter(v => v !== value))
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">INFORME DE INCIDENCIAS</h1>
          <p className="text-gray-600 mt-2">Área de Trabajo Social - PMSPL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información del Informe</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <JovenSearchInput
                value={formData.nombre_completo_nnaj}
                onChange={(value) => handleInputChange('nombre_completo_nnaj', value)}
                onJovenSelect={(joven) => {
                  if (joven.id) {
                    handleInputChange('joven_id', joven.id)
                    handleInputChange('nombre_completo_nnaj', `${joven.nombres} ${joven.apellidos}`)
                    handleInputChange('expediente_interno', joven.expediente_administrativo || '')
                    handleInputChange('expediente_judicial', joven.expediente_judicial || '')
                  }
                }}
                label="Joven"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.joven_id || errors.nombre_completo_nnaj}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Elaboración
              </label>
              <input
                type="date"
                value={formData.fecha_elaboracion}
                onChange={(e) => handleInputChange('fecha_elaboracion', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trabajador/a Social
              </label>
              <input
                type="text"
                value={formData.trabajador_social}
                onChange={(e) => handleInputChange('trabajador_social', e.target.value)}
                className="input-field"
                placeholder="Nombre del trabajador social"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* DATOS DEL CASO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Datos del Caso</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medida
              </label>
              <input
                type="text"
                value={formData.medida}
                onChange={(e) => handleInputChange('medida', e.target.value)}
                className="input-field"
                placeholder="Medida aplicada"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expediente Interno
              </label>
              <input
                type="text"
                value={formData.expediente_interno}
                onChange={(e) => handleInputChange('expediente_interno', e.target.value)}
                className="input-field"
                placeholder="Expediente interno"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expediente Judicial No.
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => handleInputChange('expediente_judicial', e.target.value)}
                className="input-field"
                placeholder="Expediente judicial"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* SITUACIÓN PRESENTADA */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Situación Presentada</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Situación Presentada
            </label>
            <textarea
              value={formData.situacion_presentada}
              onChange={(e) => handleInputChange('situacion_presentada', e.target.value)}
              className="input-field"
              rows={8}
              placeholder="Describir detalladamente la situación presentada"
            />
          </div>
        </div>

        {/* ACCIONES REALIZADAS */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones Realizadas</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acciones Realizadas
            </label>
            <textarea
              value={formData.acciones_realizadas}
              onChange={(e) => handleInputChange('acciones_realizadas', e.target.value)}
              className="input-field"
              rows={6}
              placeholder="Describir las acciones realizadas para abordar la situación"
            />
          </div>
        </div>

        {/* RECOMENDACIONES */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recomendaciones</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recomendaciones
            </label>
            <textarea
              value={formData.recomendaciones}
              onChange={(e) => handleInputChange('recomendaciones', e.target.value)}
              className="input-field"
              rows={6}
              placeholder="Describir las recomendaciones para el caso"
            />
          </div>
        </div>

        {/* MEDIOS DE VERIFICACIÓN */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Medios de Verificación</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Medios de Verificación
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Testimonios', 'Informes', 'Hojas de faltas', 'Libro de novedades', 'Otros'].map((opcion) => (
                <div key={opcion} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.medios_verificacion.includes(opcion)}
                    onChange={(e) => handleCheckboxChange('medios_verificacion', opcion, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{opcion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              loadingExisting ||
              (Boolean(atencionIdEdicion) && fichaEncontrada === null)
            }
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Informe de Incidencias'}
          </button>
        </div>
      </form>
    </div>
  )
}
