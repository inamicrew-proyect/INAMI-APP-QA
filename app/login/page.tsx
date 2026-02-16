'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// PASO 1.1: Importar el "auth helper" en lugar de tu "lib/auth"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  // PASO 1.2: Crear el cliente de Supabase específico para Client Components
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Verificar si viene de un cambio de contraseña exitoso
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('passwordChanged') === 'true') {
      setPasswordChanged(true)
      setError('')
      window.history.replaceState({}, '', '/login')
    }
    // Enlace de recuperación expirado o ya usado
    if (urlParams.get('recovery_expired') === '1') {
      setError('El enlace ha expirado o ya fue usado. Algunos correos abren el enlace en segundo plano y lo invalidan. Solicita uno nuevo y ábrelo directamente en el navegador (o copia la URL y pégala en una pestaña nueva).')
      setShowResetPassword(true)
      window.history.replaceState({}, '', '/login')
    }
    if (urlParams.get('recovery') === '1') {
      setShowResetPassword(true)
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  useEffect(() => {
    setMounted(true)

    // Manejar el callback de Supabase cuando llega con código o con token en el hash
    const handleAuthCallback = async () => {
      const currentOrigin = window.location.origin
      const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://qa.inamiunah.online'

      // Si el token viene en el hash (enlace de recuperación), ir al callback para procesarlo
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        if (hashParams.get('access_token') && hashParams.get('refresh_token')) {
          window.location.replace(currentOrigin + '/auth/callback' + window.location.hash)
          return
        }
      }

      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const type = urlParams.get('type')
      const currentHost = window.location.host

      // Si hay código y estamos en localhost, redirigir INMEDIATAMENTE a producción
      if (code && (currentHost.includes('localhost') || currentOrigin.includes('localhost'))) {
        if (type === 'recovery') {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}&type=recovery&next=/reset-password`)
        } else {
          window.location.replace(`${productionUrl}/auth/callback?code=${code}`)
        }
        return
      }

      // Si hay código pero no estamos en localhost, procesar normalmente
      if (code && type === 'recovery') {
        router.push(`/auth/callback?code=${code}&type=recovery&next=/reset-password`)
      } else if (code) {
        router.push(`/auth/callback?code=${code}`)
      }
    }

    handleAuthCallback()
  }, [router])

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-900"
        role="status"
        aria-label="Cargando"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white/80 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        let errorMessage = 'Credenciales incorrectas. Por favor, intenta de nuevo.'
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('invalid_credentials') ||
            error.message?.includes('Invalid email or password')) {
          errorMessage = 'Email o contraseña incorrectos. Verifica tus credenciales e intenta de nuevo.'
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Tu email no ha sido confirmado. Por favor, verifica tu correo electrónico.'
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Por favor, espera unos minutos antes de intentar de nuevo.'
        } else {
          errorMessage = `Error al iniciar sesión: ${error.message}`
        }
        setError(errorMessage)
        return
      }

      if (data?.user) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          try {
            await fetch('/api/admin/security/log-action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accion: 'login',
                entidad: 'usuarios',
                entidad_id: session.user.id,
                detalles: { email: session.user.email },
              }),
            })
          } catch (_) {}

          try {
            const profileResponse = await fetch('/api/auth/profile', { cache: 'no-store', credentials: 'include' })
            if (profileResponse.ok) {
              const profileResult = await profileResponse.json()
              if (profileResult.profile) {
                const { cacheProfile } = await import('@/lib/profile-cache')
                cacheProfile(profileResult.profile)
              }
            }
          } catch (_) {}
          await new Promise(resolve => setTimeout(resolve, 200))
          window.location.href = '/dashboard'
          return
        }
        setLoading(false)
        setError('Error al establecer la sesión. Por favor, intenta de nuevo.')
      }
    } catch (_) {
      setLoading(false)
      setError('Error inesperado. Por favor, intenta de nuevo.')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMessage('')
    setLoading(true)

    if (!email) {
      setResetMessage('Por favor ingrese su correo electrónico')
      setLoading(false)
      return
    }

    // Primero verificar si el usuario tiene preguntas secretas
    try {
      const questionsResponse = await fetch(`/api/security-questions/by-email?email=${encodeURIComponent(email)}`)
      const questionsResult = await questionsResponse.json()

      if (questionsResponse.ok && questionsResult.questions && questionsResult.questions.length > 0) {
        // El usuario tiene preguntas secretas, redirigir a esa página
        setLoading(false)
        router.push(`/reset-password?email=${encodeURIComponent(email)}`)
        return
      }
    } catch (error) {
      console.error('Error checking security questions:', error)
    }

    // Si no tiene preguntas secretas, usar el método tradicional por email
    // redirectTo debe ser la URL pública: si estás en localhost, el enlace del correo debe apuntar a producción
    // para que al hacer clic funcione (en localhost el enlace suele dar otp_expired por prefetch o entorno).
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /localhost|127\.0\.0\.1/.test(origin)
    const siteUrl =
      isLocalhost
        ? (process.env.NEXT_PUBLIC_SITE_URL && !/localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_SITE_URL)
            ? process.env.NEXT_PUBLIC_SITE_URL
            : 'https://qa.inamiunah.online')
        : (process.env.NEXT_PUBLIC_SITE_URL || origin || 'https://qa.inamiunah.online')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl.replace(/\/$/, '')}/auth/callback?type=recovery&next=/reset-password`,
      })

      if (error) {
        // Detectar error 429 (Too Many Requests)
        if (error.status === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('too many requests')) {
          setResetMessage('Has solicitado demasiados enlaces de recuperación. Por favor, espera unos minutos antes de intentar nuevamente. Si el problema persiste, verifica tu correo electrónico o contacta al administrador.')
        } else if (error.message?.toLowerCase().includes('rate limit')) {
          setResetMessage('Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.')
        } else {
          setResetMessage('Error al enviar el correo de recuperación. Verifique el email e intente nuevamente.')
        }
        console.error('Error al enviar correo de recuperación:', error)
      } else {
        setResetMessage('Se ha enviado un correo de recuperación a su email. Por favor, revise su bandeja de entrada.')
      }
    } catch (error: any) {
      console.error('Error inesperado al solicitar recuperación:', error)
      if (error?.status === 429 || error?.message?.includes('429')) {
        setResetMessage('Has solicitado demasiados enlaces de recuperación. Por favor, espera unos minutos antes de intentar nuevamente.')
      } else {
        setResetMessage('Error inesperado al enviar el correo de recuperación. Por favor, intente nuevamente más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/login-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Contenido con z-index para estar sobre el overlay */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo y header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white w-32 h-32 rounded-full shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white/50 hover:ring-white/80 transition-all duration-300 hover:scale-110 animate-float">
            <img
              src="/inami.png"
              alt="Logo INAMI"
              width={110}
              height={110}
              className="object-contain w-[110px] h-[110px] transition-transform duration-300"
              style={{ display: 'block' }}
              loading="eager"
            />
          </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-2xl animate-slide-in-right">
            INAMI
          </h1>
          <p className="text-white drop-shadow-lg text-lg font-semibold mb-2 animate-slide-in-left">
            Instituto Nacional para la Atención de Menores Infractores
          </p>
          <p className="text-white/90 text-sm mt-2 drop-shadow-md font-medium animate-fade-in">
            Sistema de Gestión de Atenciones
          </p>
        </div>

        {/* Formulario de login - Mejorado */}
        <div className="card-hover animate-scale-in backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Iniciar Sesión
          </h2>

          {passwordChanged && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Contraseña cambiada exitosamente. Por favor, inicia sesión con tu nueva contraseña.</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-center gap-3" role="status" aria-live="polite">
              <div className="spinner w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full" aria-hidden />
              <p className="text-sm font-medium text-primary-800">Iniciando sesión...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-4 ${loading ? 'pointer-events-none opacity-75' : ''}`}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="spinner w-4 h-4 border-2"></div>
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              El acceso está restringido al personal autorizado. Solicita asistencia al administrador
              institucional si necesitas una cuenta.
            </p>
            <div className="text-sm text-gray-600">
              ¿Olvidaste tu contraseña?{' '}
              <button
                onClick={() => setShowResetPassword(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Recupérala aquí
              </button>
            </div>
          </div>
        </div>

        {/* Modal de recuperación de contraseña */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recuperar Contraseña</h3>

              {resetMessage && !resetMessage.includes('Error') && !resetMessage.includes('Demasiadas') && !resetMessage.includes('espera') ? (
                <>
                  <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
                    {resetMessage}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    El enlace es válido 1 hora y solo puede usarse una vez. Al recibir el correo, haz clic en el botón o copia la URL y ábrela en el navegador (evita que el correo abra el enlace en segundo plano).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false)
                      setResetMessage('')
                    }}
                    className="w-full btn-primary"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <>
                  {resetMessage && (
                    <div
                      className={`mb-4 p-3 rounded-lg ${
                        resetMessage.includes('Error') || resetMessage.includes('Demasiadas') || resetMessage.includes('espera')
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-green-50 text-green-800 border border-green-200'
                      }`}
                    >
                      {resetMessage}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        id="resetEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        placeholder="tu@correo.com"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button type="submit" className="flex-1 btn-primary" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Correo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetPassword(false)
                          setResetMessage('')
                        }}
                        className="flex-1 btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      El enlace es válido 1 hora y solo puede usarse una vez. Al recibir el correo, haz clic en el botón o copia la URL y ábrela en el navegador (evita que el correo abra el enlace en segundo plano).
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm">
          <p>Gobierno de Honduras © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}