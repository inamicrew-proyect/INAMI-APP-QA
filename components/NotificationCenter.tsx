'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Calendar, Clock, Trash2 } from 'lucide-react'
import { NotificationService, type Notificacion, type ConfiguracionNotificaciones } from '@/lib/notifications'
import { useAuth } from '@/lib/auth'

export default function NotificationCenter() {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [, setConfiguracion] = useState<ConfiguracionNotificaciones | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const loadNotificaciones = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await NotificationService.getNotificaciones(user.id, showAll ? 100 : 10)
      setNotificaciones(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConfiguracion = async () => {
    if (!user?.id) return

    try {
      const data = await NotificationService.getConfiguracion(user.id)
      setConfiguracion(data)
    } catch (error) {
      console.error('Error loading configuration:', error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadNotificaciones()
      loadConfiguracion()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, showAll])

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await NotificationService.marcarComoLeida(notificacionId)
      setNotificaciones((prev: Notificacion[]) => 
        prev.map((notif: Notificacion) => 
          notif.id === notificacionId 
            ? { ...notif, leida: true, fecha_lectura: new Date().toISOString() }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    if (!user?.id) return

    try {
      await NotificationService.marcarTodasComoLeidas(user.id)
      setNotificaciones((prev: Notificacion[]) => 
        prev.map((notif: Notificacion) => ({ ...notif, leida: true, fecha_lectura: new Date().toISOString() }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const eliminarNotificacion = async (notificacionId: string) => {
    try {
      await NotificationService.eliminarNotificacion(notificacionId)
      setNotificaciones((prev: Notificacion[]) => prev.filter((notif: Notificacion) => notif.id !== notificacionId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }


  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'cita_proxima':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'seguimiento_pendiente':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'atencion_vencida':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'sistema':
        return <Bell className="w-4 h-4 text-gray-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'media':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'baja':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const notificacionesNoLeidas = notificaciones.filter((n: Notificacion) => !n.leida).length

  if (!user) return null

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {showConfig && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAll ? 'Ver menos' : 'Ver todas'}
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando...</div>
            ) : notificaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notificaciones.map((notificacion: Notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 hover:bg-gray-50 ${!notificacion.leida ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIconoTipo(notificacion.tipo_notificacion)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${!notificacion.leida ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notificacion.titulo}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getColorPrioridad(notificacion.prioridad)}`}>
                            {notificacion.prioridad}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notificacion.mensaje}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(notificacion.fecha_creacion).toLocaleDateString('es-ES')}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {!notificacion.leida && (
                              <button
                                onClick={() => marcarComoLeida(notificacion.id)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Marcar como leída"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => eliminarNotificacion(notificacion.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={marcarTodasComoLeidas}
                disabled={notificacionesNoLeidas === 0}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Marcar todas como leídas
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

