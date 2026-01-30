'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, FileText, User, MapPin, Phone, AlertCircle, Download, Printer, Eye } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Joven, Profile, Atencion, TipoAtencion } from '@/lib/supabase'
import { format } from 'date-fns'
import { exportAtencionPDF, type PDFData } from '@/lib/pdf-generator'
import { useAuth } from '@/lib/auth'

export default function DetallesAtencionPage() {
  const router = useRouter()
  const params = useParams()
  const atencionId = params.id as string
  const supabase = createClientComponentClient()
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

      setAtencion(atencionData)
      setJoven(atencionData.jovenes)
      setProfesional(atencionData.profesional)
      setTipoAtencion(atencionData.tipos_atencion)

      // Cargar formulario específico si existe
      const { data: formularioData, error: formularioError } = await supabase
        .from('formularios_atencion')
        .select('*')
        .eq('atencion_id', atencionId)
        .single()

      if (!formularioError && formularioData) {
        setFormularioEspecifico(formularioData.datos_json)
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
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_proceso: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getTipoAtencionBadge = (tipo: string) => {
    const badges = {
      salud: 'bg-red-100 text-red-800',
      educativa: 'bg-purple-100 text-purple-800',
      legal: 'bg-indigo-100 text-indigo-800',
      psicologica: 'bg-pink-100 text-pink-800',
      trabajo_social: 'bg-orange-100 text-orange-800',
      seguridad: 'bg-gray-100 text-gray-800'
    }
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const renderFormularioEspecifico = () => {
    if (!formularioEspecifico || !tipoAtencion) return null

    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Formulario Específico - {tipoAtencion.nombre}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formularioEspecifico).map(([key, value]) => {
            if (!value || value === '') return null
            
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-gray-900 text-sm">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!atencion || !joven) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Atención no encontrada</h2>
          <p className="text-gray-600 mb-4">La atención que buscas no existe o no tienes permisos para verla.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Detalles de Atención</h1>
                <p className="text-gray-600 mt-1">Información completa de la atención</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Información del NNAJ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {joven.nombres} {joven.apellidos}
                  </h4>
                  <p className="text-sm text-gray-600">Edad: {joven.edad} años</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Exp: {joven.expediente_administrativo}</span>
                  </div>
                  
                  {joven.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{joven.telefono}</span>
                    </div>
                  )}
                  
                  {joven.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{joven.direccion}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Datos de la Atención
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Atención</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoAtencionBadge(tipoAtencion?.nombre || '')}`}>
                        {tipoAtencion?.nombre || 'Sin especificar'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(atencion.estado)}`}>
                        {atencion.estado}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha y Hora</label>
                    <p className="text-gray-900">
                      {format(new Date(atencion.fecha_atencion), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Motivo</label>
                    <p className="text-gray-900">{atencion.motivo}</p>
                  </div>
                </div>
              </div>

              {/* Información del Profesional */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Profesional Responsable
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-gray-900">{profesional?.full_name || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Área</label>
                    <p className="text-gray-900 capitalize">{profesional?.role || 'Sin especificar'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Registro</label>
                    <p className="text-gray-900">
                      {format(new Date(atencion.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {atencion.proxima_cita && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Próxima Cita</label>
                      <p className="text-gray-900">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{atencion.observaciones}</p>
                </div>
              )}

              {atencion.recomendaciones && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{atencion.recomendaciones}</p>
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
            <h3 className="text-xl font-semibold text-gray-900">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Atención actual:</strong> Esta es la atención que estás viendo actualmente.
              </p>
            </div>
          </div>

          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ver Historial Completo</h3>
            <p className="text-gray-500 mb-4">Para ver el historial completo de atenciones de este joven, ve a su expediente.</p>
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
