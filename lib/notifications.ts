import { supabase } from './supabase'

export interface Notificacion {
  id: string
  usuario_id: string
  tipo_notificacion: 'cita_proxima' | 'seguimiento_pendiente' | 'atencion_vencida' | 'recordatorio_general' | 'sistema'
  titulo: string
  mensaje: string
  datos_adicionales?: any
  leida: boolean
  fecha_creacion: string
  fecha_lectura?: string
  fecha_vencimiento?: string
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  created_at: string
  updated_at: string
}

export interface ConfiguracionNotificaciones {
  id: string
  usuario_id: string
  notificaciones_email: boolean
  notificaciones_push: boolean
  recordatorios_citas: boolean
  recordatorios_seguimientos: boolean
  dias_anticipacion_citas: number
  dias_anticipacion_seguimientos: number
  horario_notificaciones: string
  created_at: string
  updated_at: string
}

export class NotificationService {
  // Obtener notificaciones del usuario
  static async getNotificaciones(usuarioId: string, limit: number = 50): Promise<Notificacion[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Obtener notificaciones no leídas
  static async getNotificacionesNoLeidas(usuarioId: string): Promise<Notificacion[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('leida', false)
      .order('fecha_creacion', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Marcar notificación como leída
  static async marcarComoLeida(notificacionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('notificaciones')
      .update({ 
        leida: true, 
        fecha_lectura: new Date().toISOString() 
      })
      .eq('id', notificacionId)
      .select()

    if (error) throw error
    return data && data.length > 0
  }

  // Marcar todas las notificaciones como leídas
  static async marcarTodasComoLeidas(usuarioId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notificaciones')
      .update({ 
        leida: true, 
        fecha_lectura: new Date().toISOString() 
      })
      .eq('usuario_id', usuarioId)
      .eq('leida', false)
      .select()

    if (error) throw error
    return true
  }

  // Crear notificación
  static async crearNotificacion(
    usuarioId: string,
    tipo: Notificacion['tipo_notificacion'],
    titulo: string,
    mensaje: string,
    datosAdicionales?: any,
    prioridad: Notificacion['prioridad'] = 'media',
    fechaVencimiento?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert({
        usuario_id: usuarioId,
        tipo_notificacion: tipo,
        titulo,
        mensaje,
        datos_adicionales: datosAdicionales,
        prioridad,
        fecha_vencimiento: fechaVencimiento
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  // Eliminar notificación
  static async eliminarNotificacion(notificacionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', notificacionId)

    if (error) throw error
    return true
  }

  // Eliminar notificaciones vencidas
  static async eliminarNotificacionesVencidas(usuarioId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('usuario_id', usuarioId)
      .lt('fecha_vencimiento', new Date().toISOString())

    if (error) throw error
    return true
  }

  // Obtener configuración de notificaciones del usuario
  static async getConfiguracion(usuarioId: string, supabaseClient?: any): Promise<ConfiguracionNotificaciones | null> {
    const client = supabaseClient || supabase
    try {
      const { data, error } = await client
        .from('configuraciones_notificaciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .maybeSingle()

      // Si no existe, retornar null en lugar de lanzar error
      if (error) {
        // Error PGRST116 significa "no rows returned" - esto es normal
        if (error.code === 'PGRST116') {
          return null
        }
        // Si es un error 406 o problemas de RLS, silenciar el error
        if (error.code === 'PGRST301' || error.message?.includes('406') || error.message?.includes('Not Acceptable')) {
          // Silenciar este error - la tabla puede no existir o no tener permisos
          return null
        }
        // Para otros errores, solo loguear pero no lanzar
        console.warn('Error loading notification config (non-critical):', error.message)
        return null
      }
      return data
    } catch (err: any) {
      // Capturar cualquier error y retornar null silenciosamente
      if (err?.message?.includes('406') || err?.code === 'PGRST301') {
        return null
      }
      console.warn('Error loading notification config (non-critical):', err?.message)
      return null
    }
  }

  // Crear o actualizar configuración de notificaciones
  static async guardarConfiguracion(
    usuarioId: string,
    configuracion: Partial<Omit<ConfiguracionNotificaciones, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>,
    supabaseClient?: any
  ): Promise<ConfiguracionNotificaciones> {
    const client = supabaseClient || supabase
    const { data, error } = await client
      .from('configuraciones_notificaciones')
      .upsert({
        usuario_id: usuarioId,
        ...configuracion
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving notification config:', error)
      // Si es un error 406, probablemente la tabla no existe o hay problemas de RLS
      if (error.code === 'PGRST301' || error.message?.includes('406')) {
        throw new Error('No se puede guardar la configuración. Verifica los permisos de la tabla configuraciones_notificaciones.')
      }
      throw error
    }
    return data
  }

  // Crear recordatorios automáticos
  static async crearRecordatoriosAutomaticos(): Promise<void> {
    const { error } = await supabase.rpc('crear_recordatorios_automaticos')
    if (error) throw error
  }

  // Obtener estadísticas de notificaciones
  static async getEstadisticas(usuarioId: string): Promise<{
    total: number
    noLeidas: number
    porTipo: Record<string, number>
    porPrioridad: Record<string, number>
  }> {
    const [notificaciones, noLeidas] = await Promise.all([
      this.getNotificaciones(usuarioId, 1000),
      this.getNotificacionesNoLeidas(usuarioId)
    ])

    const porTipo = notificaciones.reduce((acc, notif) => {
      acc[notif.tipo_notificacion] = (acc[notif.tipo_notificacion] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const porPrioridad = notificaciones.reduce((acc, notif) => {
      acc[notif.prioridad] = (acc[notif.prioridad] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: notificaciones.length,
      noLeidas: noLeidas.length,
      porTipo,
      porPrioridad
    }
  }

  // Crear notificación de cita próxima
  static async crearNotificacionCita(
    profesionalId: string,
    jovenNombre: string,
    jovenApellidos: string,
    fechaCita: string,
    atencionId: string,
    jovenId: string
  ): Promise<string> {
    return this.crearNotificacion(
      profesionalId,
      'cita_proxima',
      `Cita Próxima - ${jovenNombre} ${jovenApellidos}`,
      `Tienes una cita programada para el ${new Date(fechaCita).toLocaleDateString('es-ES')} con ${jovenNombre} ${jovenApellidos}`,
      {
        atencion_id: atencionId,
        joven_id: jovenId,
        fecha_cita: fechaCita
      },
      'alta',
      fechaCita
    )
  }

  // Crear notificación de seguimiento pendiente
  static async crearNotificacionSeguimiento(
    profesionalId: string,
    jovenNombre: string,
    jovenApellidos: string,
    fechaAtencion: string,
    atencionId: string,
    jovenId: string
  ): Promise<string> {
    return this.crearNotificacion(
      profesionalId,
      'seguimiento_pendiente',
      `Seguimiento Pendiente - ${jovenNombre} ${jovenApellidos}`,
      `Tienes un seguimiento pendiente desde el ${new Date(fechaAtencion).toLocaleDateString('es-ES')} para ${jovenNombre} ${jovenApellidos}`,
      {
        atencion_id: atencionId,
        joven_id: jovenId,
        fecha_atencion: fechaAtencion
      },
      'urgente',
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 día
    )
  }

  // Crear notificación del sistema
  static async crearNotificacionSistema(
    usuarioId: string,
    titulo: string,
    mensaje: string,
    prioridad: Notificacion['prioridad'] = 'media'
  ): Promise<string> {
    return this.crearNotificacion(
      usuarioId,
      'sistema',
      titulo,
      mensaje,
      null,
      prioridad
    )
  }
}

