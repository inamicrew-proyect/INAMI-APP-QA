'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Copy, Loader2, RefreshCcw, Save, ShieldCheck } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase-browser'
import { ACCOUNT_STATUSES, passwordSchema, userUpdateSchema } from '@/lib/validation/users'
import { useAuth } from '@/lib/auth'
import { formatZodErrors } from '@/lib/validation/utils'
import { useAdminAccess } from '@/lib/hooks/useAdminAccess'
import { generateTemporaryPassword } from '@/lib/generate-temporary-password'

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
  /** Error al cargar el usuario (sin formulario) */
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Errores generales al guardar (nombre, rol, API, etc.) */
  const [formError, setFormError] = useState<string | null>(null)
  /** Validación contraseña temporal (misma regla que crear usuario) */
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [confirmTempPassword, setConfirmTempPassword] = useState('')
  const [copiedTemp, setCopiedTemp] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [accountStatus, setAccountStatus] = useState<(typeof ACCOUNT_STATUSES)[number]>('activo')
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
      setLoadError(null)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setLoadError('No autenticado. Vuelve a iniciar sesión.')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/users/${id}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        
        const result = await response.json()

        if (!response.ok) {
          setLoadError(result.error || result.message || 'No se pudo cargar la información.')
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
        setTempPassword('')
        setConfirmTempPassword('')
        setCopiedTemp(false)
        const existingPhoto = result.user.photo_url ?? null
        setPhotoUrl(existingPhoto)
        setPhotoPreview(existingPhoto)
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setLoadError(`Ocurrió un error al cargar la información: ${err?.message || 'Error desconocido'}`)
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
    setFormError(null)
    setPasswordError(null)
    setSuccess(null)

    try {
      if (tempPassword.trim() || confirmTempPassword.trim()) {
        if (!tempPassword.trim() || !confirmTempPassword.trim()) {
          setPasswordError('Completa ambos campos de contraseña temporal o déjalos vacíos para no cambiarla.')
          setSaving(false)
          return
        }
        if (tempPassword !== confirmTempPassword) {
          setPasswordError('Las contraseñas temporales no coinciden.')
          setSaving(false)
          return
        }
        const pwdCheck = passwordSchema.safeParse(tempPassword)
        if (!pwdCheck.success) {
          const errs = formatZodErrors(pwdCheck.error)
          setPasswordError(errs[0] ?? 'La contraseña temporal no cumple los requisitos de seguridad.')
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
        const firstError = errors && errors.length > 0 ? errors[0] : 'Los datos del usuario no son válidos.'
        setFormError(firstError)
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
        setFormError('No autenticado. Vuelve a iniciar sesión.')
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
      if (tempPassword.trim().length > 0) {
        bodyPayload.password = tempPassword
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
      const assignedTemporaryPassword = tempPassword.trim().length > 0

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.')
        }
        if (response.status === 403) {
          throw new Error('No tienes permisos para editar usuarios. Solo los administradores pueden realizar esta acción.')
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.')
        }
        const detail = Array.isArray(result?.details) ? result.details[0] : null
        throw new Error(detail || result.error || result.details || 'No se pudo actualizar al usuario.')
      }

      setSuccess(
        assignedTemporaryPassword
          ? 'Usuario actualizado. Se asignó contraseña temporal: deberá cambiarla al iniciar sesión.'
          : 'Usuario actualizado correctamente.'
      )
      setUser(result.user)
      const rs = result.user.account_status ?? 'activo'
      setAccountStatus(
        ACCOUNT_STATUSES.includes(rs as (typeof ACCOUNT_STATUSES)[number])
          ? (rs as (typeof ACCOUNT_STATUSES)[number])
          : 'activo'
      )
      setTempPassword('')
      setConfirmTempPassword('')
      setCopiedTemp(false)
      setPhotoPreview(result.user.photo_url ?? null)
      setPhotoFile(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usuarios:updated'))
      }
      router.refresh()
    } catch (err) {
      console.error('Error updating user:', err)
      setFormError(err instanceof Error ? err.message : 'Ocurrió un error al actualizar.')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  const resetTempPasswordSuggestion = () => {
    const next = generateTemporaryPassword()
    setTempPassword(next)
    setConfirmTempPassword('')
    setPasswordError(null)
    setCopiedTemp(false)
  }

  const copyTempPassword = async () => {
    try {
      if (!tempPassword.trim()) return
      if (!navigator.clipboard?.writeText) {
        const textArea = document.createElement('textarea')
        textArea.value = tempPassword
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          setCopiedTemp(true)
          setTimeout(() => setCopiedTemp(false), 2000)
        } finally {
          document.body.removeChild(textArea)
        }
        return
      }
      await navigator.clipboard.writeText(tempPassword)
      setCopiedTemp(true)
      setTimeout(() => setCopiedTemp(false), 2000)
    } catch {
      setPasswordError('No se pudo copiar. Copia la contraseña manualmente.')
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError('Selecciona una imagen JPG, PNG o WebP.')
      return
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      setFormError('La foto no puede superar 1 MB.')
      return
    }

    setPhotoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setFormError(null)
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

        {!loading && !user && loadError && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {!loading && user && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {formError && (
              <div className="flex items-start gap-3 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{formError}</span>
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
                <p className="text-xs text-gray-500 dark:text-gray-300">Formatos aceptados: JPG, PNG. Tamaño recomendado 400x400 px.</p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Correo electrónico</label>
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

            <div className="rounded-lg border border-primary-100 bg-primary-50/80 dark:bg-primary-900/10 dark:border-primary-900/30 p-4 space-y-4">
              <div className="flex gap-3 text-sm text-primary-800 dark:text-primary-200">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Contraseña temporal (opcional)</p>
                  <p className="font-normal text-primary-700 dark:text-primary-300 mt-1">
                    Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
                    Sin espacios. Si guardas una contraseña temporal, el usuario deberá cambiarla al iniciar sesión.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/40 p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="tempPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Contraseña temporal
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="tempPassword"
                      name="tempPassword"
                      autoComplete="new-password"
                      value={tempPassword}
                      onChange={(e) => {
                        setTempPassword(e.target.value)
                        setPasswordError(null)
                      }}
                      className="input-field pr-24"
                      placeholder="Vacío = no cambiar"
                      minLength={8}
                      pattern="[^\s]+"
                      title="La contraseña no puede contener espacios"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                      <button
                        type="button"
                        onClick={copyTempPassword}
                        disabled={!tempPassword.trim()}
                        className="p-2 rounded-md text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/40 disabled:opacity-40"
                        title="Copiar contraseña"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={resetTempPasswordSuggestion}
                        className="p-2 rounded-md text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/40"
                        title="Generar nueva contraseña segura"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {copiedTemp && (
                    <p className="text-xs text-green-600 dark:text-green-400">Contraseña copiada al portapapeles.</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Usa «Generar» para una contraseña que cumple las reglas automáticamente. Compártela por un canal
                    seguro.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="confirmTempPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
                  >
                    Confirmar contraseña temporal
                  </label>
                  <input
                    type="text"
                    id="confirmTempPassword"
                    name="confirmTempPassword"
                    autoComplete="new-password"
                    value={confirmTempPassword}
                    onChange={(e) => {
                      setConfirmTempPassword(e.target.value)
                      setPasswordError(null)
                    }}
                    className="input-field"
                    placeholder="Repite la contraseña temporal"
                    minLength={8}
                  />
                </div>
                {passwordError && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>
              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm">
                  {success}
                </div>
              )}
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

