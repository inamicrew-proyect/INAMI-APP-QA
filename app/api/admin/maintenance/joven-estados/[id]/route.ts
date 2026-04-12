import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { countJovenesWithEstado } from '@/lib/joven-estados-server'

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

const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { id } = await params
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const orden = Number(body.orden)
    const activo = body.activo !== false
    const cuenta_como_activo = body.cuenta_como_activo === true

    if (!nombre || nombre.length > 120) {
      return NextResponse.json({ error: 'Nombre obligatorio (máx. 120 caracteres).' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data, error } = await admin
      .from('estados_joven')
      .update({
        nombre,
        orden: Number.isFinite(orden) ? Math.floor(orden) : 0,
        activo,
        cuenta_como_activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, codigo, nombre, orden, activo, cuenta_como_activo')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Estado no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { id } = await params
    if (!id || !uuidRegex.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data: row, error: fetchErr } = await admin
      .from('estados_joven')
      .select('id, codigo')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Estado no encontrado' }, { status: 404 })
    }

    const n = await countJovenesWithEstado(admin, row.codigo)
    if (n > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${n} joven(es) con estado "${row.codigo}".` },
        { status: 409 }
      )
    }

    const { error } = await admin.from('estados_joven').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al eliminar estado' },
      { status: 500 }
    )
  }
}
