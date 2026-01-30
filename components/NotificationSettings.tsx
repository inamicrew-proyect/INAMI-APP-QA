'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Bell, Mail, Smartphone, Clock, Save, X, Shield, ArrowRight } from 'lucide-react'
import { NotificationService, type ConfiguracionNotificaciones } from '@/lib/notifications'
import { useAuth } from '@/lib/auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function NotificationSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [configuracion, setConfiguracion] = useState<ConfiguracionNotificaciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loadingMfa, setLoadingMfa] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadConfiguracion()
      checkMfaStatus()
    }
  }, [user?.id])

  const checkMfaStatus = async () => {
    if (!user?.id) return
    
    try {
      setLoadingMfa(true)
      const { data: factors, error } = await supabase.auth.mfa.listFactors()
      
      if (error) {
        console.error('Error checking MFA status:', error)
        return
      }
      
      // Verificar si hay un factor TOTP verificado
      const hasVerifiedTotp = factors.all?.some(
        (factor) => factor.factor_type === 'totp' && factor.status === 'verified'
      ) ?? false
      
      setMfaEnabled(hasVerifiedTotp)
    } catch (error) {
      console.error('Error checking MFA:', error)
    } finally {
      setLoadingMfa(false)
    }
  }

  const handleGoToSecurity = () => {
    setShowModal(false)
    router.push('/dashboard/seguridad')
  }

  const loadConfiguracion = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Pasar el cliente con sesión para que tenga los permisos correctos
      const data = await NotificationService.getConfiguracion(user.id, supabase)
      setConfiguracion(data)
    } catch (error) {
      console.error('Error loading configuration:', error)
      // Si hay error, usar configuración por defecto
      setConfiguracion(null)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async (nuevaConfig: Partial<ConfiguracionNotificaciones>) => {
    if (!user?.id) return

    try {
      setSaving(true)
      // Pasar el cliente con sesión para que tenga los permisos correctos
      const data = await NotificationService.guardarConfiguracion(user.id, nuevaConfig, supabase)
      setConfiguracion(data)
      setShowModal(false)
    } catch (error) {
      console.error('Error saving configuration:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const nuevaConfig = {
      notificaciones_email: formData.get('notificaciones_email') === 'on',
      notificaciones_push: formData.get('notificaciones_push') === 'on',
      recordatorios_citas: formData.get('recordatorios_citas') === 'on',
      recordatorios_seguimientos: formData.get('recordatorios_seguimientos') === 'on',
      dias_anticipacion_citas: parseInt(formData.get('dias_anticipacion_citas') as string),
      dias_anticipacion_seguimientos: parseInt(formData.get('dias_anticipacion_seguimientos') as string),
      horario_notificaciones: formData.get('horario_notificaciones') as string
    }

    guardarConfiguracion(nuevaConfig)
  }

  if (!user) return null

  return (
    <>
      {/* Botón para abrir configuración */}
      <button
        onClick={() => setShowModal(true)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Configurar notificaciones"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Modal de configuración */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Configuración de Notificaciones
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Cargando configuración...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Configuración general */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración General</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Notificaciones por Email</span>
                        </div>
                        <input
                          type="checkbox"
                          name="notificaciones_email"
                          defaultChecked={configuracion?.notificaciones_email ?? true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Notificaciones Push</span>
                        </div>
                        <input
                          type="checkbox"
                          name="notificaciones_push"
                          defaultChecked={configuracion?.notificaciones_push ?? true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recordatorios */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recordatorios</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Recordatorios de Citas</span>
                        </div>
                        <input
                          type="checkbox"
                          name="recordatorios_citas"
                          defaultChecked={configuracion?.recordatorios_citas ?? true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Recordatorios de Seguimientos</span>
                        </div>
                        <input
                          type="checkbox"
                          name="recordatorios_seguimientos"
                          defaultChecked={configuracion?.recordatorios_seguimientos ?? true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seguridad - Autenticación de Dos Factores */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Seguridad</h3>
                    
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Autenticación de Dos Factores (2FA)</span>
                        </div>
                        {!loadingMfa && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            mfaEnabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {mfaEnabled ? 'Activo' : 'Inactivo'}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3">
                        Protege tu cuenta con una capa adicional de seguridad. Se te pedirá un código de tu app de autenticación cada vez que inicies sesión.
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleGoToSecurity}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        {mfaEnabled ? 'Gestionar 2FA' : 'Activar 2FA'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Configuración avanzada */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración Avanzada</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Días de anticipación para citas
                        </label>
                        <input
                          type="number"
                          name="dias_anticipacion_citas"
                          min="1"
                          max="7"
                          defaultValue={configuracion?.dias_anticipacion_citas ?? 1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Días de anticipación para seguimientos
                        </label>
                        <input
                          type="number"
                          name="dias_anticipacion_seguimientos"
                          min="1"
                          max="30"
                          defaultValue={configuracion?.dias_anticipacion_seguimientos ?? 3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horario de notificaciones
                        </label>
                        <input
                          type="time"
                          name="horario_notificaciones"
                          defaultValue={configuracion?.horario_notificaciones ?? '09:00'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

