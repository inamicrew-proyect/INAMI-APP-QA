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

  return { supabase, userId: session.user.id } as const
}

export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { supabase } = adminCheck

    const { data: modulos, error } = await supabase
      .from('modulos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
      return NextResponse.json({ error: 'Error al obtener módulos' }, { status: 500 })
    }

    return NextResponse.json({ modulos })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { nombre, descripcion, ruta, icono, orden } = body

    if (!nombre || !ruta) {
      return NextResponse.json({ error: 'Nombre y ruta son requeridos' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const { data: modulo, error } = await adminClient
      .from('modulos')
      .insert({
        nombre,
        descripcion: descripcion || null,
        ruta,
        icono: icono || null,
        orden: orden || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating module:', error)
      return NextResponse.json({ error: 'Error al crear módulo' }, { status: 500 })
    }

    return NextResponse.json({ modulo })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

