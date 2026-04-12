import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

const TIPOS = ['CPI', 'PAMSPL'] as const
type TipoCentro = (typeof TIPOS)[number]

function isTipoCentro(v: unknown): v is TipoCentro {
  return typeof v === 'string' && TIPOS.includes(v as TipoCentro)
}

async function requireAdmin() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { error: 'No autenticado', status: 401 } as const

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()

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
      .from('centros')
      .select('id, nombre, tipo, ubicacion, direccion, created_at')
      .order('nombre', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al listar centros' },
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

    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
    const ubicacion = typeof body.ubicacion === 'string' ? body.ubicacion.trim() : ''
    const direccionRaw = typeof body.direccion === 'string' ? body.direccion.trim() : ''
    const direccion = direccionRaw.length > 0 ? direccionRaw : null

    if (!nombre || nombre.length > 200) {
      return NextResponse.json({ error: 'Nombre obligatorio (máx. 200 caracteres).' }, { status: 400 })
    }
    if (!isTipoCentro(body.tipo)) {
      return NextResponse.json({ error: 'Tipo inválido: use CPI o PAMSPL.' }, { status: 400 })
    }
    if (ubicacion.length > 300) {
      return NextResponse.json({ error: 'Ubicación demasiado larga (máx. 300).' }, { status: 400 })
    }
    if (direccion && direccion.length > 500) {
      return NextResponse.json({ error: 'Dirección demasiado larga (máx. 500).' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })

    const { data, error } = await admin
      .from('centros')
      .insert({
        nombre,
        tipo: body.tipo,
        ubicacion,
        direccion,
      })
      .select('id, nombre, tipo, ubicacion, direccion, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al crear centro' },
      { status: 500 }
    )
  }
}
