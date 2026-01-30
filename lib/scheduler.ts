import { supabase } from './supabase'
import { NotificationService } from './notifications'

export class SchedulerService {
  // Programar recordatorios automáticos
  static async programarRecordatorios() {
    try {
      // Ejecutar la función de recordatorios automáticos
      await supabase.rpc('crear_recordatorios_automaticos')
      console.log('Recordatorios automáticos programados exitosamente')
    } catch (error) {
      console.error('Error programando recordatorios:', error)
      throw error
    }
  }

  // Crear recordatorio para una cita específica
  static async crearRecordatorioCita(
    profesionalId: string,
    jovenNombre: string,
    jovenApellidos: string,
    fechaCita: string,
    atencionId: string,
    jovenId: string
  ) {
    try {
      await NotificationService.crearNotificacionCita(
        profesionalId,
        jovenNombre,
        jovenApellidos,
        fechaCita,
        atencionId,
        jovenId
      )
    } catch (error) {
      console.error('Error creando recordatorio de cita:', error)
      throw error
    }
  }

  // Crear recordatorio para seguimiento pendiente
  static async crearRecordatorioSeguimiento(
    profesionalId: string,
    jovenNombre: string,
    jovenApellidos: string,
    fechaAtencion: string,
    atencionId: string,
    jovenId: string
  ) {
    try {
      await NotificationService.crearNotificacionSeguimiento(
        profesionalId,
        jovenNombre,
        jovenApellidos,
        fechaAtencion,
        atencionId,
        jovenId
      )
    } catch (error) {
      console.error('Error creando recordatorio de seguimiento:', error)
      throw error
    }
  }

  // Verificar y crear recordatorios para atenciones próximas
  static async verificarAtencionesProximas() {
    try {
      const { data: atenciones, error } = await supabase
        .from('atenciones')
        .select(`
          id,
          joven_id,
          profesional_id,
          proxima_cita,
          fecha_atencion,
          estado,
          jovenes!inner(nombres, apellidos),
          profesional:profiles!atenciones_profesional_id_fkey(full_name)
        `)
        .eq('estado', 'pendiente')
        .not('proxima_cita', 'is', null)
        .lte('proxima_cita', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Próximos 7 días

      if (error) throw error

      for (const atencion of atenciones || []) {
        // Verificar si ya existe una notificación para esta cita
        const { data: notificacionExistente } = await supabase
          .from('notificaciones')
          .select('id')
          .eq('usuario_id', atencion.profesional_id)
          .eq('tipo_notificacion', 'cita_proxima')
          .eq('datos_adicionales->>atencion_id', atencion.id)
          .single()

        if (!notificacionExistente) {
          const joven = Array.isArray(atencion.jovenes) ? atencion.jovenes[0] : atencion.jovenes
          await this.crearRecordatorioCita(
            atencion.profesional_id,
            joven?.nombres || 'Joven',
            joven?.apellidos || 'Sin apellidos',
            atencion.proxima_cita,
            atencion.id,
            atencion.joven_id
          )
        }
      }
    } catch (error) {
      console.error('Error verificando atenciones próximas:', error)
      throw error
    }
  }

  // Verificar y crear recordatorios para seguimientos pendientes
  static async verificarSeguimientosPendientes() {
    try {
      const { data: atenciones, error } = await supabase
        .from('atenciones')
        .select(`
          id,
          joven_id,
          profesional_id,
          fecha_atencion,
          estado,
          jovenes!inner(nombres, apellidos),
          profesional:profiles!atenciones_profesional_id_fkey(full_name)
        `)
        .eq('estado', 'pendiente')
        .lt('fecha_atencion', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()) // Hace más de 3 días

      if (error) throw error

      for (const atencion of atenciones || []) {
        // Verificar si ya existe una notificación para este seguimiento
        const { data: notificacionExistente } = await supabase
          .from('notificaciones')
          .select('id')
          .eq('usuario_id', atencion.profesional_id)
          .eq('tipo_notificacion', 'seguimiento_pendiente')
          .eq('datos_adicionales->>atencion_id', atencion.id)
          .single()

        if (!notificacionExistente) {
          const joven = Array.isArray(atencion.jovenes) ? atencion.jovenes[0] : atencion.jovenes
          await this.crearRecordatorioSeguimiento(
            atencion.profesional_id,
            joven?.nombres || 'Joven',
            joven?.apellidos || 'Sin apellidos',
            atencion.fecha_atencion,
            atencion.id,
            atencion.joven_id
          )
        }
      }
    } catch (error) {
      console.error('Error verificando seguimientos pendientes:', error)
      throw error
    }
  }

  // Ejecutar todas las verificaciones
  static async ejecutarVerificaciones() {
    try {
      await Promise.all([
        this.verificarAtencionesProximas(),
        this.verificarSeguimientosPendientes()
      ])
    } catch (error) {
      console.error('Error ejecutando verificaciones:', error)
      throw error
    }
  }

  // Limpiar notificaciones vencidas
  static async limpiarNotificacionesVencidas() {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .lt('fecha_vencimiento', new Date().toISOString())

      if (error) throw error
      console.log('Notificaciones vencidas eliminadas')
    } catch (error) {
      console.error('Error limpiando notificaciones vencidas:', error)
      throw error
    }
  }
}

