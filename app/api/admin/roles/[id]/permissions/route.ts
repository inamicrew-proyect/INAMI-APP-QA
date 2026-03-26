import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdmin() {
  const supabase = await createSupabaseRouteHandlerClient()
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

// GET: Obtener permisos de un rol
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const resolvedParams = await params
    const roleId = resolvedParams.id

    if (!roleId) {
      return NextResponse.json({ error: 'El ID del rol es requerido' }, { status: 400 })
    }

    const { supabase } = adminCheck

    const { data: permisos, error } = await supabase
      .from('role_module_permissions')
      .select(`
        *,
        modulos (
          id,
          nombre,
          descripcion,
          ruta,
          icono
        )
      `)
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching role permissions:', error)
      return NextResponse.json({ error: 'Error al obtener permisos del rol' }, { status: 500 })
    }

    return NextResponse.json({ permisos })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// POST: Crear o actualizar permisos de un rol
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const resolvedParams = await params
    const roleId = resolvedParams.id

    if (!roleId) {
      return NextResponse.json({ error: 'El ID del rol es requerido' }, { status: 400 })
    }

    const body = await request.json()
    const { moduloId, puedeVer, puedeCrear, puedeEditar, puedeEliminar } = body

    if (!moduloId) {
      return NextResponse.json({ error: 'El ID del módulo es requerido' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Crear alerta de seguridad
    try {
      await adminClient.from('security_alerts').insert({
        tipo_alerta: 'cambio_permisos',
        severidad: 'media',
        descripcion: `Permisos de rol actualizados por administrador`,
        detalles: {
          role_id: roleId,
          modulo_id: moduloId,
          permisos: {
            puede_ver: puedeVer,
            puede_crear: puedeCrear,
            puede_editar: puedeEditar,
            puede_eliminar: puedeEliminar,
          },
          otorgado_por: adminCheck.userId,
        },
      })
    } catch (alertError) {
      console.warn('Error creating security alert:', alertError)
    }

    const { data: permiso, error } = await adminClient
      .from('role_module_permissions')
      .upsert({
        role_id: roleId,
        modulo_id: moduloId,
        puede_ver: puedeVer || false,
        puede_crear: puedeCrear || false,
        puede_editar: puedeEditar || false,
        puede_eliminar: puedeEliminar || false,
      }, {
        onConflict: 'role_id,modulo_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating role permissions:', error)
      return NextResponse.json({ error: 'Error al actualizar permisos del rol' }, { status: 500 })
    }

    // Registrar bitácora: cambio de permisos del rol (para que aparezca en Seguridad)
    try {
      const ipAddress = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await adminClient.from('system_logs').insert({
        usuario_id: adminCheck.userId,
        accion: 'update_permissions',
        entidad: 'role_module_permissions',
        entidad_id: roleId,
        detalles: {
          module_id: moduloId,
          permissions: {
            puede_ver: puedeVer || false,
            puede_crear: puedeCrear || false,
            puede_editar: puedeEditar || false,
            puede_eliminar: puedeEliminar || false,
          },
          updated_by: adminCheck.userId,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    } catch (logError) {
      console.warn('No se pudo registrar log de cambio de permisos del rol:', logError)
    }

    return NextResponse.json({ permiso })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// DELETE: Eliminar permisos de un rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const resolvedParams = await params
    const roleId = resolvedParams.id

    const { searchParams } = new URL(request.url)
    const moduloId = searchParams.get('moduloId')

    if (!roleId || !moduloId) {
      return NextResponse.json({ error: 'El ID del rol y del módulo son requeridos' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const { error } = await adminClient
      .from('role_module_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('modulo_id', moduloId)

    if (error) {
      console.error('Error deleting role permissions:', error)
      return NextResponse.json({ error: 'Error al eliminar permisos del rol' }, { status: 500 })
    }

    // Registrar bitácora: eliminación de permisos del rol (en ese módulo)
    try {
      const ipAddress = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'

      await adminClient.from('system_logs').insert({
        usuario_id: adminCheck.userId,
        accion: 'update_permissions',
        entidad: 'role_module_permissions',
        entidad_id: roleId,
        detalles: {
          module_id: moduloId,
          permissions: {
            puede_ver: false,
            puede_crear: false,
            puede_editar: false,
            puede_eliminar: false,
          },
          updated_by: adminCheck.userId,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      })
    } catch (logError) {
      console.warn('No se pudo registrar log de eliminación de permisos del rol:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

