import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const PARAM_KEY = 'notificaciones_dias_visibles'
const DEFAULT_DAYS = 7

async function requireAdmin() {
  const supabase = await createSupabaseRouteHandlerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No autenticado', status: 401 } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 } as const
  }
  return { userId: session.user.id } as const
}

export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data, error } = await admin
      .from('parametros_mantenimiento')
      .select('valor_entero')
      .eq('clave', PARAM_KEY)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const raw = data?.valor_entero ?? DEFAULT_DAYS
    const diasVisibles = Math.min(7, Math.max(1, Number(raw) || DEFAULT_DAYS))
    return NextResponse.json({ diasVisibles })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener parámetro' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const diasInput = Number(body?.diasVisibles)
    if (!Number.isFinite(diasInput)) {
      return NextResponse.json({ error: 'diasVisibles debe ser numérico' }, { status: 400 })
    }
    const diasVisibles = Math.min(7, Math.max(1, Math.floor(diasInput)))

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { error } = await admin
      .from('parametros_mantenimiento')
      .upsert({
        clave: PARAM_KEY,
        valor_entero: diasVisibles,
        descripcion: 'Días que una notificación permanece visible (máximo 7).',
        updated_by: adminCheck.userId,
      }, { onConflict: 'clave' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, diasVisibles })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar parámetro' },
      { status: 500 }
    )
  }
}
