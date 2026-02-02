'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, PenSquare, Camera, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/lib/auth'

type UserProfile = {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
  photo_url?: string | null
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  pedagogo: 'Pedagogo',
  abogado: 'Abogado',
  medico: 'Médico',
  psicologo: 'Psicólogo',
  trabajador_social: 'Trabajador Social',
  seguridad: 'Seguridad',
}

export default function UsuarioDetallePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined
  const supabase = getSupabaseClient()
  const { profile: currentUserProfile } = useAuth()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  
  const MAX_PROFILE_PHOTO_SIZE = 1024 * 1024 // 1 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  
  const isOwnProfile = currentUserProfile?.id === id

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        // Verificar sesión
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError('No autenticado. Vuelve a iniciar sesión.')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/users/${id}`, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        const result = await response.json()

        if (!response.ok) {
          // Mensajes de error más específicos
          if (response.status === 401) {
            setError('No estás autenticado. Por favor, inicia sesión nuevamente.')
          } else if (response.status === 403) {
            setError(result.error || 'No tienes permisos para ver este usuario. Solo puedes ver tu propio perfil o ser administrador para ver todos los usuarios.')
          } else if (response.status === 404) {
            setError('Usuario no encontrado.')
          } else {
            setError(result.error || result.message || result.details || 'No se pudo cargar la información.')
          }
          setUser(null)
          return
        }

        setUser(result.user)
        setPhotoPreview(result.user.photo_url ?? null)
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError(`Ocurrió un error al cargar la información: ${err?.message || 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id, supabase])

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Selecciona una imagen JPG, PNG o WebP.')
      return
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      setError('La foto no puede superar 1 MB.')
      return
    }

    setPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setError(null)
    setSuccess(null)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleDeletePhoto = async () => {
    if (!id || !isOwnProfile) return

    if (!confirm('¿Estás seguro de que quieres quitar tu foto de perfil?')) {
      return
    }

    setUploadingPhoto(true)
    setError(null)
    setSuccess(null)

    try {
      // Actualizar el perfil para quitar la foto
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          photoUrl: null,
        }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo quitar la foto.')
      }

      // Actualizar el estado del usuario
      setUser({ ...result.user, photo_url: null })
      setPhotoPreview(null)
      setPhotoFile(null)
      setSuccess('Foto eliminada correctamente.')
      
      // Recargar la página después de un momento
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error('Error deleting photo:', err)
      setError(err.message || 'Ocurrió un error al quitar la foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile || !id) return

    setUploadingPhoto(true)
    setError(null)
    setSuccess(null)

    try {
      // Usar el endpoint API para subir la foto (evita problemas de RLS)
      const formData = new FormData()
      formData.append('file', photoFile)

      const response = await fetch(`/api/users/${id}/upload-photo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'No se pudo subir la foto.')
      }

      // Actualizar el estado del usuario con la nueva foto
      const photoUrl = result.photoUrl
      setUser({ ...user!, photo_url: photoUrl })
      setPhotoPreview(photoUrl)
      setPhotoFile(null)
      setSuccess('Foto actualizada correctamente.')
      
      // Recargar la página después de un momento para reflejar los cambios
      setTimeout(() => {
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error('Error uploading photo:', err)
      setError(err.message || 'Ocurrió un error al subir la foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <p className="text-red-600">ID de usuario no proporcionado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        {user && (isOwnProfile || currentUserProfile?.role === 'admin') && (
          <Link
            href={`/dashboard/usuarios/${user.id}/editar`}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PenSquare className="w-4 h-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Detalle del Usuario</h1>

        {loading && (
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando información...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && success && (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <span>{success}</span>
          </div>
        )}

        {!loading && !error && user && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt={user.full_name || user.email}
                      className="h-full w-full object-cover"
                    />
                  ) : user.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photo_url}
                      alt={user.full_name || user.email}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                      {(user.full_name || user.email)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <label className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-lg transition-colors" title="Cambiar foto">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </label>
                    {user.photo_url && !photoFile && (
                      <button
                        onClick={handleDeletePhoto}
                        disabled={uploadingPhoto}
                        className="cursor-pointer bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Quitar foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.full_name || '-'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              {isOwnProfile && photoFile && (
                <div className="flex flex-col items-center gap-2 w-full max-w-md">
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Guardar foto
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vista previa. Haz clic en "Guardar foto" para aplicar los cambios.</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">UID</p>
                <p className="font-mono text-gray-900 dark:text-gray-100">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rol</p>
                <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Creado</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(user.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Actualizado</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(user.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

