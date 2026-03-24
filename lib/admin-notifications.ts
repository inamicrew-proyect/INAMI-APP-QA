import { getSupabaseAdmin } from '@/lib/supabase-admin'

/** Notificaciones de prioridad urgente a todos los perfiles con rol `admin` (seguridad / auditoría). */
export async function notifyAdminsCriticalSecurity(payload: {
  titulo: string
  mensaje: string
  datos_adicionales?: Record<string, unknown>
}): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) {
    console.warn('[notifyAdminsCriticalSecurity] Cliente admin no disponible')
    return
  }

  const { data: admins, error } = await admin.from('profiles').select('id').eq('role', 'admin')
  if (error) {
    console.error('[notifyAdminsCriticalSecurity] Error listando administradores:', error)
    return
  }
  if (!admins?.length) return

  const rows = admins.map((a) => ({
    usuario_id: a.id,
    tipo_notificacion: 'sistema' as const,
    titulo: payload.titulo,
    mensaje: payload.mensaje,
    datos_adicionales: payload.datos_adicionales ?? null,
    prioridad: 'urgente' as const,
    leida: false,
  }))

  const { error: insertError } = await admin.from('notificaciones').insert(rows)
  if (insertError) {
    console.error('[notifyAdminsCriticalSecurity] Error insertando notificaciones:', insertError)
  }
}
