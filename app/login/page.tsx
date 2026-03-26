'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// PASO 1.1: Importar el "auth helper" en lugar de tu "lib/auth"
import { createClientComponentClient } from '@/lib/supabase-browser'
import { userMustChangePassword } from '@/lib/auth-must-change-password'
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail, HelpCircle } from 'lucide-react'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // PASO 1.2: Crear el cliente de Supabase específico para Client Components
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [recoveryEmailSent, setRecoveryEmailSent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Razón de redirección: URL o cookie (la cookie la pone el middleware al redirigir por inactividad)
  const reasonFromUrl = searchParams.get('reason')
  const reasonFromCookie =
    typeof document !== 'undefined' && document.cookie.includes('login_reason=session_expired')
  const showSessionExpiredMessage = sessionExpired || reasonFromUrl === 'session_expired' || reasonFromCookie

  useEffect(() => {
    const reason = searchParams.get('reason') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('reason') : null)

    if (searchParams.get('passwordChanged') === 'true') {
      setPasswordChanged(true)
      setError('')
      window.history.replaceState({}, '', '/login')
      return
    }

    if (reason === 'session_expired') {
      setSessionExpired(true)
      setError('')
      window.history.replaceState({}, '', '/login')
      document.cookie = 'login_reason=; path=/; max-age=0'
    } else if (reason === 'account_inactive') {
      setError(
        'Tu cuenta está inactiva. No puedes acceder al sistema. Contacta a un administrador si necesitas reactivarla.'
      )
      window.history.replaceState({}, '', '/login')
    } else if (reason === 'account_blocked') {
      setError('Tu cuenta ha sido bloqueada. Contacta a un administrador si crees que es un error.')
      window.history.replaceState({}, '', '/login')
    } else if (reason === 'session_replaced') {
      setError('Tu sesión se ha cerrado porque la misma cuenta inició sesión en otro dispositivo. Vuelve a iniciar sesión si deseas continuar aquí.')
      window.history.replaceState({}, '', '/login')
    }

    if (searchParams.get('recovery_expired') === '1') {
      setError(
        'El enlace ha expirado o ya fue usado. Algunos correos abren el enlace en segundo plano y lo invalidan. Solicita uno nuevo y ábrelo directamente en el navegador (o copia la URL y pégala en una pestaña nueva).'
      )
      setShowResetPassword(true)
      setRecoveryEmailSent(false)
      setResetMessage('')
      window.history.replaceState({}, '', '/login')
    }
    if (searchParams.get('recovery') === '1') {
      setShowResetPassword(true)
      setRecoveryEmailSent(false)
      setResetMessage('')
      const em = searchParams.get('email')
      if (em) setEmail(em)
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

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
            const profileResponse = await fetch('/api/auth/profile', { cache: 'no-store', credentials: 'include' })
            if (profileResponse.ok) {
              const profileResult = await profileResponse.json()
              const st = profileResult.profile?.account_status ?? 'activo'
              if (st !== 'activo') {
                await supabase.auth.signOut()
                setLoading(false)
                setError(
                  st === 'bloqueado'
                    ? 'Tu cuenta ha sido bloqueada. Contacta a un administrador si crees que es un error.'
                    : 'Tu cuenta está inactiva. No puedes acceder al sistema. Contacta a un administrador si necesitas reactivarla.'
                )
                return
              }
              if (profileResult.profile) {
                const { cacheProfile } = await import('@/lib/profile-cache')
                cacheProfile(profileResult.profile)
              }
            }
          } catch (_) {}
          await new Promise(resolve => setTimeout(resolve, 200))
          // Iniciar contador de inactividad (30 min) para que el middleware no use una cookie antigua
          const maxAge = 30 * 60
          document.cookie = `last-activity=${Date.now()}; path=/; max-age=${maxAge}; samesite=lax`
          if (userMustChangePassword(session.user)) {
            window.location.href = '/cambiar-contrasena-inicial'
            return
          }
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

  const getRecoveryRedirectSiteUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const isLocalhost = /localhost|127\.0\.0\.1/.test(origin)
    return isLocalhost
      ? process.env.NEXT_PUBLIC_SITE_URL && !/localhost|127\.0\.0\.1/.test(process.env.NEXT_PUBLIC_SITE_URL)
        ? process.env.NEXT_PUBLIC_SITE_URL
        : 'https://qa.inamiunah.online'
      : process.env.NEXT_PUBLIC_SITE_URL || origin || 'https://qa.inamiunah.online'
  }

  /** Recuperación por enlace mágico al correo (el usuario elige este método explícitamente) */
  const handleRecoveryByEmail = async () => {
    setResetMessage('')
    setRecoveryEmailSent(false)
    setLoading(true)

    if (!email?.trim()) {
      setResetMessage('Por favor ingrese su correo electrónico')
      setLoading(false)
      return
    }

    const siteUrl = getRecoveryRedirectSiteUrl()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${String(siteUrl).replace(/\/$/, '')}/auth/callback?type=recovery&next=/reset-password`,
      })

      if (error) {
        if (error.status === 429 || error.message?.includes('429') || error.message?.toLowerCase().includes('too many requests')) {
          setResetMessage('Has solicitado demasiados enlaces de recuperación. Por favor, espera unos minutos antes de intentar nuevamente. Si el problema persiste, verifica tu correo electrónico o contacta al administrador.')
        } else if (error.message?.toLowerCase().includes('rate limit')) {
          setResetMessage('Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.')
        } else {
          setResetMessage('Error al enviar el correo de recuperación. Verifique el email e intente nuevamente.')
        }
        console.error('Error al enviar correo de recuperación:', error)
      } else {
        setRecoveryEmailSent(true)
        setResetMessage('Se ha enviado un correo de recuperación a su email. Por favor, revise su bandeja de entrada.')
      }
    } catch (error: unknown) {
      console.error('Error inesperado al solicitar recuperación:', error)
      const err = error as { status?: number; message?: string }
      if (err?.status === 429 || err?.message?.includes('429')) {
        setResetMessage('Has solicitado demasiados enlaces de recuperación. Por favor, espera unos minutos antes de intentar nuevamente.')
      } else {
        setResetMessage('Error inesperado al enviar el correo de recuperación. Por favor, intente nuevamente más tarde.')
      }
    } finally {
      setLoading(false)
    }
  }

  /** Recuperación respondiendo preguntas secretas (solo si están configuradas) */
  const handleRecoveryBySecretQuestions = async () => {
    setResetMessage('')
    setRecoveryEmailSent(false)
    setLoading(true)

    if (!email?.trim()) {
      setResetMessage('Por favor ingrese su correo electrónico')
      setLoading(false)
      return
    }

    try {
      const questionsResponse = await fetch(`/api/security-questions/by-email?email=${encodeURIComponent(email.trim())}`)
      const questionsResult = await questionsResponse.json()

      if (questionsResponse.ok && questionsResult.questions && questionsResult.questions.length > 0) {
        setShowResetPassword(false)
        setResetMessage('')
        router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`)
        return
      }

      setResetMessage(
        'Este correo no tiene preguntas secretas configuradas. Usa «Enlace por correo» o, si ya tienes cuenta, inicia sesión y configura las preguntas en Configuración.'
      )
    } catch (err) {
      console.error('Error checking security questions:', err)
      setResetMessage('No se pudieron comprobar las preguntas secretas. Intente de nuevo o use el enlace por correo.')
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

          {showSessionExpiredMessage && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                La sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente para continuar.
              </p>
            </div>
          )}

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
                type="button"
                onClick={() => {
                  setShowResetPassword(true)
                  setRecoveryEmailSent(false)
                  setResetMessage('')
                }}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Recuperar contraseña</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ingresa tu correo y elige cómo quieres continuar: enlace por email o preguntas secretas (si las configuraste).
              </p>

              {recoveryEmailSent ? (
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
                      setRecoveryEmailSent(false)
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
                      className={`mb-4 p-3 rounded-lg text-sm ${
                        resetMessage.includes('Error') ||
                        resetMessage.includes('Demasiadas') ||
                        resetMessage.includes('espera') ||
                        resetMessage.includes('no tiene preguntas') ||
                        resetMessage.includes('comprobar')
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-green-50 text-green-800 border border-green-200'
                      }`}
                    >
                      {resetMessage}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Correo electrónico
                      </label>
                      <input
                        id="resetEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        placeholder="tu@correo.com"
                        autoComplete="email"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleRecoveryByEmail}
                        disabled={loading}
                        className="flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-primary-200 bg-primary-50/50 hover:bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 text-left transition-colors disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <Mail className="w-5 h-5 text-primary-600 shrink-0" aria-hidden />
                          Enlace por correo
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Recibirás un email con un enlace para crear una nueva contraseña.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRecoveryBySecretQuestions}
                        disabled={loading}
                        className="flex flex-col items-start gap-1 p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/40 text-left transition-colors disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" aria-hidden />
                          Preguntas secretas
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Responde las preguntas que configuraste en tu cuenta (si aplica).
                        </span>
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Si no recuerdas el correo o no tienes preguntas configuradas, contacta al administrador institucional.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false)
                        setResetMessage('')
                        setRecoveryEmailSent(false)
                      }}
                      className="w-full btn-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}