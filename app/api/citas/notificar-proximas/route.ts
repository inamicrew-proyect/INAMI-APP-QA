import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const DEFAULT_DAYS = 7

/** Encargado de la cita + administradores (vista global). Sin duplicar solicitante si no es quien atiende. */
async function getAdminUserIds(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<string[]> {
  const { data } = await admin.from('profiles').select('id').eq('role', 'admin')
  return (data ?? []).map((r) => r.id as string)
}

function recipientsParaNotificacionCita(
  cita: { profesional_id?: string | null; solicitante_id?: string | null },
  adminIds: string[]
): string[] {
  const ids = new Set<string>()
  if (cita.profesional_id) ids.add(cita.profesional_id)
  else if (cita.solicitante_id) ids.add(cita.solicitante_id)
  for (const id of adminIds) ids.add(id)
  return [...ids]
}

async function requireAuth() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return false
  return true
}

export async function POST(_request: NextRequest) {
  try {
    const isAuthenticated = await requireAuth()
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const { data: paramData } = await admin
      .from('parametros_mantenimiento')
      .select('valor_entero')
      .eq('clave', 'notificaciones_dias_visibles')
      .maybeSingle()
    const diasVisibles = Math.min(7, Math.max(1, Number(paramData?.valor_entero) || DEFAULT_DAYS))
    const fechaVencimiento = new Date(Date.now() + diasVisibles * 24 * 60 * 60 * 1000).toISOString()

    const adminIds = await getAdminUserIds(admin)

    const now = new Date()
    const next7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: citasPendientes, error: citasPendientesError } = await admin
      .from('citas')
      .select(`
        id,
        joven_id,
        solicitante_id,
        profesional_id,
        fecha_cita,
        motivo,
        joven:jovenes(nombres, apellidos)
      `)
      .eq('estado', 'pendiente')
      .eq('notificacion_cita_enviada', false)
      .lte('fecha_cita', next7d.toISOString())

    if (citasPendientesError) {
      return NextResponse.json({ error: citasPendientesError.message }, { status: 500 })
    }

    const { data: citasSeguimiento, error: citasSeguimientoError } = await admin
      .from('citas')
      .select(`
        id,
        joven_id,
        solicitante_id,
        profesional_id,
        fecha_cita,
        motivo,
        joven:jovenes(nombres, apellidos)
      `)
      .eq('estado', 'en_proceso')
      .eq('notificacion_seguimiento_enviada', false)
      .lte('fecha_cita', now.toISOString())

    if (citasSeguimientoError) {
      return NextResponse.json({ error: citasSeguimientoError.message }, { status: 500 })
    }

    const { data: citasCanceladas, error: citasCanceladasError } = await admin
      .from('citas')
      .select(`
        id,
        joven_id,
        solicitante_id,
        profesional_id,
        fecha_cita,
        motivo,
        joven:jovenes(nombres, apellidos)
      `)
      .eq('estado', 'cancelada')
      .eq('notificacion_cancelada_enviada', false)

    if (citasCanceladasError) {
      return NextResponse.json({ error: citasCanceladasError.message }, { status: 500 })
    }

    const pendingNotifications = (citasPendientes || []).flatMap((cita: any) => {
      const uniqueRecipients = recipientsParaNotificacionCita(cita, adminIds)
      const jovenNombre = `${cita.joven?.nombres ?? ''} ${cita.joven?.apellidos ?? ''}`.trim()
      const fechaTexto = new Date(cita.fecha_cita).toLocaleString('es-ES')

      return uniqueRecipients.map((usuario_id) => ({
        usuario_id,
        tipo_notificacion: 'cita_proxima',
        titulo: `Cita próxima: ${jovenNombre}`,
        mensaje: `Cita programada para ${fechaTexto}. Motivo: ${cita.motivo}`,
        prioridad: 'alta',
        datos_adicionales: { cita_id: cita.id, joven_id: cita.joven_id, fecha_cita: cita.fecha_cita },
        fecha_vencimiento: fechaVencimiento,
      }))
    })

    const seguimientoNotifications = (citasSeguimiento || []).flatMap((cita: any) => {
      const uniqueRecipients = recipientsParaNotificacionCita(cita, adminIds)
      const jovenNombre = `${cita.joven?.nombres ?? ''} ${cita.joven?.apellidos ?? ''}`.trim()
      const fechaTexto = new Date(cita.fecha_cita).toLocaleString('es-ES')

      return uniqueRecipients.map((usuario_id) => ({
        usuario_id,
        tipo_notificacion: 'seguimiento_pendiente',
        titulo: `Seguimiento pendiente: ${jovenNombre}`,
        mensaje: `La cita de ${fechaTexto} está en seguimiento y requiere atención. Motivo: ${cita.motivo}`,
        prioridad: 'urgente',
        datos_adicionales: { cita_id: cita.id, joven_id: cita.joven_id, fecha_cita: cita.fecha_cita },
        fecha_vencimiento: fechaVencimiento,
      }))
    })

    const notifications = [...pendingNotifications, ...seguimientoNotifications]
    const canceladasNotifications = (citasCanceladas || []).flatMap((cita: any) => {
      const uniqueRecipients = recipientsParaNotificacionCita(cita, adminIds)
      const jovenNombre = `${cita.joven?.nombres ?? ''} ${cita.joven?.apellidos ?? ''}`.trim()
      const fechaTexto = new Date(cita.fecha_cita).toLocaleString('es-ES')

      return uniqueRecipients.map((usuario_id) => ({
        usuario_id,
        tipo_notificacion: 'sistema',
        titulo: `Cita cancelada: ${jovenNombre}`,
        mensaje: `La cita de ${fechaTexto} fue cancelada. Motivo original: ${cita.motivo}`,
        prioridad: 'media',
        datos_adicionales: {
          categoria: 'cita_cancelada',
          cita_id: cita.id,
          joven_id: cita.joven_id,
          fecha_cita: cita.fecha_cita,
        },
        fecha_vencimiento: fechaVencimiento,
      }))
    })

    const notificationsToInsert = [...notifications, ...canceladasNotifications]
    if (notificationsToInsert.length > 0) {
      const { error: notificationError } = await admin.from('notificaciones').insert(notificationsToInsert)
      if (notificationError) {
        return NextResponse.json({ error: notificationError.message }, { status: 500 })
      }
    }

    const citaPendienteIds = (citasPendientes || []).map((c: any) => c.id)
    if (citaPendienteIds.length > 0) {
      const { error: updateErrorPendientes } = await admin
        .from('citas')
        .update({ notificacion_cita_enviada: true, notificacion_enviada: true })
        .in('id', citaPendienteIds)

      if (updateErrorPendientes) {
        return NextResponse.json({ error: updateErrorPendientes.message }, { status: 500 })
      }
    }

    const citaSeguimientoIds = (citasSeguimiento || []).map((c: any) => c.id)
    if (citaSeguimientoIds.length > 0) {
      const { error: updateErrorSeguimiento } = await admin
        .from('citas')
        .update({ notificacion_seguimiento_enviada: true })
        .in('id', citaSeguimientoIds)

      if (updateErrorSeguimiento) {
        return NextResponse.json({ error: updateErrorSeguimiento.message }, { status: 500 })
      }
    }

    const citaCanceladaIds = (citasCanceladas || []).map((c: any) => c.id)
    if (citaCanceladaIds.length > 0) {
      const { error: updateErrorCanceladas } = await admin
        .from('citas')
        .update({ notificacion_cancelada_enviada: true })
        .in('id', citaCanceladaIds)

      if (updateErrorCanceladas) {
        return NextResponse.json({ error: updateErrorCanceladas.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      processed: citaPendienteIds.length + citaSeguimientoIds.length + citaCanceladaIds.length,
      citas_pendientes_notificadas: citaPendienteIds.length,
      seguimientos_notificados: citaSeguimientoIds.length,
      canceladas_notificadas: citaCanceladaIds.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar notificaciones' },
      { status: 500 }
    )
  }
}
