import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdmin() {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 } as const
  }

  return { supabase } as const
}

export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    // Usar cliente admin para evitar problemas con RLS
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Obtener métricas del sistema usando cliente admin
    const [
      { count: totalUsuarios },
      { count: totalJovenes },
      { count: totalAtenciones },
      { count: alertasPendientes },
      { count: alertasCriticas },
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('jovenes').select('*', { count: 'exact', head: true }),
      adminClient.from('atenciones').select('*', { count: 'exact', head: true }),
      adminClient.from('security_alerts').select('*', { count: 'exact', head: true }).eq('resuelta', false),
      adminClient.from('security_alerts').select('*', { count: 'exact', head: true }).eq('resuelta', false).eq('severidad', 'critica'),
    ])

    // Obtener logs recientes (últimas 24 horas)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: logsRecientes } = await adminClient
      .from('system_logs')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    // Obtener usuarios activos (últimos 7 días)
    // Si hay logs de login, usarlos; si no, contar usuarios que han creado/actualizado algo recientemente
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Intentar obtener de logs de sistema
    const { data: usuariosActivosLogs } = await adminClient
      .from('system_logs')
      .select('usuario_id')
      .eq('accion', 'login')
      .gte('created_at', sevenDaysAgo.toISOString())

    let usuariosActivosUnicos: Set<string>
    
    if (usuariosActivosLogs && usuariosActivosLogs.length > 0) {
      // Si hay logs, usarlos
      usuariosActivosUnicos = new Set(usuariosActivosLogs.map(log => log.usuario_id).filter(Boolean))
    } else {
      // Si no hay logs, contar usuarios que han hecho alguna acción reciente (atenciones, actualizaciones, etc.)
      const { data: usuariosConActividad } = await adminClient
        .from('atenciones')
        .select('profesional_id')
        .gte('created_at', sevenDaysAgo.toISOString())
      
      const idsUnicos = new Set(usuariosConActividad?.map(a => a.profesional_id).filter(Boolean) || [])
      
      // También incluir usuarios que han actualizado su perfil recientemente
      const { data: usuariosActualizados } = await adminClient
        .from('profiles')
        .select('id')
        .gte('updated_at', sevenDaysAgo.toISOString())
      
      usuariosActualizados?.forEach(p => idsUnicos.add(p.id))
      
      usuariosActivosUnicos = idsUnicos
    }

    return NextResponse.json({
      metricas: {
        totalUsuarios: totalUsuarios || 0,
        totalJovenes: totalJovenes || 0,
        totalAtenciones: totalAtenciones || 0,
        alertasPendientes: alertasPendientes || 0,
        alertasCriticas: alertasCriticas || 0,
        usuariosActivos: usuariosActivosUnicos.size,
      },
      logsRecientes: logsRecientes || [],
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

