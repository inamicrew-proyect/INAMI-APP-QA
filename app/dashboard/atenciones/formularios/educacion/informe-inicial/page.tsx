'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Save, ArrowLeft, User, FileText, BookOpen, GraduationCap } from 'lucide-react'
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
  fecha_elaboracion: string
  pedagogo_nombre: string
  
  // Datos generales
  nombre_completo: string
  expediente_administrativo: string
  expediente_judicial: string
  edad: number
  sexo: string
  estado_familiar: string
  tiene_hijos: boolean
  numero_hijos: number
  celular: string
  dni: string
  nacionalidad: string
  departamento: string
  municipio: string
  direccion: string
  zona_residencia: string
  ocupacion: string
  lugar_trabajo: string
  telefono_trabajo: string
  representante_legal: string
  parentesco: string
  
  // Datos judiciales
  juzgado_remite: string
  juez_remite: string
  tipo_infraccion: string
  expediente_judicial_numero: string
  medida_socioeducativa: string
  tiempo_medida: string
  
  // Situación área de educación formal
  situacion_educacion_formal: string
  
  // Situación educativa familiar y social
  situacion_educativa_familiar: string
  
  // Valoración técnica
  valoracion_tecnica: string
  
  // Pronóstico
  pronostico: string
  
  // Recomendaciones
  recomendaciones: string
}

export default function InformeInicialEducativoPage() {
  const router = useRouter()
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    joven_id: '',
    fecha_elaboracion: new Date().toISOString().split('T')[0],
    pedagogo_nombre: '',
    nombre_completo: '',
    expediente_administrativo: '',
    expediente_judicial: '',
    edad: 0,
    sexo: '',
    estado_familiar: '',
    tiene_hijos: false,
    numero_hijos: 0,
    celular: '',
    dni: '',
    nacionalidad: '',
    departamento: '',
    municipio: '',
    direccion: '',
    zona_residencia: '',
    ocupacion: '',
    lugar_trabajo: '',
    telefono_trabajo: '',
    representante_legal: '',
    parentesco: '',
    juzgado_remite: '',
    juez_remite: '',
    tipo_infraccion: '',
    expediente_judicial_numero: '',
    medida_socioeducativa: '',
    tiempo_medida: '',
    situacion_educacion_formal: '',
    situacion_educativa_familiar: '',
    valoracion_tecnica: '',
    pronostico: '',
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
        joven_id: jovenId,
        nombre_completo: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad
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
          tipo_formulario: 'informe_inicial_educativo',
          joven_id: formData.joven_id,
          datos_json: formData,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Informe inicial educativo guardado exitosamente')
      router.push('/dashboard/atenciones')
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error al guardar el informe inicial educativo')
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
            Informe Inicial Educativo
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Formulario de evaluación educativa inicial
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
                Pedagogo/a *
              </label>
              <input
                type="text"
                value={formData.pedagogo_nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, pedagogo_nombre: e.target.value }))}
                className="input-field"
                placeholder="Nombre del pedagogo"
                required
              />
            </div>
          </div>
        </div>

        {/* Datos Generales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              I. Datos Generales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.nombre_completo}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_completo: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Expediente Administrativo
              </label>
              <input
                type="text"
                value={formData.expediente_administrativo}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_administrativo: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Expediente Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => setFormData(prev => ({ ...prev, edad: parseInt(e.target.value) || 0 }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo
              </label>
              <select
                value={formData.sexo}
                onChange={(e) => setFormData(prev => ({ ...prev, sexo: e.target.value }))}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado Familiar del NNAJ
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estado_familiar"
                    value="soltero"
                    checked={formData.estado_familiar === 'soltero'}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_familiar: e.target.value }))}
                    className="form-radio"
                  />
                  <span>Soltero</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estado_familiar"
                    value="casado"
                    checked={formData.estado_familiar === 'casado'}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_familiar: e.target.value }))}
                    className="form-radio"
                  />
                  <span>Casado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="estado_familiar"
                    value="acompañado"
                    checked={formData.estado_familiar === 'acompañado'}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado_familiar: e.target.value }))}
                    className="form-radio"
                  />
                  <span>Acompañado</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiene Hijos
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tiene_hijos"
                    checked={formData.tiene_hijos === true}
                    onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: true }))}
                    className="form-radio"
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tiene_hijos"
                    checked={formData.tiene_hijos === false}
                    onChange={() => setFormData(prev => ({ ...prev, tiene_hijos: false }))}
                    className="form-radio"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.tiene_hijos && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  N° de Hijos
                </label>
                <input
                  type="number"
                  value={formData.numero_hijos}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_hijos: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                N° de Celular
              </label>
              <input
                type="text"
                value={formData.celular}
                onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                className="input-field"
                placeholder="Número de teléfono celular"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documento Nacional de Identificación
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                className="input-field"
                placeholder="Número de identidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nacionalidad
              </label>
              <input
                type="text"
                value={formData.nacionalidad}
                onChange={(e) => setFormData(prev => ({ ...prev, nacionalidad: e.target.value }))}
                className="input-field"
                placeholder="Nacionalidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                className="input-field"
                placeholder="Departamento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Municipio
              </label>
              <input
                type="text"
                value={formData.municipio}
                onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                className="input-field"
                placeholder="Municipio"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                className="input-field"
                placeholder="Dirección de residencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zona en la que Reside el NNAJ
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="zona_residencia"
                    value="urbana"
                    checked={formData.zona_residencia === 'urbana'}
                    onChange={(e) => setFormData(prev => ({ ...prev, zona_residencia: e.target.value }))}
                    className="form-radio"
                  />
                  <span>Urbana</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="zona_residencia"
                    value="rural"
                    checked={formData.zona_residencia === 'rural'}
                    onChange={(e) => setFormData(prev => ({ ...prev, zona_residencia: e.target.value }))}
                    className="form-radio"
                  />
                  <span>Rural</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ocupación
              </label>
              <input
                type="text"
                value={formData.ocupacion}
                onChange={(e) => setFormData(prev => ({ ...prev, ocupacion: e.target.value }))}
                className="input-field"
                placeholder="Ocupación actual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lugar de Trabajo
              </label>
              <input
                type="text"
                value={formData.lugar_trabajo}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_trabajo: e.target.value }))}
                className="input-field"
                placeholder="Lugar donde trabaja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Teléfono del Trabajo
              </label>
              <input
                type="text"
                value={formData.telefono_trabajo}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono_trabajo: e.target.value }))}
                className="input-field"
                placeholder="Teléfono del trabajo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Representante Legal
              </label>
              <input
                type="text"
                value={formData.representante_legal}
                onChange={(e) => setFormData(prev => ({ ...prev, representante_legal: e.target.value }))}
                className="input-field"
                placeholder="Padre, madre o tutor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parentesco
              </label>
              <input
                type="text"
                value={formData.parentesco}
                onChange={(e) => setFormData(prev => ({ ...prev, parentesco: e.target.value }))}
                className="input-field"
                placeholder="Parentesco con el representante"
              />
            </div>
          </div>
        </div>

        {/* Datos Judiciales */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Datos Judiciales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juzgado que Remite
              </label>
              <input
                type="text"
                value={formData.juzgado_remite}
                onChange={(e) => setFormData(prev => ({ ...prev, juzgado_remite: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Juez que Remite
              </label>
              <input
                type="text"
                value={formData.juez_remite}
                onChange={(e) => setFormData(prev => ({ ...prev, juez_remite: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Infracción
              </label>
              <input
                type="text"
                value={formData.tipo_infraccion}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_infraccion: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Expediente Judicial
              </label>
              <input
                type="text"
                value={formData.expediente_judicial_numero}
                onChange={(e) => setFormData(prev => ({ ...prev, expediente_judicial_numero: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Medida Socioeducativa Impuesta
              </label>
              <input
                type="text"
                value={formData.medida_socioeducativa}
                onChange={(e) => setFormData(prev => ({ ...prev, medida_socioeducativa: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo de las Medidas Impuestas
              </label>
              <input
                type="text"
                value={formData.tiempo_medida}
                onChange={(e) => setFormData(prev => ({ ...prev, tiempo_medida: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Situación Área de Educación Formal */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Situación Área de Educación Formal
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Situación Actual en Educación Formal
            </label>
            <textarea
              value={formData.situacion_educacion_formal}
              onChange={(e) => setFormData(prev => ({ ...prev, situacion_educacion_formal: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Describa la situación actual del joven en el área de educación formal..."
            />
          </div>
        </div>

        {/* Situación Educativa Familiar y Social */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Situación Educativa Familiar y Social
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Situación Educativa Familiar y Social
            </label>
            <textarea
              value={formData.situacion_educativa_familiar}
              onChange={(e) => setFormData(prev => ({ ...prev, situacion_educativa_familiar: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Describa la situación educativa familiar y social del joven..."
            />
          </div>
        </div>

        {/* Valoración Técnica */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Valoración Técnica
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valoración Técnica
            </label>
            <textarea
              value={formData.valoracion_tecnica}
              onChange={(e) => setFormData(prev => ({ ...prev, valoracion_tecnica: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Valoración técnica del caso educativo..."
            />
          </div>
        </div>

        {/* Pronóstico */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Pronóstico
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pronóstico
            </label>
            <textarea
              value={formData.pronostico}
              onChange={(e) => setFormData(prev => ({ ...prev, pronostico: e.target.value }))}
              className="input-field"
              rows={6}
              placeholder="Pronóstico educativo del caso..."
            />
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recomendaciones
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
              placeholder="Recomendaciones para el caso educativo..."
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
            {loading ? 'Guardando...' : 'Guardar Informe Inicial'}
          </button>
        </div>
      </form>
    </div>
  )
}
