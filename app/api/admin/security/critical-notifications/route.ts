import { NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { esNotificacionCambioRol } from '@/lib/notifications'
import { isProfileAdminRole } from '@/lib/is-profile-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdmin() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !isProfileAdminRole(profile.role)) {
    return { error: 'No autorizado', status: 403 } as const
  }

  return { userId: session.user.id } as const
}

/** Notificaciones de seguridad (sistema + urgente) del usuario actual */
export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const { data: rows, error } = await adminClient
      .from('notificaciones')
      .select('id, titulo, mensaje, leida, prioridad, tipo_notificacion, fecha_creacion, datos_adicionales')
      .eq('usuario_id', adminCheck.userId)
      .eq('tipo_notificacion', 'sistema')
      .eq('prioridad', 'urgente')
      .order('fecha_creacion', { ascending: false })
      .limit(25)

    if (error) {
      console.error('Error leyendo notificaciones críticas:', error)
      return NextResponse.json({ error: 'Error al cargar notificaciones' }, { status: 500 })
    }

    const list = (rows || []).filter(
      (r) => !esNotificacionCambioRol({ titulo: r.titulo, datos_adicionales: r.datos_adicionales })
    )
    const unreadCount = list.filter((r) => !r.leida).length

    return NextResponse.json({
      items: list,
      unreadCount,
    })
  } catch (e) {
    console.error('GET critical-notifications:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
