import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { JOVEN_ESTADO_CODIGO_REGEX } from '@/lib/joven-estados'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

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

export async function GET() {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data, error } = await admin
      .from('estados_joven')
      .select('id, codigo, nombre, orden, activo, cuenta_como_activo, created_at, updated_at')
      .order('orden', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al listar estados' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }

    const codigo = typeof body.codigo === 'string' ? body.codigo.trim().toLowerCase() : ''
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const orden = Number(body.orden)
    const activo = body.activo !== false
    const cuenta_como_activo = body.cuenta_como_activo === true

    if (!codigo || !JOVEN_ESTADO_CODIGO_REGEX.test(codigo)) {
      return NextResponse.json(
        { error: 'Código inválido: use minúsculas, números o guión bajo (máx. 40).' },
        { status: 400 }
      )
    }
    if (!nombre || nombre.length > 120) {
      return NextResponse.json({ error: 'Nombre obligatorio (máx. 120 caracteres).' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data, error } = await admin
      .from('estados_joven')
      .insert({
        codigo,
        nombre,
        orden: Number.isFinite(orden) ? Math.floor(orden) : 0,
        activo,
        cuenta_como_activo,
        updated_at: new Date().toISOString(),
      })
      .select('id, codigo, nombre, orden, activo, cuenta_como_activo')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un estado con ese código.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al crear estado' },
      { status: 500 }
    )
  }
}
