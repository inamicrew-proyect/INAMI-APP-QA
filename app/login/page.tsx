'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// PASO 1.1: Importar el "auth helper" en lugar de tu "lib/auth"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Shield, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    setMounted(true)
    
    // Manejar el callback de Supabase cuando llega con código
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const type = urlParams.get('type')
      const currentHost = window.location.host
      const currentOrigin = window.location.origin
      const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'
      
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
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // PASO 1.3: Usar el nuevo cliente de Supabase para iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Credenciales incorrectas. Por favor, intenta de nuevo.')
    } else if (data?.user) {
      // Esperar un momento para que la sesión se establezca correctamente
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Verificar que la sesión esté activa antes de redirigir
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Usar window.location para forzar una recarga completa y asegurar que el middleware funcione correctamente
        window.location.href = '/dashboard'
      } else {
        setError('Error al establecer la sesión. Por favor, intenta de nuevo.')
      }
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
    // Usar la URL de producción (configurada en variable de entorno o hardcodeada como fallback)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/reset-password`,
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
        setShowResetPassword(false)
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

  // ... el resto de tu JSX (formularios, UI) no necesita cambiar ...
  // Pega el resto de tu return (...) aquí abajo
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/login-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Contenido con z-index para estar sobre el overlay */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo y header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Shield className="w-12 h-12 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">INAMI</h1>
          <p className="text-white text-opacity-90 drop-shadow-md">Instituto Nacional para la Atención de Menores Infractores</p>
          <p className="text-white text-opacity-80 text-sm mt-2 drop-shadow-md">Sistema de Gestión de Atenciones</p>
        </div>

        {/* Formulario de login */}
        <div className="card"> {/* Asumo que .card es una clase global tuya */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" // Asumo que .input-field es una clase global tuya
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed" // Asumo clases tuyas
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
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
              
              {resetMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  resetMessage.includes('Error') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
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
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Enviar Correo
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
              </form>
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