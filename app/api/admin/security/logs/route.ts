import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function requireAdmin() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 }
  }

  return { supabase } as const
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const accion = searchParams.get('accion')
    const entidad = searchParams.get('entidad')
    const usuarioId = searchParams.get('usuario_id')
    const usuarioSearch = searchParams.get('usuario') // Búsqueda por nombre/email
    const fechaDesde = searchParams.get('fecha_desde')
    const fechaHasta = searchParams.get('fecha_hasta')

    // Construir query base
    let query = adminClient
      .from('system_logs')
      .select(`
        *,
        usuario:profiles!system_logs_usuario_id_fkey (
          id,
          email,
          full_name,
          role
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtros (búsqueda parcial para mayor flexibilidad)
    if (accion) {
      query = query.ilike('accion', `%${accion}%`)
    }
    if (entidad) {
      query = query.ilike('entidad', `%${entidad}%`)
    }
    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId)
    }
    if (usuarioSearch) {
      // Buscar por nombre o email del usuario usando la relación
      // Primero obtenemos los IDs de usuarios que coincidan
      const { data: usuarios } = await adminClient
        .from('profiles')
        .select('id')
        .or(`full_name.ilike.%${usuarioSearch}%,email.ilike.%${usuarioSearch}%`)
      
      if (usuarios && usuarios.length > 0) {
        const userIds = usuarios.map(u => u.id)
        query = query.in('usuario_id', userIds)
      } else {
        // Si no hay usuarios que coincidan, retornar vacío
        query = query.eq('usuario_id', '00000000-0000-0000-0000-000000000000') // UUID inválido para no retornar nada
      }
    }
    if (fechaDesde) {
      query = query.gte('created_at', fechaDesde)
    }
    if (fechaHasta) {
      query = query.lte('created_at', fechaHasta)
    }

    // Aplicar paginación después de los filtros
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error obteniendo logs:', error)
      return NextResponse.json({ error: 'Error al obtener logs del sistema' }, { status: 500 })
    }

    // Formatear logs para incluir información del usuario
    const formattedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      accion: log.accion,
      entidad: log.entidad,
      entidad_id: log.entidad_id,
      detalles: typeof log.detalles === 'string' ? JSON.parse(log.detalles || '{}') : log.detalles,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
      usuario: log.usuario ? {
        id: log.usuario.id,
        email: log.usuario.email,
        full_name: log.usuario.full_name,
        role: log.usuario.role,
      } : null,
    }))

    return NextResponse.json({
      logs: formattedLogs,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error en GET /api/admin/security/logs:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
