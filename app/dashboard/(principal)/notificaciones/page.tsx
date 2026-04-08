'use client'

import { useEffect, useState } from 'react'
import { Bell, Calendar, Clock, AlertCircle, Check, Trash2, Filter } from 'lucide-react'
import { useNotifications } from '@/lib/useNotifications'
import { useAuth } from '@/lib/auth'

export default function NotificacionesPage() {
  const { user, loading: authLoading } = useAuth()
  const {
    notificaciones,
    notificacionesNoLeidas,
    loading,
    loadNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion
  } = useNotifications()

  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'cita_proxima' | 'seguimiento_pendiente' | 'canceladas' | 'sistema'>('todas')
  const [syncing, setSyncing] = useState(false)

  const syncReminderNotifications = async () => {
    if (!user?.id) return
    try {
      setSyncing(true)
      const res = await fetch('/api/citas/notificar-proximas', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudieron generar recordatorios')
      }
      await loadNotificaciones({ toggleLoading: false })
    } catch (_error) {
      // Silencioso en UI: el centro de notificaciones refleja el estado actual.
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    syncReminderNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'cita_proxima':
        return <Calendar className="w-5 h-5 text-blue-500" />
      case 'seguimiento_pendiente':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'atencion_vencida':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'sistema':
        return <Bell className="w-5 h-5 text-gray-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'alta':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      case 'media':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      case 'baja':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  }

  const getLabelTipo = (tipo: string) => {
    switch (tipo) {
      case 'cita_proxima':
        return 'Cita Próxima'
      case 'seguimiento_pendiente':
        return 'Seguimiento Pendiente'
      case 'atencion_vencida':
        return 'Atención Vencida'
      case 'recordatorio_general':
        return 'Recordatorio General'
      case 'sistema':
        return 'Sistema'
      default:
        return tipo
    }
  }

  const notificacionesFiltradas = notificaciones.filter((notif) => {
    if (filtro === 'todas') return true
    if (filtro === 'no_leidas') return !notif.leida
    if (filtro === 'canceladas') return notif.datos_adicionales?.categoria === 'cita_cancelada'
    return notif.tipo_notificacion === filtro
  })

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Solo mostrar mensaje de login si no hay usuario Y no está cargando
  if (!user && !authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Debes iniciar sesión para ver las notificaciones</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Notificaciones
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Gestiona tus notificaciones y recordatorios del sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={syncReminderNotifications}
              disabled={syncing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-60"
            >
              {syncing ? 'Sincronizando...' : 'Generar recordatorios ahora'}
            </button>
            {notificacionesNoLeidas > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                className="btn-primary flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="flex gap-2">
            {[
              { key: 'todas', label: 'Todas', count: notificaciones.length },
              { key: 'no_leidas', label: 'No leídas', count: notificaciones.filter(n => !n.leida).length },
              { key: 'cita_proxima', label: 'Citas', count: notificaciones.filter(n => n.tipo_notificacion === 'cita_proxima').length },
              { key: 'seguimiento_pendiente', label: 'Seguimientos', count: notificaciones.filter(n => n.tipo_notificacion === 'seguimiento_pendiente').length },
              { key: 'canceladas', label: 'Canceladas', count: notificaciones.filter(n => n.datos_adicionales?.categoria === 'cita_cancelada').length },
              { key: 'sistema', label: 'Sistema', count: notificaciones.filter(n => n.tipo_notificacion === 'sistema').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFiltro(key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-stone-50 dark:bg-gray-800 rounded-lg shadow-sm border border-stone-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando notificaciones...</p>
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay notificaciones</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filtro === 'no_leidas' 
                ? 'No tienes notificaciones sin leer'
                : 'No hay notificaciones que coincidan con el filtro seleccionado'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notificacionesFiltradas.map((notificacion) => (
              <div
                key={notificacion.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  !notificacion.leida ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIconoTipo(notificacion.tipo_notificacion)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-medium ${!notificacion.leida ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notificacion.titulo}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getColorPrioridad(notificacion.prioridad)}`}>
                        {notificacion.prioridad}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {getLabelTipo(notificacion.tipo_notificacion)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notificacion.mensaje}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {new Date(notificacion.fecha_creacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notificacion.fecha_lectura && (
                          <span>
                            Leída: {new Date(notificacion.fecha_lectura).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notificacion.leida && (
                          <button
                            onClick={() => marcarComoLeida(notificacion.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarNotificacion(notificacion.id)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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

    </div>
  )
}

