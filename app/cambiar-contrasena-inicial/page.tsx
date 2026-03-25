'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-browser'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { userMustChangePassword } from '@/lib/auth-must-change-password'

/** Fuerza estilos de modo claro aunque <html> tenga class "dark" (mismo criterio que el dashboard en tema claro). */
const L = {
  screen:
    'min-h-screen bg-gray-50 dark:!bg-gray-50 text-gray-900 dark:!text-gray-900 flex items-center justify-center px-4 py-12',
  card:
    'card w-full max-w-md dark:!bg-white dark:!text-gray-900 dark:!border-gray-100 dark:!shadow-gray-200/40',
  title: 'text-2xl font-bold text-gray-900 dark:!text-gray-900',
  lead: 'text-sm text-gray-600 dark:!text-gray-600',
  label: 'block text-sm font-medium text-gray-700 dark:!text-gray-700 mb-1',
  input:
    'input-field pr-12 dark:!bg-white dark:!text-gray-900 dark:!border-gray-300 dark:!placeholder-gray-500',
  hint: 'text-xs text-gray-600 dark:!text-gray-600',
  errorWrap: 'mb-4 rounded-lg border border-red-200 bg-red-50 dark:!bg-red-50 px-3 py-2 text-sm text-red-800 dark:!text-red-800',
  iconBox: 'rounded-lg bg-primary-100 p-3 dark:!bg-primary-100',
  icon: 'w-8 h-8 text-primary-600 dark:!text-primary-600',
  eye: 'text-gray-500 hover:text-gray-800 dark:!text-gray-500 dark:hover:!text-gray-800',
  spinner: 'border-gray-200 border-t-primary-600 dark:!border-gray-200 dark:!border-t-primary-600',
}

export default function CambiarContraseñaInicialPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        router.replace('/login')
        return
      }
      if (!userMustChangePassword(session.user)) {
        router.replace('/dashboard')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mounted, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/first-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          Array.isArray(data.details) && data.details.length > 0
            ? data.details[0]
            : data.error || 'No se pudo cambiar la contraseña.'
        setError(msg)
        setLoading(false)
        return
      }
      await supabase.auth.signOut({ scope: 'global' })
      window.location.href = '/login?passwordChanged=true'
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className={L.screen} role="status">
        <div className={`h-12 w-12 animate-spin rounded-full border-4 ${L.spinner}`} />
      </div>
    )
  }

  return (
    <div className={L.screen}>
      <div className={L.card}>
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className={L.iconBox}>
            <Lock className={L.icon} aria-hidden />
          </div>
          <h1 className={L.title}>Cambiar contraseña temporal</h1>
          <p className={L.lead}>
            Por seguridad, define una contraseña nueva antes de continuar. Luego deberás iniciar sesión de
            nuevo.
          </p>
        </div>

        {error && (
          <div className={L.errorWrap} role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:!text-red-600" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current-pw" className={L.label}>
              Contraseña actual (temporal)
            </label>
            <div className="relative">
              <input
                id="current-pw"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={L.input}
                required
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${L.eye}`}
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="new-pw" className={L.label}>
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="new-pw"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={L.input}
                required
                minLength={8}
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${L.eye}`}
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-pw" className={L.label}>
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirm-pw"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={L.input}
                required
                minLength={8}
              />
              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${L.eye}`}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <p className={L.hint}>
            La nueva contraseña no puede ser igual a la temporal. Mínimo 8 caracteres, mayúscula, minúscula,
            número y un carácter especial. Sin espacios.
          </p>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Guardando…' : 'Guardar y cerrar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
