'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Camera,
  User,
  Calendar,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  Download,
  Printer,
} from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Joven, Centro } from '@/lib/supabase'
import { format } from 'date-fns'
import { exportExpedientePDF, type PDFData } from '@/lib/pdf-generator'

export default function ExpedienteJovenPage() {
  const router = useRouter()
  const params = useParams()

  const jovenIdParam = (params as any)?.id
  const jovenId = Array.isArray(jovenIdParam) ? jovenIdParam[0] : (jovenIdParam as string | undefined)

  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [centro, setCentro] = useState<Centro | null>(null)
  const [atenciones, setAtenciones] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    if (jovenId) {
      loadData()
    }

    const handleJovenesUpdated = () => {
      console.log('Evento jovenes:updated recibido, recargando datos...')
      if (jovenId) {
        loadData()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('jovenes:updated', handleJovenesUpdated)

      return () => {
        window.removeEventListener('jovenes:updated', handleJovenesUpdated)
      }
    }
  }, [jovenId])

  const loadData = async () => {
    if (!jovenId) return

    try {
      setLoading(true)
      console.log('Cargando datos del expediente del joven:', jovenId)

      const jovenResponse = await fetch(`/api/jovenes/${jovenId}?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const jovenResult = await jovenResponse.json()

      console.log('Resultado de carga de joven desde API:', {
        status: jovenResponse.status,
        hasSuccess: !!jovenResult.success,
        hasJoven: !!jovenResult.joven,
      })

      if (!jovenResponse.ok || !jovenResult.success || !jovenResult.joven) {
        console.error('Error loading joven:', jovenResult)
        alert('Error al cargar los datos del joven')
        return
      }

      const jovenData = jovenResult.joven
      console.log('Joven cargado exitosamente. Datos:', jovenData)
      setJoven(jovenData)

      if (jovenData.centro_id) {
        const centrosResponse = await fetch('/api/centros', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        const centrosResult = await centrosResponse.json()

        if (centrosResponse.ok && centrosResult.success && centrosResult.centros) {
          const centroData = centrosResult.centros.find((c: Centro) => c.id === jovenData.centro_id)
          if (centroData) {
            setCentro(centroData)
          }
        }
      }

      const atencionesResponse = await fetch('/api/atenciones', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const atencionesResult = await atencionesResponse.json()

      if (atencionesResponse.ok && atencionesResult.success && atencionesResult.atenciones) {
        const jovenAtenciones = atencionesResult.atenciones.filter((a: any) => String(a.joven_id) === String(jovenId))
        setAtenciones(jovenAtenciones || [])
      } else {
        setAtenciones([])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar los datos del expediente')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !jovenId) return

    try {
      setUploading(true)

      const fileExt = file.name.split('.').pop()
      const safeExt = fileExt ? fileExt : 'jpg'
      const fileName = `${jovenId}.${safeExt}`
      const filePath = `fotos-jovenes/${fileName}`

      const { error: uploadError } = await supabase.storage.from('fotos-jovenes').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('fotos-jovenes').getPublicUrl(filePath)

      const updateResponse = await fetch(`/api/jovenes/${jovenId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foto_url: publicUrl }),
        cache: 'no-store',
      })

      const updateResult = await updateResponse.json()

      if (!updateResponse.ok || !updateResult.success) {
        throw new Error(updateResult.error || 'Error al actualizar la foto')
      }

      setJoven((prev) => (prev ? { ...prev, foto_url: publicUrl } : null))
      alert('Foto actualizada exitosamente')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error al subir la foto')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleExportPDF = async () => {
    if (!joven) return

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
          foto_url: joven.foto_url,
        },
      }

      await exportExpedientePDF(pdfData)
      alert('Expediente exportado exitosamente')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al exportar el expediente')
    } finally {
      setExportingPDF(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-red-100 text-red-800',
      egresado: 'bg-blue-100 text-blue-800',
      transferido: 'bg-yellow-100 text-yellow-800',
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getTipoAtencionBadge = (tipo: string) => {
    const badges: Record<string, string> = {
      salud: 'bg-red-100 text-red-800',
      educativa: 'bg-purple-100 text-purple-800',
      legal: 'bg-indigo-100 text-indigo-800',
      psicologica: 'bg-pink-100 text-pink-800',
      trabajo_social: 'bg-orange-100 text-orange-800',
      seguridad: 'bg-gray-100 text-gray-800',
    }
    return badges[tipo as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!joven) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Expediente no encontrado</h2>
          <p className="text-gray-600 mb-4">El expediente que buscas no existe o no tienes permisos para verlo.</p>
          <button onClick={() => router.push('/dashboard/jovenes')} className="btn-primary">
            Volver a Jóvenes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Expediente</h1>
                <p className="text-gray-600 mt-1">Información completa del NNAJ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
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

              <button onClick={() => router.push(`/dashboard/jovenes/${jovenId}/editar`)} className="btn-primary flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar Expediente
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="print-area">
          {/* ====== FORMATO SOLO PARA IMPRESIÓN (FICHA) ====== */}
          <div className="hidden print:block">
            <div className="print-page">
              {/* ENCABEZADO: LOGO + TITULO + FOTO */}
              <div className="print-header">
                <div className="print-logo-wrap">
                  <img src="/inami.png" alt="INAMI" className="print-logo" />
                </div>

                <div className="print-header-title">
                  <div className="print-title">INAMI – EXPEDIENTE DEL NNAJ</div>
                  <div className="print-subtitle">FICHA DE IDENTIFICACIÓN</div>
                </div>

                <div className="print-photo-wrap">
                  {joven.foto_url ? (
                    <img src={joven.foto_url} alt="Foto NNAJ" className="print-photo" />
                  ) : (
                    <div className="print-photo-placeholder">SIN FOTO</div>
                  )}
                </div>
              </div>

              <div className="print-section">
                <div className="print-section-title">Ficha de Identificación</div>

                <div className="two-cols">
                  <div>
                    <div className="field-row">
                      <div className="field-label">Nombres</div>
                      <div className="field-value">{joven.nombres || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Apellidos</div>
                      <div className="field-value">{joven.apellidos || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Fecha Nacimiento</div>
                      <div className="field-value">{joven.fecha_nacimiento ? format(new Date(joven.fecha_nacimiento), 'dd/MM/yyyy') : ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Edad</div>
                      <div className="field-value">{joven.edad ?? ''}</div>
                    </div>
                  </div>

                  <div>
                    <div className="field-row">
                      <div className="field-label">Sexo</div>
                      <div className="field-value">{joven.sexo || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Estado Civil</div>
                      <div className="field-value">{joven.estado_civil || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Teléfono</div>
                      <div className="field-value">{joven.telefono || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Email</div>
                      <div className="field-value">{joven.email || ''}</div>
                    </div>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-label">Dirección</div>
                  <div className="field-value">{joven.direccion || ''}</div>
                </div>
              </div>

              <div className="print-section">
                <div className="print-section-title">Datos Administrativos</div>

                <div className="two-cols">
                  <div>
                    <div className="field-row">
                      <div className="field-label">Exp. Administrativo</div>
                      <div className="field-value">{joven.expediente_administrativo || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Exp. Judicial</div>
                      <div className="field-value">{joven.expediente_judicial || ''}</div>
                    </div>
                  </div>

                  <div>
                    <div className="field-row">
                      <div className="field-label">Centro</div>
                      <div className="field-value">{centro?.nombre || ''}</div>
                    </div>

                    <div className="field-row">
                      <div className="field-label">Fecha de Ingreso</div>
                      <div className="field-value">{joven.fecha_ingreso ? format(new Date(joven.fecha_ingreso), 'dd/MM/yyyy') : ''}</div>
                    </div>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-label">Estado</div>
                  <div className="field-value">{joven.estado || ''}</div>
                </div>
              </div>

              <div className="print-section">
                <div className="print-section-title">Observaciones Generales</div>
                <div className="field-value" style={{ minHeight: '18mm' }}>
                  {joven.observaciones_generales || ''}
                </div>
              </div>

              <div className="print-section page-break">
                <div className="print-section-title">Historial de Atenciones</div>

                <table className="print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Fecha</th>
                      <th style={{ width: '18%' }}>Tipo</th>
                      <th style={{ width: '20%' }}>Profesional</th>
                      <th>Motivo</th>
                      <th style={{ width: '14%' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atenciones.length > 0 ? (
                      atenciones.map((a) => (
                        <tr key={a.id}>
                          <td>{a.fecha_atencion ? format(new Date(a.fecha_atencion), 'dd/MM/yyyy HH:mm') : ''}</td>
                          <td>{a.tipos_atencion?.nombre || ''}</td>
                          <td>{a.profesional?.full_name || ''}</td>
                          <td>{a.motivo || ''}</td>
                          <td>{a.estado || ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>
                          No hay atenciones registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ====== UI NORMAL (NO SE IMPRIME) ====== */}
          <div className="print-hidden">
            {/* Tu UI normal intacta */}
            {/* Información Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Foto y Datos Básicos */}
              <div className="lg:col-span-1">
                <div className="card">
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
                        {joven.foto_url ? (
                          <img src={joven.foto_url} alt={`${joven.nombres} ${joven.apellidos}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <User className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                      </label>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {joven.nombres} {joven.apellidos}
                    </h2>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{joven.edad} años</span>
                      </div>

                      {joven.direccion && (
                        <div className="flex items-center justify-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{joven.direccion}</span>
                        </div>
                      )}

                      {joven.telefono && (
                        <div className="flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{joven.telefono}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(joven.estado)}`}>{joven.estado}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Detallada */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Datos Personales
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                        <p className="text-gray-900">
                          {joven.fecha_nacimiento ? format(new Date(joven.fecha_nacimiento), 'dd/MM/yyyy') : 'No especificada'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Sexo</label>
                        <p className="text-gray-900">{joven.sexo || 'No especificado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado Civil</label>
                        <p className="text-gray-900">{joven.estado_civil || 'No especificado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{joven.email || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Datos Administrativos
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Expediente Administrativo</label>
                        <p className="text-gray-900">{joven.expediente_administrativo || 'No asignado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Expediente Judicial</label>
                        <p className="text-gray-900">{joven.expediente_judicial || 'No asignado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Centro</label>
                        <p className="text-gray-900">{centro?.nombre || 'Sin asignar'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fecha de Ingreso</label>
                        <p className="text-gray-900">
                          {joven.fecha_ingreso ? format(new Date(joven.fecha_ingreso), 'dd/MM/yyyy') : 'No especificada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {joven.observaciones_generales && (
                  <div className="card mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones Generales</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{joven.observaciones_generales}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Historial de Atenciones</h3>
                <button onClick={() => router.push(`/dashboard/atenciones/nueva?joven_id=${jovenId}`)} className="btn-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nueva Atención
                </button>
              </div>

              {atenciones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo de Atención</th>
                        <th>Profesional</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {atenciones.map((atencion) => (
                        <tr key={atencion.id} className="hover:bg-gray-50">
                          <td>{format(new Date(atencion.fecha_atencion), 'dd/MM/yyyy HH:mm')}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoAtencionBadge(atencion.tipos_atencion?.nombre || '')}`}>
                              {atencion.tipos_atencion?.nombre || 'Sin especificar'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <p className="font-medium">{atencion.profesional?.full_name || 'Sin especificar'}</p>
                              <p className="text-sm text-gray-500">{atencion.profesional?.role || ''}</p>
                            </div>
                          </td>
                          <td className="max-w-xs truncate">{atencion.motivo}</td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                atencion.estado === 'completada'
                                  ? 'bg-green-100 text-green-800'
                                  : atencion.estado === 'en_proceso'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : atencion.estado === 'pendiente'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {atencion.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => router.push(`/dashboard/atenciones/${atencion.id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Ver Detalles
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay atenciones registradas</h3>
                  <p className="text-gray-500 mb-4">Este joven aún no tiene atenciones registradas en el sistema.</p>
                  <button onClick={() => router.push(`/dashboard/atenciones/nueva?joven_id=${jovenId}`)} className="btn-primary">
                    Registrar Primera Atención
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
