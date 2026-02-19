'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, Calendar, Phone, AlertTriangle } from 'lucide-react'
import type { Centro } from '@/lib/supabase'
import { jovenCreateSchema, calculateAgeFromBirth } from '@/lib/validation/jovenes'
import { zodErrorToFieldErrors } from '@/lib/validation/utils'

export default function NuevoJovenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [centros, setCentros] = useState<Centro[]>([])
  const [loadingCentros, setLoadingCentros] = useState(true)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    identidad: '',
    sexo: 'Masculino',
    direccion: '',
    telefono: '',
    nombre_contacto_emergencia: '',
    telefono_emergencia: '',
    centro_id: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    medida_aplicada: '',
    delito_infraccion: '',
    observaciones: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar centros al montar el componente
  useEffect(() => {
    loadCentros()
  }, [])

  const loadCentros = async () => {
    try {
      setLoadingCentros(true)
      console.log('Cargando centros...')

      // Usar la API route que maneja permisos correctamente
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
        
        if (response.status === 401) {
          console.error('No autenticado')
        } else {
          console.error('Error al cargar centros:', result.details || result.error)
        }
        
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const parsed = jovenCreateSchema.safeParse({
        ...formData,
        foto_url: undefined,
      })

      if (!parsed.success) {
        setErrors(zodErrorToFieldErrors(parsed.error))
        setLoading(false)
        return
      }

      const sanitized = parsed.data
      const edad = calculateAgeFromBirth(sanitized.fecha_nacimiento)

      console.log('Creando nuevo joven...')

      // Usar la API route que maneja permisos correctamente
      const response = await fetch('/api/jovenes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombres: sanitized.nombres,
          apellidos: sanitized.apellidos,
          fecha_nacimiento: sanitized.fecha_nacimiento,
          edad,
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
          observaciones: sanitized.observaciones ?? null,
          estado: 'activo'
        }),
        cache: 'no-store',
      })

      const result = await response.json()

      console.log('Resultado de creación:', { status: response.status, result })

      if (!response.ok) {
        if (response.status === 401) {
          alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
          router.push('/login')
          return
        }
        if (response.status === 403) {
          alert(result.details || result.error || 'No tienes permisos para crear un joven.')
          return
        }
        throw new Error(result.details || result.error || 'Error al crear el joven.')
      }

      if (!result.success) {
        throw new Error(result.error || 'No se pudo crear el joven.')
      }

      console.log('Joven creado exitosamente')
      alert('Joven registrado exitosamente')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jovenes:updated'))
      }
      router.push('/dashboard/jovenes')
    } catch (error: any) {
      console.error('Error creating joven:', error)
      if (error?.code === '23505') {
        setErrors({ identidad: 'Ya existe un joven registrado con esta identidad.' })
      } else if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Error al registrar el joven. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registrar Nuevo Joven</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Complete la información del menor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información Personal */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información Personal</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                type="text"
                value={formData.nombres}
                onChange={(e) => handleInputChange('nombres', e.target.value)}
                className={`input-field ${errors.nombres ? 'border-red-500' : ''}`}
                placeholder="Nombres del joven"
              />
              {errors.nombres && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.nombres}
                </p>
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
                placeholder="Apellidos del joven"
              />
              {errors.apellidos && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.apellidos}
                </p>
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.fecha_nacimiento}
                </p>
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
                placeholder="Número de identidad (opcional)"
              />
              {errors.identidad && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.identidad}
                </p>
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
        </div>

        {/* Información de Contacto */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información de Contacto</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.telefono}
                </p>
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
                placeholder="Nombre del contacto de emergencia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de Emergencia
              </label>
              <input
                type="tel"
                value={formData.telefono_emergencia}
                onChange={(e) => handleInputChange('telefono_emergencia', e.target.value)}
                className="input-field"
                placeholder="Teléfono de emergencia"
              />
              {errors.telefono_emergencia && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.telefono_emergencia}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información Institucional */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Información Institucional</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {centro.nombre} ({centro.tipo})
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.centro_id}
                </p>
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
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {errors.fecha_ingreso}
                </p>
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
                placeholder="Tipo de medida aplicada"
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
                placeholder="Descripción del delito o infracción"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Observaciones adicionales sobre el joven"
              />
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
            {loading ? 'Guardando...' : 'Guardar Joven'}
          </button>
        </div>
      </form>
    </div>
  )
}