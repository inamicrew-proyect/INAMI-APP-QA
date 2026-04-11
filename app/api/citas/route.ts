import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Routes } from '@/lib/routes'
import { getRoleIdsForUser } from '@/lib/user-role-resolution'
import { isProfileAdminRole } from '@/lib/is-profile-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return { error: 'No autenticado', status: 401 } as const

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', session.user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  return { supabase, profile } as const
}

async function hasModulePermission(
  userId: string,
  action: 'puede_ver' | 'puede_crear' | 'puede_editar' | 'puede_eliminar'
) {
  const admin = getSupabaseAdmin()
  if (!admin) return false

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (isProfileAdminRole(profile?.role)) return true

  const { data: moduleRow } = await admin
    .from('modulos')
    .select('id')
    .eq('ruta', Routes.CITAS)
    .maybeSingle()
  if (!moduleRow?.id) return false

  const roleIds = await getRoleIdsForUser(admin, userId)
  if (roleIds.length === 0) return false

  const { data: permissionRow } = await admin
    .from('role_module_permissions')
    .select('id')
    .in('role_id', roleIds)
    .eq('modulo_id', moduleRow.id)
    .eq(action, true)
    .limit(1)
    .maybeSingle()

  return !!permissionRow
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth()
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    const canView = await hasModulePermission(authCheck.profile.id, 'puede_ver')
    if (!canView) {
      return NextResponse.json({ error: 'No autorizado para ver citas' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const uid = authCheck.profile.id
    const esAdmin = isProfileAdminRole(authCheck.profile.role)
    /** Listado completo de la agenda (p. ej. PDF vista general). Misma regla que admin: solo quien puede ver el módulo Citas. */
    const agendaCompleta =
      request.nextUrl.searchParams.get('vista') === 'agenda_completa'

    let citasQuery = admin
      .from('citas')
      .select(`
        *,
        joven:jovenes(id, nombres, apellidos),
        profesional:profiles!citas_profesional_id_fkey(id, full_name, role),
        solicitante:profiles!citas_solicitante_id_fkey(id, full_name, role)
      `)
      .order('fecha_cita', { ascending: true })

    if (!esAdmin && !agendaCompleta) {
      citasQuery = citasQuery.or(`profesional_id.eq.${uid},solicitante_id.eq.${uid}`)
    }

    const [citasRes, jovenesRes, profesionalesRes] = await Promise.all([
      citasQuery,
      admin
        .from('jovenes')
        .select('id, nombres, apellidos, estado')
        .eq('estado', 'activo')
        .order('nombres', { ascending: true }),
      admin
        .from('profiles')
        .select('id, full_name, role')
        .not('full_name', 'is', null)
        .order('full_name', { ascending: true }),
    ])

    if (citasRes.error) {
      return NextResponse.json({ error: citasRes.error.message }, { status: 500 })
    }
    if (jovenesRes.error) {
      return NextResponse.json({ error: jovenesRes.error.message }, { status: 500 })
    }
    if (profesionalesRes.error) {
      return NextResponse.json({ error: profesionalesRes.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      citas: citasRes.data ?? [],
      jovenes: jovenesRes.data ?? [],
      profesionales: profesionalesRes.data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al cargar citas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth()
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    const canCreate = await hasModulePermission(authCheck.profile.id, 'puede_crear')
    if (!canCreate) {
      return NextResponse.json({ error: 'No autorizado para crear citas' }, { status: 403 })
    }

    const { profile } = authCheck
    const body = await request.json()
    const { joven_id, profesional_id, fecha_cita, motivo } = body ?? {}

    if (!joven_id || !fecha_cita || !motivo) {
      return NextResponse.json(
        { error: 'joven_id, fecha_cita y motivo son requeridos' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const { data, error } = await admin
      .from('citas')
      .insert({
        joven_id,
        profesional_id: profesional_id || null,
        solicitante_id: profile.id,
        rol_solicitante: profile.role,
        fecha_cita,
        motivo,
        estado: 'pendiente',
        notificacion_cita_enviada: false,
        notificacion_seguimiento_enviada: false,
        notificacion_cancelada_enviada: false,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cita: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear cita' },
      { status: 500 }
    )
  }
}
