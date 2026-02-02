'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, Scale, Gavel } from 'lucide-react'
import Link from 'next/link'
import JovenSearchInput from '@/components/JovenSearchInput'

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
  procurador_legal: string
  
  // Datos judiciales
  fecha_vinculacion: string
  fecha_orden_ingreso: string
  orden_ingreso_requisitos: string
  infraccion_cometida: string
  juzgado_remitente: string
  nombre_judge: string
  autoridad_firma_orden: string
  expediente_judicial: string
  estado_legal: string
  medida_cautelar_sancion: string
  duracion_medida: string
  narracion_hechos: string
  
  // Asesoría legal brindada
  informar_situacion_juridica: boolean
  explicar_derechos_deberes: boolean
  asesorar_audiencias: boolean
  explicar_revision_medida: boolean
  explicar_importancia_participacion: boolean
  
  // Observaciones y recomendaciones
  observaciones: string
  recomendaciones: string
}

export default function DatosJudicialesPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    procurador_legal: '',
    fecha_vinculacion: '',
    fecha_orden_ingreso: '',
    orden_ingreso_requisitos: '',
    infraccion_cometida: '',
    juzgado_remitente: '',
    nombre_judge: '',
    autoridad_firma_orden: '',
    expediente_judicial: '',
    estado_legal: '',
    medida_cautelar_sancion: '',
    duracion_medida: '',
    narracion_hechos: '',
    informar_situacion_juridica: false,
    explicar_derechos_deberes: false,
    asesorar_audiencias: false,
    explicar_revision_medida: false,
    explicar_importancia_participacion: false,
    observaciones: '',
    recomendaciones: ''
  })

  useEffect(() => {
    loadJovenes()
  }, [])

  const loadJovenes = async () => {
    try {
      const { data, error } = await supabase
        .from('jovenes')
        .select('id, nombres, apellidos, fecha_nacimiento, edad')
        .eq('estado', 'activo')
        .order('nombres')

      if (error) throw error
      setJovenes(data || [])
    } catch (error) {
      console.error('Error loading jovenes:', error)
    }
  }

  const handleJovenChange = (jovenId: string) => {
    const joven = jovenes.find(j => j.id === jovenId)
    if (joven) {
      setFormData(prev => ({
        ...prev,
        joven_id: jovenId
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'datos_judiciales',
          joven_id: formData.joven_id,
          datos_json: formData,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Ficha de datos judiciales guardada exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar la ficha de datos judiciales')
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
            Ficha de Datos Judiciales
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Formulario de datos judiciales y asesoría legal
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
            <div>
              <JovenSearchInput
                value=""
                onChange={() => {}}
                onJovenSelect={(joven) => {
                  if (joven && joven.id) {
                    handleJovenChange(joven.id)
                  }
                }}
                label="Seleccionar Joven"
                required
                placeholder="Buscar joven por nombre..."
              />
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
                Procurador Legal *
              </label>
              <input
                type="text"
                value={formData.procurador_legal}
                onChange={(e) => setFormData(prev => ({ ...prev, procurador_legal: e.target.value }))}
                className="input-field"
                placeholder="Nombre del procurador legal"
                required
              />
            </div>
          </div>
        </div>

        {/* Datos Judiciales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              I. Datos Judiciales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.1 Fecha de Vinculación al Proceso Judicial
              </label>
              <input
                type="date"
                value={formData.fecha_vinculacion}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_vinculacion: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.2 Fecha de la Orden de Ingreso
              </label>
              <input
                type="date"
                value={formData.fecha_orden_ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_orden_ingreso: e.target.value }))}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.3 ¿Considera que el documento de la orden de ingreso contiene los requisitos mínimos de acuerdo a derecho y cuenta con toda la información necesaria? Especifique
              </label>
              <textarea
                value={formData.orden_ingreso_requisitos}
                onChange={(e) => setFormData(prev => ({ ...prev, orden_ingreso_requisitos: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="Describa si la orden de ingreso cumple con los requisitos legales..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.4 Infracción Cometida
              </label>
              <input
                type="text"
                value={formData.infraccion_cometida}
                onChange={(e) => setFormData(prev => ({ ...prev, infraccion_cometida: e.target.value }))}
                className="input-field"
                placeholder="Tipo de infracción cometida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.5 Juzgado Remitente
              </label>
              <input
                type="text"
                value={formData.juzgado_remitente}
                onChange={(e) => setFormData(prev => ({ ...prev, juzgado_remitente: e.target.value }))}
                className="input-field"
                placeholder="Nombre del juzgado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.6 Nombre del/la Juez/a que Conoce la Causa
              </label>
              <input
                type="text"
                value={formData.nombre_judge}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_judge: e.target.value }))}
                className="input-field"
                placeholder="Nombre del juez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.7 Nombre y Cargo de la Autoridad que Firma la Orden de Ingreso al PMSPL
              </label>
              <input
                type="text"
                value={formData.autoridad_firma_orden}
                onChange={(e) => setFormData(prev => ({ ...prev, autoridad_firma_orden: e.target.value }))}
                className="input-field"
                placeholder="Nombre y cargo de la autoridad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.8 No. Expediente Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))}
                className="input-field"
                placeholder="Número de expediente judicial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.9 Estado Legal
              </label>
              <select
                value={formData.estado_legal}
                onChange={(e) => setFormData(prev => ({ ...prev, estado_legal: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Cautelar">Cautelar</option>
                <option value="Sancionado">Sancionado</option>
                <option value="Reglas de Cumplimiento">Reglas de Cumplimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.10 Medida Cautelar, Sanción o Reglas de Cumplimiento Impuestas
              </label>
              <input
                type="text"
                value={formData.medida_cautelar_sancion}
                onChange={(e) => setFormData(prev => ({ ...prev, medida_cautelar_sancion: e.target.value }))}
                className="input-field"
                placeholder="Tipo de medida impuesta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.11 Duración de la Medida
              </label>
              <input
                type="text"
                value={formData.duracion_medida}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion_medida: e.target.value }))}
                className="input-field"
                placeholder="Duración de la medida"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1.12 Breve Narración de los Hechos por parte del NNAJ (Si dan su consentimiento)
              </label>
              <textarea
                value={formData.narracion_hechos}
                onChange={(e) => setFormData(prev => ({ ...prev, narracion_hechos: e.target.value }))}
                className="input-field"
                rows={4}
                placeholder="Narración de los hechos por parte del joven..."
              />
            </div>
          </div>
        </div>

        {/* Asesoría Legal Brindada al NNAJ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Gavel className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              II. Asesoría Legal Brindada al NNAJ
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.informar_situacion_juridica}
                  onChange={(e) => setFormData(prev => ({ ...prev, informar_situacion_juridica: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Informar y explicar al NNAJ, de forma comprensible, su situación jurídica y el alcance de la medida</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.explicar_derechos_deberes}
                  onChange={(e) => setFormData(prev => ({ ...prev, explicar_derechos_deberes: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Explicarle sus derechos y deberes como usuario del programa</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.asesorar_audiencias}
                  onChange={(e) => setFormData(prev => ({ ...prev, asesorar_audiencias: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Asesorar al NNA acerca de las audiencias que tendrá durante todo el proceso</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.explicar_revision_medida}
                  onChange={(e) => setFormData(prev => ({ ...prev, explicar_revision_medida: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Explicar al NNA el beneficio de la revisión de la medida</span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.explicar_importancia_participacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, explicar_importancia_participacion: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Explicarle la importancia de participar en todas las actividades que se desarrollan en el PMSPL</span>
              </label>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            III. Observaciones
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Observaciones adicionales sobre el caso judicial..."
            />
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            IV. Recomendaciones
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recomendaciones
            </label>
            <textarea
              value={formData.recomendaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Recomendaciones para el caso judicial..."
            />
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
            {loading ? 'Guardando...' : 'Guardar Datos Judiciales'}
          </button>
        </div>
      </form>
    </div>
  )
}