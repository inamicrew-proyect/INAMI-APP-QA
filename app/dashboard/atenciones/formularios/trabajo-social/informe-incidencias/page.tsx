'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

export default function InformeIncidenciasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [jovenes, setJovenes] = useState<Joven[]>([])
  
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

  const loadData = async () => {
    try {
      // Cargar jóvenes activos
      const { data: jovenesData, error: jovenesError } = await supabase
        .from('jovenes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombres')

      if (jovenesError) throw jovenesError

      setJovenes(jovenesData || [])

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
      // Obtener el usuario actual (trabajador social)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Crear la atención de trabajo social
      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .insert({
          joven_id: formData.joven_id,
          tipo_atencion_id: 'trabajador_social',
          profesional_id: user.id,
          fecha_atencion: new Date().toISOString(),
          motivo: 'Informe de Incidencias',
          observaciones: formData.situacion_presentada,
          estado: 'completada'
        })
        .select()

      if (atencionError) throw atencionError

      // Guardar el formulario específico
      if (atencionData?.[0]) {
        const { error: formularioError } = await supabase
          .from('formularios_atencion')
          .insert({
            atencion_id: atencionData[0].id,
            datos_json: {
              tipo_formulario: 'informe_incidencias',
              datos_caso: {
                nombre_completo_nnaj: formData.nombre_completo_nnaj,
                medida: formData.medida,
                expediente_interno: formData.expediente_interno,
                expediente_judicial: formData.expediente_judicial
              },
              situacion_presentada: formData.situacion_presentada,
              acciones_realizadas: formData.acciones_realizadas,
              recomendaciones: formData.recomendaciones,
              medios_verificacion: formData.medios_verificacion
            }
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
            disabled={loading}
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
