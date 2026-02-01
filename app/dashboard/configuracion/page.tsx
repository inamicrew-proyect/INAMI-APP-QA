'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Palette, Bell, Shield, Lock, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/useTheme'
import { useAuth } from '@/lib/auth'
import NotificationSettings from '@/components/NotificationSettings'

export default function ConfiguracionPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { profile } = useAuth()
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const handleChangePassword = () => {
    router.push('/dashboard/seguridad')
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
                
                {/* Cambiar Contraseña */}
                <div className="bg-stone-100/50 dark:bg-gray-700/30 rounded-lg p-4 border border-stone-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                        Cambiar Contraseña
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Actualiza tu contraseña para mantener tu cuenta segura
                      </p>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                    >
                      <Lock className="w-4 h-4" />
                      Cambiar Contraseña
                    </button>
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
