'use client'

import { useState, useEffect } from 'react'
import { NotificationService, type Notificacion } from './notifications'
import { useAuth } from './auth'

export function useNotifications() {
  const { user } = useAuth()
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadNotificaciones()
      // Recargar notificaciones cada 30 segundos
      const interval = setInterval(loadNotificaciones, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const loadNotificaciones = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [todas, noLeidas] = await Promise.all([
        NotificationService.getNotificaciones(user.id, 10),
        NotificationService.getNotificacionesNoLeidas(user.id)
      ])
      
      setNotificaciones(todas)
      setNotificacionesNoLeidas(noLeidas.length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await NotificationService.marcarComoLeida(notificacionId)
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, leida: true, fecha_lectura: new Date().toISOString() }
            : notif
        )
      )
      setNotificacionesNoLeidas(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    if (!user?.id) return

    try {
      await NotificationService.marcarTodasComoLeidas(user.id)
      setNotificaciones(prev => 
        prev.map(notif => ({ ...notif, leida: true, fecha_lectura: new Date().toISOString() }))
      )
      setNotificacionesNoLeidas(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const eliminarNotificacion = async (notificacionId: string) => {
    try {
      await NotificationService.eliminarNotificacion(notificacionId)
      setNotificaciones(prev => prev.filter(notif => notif.id !== notificacionId))
      // Verificar si era no leída para actualizar el contador
      const notificacion = notificaciones.find(n => n.id === notificacionId)
      if (notificacion && !notificacion.leida) {
        setNotificacionesNoLeidas(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const crearNotificacion = async (
    tipo: Notificacion['tipo_notificacion'],
    titulo: string,
    mensaje: string,
    datosAdicionales?: any,
    prioridad: Notificacion['prioridad'] = 'media'
  ) => {
    if (!user?.id) return

    try {
      const id = await NotificationService.crearNotificacion(
        user.id,
        tipo,
        titulo,
        mensaje,
        datosAdicionales,
        prioridad
      )
      
      // Recargar notificaciones para mostrar la nueva
      loadNotificaciones()
      return id
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  return {
    notificaciones,
    notificacionesNoLeidas,
    loading,
    loadNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    crearNotificacion
  }
}

