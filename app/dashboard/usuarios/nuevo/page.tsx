'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserPlus, ShieldCheck, Copy, RefreshCcw, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { userCreateSchema } from '@/lib/validation/users'
import { formatZodErrors } from '@/lib/validation/utils'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'pedagogo', label: 'Pedagogo' },
  { value: 'abogado', label: 'Abogado' },
  { value: 'medico', label: 'Médico' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'trabajador_social', label: 'Trabajador Social' },
  { value: 'seguridad', label: 'Seguridad' },
] as const

const generateSecurePassword = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  const length = 12
  let password = ''
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null

  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomValues = new Uint32Array(length)
    cryptoObj.getRandomValues(randomValues)
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length]
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
  }

  return password
}

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'seguridad',
    password: generateSecurePassword(),
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const MAX_PROFILE_PHOTO_SIZE = 1024 * 1024 // 1 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (successMessage) setSuccessMessage(null)
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('La foto debe ser JPG, PNG o WebP.')
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
  }

  const resetPasswordSuggestion = () => {
    const newPassword = generateSecurePassword()
    setFormData((prev) => ({ ...prev, password: newPassword, confirmPassword: '' }))
    setCopied(false)
  }

  const copyPassword = async () => {
    try {
      // Verificar que navigator.clipboard esté disponible
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = formData.password
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error('Error copying password with fallback:', err)
          setError('No se pudo copiar la contraseña. Por favor, cópiela manualmente.')
        } finally {
          document.body.removeChild(textArea)
        }
        return
      }

      await navigator.clipboard.writeText(formData.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying password:', err)
      setError('No se pudo copiar la contraseña. Por favor, cópiela manualmente.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      const parsedInput = userCreateSchema.safeParse({
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        photoUrl: null,
      })

      if (!parsedInput.success) {
        const errors = formatZodErrors(parsedInput.error)
        const firstError = errors && errors.length > 0 ? errors[0] : 'Los datos del usuario no son válidos.'
        setError(firstError)
        setSubmitting(false)
        return
      }

      const sanitizedInput = parsedInput.data
      setFormData((prev) => ({
        ...prev,
        fullName: sanitizedInput.fullName,
        email: sanitizedInput.email,
        role: sanitizedInput.role,
      }))

      let uploadedPhotoUrl: string | null = null

      if (photoFile) {
        setUploadingPhoto(true)
        const fileExt = photoFile.name.split('.').pop()
        const safeExt = fileExt ? fileExt.toLowerCase() : 'jpg'
        const randomId =
          typeof window !== 'undefined' && window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `${Date.now()}`
        const filePath = `fotos-usuarios/${randomId}.${safeExt}`

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
      }

      // La cookie se envía automáticamente, no necesitamos headers manuales
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: sanitizedInput.fullName,
          email: sanitizedInput.email,
          role: sanitizedInput.role,
          password: sanitizedInput.password,
          photoUrl: uploadedPhotoUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const detail = Array.isArray(result?.details) ? result.details[0] : null
        throw new Error(detail || result.error || 'No se pudo crear el usuario.')
      }

      setSuccessMessage('Usuario creado correctamente. Recuerda compartir las credenciales de forma segura.')
      setFormData((prev) => ({ ...prev, confirmPassword: '' }))
      setPhotoFile(null)
      setPhotoPreview(null)
      
      // Disparar evento para actualizar la lista de usuarios
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('usuarios:updated'))
      }
      
      setTimeout(() => {
        router.push('/dashboard/usuarios')
      }, 1500)
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Error inesperado al crear el usuario.')
    } finally {
      setSubmitting(false)
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard/usuarios"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="card space-y-8">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <UserPlus className="w-6 h-6 text-primary-600" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Crear usuario interno</h1>
            <p className="text-sm text-gray-600">
              Ingresa los datos del colaborador. La cuenta quedará activa al instante y se registrará a tu nombre.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-primary-100 bg-primary-50 p-4 text-sm text-primary-700 flex gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Buenas prácticas</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Comparte la contraseña temporal por un canal seguro y cambia el password al entregarla.</li>
              <li>Solicita al usuario actualizar su contraseña en el primer ingreso.</li>
              <li>Desactiva cuentas que ya no necesiten acceso desde el panel de usuarios.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="input-field"
                placeholder="Nombre y apellidos"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo institucional
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="input-field"
                placeholder="colaborador@inami.hn"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil (opcional)</label>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Vista previa" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-primary-600">
                      {formData.fullName
                        ? formData.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                        : 'IN'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="btn-secondary cursor-pointer">
                    Seleccionar foto
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                  {photoPreview && (
                    <button type="button" className="btn-secondary" onClick={handleRemovePhoto}>
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Se recomienda una imagen cuadrada (mínimo 300x300 px).</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol dentro del sistema
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="input-field"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contraseña temporal</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input-field pr-24"
                  required
                  minLength={8}
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-2 rounded-md text-primary-600 hover:bg-primary-100"
                    title="Copiar contraseña"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={resetPasswordSuggestion}
                    className="p-2 rounded-md text-primary-600 hover:bg-primary-100"
                    title="Generar nueva contraseña segura"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copied && <p className="text-xs text-green-600">Contraseña copiada al portapapeles.</p>}
              <p className="text-xs text-gray-500">
                Mínimo 10 caracteres, con mayúsculas, minúsculas, números y símbolos.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                type="text"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="input-field"
                required
                minLength={10}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {uploadingPhoto && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo foto...
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/usuarios" className="btn-secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registrando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
