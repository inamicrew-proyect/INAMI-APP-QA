import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

  return { supabase, userId: session.user.id } as const
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const resuelta = searchParams.get('resuelta')
    const severidad = searchParams.get('severidad')

    const { supabase } = adminCheck

    let query = supabase
      .from('security_alerts')
      .select(`
        *,
        usuario:profiles!security_alerts_usuario_id_fkey (
          id,
          email,
          full_name
        ),
        resuelta_por_profile:profiles!security_alerts_resuelta_por_fkey (
          id,
          email,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (resuelta !== null) {
      query = query.eq('resuelta', resuelta === 'true')
    }

    if (severidad) {
      query = query.eq('severidad', severidad)
    }

    const { data: alertas, error } = await query

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 })
    }

    // Obtener total
    let countQuery = supabase
      .from('security_alerts')
      .select('*', { count: 'exact', head: true })

    if (resuelta !== null) {
      countQuery = countQuery.eq('resuelta', resuelta === 'true')
    }

    if (severidad) {
      countQuery = countQuery.eq('severidad', severidad)
    }

    const { count } = await countQuery

    return NextResponse.json({ alertas, total: count || 0 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { alertId, resuelta } = body

    if (!alertId) {
      return NextResponse.json({ error: 'alertId es requerido' }, { status: 400 })
    }

    const { supabase } = adminCheck

    const updateData: any = {}
    if (resuelta !== undefined) {
      updateData.resuelta = resuelta
      if (resuelta) {
        updateData.resuelta_por = adminCheck.userId
        updateData.fecha_resolucion = new Date().toISOString()
      } else {
        updateData.resuelta_por = null
        updateData.fecha_resolucion = null
      }
    }

    const { data: alerta, error } = await supabase
      .from('security_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json({ error: 'Error al actualizar alerta' }, { status: 500 })
    }

    return NextResponse.json({ alerta })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

