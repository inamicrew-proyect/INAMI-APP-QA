'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, Calendar, AlertTriangle, Camera } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-browser'
import type { Joven, Centro } from '@/lib/supabase'
import { jovenUpdateSchema, calculateAgeFromBirth } from '@/lib/validation/jovenes'
import { zodErrorToFieldErrors } from '@/lib/validation/utils'

export default function EditarJovenPage() {
  const router = useRouter()
  const params = useParams()
  const jovenId = params.id as string

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [joven, setJoven] = useState<Joven | null>(null)
  const [centros, setCentros] = useState<Centro[]>([])
  const [loadingCentros, setLoadingCentros] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    edad: 0,
    identidad: '',
    sexo: 'Masculino' as 'Masculino' | 'Femenino',
    direccion: '',
    telefono: '',
    nombre_contacto_emergencia: '',
    telefono_emergencia: '',
    centro_id: '',
    fecha_ingreso: '',
    medida_aplicada: '',
    delito_infraccion: '',
    expediente_administrativo: '',
    expediente_judicial: '',
    estado: 'activo' as 'activo' | 'egresado' | 'transferido',
    observaciones: ''
  })

  useEffect(() => {
    if (jovenId) {
      loadData()
    }
  }, [jovenId])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Cargando datos del joven:', jovenId)

      // Cargar datos del joven usando la API route
      const response = await fetch(`/api/jovenes/${jovenId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const result = await response.json()

      console.log('Resultado de carga de joven desde API:', { status: response.status })

      if (!response.ok) {
        console.error('Error loading joven:', result)
        
        if (response.status === 401) {
          alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
          router.push('/login')
          return
        }
        if (response.status === 404) {
          alert('Joven no encontrado.')
          router.push('/dashboard/jovenes')
          return
        }
        alert(result.details || result.error || 'Error al cargar los datos del joven')
        return
      }

      if (!result.success || !result.joven) {
        alert('Error al cargar los datos del joven')
        return
      }

      const jovenData = result.joven
      console.log('Joven cargado exitosamente')
      setJoven(jovenData)
      setFormData({
        nombres: jovenData.nombres || '',
        apellidos: jovenData.apellidos || '',
        fecha_nacimiento: jovenData.fecha_nacimiento || '',
        edad: jovenData.edad || 0,
        identidad: jovenData.identidad || '',
        sexo: jovenData.sexo || 'Masculino',
        direccion: jovenData.direccion || '',
        telefono: jovenData.telefono || '',
        nombre_contacto_emergencia: jovenData.nombre_contacto_emergencia || '',
        telefono_emergencia: jovenData.telefono_emergencia || '',
        centro_id: jovenData.centro_id || '',
        fecha_ingreso: jovenData.fecha_ingreso || '',
        medida_aplicada: jovenData.medida_aplicada || '',
        delito_infraccion: jovenData.delito_infraccion || '',
        expediente_administrativo: jovenData.expediente_administrativo || '',
        expediente_judicial: jovenData.expediente_judicial || '',
        estado: jovenData.estado || 'activo',
        observaciones: jovenData.observaciones || ''
      })

      // Cargar centros usando la API route
      await loadCentros()

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const loadCentros = async () => {
    try {
      setLoadingCentros(true)
      console.log('Cargando centros...')

      const response = await fetch('/api/centros', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      const result = await response.json()

      console.log('Resultado de carga de centros desde API:', { status: response.status, count: result.centros?.length })

      if (!response.ok) {
        console.error('Error loading centros:', result)
        setCentros([])
        return
      }

      if (!result.success) {
        console.error('API returned error:', result)
        setCentros([])
        return
      }

      const centrosData = result.centros || []
      console.log(`Centros cargados: ${centrosData.length}`)
      setCentros(centrosData)
    } catch (error) {
      console.error('Error loading centros:', error)
      setCentros([])
    } finally {
      setLoadingCentros(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !jovenId) return

    try {
      setUploadingPhoto(true)
      const supabase = createClientComponentClient()
      const fileExt = file.name.split('.').pop() || 'jpg'
      const filePath = `fotos-jovenes/${jovenId}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('fotos-jovenes').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('fotos-jovenes').getPublicUrl(filePath)

      const updateResponse = await fetch(`/api/jovenes/${jovenId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_url: publicUrl }),
        cache: 'no-store',
      })
      const updateResult = await updateResponse.json()
      if (!updateResponse.ok || !updateResult.success) {
        throw new Error(updateResult.error || 'Error al actualizar la foto')
      }

      setJoven((prev) => (prev ? { ...prev, foto_url: publicUrl } : null))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jovenes:updated'))
      }
      alert('Fotografía actualizada exitosamente')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error al subir la fotografía')
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      setSaving(true)

      const parsed = jovenUpdateSchema.safeParse({
        ...formData,
        foto_url: joven?.foto_url ?? undefined,
      })

      if (!parsed.success) {
        setErrors(zodErrorToFieldErrors(parsed.error))
        setSaving(false)
        return
      }

      const sanitized = parsed.data
      // Validación cruzada: edad debe coincidir con la fecha de nacimiento
      const edadCalculada = calculateAgeFromBirth(sanitized.fecha_nacimiento)
      const edadIngresada = Number(formData.edad)

      if (!Number.isFinite(edadIngresada) || edadIngresada < 0) {
        setErrors((prev) => ({ ...prev, edad: 'La edad ingresada no es válida.' }))
        setSaving(false)
        return
      }

      if (edadIngresada !== edadCalculada) {
        setErrors((prev) => ({
          ...prev,
          edad: `La edad no coincide con la fecha de nacimiento. Debe ser ${edadCalculada}.`,
        }))
        setSaving(false)
        return
      }

      const edadFinal = edadCalculada

      setFormData((prev) => ({
        ...prev,
        nombres: sanitized.nombres,
        apellidos: sanitized.apellidos,
        fecha_nacimiento: sanitized.fecha_nacimiento,
        identidad: sanitized.identidad ?? '',
        sexo: sanitized.sexo,
        direccion: sanitized.direccion ?? '',
        telefono: sanitized.telefono ?? '',
        nombre_contacto_emergencia: sanitized.nombre_contacto_emergencia ?? '',
        telefono_emergencia: sanitized.telefono_emergencia ?? '',
        centro_id: sanitized.centro_id,
        fecha_ingreso: sanitized.fecha_ingreso,
        medida_aplicada: sanitized.medida_aplicada ?? '',
        delito_infraccion: sanitized.delito_infraccion ?? '',
        expediente_administrativo: sanitized.expediente_administrativo ?? '',
        expediente_judicial: sanitized.expediente_judicial ?? '',
        estado: sanitized.estado,
        observaciones: sanitized.observaciones ?? '',
        edad: edadFinal,
      }))

      const payload = {
        nombres: sanitized.nombres,
        apellidos: sanitized.apellidos,
        fecha_nacimiento: sanitized.fecha_nacimiento,
        edad: edadFinal,
        identidad: sanitized.identidad ?? null,
        sexo: sanitized.sexo,
        direccion: sanitized.direccion ?? null,
        telefono: sanitized.telefono ?? null,
        nombre_contacto_emergencia: sanitized.nombre_contacto_emergencia ?? null,
        telefono_emergencia: sanitized.telefono_emergencia ?? null,
        centro_id: sanitized.centro_id,
        fecha_ingreso: sanitized.fecha_ingreso,
        medida_aplicada: sanitized.medida_aplicada ?? null,
        delito_infraccion: sanitized.delito_infraccion ?? null,
        expediente_administrativo: sanitized.expediente_administrativo ?? null,
        expediente_judicial: sanitized.expediente_judicial ?? null,
        estado: sanitized.estado,
        observaciones: sanitized.observaciones ?? null,
        foto_url: joven?.foto_url ?? null,
      }

      console.log('Enviando actualización de joven:', { jovenId, payload })

      // Usar la API route que maneja permisos correctamente
      const response = await fetch(`/api/jovenes/${jovenId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      const result = await response.json()

      console.log('Respuesta de actualización:', { status: response.status, result })

      if (!response.ok) {
        setSaving(false)
        // Mensajes de error más específicos
        if (response.status === 401) {
          alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
          router.push('/login')
          return
        }
        if (response.status === 403) {
          alert(result.details || result.error || 'No tienes permisos para actualizar este joven.')
          return
        }
        if (response.status === 404) {
          alert(result.details || result.error || 'Joven no encontrado.')
          return
        }
        alert(result.details || result.error || 'Error al actualizar el joven.')
        return
      }

      if (!result.success) {
        setSaving(false)
        alert(result.error || 'No se pudo actualizar el joven.')
        return
      }

      if (!result.data) {
        setSaving(false)
        console.error('La API no retornó datos actualizados:', result)
        alert('La actualización se completó pero no se recibieron datos. Por favor, verifica los cambios.')
        router.push(`/dashboard/jovenes/${jovenId}/expediente`)
        return
      }

      console.log('Joven actualizado exitosamente. Datos recibidos:', result.data)

      alert('Joven actualizado exitosamente')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jovenes:updated'))
      }
      
      // Esperar un momento antes de redirigir para asegurar que los cambios se reflejen
      await new Promise(resolve => setTimeout(resolve, 300))
      
      router.push(`/dashboard/jovenes/${jovenId}/expediente`)

    } catch (error: any) {
      console.error('Error:', error)
      if (error?.code === '23505') {
        setErrors({ identidad: 'Ya existe un joven registrado con esta identidad.' })
      } else {
        alert('Error al actualizar el joven')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!joven) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Joven no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">El joven que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push('/dashboard/jovenes')}
            className="btn-primary"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Joven</h1>
            <p className="text-gray-600 mt-1">Modificar información del NNAJ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Fotografía del NNAJ</h2>
            <p className="text-sm text-gray-600 mb-4">Opcional. Se usa en expediente e informes en PDF.</p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {joven.foto_url ? (
                    <img src={joven.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
              {uploadingPhoto && <span className="text-sm text-gray-500">Subiendo…</span>}
            </div>
          </div>

          {/* Información Personal */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Información Personal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange('nombres', e.target.value)}
                  className={`input-field ${errors.nombres ? 'border-red-500' : ''}`}
                  placeholder="Nombres del NNAJ"
                />
                {errors.nombres && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombres}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange('apellidos', e.target.value)}
                  className={`input-field ${errors.apellidos ? 'border-red-500' : ''}`}
                  placeholder="Apellidos del NNAJ"
                />
                {errors.apellidos && (
                  <p className="text-red-500 text-sm mt-1">{errors.apellidos}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                  className={`input-field ${errors.fecha_nacimiento ? 'border-red-500' : ''}`}
                />
                {errors.fecha_nacimiento && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha_nacimiento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  value={formData.edad}
                  onChange={(e) => handleInputChange('edad', parseInt(e.target.value) || 0)}
                  className={`input-field ${errors.edad ? 'border-red-500' : ''}`}
                  min="0"
                  max="25"
                />
                {errors.edad && (
                  <p className="text-red-500 text-sm mt-1">{errors.edad}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identidad
                </label>
                <input
                  type="text"
                  value={formData.identidad}
                  onChange={(e) => handleInputChange('identidad', e.target.value)}
                  className="input-field"
                  placeholder="Número de identidad"
                />
                {errors.identidad && (
                  <p className="text-red-500 text-sm mt-1">{errors.identidad}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo
                </label>
                <select
                  value={formData.sexo}
                  onChange={(e) => handleInputChange('sexo', e.target.value)}
                  className="input-field"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="input-field"
                placeholder="Dirección de residencia"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="input-field"
                  placeholder="Número de teléfono"
                />
                {errors.telefono && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto de Emergencia
                </label>
                <input
                  type="text"
                  value={formData.nombre_contacto_emergencia}
                  onChange={(e) => handleInputChange('nombre_contacto_emergencia', e.target.value)}
                  className="input-field"
                  placeholder="Nombre del contacto"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Emergencia
              </label>
              <input
                type="tel"
                value={formData.telefono_emergencia}
                onChange={(e) => handleInputChange('telefono_emergencia', e.target.value)}
                className="input-field"
                placeholder="Teléfono del contacto de emergencia"
              />
                {errors.telefono_emergencia && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefono_emergencia}</p>
                )}
            </div>
          </div>

          {/* Información Administrativa */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Información Administrativa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Centro *
                </label>
                <select
                  value={formData.centro_id}
                  onChange={(e) => handleInputChange('centro_id', e.target.value)}
                  className={`input-field ${errors.centro_id ? 'border-red-500' : ''}`}
                  required
                  disabled={loadingCentros}
                >
                  <option value="">
                    {loadingCentros ? 'Cargando centros...' : 'Seleccionar centro'}
                  </option>
                  {centros.map((centro) => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre} - {centro.tipo}
                    </option>
                  ))}
                </select>
                {!loadingCentros && centros.length === 0 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    No se pudieron cargar los centros. Verifica tu conexión y permisos.
                  </p>
                )}
                {errors.centro_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.centro_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ingreso *
                </label>
                <input
                  type="date"
                  value={formData.fecha_ingreso}
                  onChange={(e) => handleInputChange('fecha_ingreso', e.target.value)}
                  className={`input-field ${errors.fecha_ingreso ? 'border-red-500' : ''}`}
                />
                {errors.fecha_ingreso && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha_ingreso}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medida Aplicada
                </label>
                <input
                  type="text"
                  value={formData.medida_aplicada}
                  onChange={(e) => handleInputChange('medida_aplicada', e.target.value)}
                  className="input-field"
                  placeholder="Medida socioeducativa aplicada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delito/Infracción
                </label>
                <input
                  type="text"
                  value={formData.delito_infraccion}
                  onChange={(e) => handleInputChange('delito_infraccion', e.target.value)}
                  className="input-field"
                  placeholder="Delito o infracción cometida"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expediente Administrativo
                </label>
                <input
                  type="text"
                  value={formData.expediente_administrativo}
                  onChange={(e) => handleInputChange('expediente_administrativo', e.target.value)}
                  className="input-field"
                  placeholder="Número de expediente administrativo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expediente Judicial
                </label>
                <input
                  type="text"
                  value={formData.expediente_judicial}
                  onChange={(e) => handleInputChange('expediente_judicial', e.target.value)}
                  className="input-field"
                  placeholder="Número de expediente judicial"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="input-field"
              >
                <option value="activo">Activo</option>
                <option value="egresado">Egresado</option>
                <option value="transferido">Transferido</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

