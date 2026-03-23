'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-browser'
import { ACCOUNT_STATUSES, passwordSchema, userUpdateSchema } from '@/lib/validation/users'
import { useAuth } from '@/lib/auth'
import { formatZodErrors } from '@/lib/validation/utils'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'

type UserProfile = {
  id: string
  email: string
  full_name: string
  role: string
  photo_url?: string | null
  account_status?: string | null
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string | undefined
  const supabase = createClientComponentClient()
  const { hasAccess, loading: authLoading } = useAdminAccess()
  const { user: authUser } = useAuth()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [accountStatus, setAccountStatus] = useState<(typeof ACCOUNT_STATUSES)[number]>('activo')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const MAX_PROFILE_PHOTO_SIZE = 1024 * 1024 // 1 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const isEditingSelf = Boolean(authUser?.id && id && authUser.id === id)

  // Verificar que el usuario tiene acceso
  useEffect(() => {
    if (!authLoading && !hasAccess) {
      router.push('/dashboard')
    }
  }, [hasAccess, authLoading, router])

  // Cargar roles disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const response = await fetch('/api/admin/roles', {
          cache: 'no-store',
        })
        
        const result = await response.json()

        if (response.ok && result.roles) {
          const rolesList = result.roles
            .filter((r: any) => r.activo !== false)
            .map((r: any) => ({
              value: r.nombre,
              label: r.nombre.toUpperCase().replace(/_/g, ' '),
            }))
          setRoles(rolesList)
        }
      } catch (err) {
        console.error('Error loading roles:', err)
      } finally {
        setLoadingRoles(false)
      }
    }

    if (hasAccess) {
      fetchRoles()
    }
  }, [hasAccess])

  useEffect(() => {
    if (!id) return

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError('No autenticado. Vuelve a iniciar sesi?n.')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/users/${id}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || result.message || 'No se pudo cargar la informaci?n.')
          setUser(null)
          return
        }

        setUser(result.user)
        setFullName(result.user.full_name ?? '')
        setRole(result.user.role ?? '')
        const rawStatus = result.user.account_status ?? 'activo'
        setAccountStatus(
          ACCOUNT_STATUSES.includes(rawStatus as (typeof ACCOUNT_STATUSES)[number])
            ? (rawStatus as (typeof ACCOUNT_STATUSES)[number])
            : 'activo'
        )
        setNewPassword('')
        setConfirmPassword('')
        const existingPhoto = result.user.photo_url ?? null
        setPhotoUrl(existingPhoto)
        setPhotoPreview(existingPhoto)
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setError(`Ocurri? un error al cargar la informaci?n: ${err?.message || 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    if (hasAccess) {
      fetchUser()
    }
  }, [id, supabase, hasAccess])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!id) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (newPassword || confirmPassword) {
        if (!newPassword.trim() || !confirmPassword.trim()) {
          setError('Completa ambos campos de nueva contraseña o déjalos vacíos.')
          setSaving(false)
          return
        }
        if (newPassword !== confirmPassword) {
          setError('Las contraseñas nuevas no coinciden.')
          setSaving(false)
          return
        }
        const pwdCheck = passwordSchema.safeParse(newPassword)
        if (!pwdCheck.success) {
          const errs = formatZodErrors(pwdCheck.error)
          setError(errs[0] ?? 'La nueva contraseña no cumple los requisitos de seguridad.')
          setSaving(false)
          return
        }
      }

      const parsed = userUpdateSchema.safeParse({
        fullName,
        role,
        photoUrl: photoFile ? null : photoUrl,
      })

      if (!parsed.success) {
        const errors = formatZodErrors(parsed.error)
        const firstError = errors && errors.length > 0 ? errors[0] : 'Los datos del usuario no son v?lidos.'
        setError(firstError)
        setSaving(false)
        return
      }

      const sanitized = parsed.data
      setFullName(sanitized.fullName)
      setRole(sanitized.role)

      let uploadedPhotoUrl: string | null | undefined = photoUrl ?? null

      if (photoFile) {
        setUploadingPhoto(true)
        const fileExt = photoFile.name.split('.').pop()
        const safeExt = fileExt ? fileExt.toLowerCase() : 'jpg'
        const filePath = `fotos-usuarios/${id}.${safeExt}`

        const { error: uploadError } = await supabase.storage
          .from('fotos-usuarios')
          .upload(filePath, photoFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: photoFile.type,
          })

        if (uploadError) {
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('fotos-usuarios').getPublicUrl(filePath)

        uploadedPhotoUrl = publicUrl
        setPhotoUrl(publicUrl)
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('No autenticado. Vuelve a iniciar sesi?n.')
        setSaving(false)
        setUploadingPhoto(false)
        return
      }

      const bodyPayload: Record<string, unknown> = {
        fullName: sanitized.fullName,
        role: sanitized.role,
        photoUrl: uploadedPhotoUrl ?? null,
        accountStatus,
      }
      if (newPassword.trim().length > 0) {
        bodyPayload.password = newPassword
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(bodyPayload),
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No est?s autenticado. Por favor, inicia sesi?n nuevamente.')
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para editar usuarios. Solo los administradores pueden realizar esta acci?n.')
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.')
        }
        const detail = Array.isArray(result?.details) ? result.details[0] : null
        throw new Error(detail || result.error || result.details || 'No se pudo actualizar al usuario.')
      }

      setSuccess('Usuario actualizado correctamente.')
      setUser(result.user)
      const rs = result.user.account_status ?? 'activo'
      setAccountStatus(
        ACCOUNT_STATUSES.includes(rs as (typeof ACCOUNT_STATUSES)[number])
          ? (rs as (typeof ACCOUNT_STATUSES)[number])
          : 'activo'
      )
      setNewPassword('')
      setConfirmPassword('')
      setPhotoPreview(result.user.photo_url ?? null)
      setPhotoFile(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usuarios:updated'))
      }
      router.refresh()
      setTimeout(() => {
        router.push(`/dashboard/admin/usuarios/${id}`)
      }, 1000)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Ocurri? un error al actualizar.')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

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
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoUrl(null)
  }

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center">Cargando...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <p className="text-red-600 dark:text-red-300">ID de usuario no proporcionado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/dashboard/admin/usuarios/${id}`}
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Editar Usuario</h1>

        {loading && (
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando información...
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && user && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Foto del usuario" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-primary-600 dark:text-primary-400">
                    {(fullName || user.full_name || user.email)
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Foto de perfil</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="btn-secondary cursor-pointer">
                    Seleccionar foto
                    <input type="file" id="photo" name="photo" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  {photoPreview && (
                    <button type="button" className="btn-secondary" onClick={handleRemovePhoto}>
                      Quitar foto
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-300">Formatos aceptados: JPG, PNG. Tama?o recomendado 400x400 px.</p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Correo electr?nico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                disabled
                className="input-field bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Nombre completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Nombre completo del usuario"
                required
              />
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
              <label htmlFor="accountStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Estado de la cuenta
              </label>
              <select
                id="accountStatus"
                name="accountStatus"
                value={accountStatus}
                onChange={(e) =>
                  setAccountStatus(e.target.value as (typeof ACCOUNT_STATUSES)[number])
                }
                className="input-field"
              >
                <option value="activo">Activo — puede iniciar sesión y usar el sistema</option>
                <option value="inactivo">
                  Inactivo — no puede acceder (sesiones cerradas al guardar o al entrar al panel)
                </option>
                <option value="bloqueado">
                  Bloqueado — acceso denegado en el login (cuenta suspendida)
                </option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Solo administradores pueden cambiar este valor. &quot;Bloqueado&quot; aplica también el bloqueo en el
                sistema de autenticación.
              </p>
              {isEditingSelf && accountStatus !== 'activo' && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Estás modificando tu propia cuenta. Si te marcas como inactivo o bloqueado, podrías perder el acceso.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Rol</label>
              {loadingRoles ? (
                <div className="input-field bg-gray-100 dark:bg-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Cargando roles...
                </div>
              ) : (
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Nueva contraseña (opcional)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Deja en blanco para no cambiar la contraseña. Mínimo 8 caracteres, mayúsculas, minúsculas, números y
                  símbolos. Sin espacios.
                </p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                    >
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {uploadingPhoto && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploadingPhoto ? 'Subiendo foto...' : null}
            </div>

            <div className="flex items-center gap-4">
              <Link href={`/dashboard/admin/usuarios/${id}`} className="btn-secondary">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

