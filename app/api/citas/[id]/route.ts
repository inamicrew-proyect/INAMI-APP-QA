import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { Routes } from '@/lib/routes'
import { getRoleIdsForUser } from '@/lib/user-role-resolution'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth() {
  const supabase = await createSupabaseRouteHandlerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return { error: 'No autenticado', status: 401 } as const
  return { userId: session.user.id } as const
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
  if (profile?.role === 'admin') return true

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAuth()
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    const canEdit = await hasModulePermission(authCheck.userId, 'puede_editar')
    if (!canEdit) {
      return NextResponse.json({ error: 'No autorizado para editar citas' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID de cita inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { joven_id, profesional_id, fecha_cita, motivo, estado } = body ?? {}

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      notificacion_enviada: false,
      notificacion_cita_enviada: false,
      notificacion_seguimiento_enviada: false,
      notificacion_cancelada_enviada: false,
    }
    if (typeof joven_id !== 'undefined') updatePayload.joven_id = joven_id
    if (typeof profesional_id !== 'undefined') updatePayload.profesional_id = profesional_id || null
    if (typeof fecha_cita !== 'undefined') updatePayload.fecha_cita = fecha_cita
    if (typeof motivo !== 'undefined') updatePayload.motivo = motivo
    if (typeof estado !== 'undefined') updatePayload.estado = estado

    if (Object.keys(updatePayload).length === 2) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('citas')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cita: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAuth()
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }
    const canDelete = await hasModulePermission(authCheck.userId, 'puede_eliminar')
    if (!canDelete) {
      return NextResponse.json({ error: 'No autorizado para eliminar citas' }, { status: 403 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID de cita inválido' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Cliente admin no disponible' }, { status: 500 })
    }

    const { error } = await admin.from('citas').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar cita' },
      { status: 500 }
    )
  }
}
