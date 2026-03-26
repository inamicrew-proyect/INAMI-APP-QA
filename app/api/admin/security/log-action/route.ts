import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const body = await request.json()
    const { accion, entidad, entidad_id, detalles, usuario_id: bodyUsuarioId } = body

    if (!accion) {
      return NextResponse.json({ error: 'Acción es requerida' }, { status: 400 })
    }

    // Usar siempre el usuario de la sesión; si no está disponible (p. ej. cookie aún no actualizada),
    // aceptar usuario_id del body solo si coincide con la sesión o la sesión no trae user.id
    const sessionUserId = session?.user?.id ?? null
    let userId = sessionUserId ?? bodyUsuarioId ?? null
    if (bodyUsuarioId && sessionUserId && bodyUsuarioId !== sessionUserId) {
      return NextResponse.json({ error: 'usuario_id no coincide con la sesión' }, { status: 403 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'No se pudo identificar al usuario. Vuelve a iniciar sesión si el problema continúa.' }, { status: 400 })
    }

    // Obtener IP y User Agent de los headers
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const accionNorm = String(accion).toLowerCase()

    // No registrar login/logout en la bitácora; solo auditoría de acciones relevantes.
    if (accionNorm === 'login' || accionNorm === 'logout') {
      return NextResponse.json({ success: true, ignored: true })
    }

    // Insertar log
    const { error } = await adminClient
      .from('system_logs')
      .insert({
        usuario_id: userId,
        accion: accion,
        entidad: entidad || null,
        entidad_id: entidad_id || null,
        detalles: detalles ? JSON.stringify(detalles) : null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Error registrando log:', error)
      return NextResponse.json({ error: 'Error al registrar log' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en POST /api/admin/security/log-action:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
