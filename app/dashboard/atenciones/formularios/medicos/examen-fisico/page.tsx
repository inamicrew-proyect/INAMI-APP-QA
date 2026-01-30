'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, FileText, Heart, Activity } from 'lucide-react'
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
  fecha_examen: string
  medico_nombre: string
  medico_colegiacion: string
  
  // Signos vitales
  frecuencia_respiratoria: number
  frecuencia_cardiaca: number
  presion_arterial: string
  saturacion_oxigeno: number
  temperatura: number
  talla: number
  peso: number
  imc: number
  
  // Examen neurológico
  examen_neurologico: string
  
  // Revisión por sistemas
  snc: string
  cabeza: string
  ojos: string
  nariz: string
  boca: string
  oidos: string
  cuello: string
  torax: string
  pulmonar: string
  corazon: string
  abdomen: string
  genitales: string
  extremidades: string
  piel_faneras: string
  hemodinamia: string
  
  // Diagnóstico
  diagnostico: string[]
  
  // Indicaciones médicas
  indicaciones_medicas: string[]
  
  // Lesiones corporales
  tiene_lesiones: boolean
  descripcion_lesiones: string
  
  // Observaciones
  observaciones: string
}

export default function ExamenFisicoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    fecha_examen: new Date().toISOString().split('T')[0],
    medico_nombre: '',
    medico_colegiacion: '',
    frecuencia_respiratoria: 0,
    frecuencia_cardiaca: 0,
    presion_arterial: '',
    saturacion_oxigeno: 0,
    temperatura: 0,
    talla: 0,
    peso: 0,
    imc: 0,
    examen_neurologico: '',
    snc: '',
    cabeza: '',
    ojos: '',
    nariz: '',
    boca: '',
    oidos: '',
    cuello: '',
    torax: '',
    pulmonar: '',
    corazon: '',
    abdomen: '',
    genitales: '',
    extremidades: '',
    piel_faneras: '',
    hemodinamia: '',
    diagnostico: [],
    indicaciones_medicas: [],
    tiene_lesiones: false,
    descripcion_lesiones: '',
    observaciones: ''
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

  const calculateIMC = () => {
    if (formData.peso > 0 && formData.talla > 0) {
      const imc = formData.peso / (formData.talla * formData.talla)
      setFormData(prev => ({ ...prev, imc: Math.round(imc * 100) / 100 }))
    }
  }

  useEffect(() => {
    calculateIMC()
  }, [formData.peso, formData.talla])

  const addDiagnostico = () => {
    setFormData(prev => ({
      ...prev,
      diagnostico: [...prev.diagnostico, '']
    }))
  }

  const updateDiagnostico = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      diagnostico: prev.diagnostico.map((item, i) => i === index ? value : item)
    }))
  }

  const removeDiagnostico = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnostico: prev.diagnostico.filter((_, i) => i !== index)
    }))
  }

  const addIndicacionMedica = () => {
    setFormData(prev => ({
      ...prev,
      indicaciones_medicas: [...prev.indicaciones_medicas, '']
    }))
  }

  const updateIndicacionMedica = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      indicaciones_medicas: prev.indicaciones_medicas.map((item, i) => i === index ? value : item)
    }))
  }

  const removeIndicacionMedica = (index: number) => {
    setFormData(prev => ({
      ...prev,
      indicaciones_medicas: prev.indicaciones_medicas.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('formularios_atencion')
        .insert({
          tipo_formulario: 'examen_fisico',
          joven_id: formData.joven_id,
          datos_json: formData,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Examen físico guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar el examen físico')
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
            Examen Físico
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Formulario de examen físico médico
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Joven *
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleJovenChange(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Seleccionar joven</option>
                {jovenes.map(joven => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha del Examen *
              </label>
              <input
                type="date"
                value={formData.fecha_examen}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_examen: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Médico que realiza el Examen *
              </label>
              <input
                type="text"
                value={formData.medico_nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, medico_nombre: e.target.value }))}
                className="input-field"
                placeholder="Nombre del médico"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Colegiación #
              </label>
              <input
                type="text"
                value={formData.medico_colegiacion}
                onChange={(e) => setFormData(prev => ({ ...prev, medico_colegiacion: e.target.value }))}
                className="input-field"
                placeholder="Número de colegiación"
              />
            </div>
          </div>
        </div>

        {/* Signos Vitales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Signos Vitales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                FR (rpm)
              </label>
              <input
                type="number"
                value={formData.frecuencia_respiratoria}
                onChange={(e) => setFormData(prev => ({ ...prev, frecuencia_respiratoria: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="18"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                FC (lpm)
              </label>
              <input
                type="number"
                value={formData.frecuencia_cardiaca}
                onChange={(e) => setFormData(prev => ({ ...prev, frecuencia_cardiaca: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="95"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                P/A (mmHg)
              </label>
              <input
                type="text"
                value={formData.presion_arterial}
                onChange={(e) => setFormData(prev => ({ ...prev, presion_arterial: e.target.value }))}
                className="input-field"
                placeholder="110/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SatO2 (%)
              </label>
              <input
                type="number"
                value={formData.saturacion_oxigeno}
                onChange={(e) => setFormData(prev => ({ ...prev, saturacion_oxigeno: parseInt(e.target.value) || 0 }))}
                className="input-field"
                placeholder="99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temp. (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperatura}
                onChange={(e) => setFormData(prev => ({ ...prev, temperatura: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                placeholder="37"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Talla (mts)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.talla}
                onChange={(e) => setFormData(prev => ({ ...prev, talla: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                placeholder="1.61"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso (Kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={(e) => setFormData(prev => ({ ...prev, peso: parseFloat(e.target.value) || 0 }))}
                className="input-field"
                placeholder="52"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IMC
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.imc}
                readOnly
                className="input-field bg-gray-100"
                placeholder="Calculado automáticamente"
              />
            </div>
          </div>
        </div>

        {/* Examen Neurológico */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Examen Neurológico
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Examen Neurológico
            </label>
            <textarea
              value={formData.examen_neurologico}
              onChange={(e) => setFormData(prev => ({ ...prev, examen_neurologico: e.target.value }))}
              className="input-field"
              rows={3}
              placeholder="GLASGOW 15/15, CONSCIENTE LÚCIDO ORIENTADO, SIN DETERIORO NEUROLÓGICO"
            />
          </div>
        </div>

        {/* Revisión por Sistemas */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Revisión por Sistemas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SNC
              </label>
              <input
                type="text"
                value={formData.snc}
                onChange={(e) => setFormData(prev => ({ ...prev, snc: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cabeza
              </label>
              <input
                type="text"
                value={formData.cabeza}
                onChange={(e) => setFormData(prev => ({ ...prev, cabeza: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ojos
              </label>
              <input
                type="text"
                value={formData.ojos}
                onChange={(e) => setFormData(prev => ({ ...prev, ojos: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nariz
              </label>
              <input
                type="text"
                value={formData.nariz}
                onChange={(e) => setFormData(prev => ({ ...prev, nariz: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Boca
              </label>
              <input
                type="text"
                value={formData.boca}
                onChange={(e) => setFormData(prev => ({ ...prev, boca: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Oídos
              </label>
              <input
                type="text"
                value={formData.oidos}
                onChange={(e) => setFormData(prev => ({ ...prev, oidos: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cuello
              </label>
              <input
                type="text"
                value={formData.cuello}
                onChange={(e) => setFormData(prev => ({ ...prev, cuello: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tórax
              </label>
              <input
                type="text"
                value={formData.torax}
                onChange={(e) => setFormData(prev => ({ ...prev, torax: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pulmonar
              </label>
              <input
                type="text"
                value={formData.pulmonar}
                onChange={(e) => setFormData(prev => ({ ...prev, pulmonar: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Corazón
              </label>
              <input
                type="text"
                value={formData.corazon}
                onChange={(e) => setFormData(prev => ({ ...prev, corazon: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Abdomen
              </label>
              <input
                type="text"
                value={formData.abdomen}
                onChange={(e) => setFormData(prev => ({ ...prev, abdomen: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genitales
              </label>
              <input
                type="text"
                value={formData.genitales}
                onChange={(e) => setFormData(prev => ({ ...prev, genitales: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extremidades
              </label>
              <input
                type="text"
                value={formData.extremidades}
                onChange={(e) => setFormData(prev => ({ ...prev, extremidades: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Piel y Faneras
              </label>
              <input
                type="text"
                value={formData.piel_faneras}
                onChange={(e) => setFormData(prev => ({ ...prev, piel_faneras: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hemodinamia
              </label>
              <input
                type="text"
                value={formData.hemodinamia}
                onChange={(e) => setFormData(prev => ({ ...prev, hemodinamia: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Diagnóstico
            </h2>
            <button
              type="button"
              onClick={addDiagnostico}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Agregar Diagnóstico
            </button>
          </div>

          {formData.diagnostico.map((diagnostico, index) => (
            <div key={index} className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {index + 1}.
              </span>
              <input
                type="text"
                value={diagnostico}
                onChange={(e) => updateDiagnostico(index, e.target.value)}
                className="input-field flex-1"
                placeholder="Ingrese el diagnóstico"
              />
              <button
                type="button"
                onClick={() => removeDiagnostico(index)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {/* Indicaciones Médicas */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Indicaciones Médicas
            </h2>
            <button
              type="button"
              onClick={addIndicacionMedica}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Agregar Indicación
            </button>
          </div>

          {formData.indicaciones_medicas.map((indicacion, index) => (
            <div key={index} className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {index + 1}.
              </span>
              <input
                type="text"
                value={indicacion}
                onChange={(e) => updateIndicacionMedica(index, e.target.value)}
                className="input-field flex-1"
                placeholder="Ingrese la indicación médica"
              />
              <button
                type="button"
                onClick={() => removeIndicacionMedica(index)}
                className="text-red-600 hover:text-red-800 p-2"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>

        {/* Lesiones Corporales */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Lesiones Corporales
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="lesiones"
                  checked={formData.tiene_lesiones === true}
                  onChange={() => setFormData(prev => ({ ...prev, tiene_lesiones: true }))}
                  className="form-radio"
                />
                <span>Sí</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="lesiones"
                  checked={formData.tiene_lesiones === false}
                  onChange={() => setFormData(prev => ({ ...prev, tiene_lesiones: false }))}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>

            {formData.tiene_lesiones && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción de las lesiones
                </label>
                <textarea
                  value={formData.descripcion_lesiones}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion_lesiones: e.target.value }))}
                  className="input-field"
                  rows={4}
                  placeholder="Describa las lesiones encontradas..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Observaciones
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              className="input-field"
              rows={4}
              placeholder="Observaciones adicionales del examen..."
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
            {loading ? 'Guardando...' : 'Guardar Examen Físico'}
          </button>
        </div>
      </form>
    </div>
  )
}