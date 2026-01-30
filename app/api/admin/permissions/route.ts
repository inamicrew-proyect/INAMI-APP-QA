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

// GET: Obtener permisos de un usuario
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }

    const { supabase } = adminCheck

    const { data: permisos, error } = await supabase
      .from('user_module_permissions')
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
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching permissions:', error)
      return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
    }

    return NextResponse.json({ permisos })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// POST: Crear o actualizar permisos
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const body = await request.json()
    const { userId, moduloId, puedeVer, puedeCrear, puedeEditar, puedeEliminar } = body

    if (!userId || !moduloId) {
      return NextResponse.json({ error: 'userId y moduloId son requeridos' }, { status: 400 })
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
        usuario_id: userId,
        descripcion: `Permisos de módulo actualizados por administrador`,
        detalles: {
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
      .from('user_module_permissions')
      .upsert({
        user_id: userId,
        modulo_id: moduloId,
        puede_ver: puedeVer || false,
        puede_crear: puedeCrear || false,
        puede_editar: puedeEditar || false,
        puede_eliminar: puedeEliminar || false,
        granted_by: adminCheck.userId,
      }, {
        onConflict: 'user_id,modulo_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating permissions:', error)
      return NextResponse.json({ error: 'Error al actualizar permisos' }, { status: 500 })
    }

    return NextResponse.json({ permiso })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

// DELETE: Eliminar permisos
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const moduloId = searchParams.get('moduloId')

    if (!userId || !moduloId) {
      return NextResponse.json({ error: 'userId y moduloId son requeridos' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    const { error } = await adminClient
      .from('user_module_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('modulo_id', moduloId)

    if (error) {
      console.error('Error deleting permissions:', error)
      return NextResponse.json({ error: 'Error al eliminar permisos' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}

