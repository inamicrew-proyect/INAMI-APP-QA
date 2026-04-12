import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { listEstadosJovenRows, pickDefaultEstadoCodigo } from '@/lib/joven-estados-server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth() {
  const supabase = await createSupabaseRouteHandlerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No autenticado', status: 401 } as const
  return { supabase, session } as const
}

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const { rows, error } = await listEstadosJovenRows(admin)
    if (error) {
      return NextResponse.json(
        {
          estados: [],
          usingCatalog: false,
          defaultCodigo: 'activo',
          codigosCuentanComoActivos: ['activo'],
          warning: error,
        },
        { status: 200 }
      )
    }

    const usingCatalog = Boolean(rows && rows.length > 0)
    const defaultCodigo = pickDefaultEstadoCodigo(rows)
    const codigosCuentanComoActivos = (rows ?? [])
      .filter((r) => r.cuenta_como_activo)
      .map((r) => r.codigo)

    return NextResponse.json({
      estados: rows ?? [],
      usingCatalog,
      defaultCodigo,
      codigosCuentanComoActivos:
        codigosCuentanComoActivos.length > 0 ? codigosCuentanComoActivos : ['activo'],
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error al cargar estados' },
      { status: 500 }
    )
  }
}
