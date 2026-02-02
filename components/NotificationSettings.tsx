'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Settings, Bell, Mail, Smartphone, Clock, Save, X } from 'lucide-react'
import { NotificationService, type ConfiguracionNotificaciones } from '@/lib/notifications'
import { useAuth } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase-client'

interface NotificationSettingsProps {
  showButton?: boolean
  showModal?: boolean
  onClose?: () => void
}

export default function NotificationSettings({ 
  showButton = true, 
  showModal: externalShowModal,
  onClose 
}: NotificationSettingsProps = {}) {
  const { user } = useAuth()
  const supabase = getSupabaseClient()
  const [configuracion, setConfiguracion] = useState<ConfiguracionNotificaciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [internalShowModal, setInternalShowModal] = useState(false)

  // Usar el modal externo si se proporciona, sino usar el interno
  // IMPORTANTE: Solo mostrar el modal si es explícitamente true
  const showModal = externalShowModal !== undefined 
    ? Boolean(externalShowModal) 
    : Boolean(internalShowModal)
  
  const handleOpenModal = () => {
    if (externalShowModal !== undefined && onClose) {
      // Si es controlado externamente, no hacemos nada aquí
      return
    }
    setInternalShowModal(true)
  }
  
  const handleCloseModal = () => {
    if (externalShowModal !== undefined && onClose) {
      onClose()
    } else {
      setInternalShowModal(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadConfiguracion()
    }
  }, [user?.id])

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
      handleCloseModal()
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

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) return null

  const modalContent = showModal ? (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
      onClick={(e) => {
        // Cerrar modal al hacer clic fuera del contenido
        if (e.target === e.currentTarget) {
          handleCloseModal()
        }
      }}
    >
          <div 
            className="bg-stone-50 dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fijo */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Notificaciones
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando configuración...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} id="notification-settings-form" className="space-y-6">
                  {/* Configuración general */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Configuración General</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificaciones por Email</span>
                        </div>
                        <input
                          type="checkbox"
                          name="notificaciones_email"
                          defaultChecked={configuracion?.notificaciones_email ?? true}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificaciones Push</span>
                        </div>
                        <input
                          type="checkbox"
                          name="notificaciones_push"
                          defaultChecked={configuracion?.notificaciones_push ?? true}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recordatorios */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recordatorios</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recordatorios de Citas</span>
                        </div>
                        <input
                          type="checkbox"
                          name="recordatorios_citas"
                          defaultChecked={configuracion?.recordatorios_citas ?? true}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recordatorios de Seguimientos</span>
                        </div>
                        <input
                          type="checkbox"
                          name="recordatorios_seguimientos"
                          defaultChecked={configuracion?.recordatorios_seguimientos ?? true}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:bg-gray-700 dark:checked:bg-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuración avanzada */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Configuración Avanzada</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Días de anticipación para citas
                        </label>
                        <input
                          type="number"
                          name="dias_anticipacion_citas"
                          min="1"
                          max="7"
                          defaultValue={configuracion?.dias_anticipacion_citas ?? 1}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Días de anticipación para seguimientos
                        </label>
                        <input
                          type="number"
                          name="dias_anticipacion_seguimientos"
                          min="1"
                          max="30"
                          defaultValue={configuracion?.dias_anticipacion_seguimientos ?? 3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Horario de notificaciones
                        </label>
                        <input
                          type="time"
                          name="horario_notificaciones"
                          defaultValue={configuracion?.horario_notificaciones ?? '09:00'}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </form>
                )}
              </div>
            </div>

            {/* Footer fijo con botones */}
            {!loading && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-stone-50 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="notification-settings-form"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null

  return (
    <>
      {/* Botón para abrir configuración - solo si showButton es true */}
      {showButton && (
        <button
          onClick={handleOpenModal}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Configurar notificaciones"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Modal de configuración - Renderizar en portal para evitar problemas de z-index */}
      {mounted && typeof window !== 'undefined' && showModal && createPortal(
        modalContent,
        document.body
      )}
    </>
  )
}

