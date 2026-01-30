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

// POST: Sincronizar roles de usuarios (asignar roles basándose en profile.role)
export async function POST(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Obtener todos los usuarios
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, role')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
    }

    // Obtener todos los roles
    const { data: roles, error: rolesError } = await adminClient
      .from('roles')
      .select('id, nombre')

    if (rolesError) {
      console.error('Error fetching roles:', rolesError)
      return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
    }

    const rolesMap = new Map(roles?.map(r => [r.nombre, r.id]) || [])

    // Asignar roles a usuarios
    const assignments: Array<{ user_id: string; role_id: string }> = []
    let assigned = 0
    let skipped = 0

    for (const profile of profiles || []) {
      const roleId = rolesMap.get(profile.role)
      if (roleId) {
        // Verificar si ya tiene el rol asignado
        const { data: existing } = await adminClient
          .from('user_roles')
          .select('id')
          .eq('user_id', profile.id)
          .eq('role_id', roleId)
          .single()

        if (!existing) {
          assignments.push({ user_id: profile.id, role_id: roleId })
        } else {
          skipped++
        }
      }
    }

    // Insertar asignaciones
    if (assignments.length > 0) {
      const { error: insertError } = await adminClient
        .from('user_roles')
        .insert(assignments)

      if (insertError) {
        console.error('Error assigning roles:', insertError)
        return NextResponse.json({ error: 'Error al asignar roles' }, { status: 500 })
      }
      assigned = assignments.length
    }

    return NextResponse.json({
      success: true,
      assigned,
      skipped,
      total: profiles?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

