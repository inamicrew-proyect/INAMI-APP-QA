import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
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
    const { accion, entidad, entidad_id, detalles } = body

    if (!accion) {
      return NextResponse.json({ error: 'Acción es requerida' }, { status: 400 })
    }

    // Obtener IP y User Agent de los headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Insertar log
    const { error } = await adminClient
      .from('system_logs')
      .insert({
        usuario_id: session.user.id,
        accion,
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
