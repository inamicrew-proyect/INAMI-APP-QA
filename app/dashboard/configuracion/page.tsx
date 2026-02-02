'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Palette, Bell, Shield, ShieldOff, Lock, Sun, Moon, CheckCircle } from 'lucide-react'
import { useTheme } from '@/lib/useTheme'
import NotificationSettings from '@/components/NotificationSettings'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ConfiguracionPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const supabase = createClientComponentClient()
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  
  // Estados para 2FA
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null)
  const [checkingMfaStatus, setCheckingMfaStatus] = useState(true)

  // Estados para cambiar contraseña
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Verificar el estado de 2FA al cargar la página
  useEffect(() => {
    const checkMfaStatus = async () => {
      try {
        setCheckingMfaStatus(true)
        const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
        
        if (factorError) {
          console.error('Error verificando estado de 2FA:', factorError)
          setCheckingMfaStatus(false)
          return
        }

        const verifiedTotpFactor = factors?.all?.find(
          (factor) => factor.factor_type === 'totp' && factor.status === 'verified'
        )
        const hasVerifiedTotp = !!verifiedTotpFactor

        setMfaEnabled(hasVerifiedTotp)
        setEnrolledFactorId(verifiedTotpFactor?.id ?? null)
      } catch (err) {
        console.error('Error inesperado verificando 2FA:', err)
      } finally {
        setCheckingMfaStatus(false)
      }
    }

    checkMfaStatus()
  }, [supabase])

  // Función para activar 2FA
  const handleEnableMFA = async () => {
    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    })
    
    setMfaLoading(false)
    if (error) {
      setMfaError(error.message)
      return
    }

    if (data.type === 'totp') {
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
    } else {
      setMfaError('Error: Se recibió un tipo de factor inesperado: ' + data.type)
    }
  }

  // Función para verificar código 2FA
  const handleVerifyMFA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)

    const code = e.currentTarget.code.value
    if (!factorId || !code) {
      setMfaLoading(false)
      return
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    })

    setMfaLoading(false)
    if (error) {
      setMfaError("Código inválido. Inténtalo de nuevo.")
    } else {
      setMfaSuccess('¡Autenticación de 2 Factores activada exitosamente!')
      setQrCode(null)
      setFactorId(null)
      setMfaEnabled(true)
      setTimeout(() => {
        router.refresh()
      }, 2000)
    }
  }

  // Función para desactivar 2FA
  const handleDisableMFA = async () => {
    if (!enrolledFactorId) return
    if (!confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores? Tu cuenta tendrá menos seguridad.')) return

    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)

    const { error } = await supabase.auth.mfa.unenroll({
      factorId: enrolledFactorId,
    })

    setMfaLoading(false)
    if (error) {
      setMfaError(error.message)
    } else {
      setMfaSuccess('Autenticación de dos factores desactivada correctamente.')
      setMfaEnabled(false)
      setEnrolledFactorId(null)
      setTimeout(() => {
        setMfaSuccess(null)
        router.refresh()
      }, 2000)
    }
  }

  // Función para cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setPasswordLoading(true)

    try {
      // Actualizar contraseña
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        setPasswordError(error.message)
        setPasswordLoading(false)
        return
      }

      setPasswordSuccess('Contraseña actualizada exitosamente')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowChangePassword(false)
      
      setTimeout(() => {
        setPasswordSuccess(null)
      }, 3000)
    } catch (err: any) {
      setPasswordError(err.message || 'Error al cambiar la contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Configuración</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                Administra tus preferencias y configuración de la cuenta
              </p>
            </div>
          </div>
        </div>

        {/* Secciones de Configuración */}
        <div className="space-y-4">
          {/* Apariencia */}
          <div className="bg-stone-50 dark:bg-gray-800 rounded-xl border border-stone-200 dark:border-gray-700/50 p-6 hover:border-stone-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Apariencia</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Personaliza el tema de la aplicación
                </p>
                
                {/* Modo Oscuro */}
                <div className="bg-stone-100/50 dark:bg-gray-700/30 rounded-lg p-4 border border-stone-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                        Modo Oscuro
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cambiar entre tema claro y oscuro
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-50 dark:bg-gray-600 hover:bg-stone-100 dark:hover:bg-gray-500 transition-all border border-stone-200 dark:border-gray-500 shadow-sm hover:shadow"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Oscuro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="bg-stone-50 dark:bg-gray-800 rounded-xl border border-stone-200 dark:border-gray-700/50 p-6 hover:border-stone-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Notificaciones</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Gestiona tus preferencias de notificaciones
                </p>
                
                <button
                  onClick={() => setShowNotificationSettings(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Configurar Notificaciones
                </button>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-stone-50 dark:bg-gray-800 rounded-xl border border-stone-200 dark:border-gray-700/50 p-6 hover:border-stone-300 dark:hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5">Seguridad</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Configuraciones de seguridad de tu cuenta
                </p>
                
                <div className="space-y-4">
                  {/* Cambiar Contraseña */}
                  <div className="bg-stone-100/50 dark:bg-gray-700/30 rounded-lg p-4 border border-stone-200 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                          Cambiar Contraseña
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Actualiza tu contraseña para mantener tu cuenta segura
                        </p>
                      </div>
                      <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                      >
                        <Lock className="w-4 h-4" />
                        {showChangePassword ? 'Cancelar' : 'Cambiar Contraseña'}
                      </button>
                    </div>
                    
                    {showChangePassword && (
                      <form onSubmit={handleChangePassword} className="space-y-3 mt-4">
                        {passwordError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{passwordError}</p>
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">{passwordSuccess}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="input-field w-full"
                            required
                            minLength={6}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Confirmar Contraseña
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="input-field w-full"
                            required
                            minLength={6}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Autenticación de Dos Factores (2FA) */}
                  <div className="bg-stone-100/50 dark:bg-gray-700/30 rounded-lg p-4 border border-stone-200 dark:border-gray-700/50">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Autenticación de Dos Factores (2FA)
                        </h3>
                        {checkingMfaStatus ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Verificando...</span>
                        ) : mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Protege tu cuenta con una capa adicional de seguridad. Se te pedirá un código de Google Authenticator (u otra app compatible) cada vez que inicies sesión.
                      </p>
                    </div>

                    {checkingMfaStatus ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : mfaEnabled ? (
                      <>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Tu cuenta está protegida con autenticación de dos factores.
                          </p>
                        </div>
                        {mfaError && (
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{mfaError}</p>
                          </div>
                        )}
                        {mfaSuccess && (
                          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">{mfaSuccess}</p>
                          </div>
                        )}
                        <button
                          onClick={handleDisableMFA}
                          disabled={mfaLoading}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <ShieldOff className="w-4 h-4" />
                          {mfaLoading ? 'Desactivando...' : 'Desactivar 2FA'}
                        </button>
                      </>
                    ) : (
                      <>
                        {mfaError && (
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{mfaError}</p>
                          </div>
                        )}
                        {mfaSuccess && (
                          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">{mfaSuccess}</p>
                          </div>
                        )}
                        
                        {!qrCode && (
                          <button
                            onClick={handleEnableMFA}
                            disabled={mfaLoading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            {mfaLoading ? 'Generando...' : 'Activar 2FA'}
                          </button>
                        )}

                        {qrCode && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                1. Escanea este código QR con Google Authenticator:
                              </p>
                              <div 
                                className="p-4 bg-white dark:bg-gray-900 rounded-lg inline-block border border-gray-200 dark:border-gray-700"
                                dangerouslySetInnerHTML={{ __html: qrCode }} 
                              />
                            </div>
                            
                            <form onSubmit={handleVerifyMFA} className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  2. Ingresa el código de 6 dígitos que muestra Google Authenticator:
                                </label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    name="code"
                                    maxLength={6} 
                                    required 
                                    className="input-field flex-1 text-center tracking-[0.2em]"
                                    placeholder="123456"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                  />
                                  <button 
                                    type="submit" 
                                    disabled={mfaLoading} 
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {mfaLoading ? 'Verificando...' : 'Verificar'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuración de Notificaciones */}
      {showNotificationSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-stone-50 dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <NotificationSettings 
                showButton={false}
                showModal={showNotificationSettings}
                onClose={() => setShowNotificationSettings(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
