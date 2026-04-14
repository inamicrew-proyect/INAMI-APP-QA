'use client'

import { actualizarAtencionYFormularioJson } from '@/lib/formulario-atencion-update'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Heart, User, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Joven } from '@/lib/supabase'
import JovenSearchInput from '@/components/JovenSearchInput'

function InformeSeguimientoSaludForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const atencionIdEdicion = searchParams.get('atencion_id')
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [fichaEncontrada, setFichaEncontrada] = useState<boolean | null>(() =>
    searchParams.get('atencion_id') ? null : false
  )
  const [loading, setLoading] = useState(false)
  const [jovenes, setJovenes] = useState<Joven[]>([])
  
  const [formData, setFormData] = useState({
    joven_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    
    // DATOS GENERALES DEL NNAJ
    nombre_nnaj: '',
    edad: '',
    centro_pedagogico: '',
    fecha: new Date().toISOString().split('T')[0],
    
    // ESTADO NUTRICIONAL Y DE SALUD ACTUAL
    peso: '',
    talla: '',
    imc: '',
    estado_salud_actual: '',
    
    // INFORMACIÓN COMPLEMENTARIA
    informacion_complementaria: '',
    
    // RESULTADOS DE LABORATORIO CLÍNICO
    resultados_laboratorio: '',
    
    // REFERENCIAS Y DIAGNÓSTICO ESPECIALIZADO
    referencias_diagnostico: '',
    
    // DIAGNÓSTICO ODONTOLÓGICO
    diagnostico_odontologico: '',
    
    // FIRMA
    firma_medico: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const loadExisting = async () => {
      if (!atencionIdEdicion) {
        setFichaEncontrada(false)
        setLoadingExisting(false)
        return
      }
      try {
        setLoadingExisting(true)
        setFichaEncontrada(null)
        const { data, error } = await supabase
          .from('formularios_atencion')
          .select('datos_json, joven_id')
          .eq('atencion_id', atencionIdEdicion)
          .eq('tipo_formulario', 'informe_seguimiento_salud')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw new Error(error.message)
        if (!data?.datos_json) {
          setFichaEncontrada(false)
          return
        }

        const raw = data.datos_json as Record<string, unknown>
        const dg = raw.datos_generales as Record<string, string> | undefined
        const en = raw.estado_nutricional as Record<string, string> | undefined
        const es = raw.estado_salud as Record<string, string> | undefined
        const lab = raw.laboratorio as Record<string, string> | undefined
        const ref = raw.referencias as Record<string, string> | undefined
        const odo = raw.odontologia as Record<string, string> | undefined
        const fir = raw.firma as Record<string, string> | undefined

        if (dg) {
          setFormData((prev) => ({
            ...prev,
            joven_id: (typeof raw.joven_id === 'string' ? raw.joven_id : data.joven_id) || prev.joven_id,
            nombre_nnaj: dg.nombre_nnaj ?? prev.nombre_nnaj,
            edad: dg.edad ?? prev.edad,
            centro_pedagogico: dg.centro_pedagogico ?? prev.centro_pedagogico,
            fecha: dg.fecha ?? prev.fecha,
            peso: en?.peso ?? prev.peso,
            talla: en?.talla ?? prev.talla,
            imc: en?.imc ?? prev.imc,
            estado_salud_actual: es?.estado_salud_actual ?? prev.estado_salud_actual,
            informacion_complementaria: es?.informacion_complementaria ?? prev.informacion_complementaria,
            resultados_laboratorio: lab?.resultados_laboratorio ?? prev.resultados_laboratorio,
            referencias_diagnostico: ref?.referencias_diagnostico ?? prev.referencias_diagnostico,
            diagnostico_odontologico: odo?.diagnostico_odontologico ?? prev.diagnostico_odontologico,
            firma_medico: fir?.firma_medico ?? prev.firma_medico,
          }))
        } else {
          setFormData((prev) => ({
            ...prev,
            ...(raw as Record<string, unknown>),
            joven_id: (typeof raw.joven_id === 'string' ? raw.joven_id : data.joven_id) || prev.joven_id,
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
      // Obtener el usuario actual (médico)
      // Cargar jóvenes activos
      const { data: jovenesData, error: jovenesError } = await supabase
        .from('jovenes')
        .select('*')
        .eq('estado', 'activo')
        .order('nombres')

      if (jovenesError) throw jovenesError

      setJovenes(jovenesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.joven_id) newErrors.joven_id = 'Debe seleccionar un joven'
    if (!formData.nombre_nnaj.trim()) newErrors.nombre_nnaj = 'El nombre es requerido'
    if (!formData.estado_salud_actual.trim()) newErrors.estado_salud_actual = 'El estado de salud actual es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateIMC = () => {
    const peso = parseFloat(formData.peso)
    const talla = parseFloat(formData.talla)
    
    if (peso && talla && talla > 0) {
      const imc = peso / (talla * talla)
      setFormData(prev => ({ ...prev, imc: imc.toFixed(2) }))
    }
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
        .eq('profesional_responsable', 'medico')
        .limit(1)
        .maybeSingle()

      let tipoAtencionId = tipoAtencion?.id
      if (!tipoAtencionId) {
        const { data: anyTipo } = await supabase.from('tipos_atencion').select('id').limit(1).maybeSingle()
        tipoAtencionId = anyTipo?.id
      }
      if (!tipoAtencionId) throw new Error('No se encontró ningún tipo de atención en la base de datos.')

      const datosJson = {
        tipo_formulario: 'informe_seguimiento_salud',
        datos_generales: {
          nombre_nnaj: formData.nombre_nnaj,
          edad: formData.edad,
          centro_pedagogico: formData.centro_pedagogico,
          fecha: formData.fecha,
        },
        estado_nutricional: {
          peso: formData.peso,
          talla: formData.talla,
          imc: formData.imc,
        },
        estado_salud: {
          estado_salud_actual: formData.estado_salud_actual,
          informacion_complementaria: formData.informacion_complementaria,
        },
        laboratorio: {
          resultados_laboratorio: formData.resultados_laboratorio,
        },
        referencias: {
          referencias_diagnostico: formData.referencias_diagnostico,
        },
        odontologia: {
          diagnostico_odontologico: formData.diagnostico_odontologico,
        },
        firma: {
          firma_medico: formData.firma_medico,
        },
      }

      if (atencionIdEdicion && fichaEncontrada === true) {
        await actualizarAtencionYFormularioJson(supabase, {
          atencionId: atencionIdEdicion,
          tipoFormulario: 'informe_seguimiento_salud',
          jovenId: formData.joven_id,
          tipoAtencionId: tipoAtencionId,
          datosJson: datosJson as Record<string, unknown>,
        })
        alert('Informe Médico de Seguimiento actualizado exitosamente')
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
          tipo_formulario: 'informe_seguimiento_salud',
          joven_id: formData.joven_id,
          atencion_id: atencionIdEdicion,
          datos_json: datosJson,
        })
        if (formularioError) throw formularioError
        alert('Informe Médico de Seguimiento registrado exitosamente')
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
          motivo: 'Informe Médico de Seguimiento',
          observaciones: formData.estado_salud_actual,
          estado: 'completada',
        })
        .select()

      if (atencionError) throw atencionError

      if (atencionData?.[0]) {
        const { error: formularioError } = await supabase.from('formularios_atencion').insert({
          tipo_formulario: 'informe_seguimiento_salud',
          joven_id: formData.joven_id,
          atencion_id: atencionData[0].id,
          datos_json: datosJson,
        })

        if (formularioError) throw formularioError
      }

      alert('Informe Médico de Seguimiento registrado exitosamente')
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
          <h1 className="text-3xl font-bold text-gray-900">INFORME MÉDICO DE SEGUIMIENTO</h1>
          <p className="text-gray-600 mt-2">Departamento de Salud y Bienestar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información Básica</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Joven *
              </label>
              <select
                value={formData.joven_id}
                onChange={(e) => handleInputChange('joven_id', e.target.value)}
                className={`input-field ${errors.joven_id ? 'border-red-500' : ''}`}
              >
                <option value="">Seleccionar joven</option>
                {jovenes.map((joven) => (
                  <option key={joven.id} value={joven.id}>
                    {joven.nombres} {joven.apellidos}
                  </option>
                ))}
              </select>
              {errors.joven_id && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.joven_id}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médico Responsable
              </label>
              <input
                type="text"
                value="Dr. [Nombre del Médico]"
                className="input-field bg-gray-100"
                disabled
                placeholder="Médico logueado"
              />
              <p className="text-sm text-gray-500 mt-1">Se registra automáticamente el médico que está logueado</p>
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
          </div>
        </div>

        {/* DATOS GENERALES DEL NNAJ */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">DATOS GENERALES DEL NNAJ</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <JovenSearchInput
                value={formData.nombre_nnaj}
                onChange={(value) => handleInputChange('nombre_nnaj', value)}
                onJovenSelect={(joven) => {
                  if (joven.id) {
                    handleInputChange('nombre_nnaj', `${joven.nombres} ${joven.apellidos}`)
                    handleInputChange('edad', joven.edad?.toString() || '')
                    handleInputChange('joven_id', joven.id)
                  }
                }}
                label="Nombre NNAJ"
                required
                placeholder="Buscar joven por nombre..."
                error={errors.nombre_nnaj}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                className="input-field"
                placeholder="Edad en años"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centro Pedagógico de Internamiento
              </label>
              <input
                type="text"
                value={formData.centro_pedagogico}
                onChange={(e) => handleInputChange('centro_pedagogico', e.target.value)}
                className="input-field"
                placeholder="Nombre del centro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* ESTADO NUTRICIONAL Y DE SALUD ACTUAL */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">ESTADO NUTRICIONAL Y DE SALUD ACTUAL</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (Kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={(e) => {
                  handleInputChange('peso', e.target.value)
                  calculateIMC()
                }}
                className="input-field"
                placeholder="Peso en kilogramos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Talla (m)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.talla}
                onChange={(e) => {
                  handleInputChange('talla', e.target.value)
                  calculateIMC()
                }}
                className="input-field"
                placeholder="Talla en metros"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMC (Kg/m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.imc}
                onChange={(e) => handleInputChange('imc', e.target.value)}
                className="input-field"
                placeholder="Índice de Masa Corporal"
                readOnly
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Salud Actual *
              </label>
              <textarea
                value={formData.estado_salud_actual}
                onChange={(e) => handleInputChange('estado_salud_actual', e.target.value)}
                className={`input-field ${errors.estado_salud_actual ? 'border-red-500' : ''}`}
                rows={4}
                placeholder="Descripción detallada del estado de salud actual"
              />
              {errors.estado_salud_actual && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.estado_salud_actual}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* INFORMACIÓN COMPLEMENTARIA */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">INFORMACIÓN COMPLEMENTARIA</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Información Complementaria
            </label>
            <textarea
              value={formData.informacion_complementaria}
              onChange={(e) => handleInputChange('informacion_complementaria', e.target.value)}
              className="input-field"
              rows={5}
              placeholder="Información adicional relevante para el seguimiento médico"
            />
          </div>
        </div>

        {/* RESULTADOS DE LABORATORIO CLÍNICO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">RESULTADOS DE LABORATORIO CLÍNICO</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultados de Laboratorio Clínico
            </label>
            <textarea
              value={formData.resultados_laboratorio}
              onChange={(e) => handleInputChange('resultados_laboratorio', e.target.value)}
              className="input-field"
              rows={5}
              placeholder="Resultados de análisis de laboratorio realizados"
            />
          </div>
        </div>

        {/* REFERENCIAS Y DIAGNÓSTICO ESPECIALIZADO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">REFERENCIAS Y DIAGNÓSTICO ESPECIALIZADO</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencias y Diagnóstico Especializado
            </label>
            <textarea
              value={formData.referencias_diagnostico}
              onChange={(e) => handleInputChange('referencias_diagnostico', e.target.value)}
              className="input-field"
              rows={5}
              placeholder="Referencias a especialistas y diagnósticos especializados"
            />
          </div>
        </div>

        {/* DIAGNÓSTICO ODONTOLÓGICO */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">DIAGNÓSTICO ODONTOLÓGICO</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnóstico Odontológico
            </label>
            <textarea
              value={formData.diagnostico_odontologico}
              onChange={(e) => handleInputChange('diagnostico_odontologico', e.target.value)}
              className="input-field"
              rows={5}
              placeholder="Diagnóstico y tratamiento odontológico"
            />
          </div>
        </div>

        {/* FIRMA */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">FIRMA Y SELLO DEL MÉDICO</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma y Sello del Médico
            </label>
            <input
              type="text"
              value={formData.firma_medico}
              onChange={(e) => handleInputChange('firma_medico', e.target.value)}
              className="input-field"
              placeholder="Nombre y firma del médico responsable"
            />
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
            {loading ? 'Guardando...' : 'Guardar Informe Médico'}
          </button>
        </div>
      </form>
    </div>
  )
}

function InformeSeguimientoSaludSuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}

export default function InformeSeguimientoSaludPage() {
  return (
    <Suspense fallback={<InformeSeguimientoSaludSuspenseFallback />}>
      <InformeSeguimientoSaludForm />
    </Suspense>
  )
}
