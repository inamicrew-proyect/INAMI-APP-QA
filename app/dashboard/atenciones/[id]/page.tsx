'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, FileText, User, MapPin, Phone, AlertCircle, Download, Printer, Eye } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { Joven, Profile, Atencion, TipoAtencion, FormularioAtencion } from '@/lib/supabase'

// Tipo para la respuesta de la query con relaciones
type AtencionWithRelations = Atencion & {
  jovenes: Joven | null
  tipos_atencion: TipoAtencion | null
  profesional: Profile | null
}
import { format } from 'date-fns'
import { exportAtencionPDF, type PDFData } from '@/lib/pdf-generator'
import { useAuth } from '@/lib/auth'

export default function DetallesAtencionPage() {
  const router = useRouter()
  const params = useParams()
  const atencionId = params.id as string
  const supabase = getSupabaseClient()
  const { profile: currentUserProfile } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [atencion, setAtencion] = useState<Atencion | null>(null)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [profesional, setProfesional] = useState<Profile | null>(null)
  const [tipoAtencion, setTipoAtencion] = useState<TipoAtencion | null>(null)
  const [formularioEspecifico, setFormularioEspecifico] = useState<any>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  
  // Verificar si el usuario puede editar esta atención
  const canEdit = currentUserProfile && (
    currentUserProfile.role === 'admin' || 
    (atencion && atencion.profesional_id === currentUserProfile.id)
  )

  useEffect(() => {
    if (atencionId) {
      loadData()
    }
  }, [atencionId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar datos de la atención
      // Especificar explícitamente la relación profesional_id para evitar ambigüedad
      const { data: atencionData, error: atencionError } = await supabase
        .from('atenciones')
        .select(`
          *,
          jovenes(*),
          tipos_atencion(*),
          profesional:profiles!atenciones_profesional_id_fkey(*)
        `)
        .eq('id', atencionId)
        .single()

      if (atencionError) {
        console.error('Error cargando atención:', atencionError)
        throw atencionError
      }

      if (!atencionData) {
        throw new Error('No se encontró la atención')
      }

      // Type assertion para incluir las relaciones
      const atencionWithRelations = atencionData as AtencionWithRelations

      setAtencion(atencionWithRelations)
      setJoven(atencionWithRelations.jovenes)
      setProfesional(atencionWithRelations.profesional)
      setTipoAtencion(atencionWithRelations.tipos_atencion)

      // Cargar formulario específico si existe
      const { data: formularioData, error: formularioError } = await supabase
        .from('formularios_atencion')
        .select('*')
        .eq('atencion_id', atencionId)
        .single()

      if (!formularioError && formularioData) {
        const formulario = formularioData as FormularioAtencion
        setFormularioEspecifico(formulario.datos_json)
      }
    } catch (error: any) {
      console.error('Error loading data:', error)
      alert(`Error al cargar los datos de la atención: ${error?.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    if (!atencion || !joven || !profesional) return

    try {
      setExportingPDF(true)
      
      const pdfData: PDFData = {
        joven: {
          nombres: joven.nombres,
          apellidos: joven.apellidos,
          edad: joven.edad,
          expediente_administrativo: joven.expediente_administrativo,
          expediente_judicial: joven.expediente_judicial,
          direccion: joven.direccion,
          telefono: joven.telefono,
          email: joven.email,
          fecha_nacimiento: joven.fecha_nacimiento,
          sexo: joven.sexo,
          estado_civil: joven.estado_civil,
          foto_url: joven.foto_url
        },
        atencion: {
          id: atencion.id,
          tipo: tipoAtencion?.nombre || 'Sin especificar',
          fecha_atencion: format(new Date(atencion.fecha_atencion), 'dd/MM/yyyy HH:mm'),
          motivo: atencion.motivo,
          observaciones: atencion.observaciones,
          recomendaciones: atencion.recomendaciones,
          estado: atencion.estado,
          profesional: profesional.full_name,
          proxima_cita: atencion.proxima_cita ? format(new Date(atencion.proxima_cita), 'dd/MM/yyyy') : undefined
        },
        formularioEspecifico: formularioEspecifico
      }

      await exportAtencionPDF(pdfData)
      alert('Atención exportada exitosamente')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al exportar la atención')
    } finally {
      setExportingPDF(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      en_proceso: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      completada: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      cancelada: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const getTipoAtencionBadge = (tipo: string) => {
    const badges = {
      salud: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      educativa: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      legal: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      psicologica: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      trabajo_social: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      seguridad: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const renderFormularioEspecifico = () => {
    if (!formularioEspecifico || !tipoAtencion) return null

    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Formulario Específico - {tipoAtencion.nombre}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formularioEspecifico).map(([key, value]) => {
            if (!value || value === '') return null
            
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-900 dark:text-gray-100 text-sm">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    )
  }

  if (!atencion || !joven) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Atención no encontrada</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">La atención que buscas no existe o no tienes permisos para verla.</p>
          <button
            onClick={() => router.push('/dashboard/atenciones')}
            className="btn-primary"
          >
            Volver a Atenciones
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-stone-50 dark:bg-gray-800 shadow-sm border-b border-stone-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Detalles de Atención</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Información completa de la atención</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </button>
              {canEdit && (
                <button
                  onClick={() => router.push(`/dashboard/atenciones/${atencionId}/editar`)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar Atención
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Información del Joven */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Información del NNAJ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {joven.nombres} {joven.apellidos}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Edad: {joven.edad} años</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Exp: {joven.expediente_administrativo}</span>
                  </div>
                  
                  {joven.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{joven.telefono}</span>
                    </div>
                  )}
                  
                  {joven.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{joven.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => router.push(`/dashboard/jovenes/${joven.id}/expediente`)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Expediente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Atención */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datos de la Atención */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Datos de la Atención
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Atención</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoAtencionBadge(tipoAtencion?.nombre || '')}`}>
                        {tipoAtencion?.nombre || 'Sin especificar'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(atencion.estado)}`}>
                        {atencion.estado}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha y Hora</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {format(new Date(atencion.fecha_atencion), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Motivo</label>
                    <p className="text-gray-900 dark:text-gray-100">{atencion.motivo}</p>
                  </div>
                </div>
              </div>

              {/* Información del Profesional */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Profesional Responsable
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</label>
                    <p className="text-gray-900 dark:text-gray-100">{profesional?.full_name || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Área</label>
                    <p className="text-gray-900 dark:text-gray-100 capitalize">{profesional?.role || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Registro</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {format(new Date(atencion.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {atencion.proxima_cita && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Próxima Cita</label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {format(new Date(atencion.proxima_cita), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Observaciones y Recomendaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {atencion.observaciones && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Observaciones</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{atencion.observaciones}</p>
                </div>
              )}

              {atencion.recomendaciones && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recomendaciones</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{atencion.recomendaciones}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario Específico */}
        {renderFormularioEspecifico()}

        {/* Historial de Atenciones del Joven */}
        <div className="card mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Historial de Atenciones - {joven.nombres} {joven.apellidos}
            </h3>
            <button
              onClick={() => router.push(`/dashboard/atenciones/nueva?joven_id=${joven.id}`)}
              className="btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Nueva Atención
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Atención actual:</strong> Esta es la atención que estás viendo actualmente.
              </p>
            </div>
          </div>

          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Ver Historial Completo</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Para ver el historial completo de atenciones de este joven, ve a su expediente.</p>
            <button
              onClick={() => router.push(`/dashboard/jovenes/${joven.id}/expediente`)}
              className="btn-primary"
            >
              Ver Expediente Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
