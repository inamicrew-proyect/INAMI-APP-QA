// app/api/atenciones/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdminOrProfesional(_request: NextRequest, atencionId: string) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const userId = session.user.id

  // Verificar si es admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  // Si es admin, permitir
  if (profile.role === 'admin') {
    return { supabase, profile, userId, isAdmin: true } as const
  }

  // Si no es admin, verificar que sea el creador de la atención (profesional_id)
  const { data: atencion, error: atencionError } = await supabase
    .from('atenciones')
    .select('profesional_id')
    .eq('id', atencionId)
    .single()

  if (atencionError || !atencion) {
    return { error: 'Atención no encontrada', status: 404 } as const
  }

  if (atencion.profesional_id !== userId) {
    return { error: 'No autorizado. Solo puedes editar las atenciones que creaste. Los administradores pueden editar cualquier atención.', status: 403 } as const
  }

  return { supabase, profile, userId, isAdmin: false } as const
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const authCheck = await requireAdminOrProfesional(request, id)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Si es admin, usar cliente admin directamente para evitar problemas de RLS
    let adminClient: ReturnType<typeof getSupabaseAdmin> = null
    try {
      adminClient = getSupabaseAdmin()
    } catch (err) {
      console.error('Error obteniendo cliente admin:', err)
    }

    if (authCheck.isAdmin && adminClient) {
      console.log('Eliminando con cliente admin (usuario es admin)')
      const { error: adminError, data: adminData } = await adminClient
        .from('atenciones')
        .delete()
        .eq('id', id)
        .select()

      if (adminError) {
        console.error('Error deleting with admin client:', adminError)
        return NextResponse.json({ 
          error: 'No se pudo eliminar la atención.',
          details: adminError.message 
        }, { status: 500 })
      }

      if (!adminData || adminData.length === 0) {
        return NextResponse.json({ 
          error: 'No se eliminó ninguna atención.',
          details: 'La atención puede que ya no exista.'
        }, { status: 404 })
      }

      // Registrar log de eliminación
      try {
        const atencionEliminada = adminData[0]
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.userId,
            accion: 'delete_atencion',
            entidad: 'atenciones',
            entidad_id: id,
            detalles: {
              joven_id: atencionEliminada.joven_id,
              tipo_atencion_id: atencionEliminada.tipo_atencion_id,
              profesional_id: atencionEliminada.profesional_id,
              motivo: atencionEliminada.motivo,
              deleted_by: authCheck.userId,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      } catch (logError) {
        console.error('Error registrando log de eliminación de atención:', logError)
        // No fallar la operación si el log falla
      }

      return NextResponse.json({ success: true, data: adminData })
    }

    // Si no es admin, usar el cliente con sesión
    const { supabase } = authCheck
    const { error: deleteError, data: deletedData } = await supabase
      .from('atenciones')
      .delete()
      .eq('id', id)
      .select()

    if (deleteError) {
      console.error('Error deleting atencion:', deleteError)
      return NextResponse.json({ 
        error: 'No se pudo eliminar la atención.',
        details: deleteError.message 
      }, { status: 500 })
    }

    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json({ 
        error: 'No se eliminó ninguna atención.',
        details: 'La atención puede que ya no exista o no tengas permisos para eliminarla.'
      }, { status: 404 })
    }

    // Registrar log de eliminación
    try {
      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        const atencionEliminada = deletedData[0]
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.userId,
            accion: 'delete_atencion',
            entidad: 'atenciones',
            entidad_id: id,
            detalles: {
              joven_id: atencionEliminada.joven_id,
              tipo_atencion_id: atencionEliminada.tipo_atencion_id,
              profesional_id: atencionEliminada.profesional_id,
              motivo: atencionEliminada.motivo,
              deleted_by: authCheck.userId,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      }
    } catch (logError) {
      console.error('Error registrando log de eliminación de atención:', logError)
      // No fallar la operación si el log falla
    }

    return NextResponse.json({ success: true, data: deletedData })
  } catch (error) {
    console.error('Error deleting atencion:', error)
    return NextResponse.json({ 
      error: 'Error al eliminar la atención.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const authCheck = await requireAdminOrProfesional(request, id)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar los campos que se envíen
    if (body.fecha_atencion !== undefined) updateData.fecha_atencion = body.fecha_atencion
    if (body.motivo !== undefined) updateData.motivo = body.motivo
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones || null
    if (body.recomendaciones !== undefined) updateData.recomendaciones = body.recomendaciones || null
    if (body.proxima_cita !== undefined) updateData.proxima_cita = body.proxima_cita || null
    if (body.estado !== undefined) updateData.estado = body.estado
    if (body.profesional_id !== undefined && authCheck.isAdmin) updateData.profesional_id = body.profesional_id

    // Si es admin, usar cliente admin directamente para evitar problemas de RLS
    let adminClient: ReturnType<typeof getSupabaseAdmin> = null
    try {
      adminClient = getSupabaseAdmin()
    } catch (err) {
      console.error('Error obteniendo cliente admin:', err)
    }

    if (authCheck.isAdmin && adminClient) {
      console.log('Actualizando con cliente admin (usuario es admin)')
      const { error: adminError, data: adminData } = await adminClient
        .from('atenciones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (adminError) {
        console.error('Error updating with admin client:', adminError)
        return NextResponse.json({ 
          error: 'No se pudo actualizar la atención.',
          details: adminError.message 
        }, { status: 500 })
      }

      if (!adminData) {
        return NextResponse.json({ 
          error: 'No se actualizó ninguna atención.',
          details: 'La atención puede que ya no exista.'
        }, { status: 404 })
      }

      // Registrar log de actualización
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.userId,
            accion: 'update_atencion',
            entidad: 'atenciones',
            entidad_id: id,
            detalles: {
              joven_id: adminData.joven_id,
              changes: updateData,
              updated_by: authCheck.userId,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      } catch (logError) {
        console.error('Error registrando log de actualización de atención:', logError)
        // No fallar la operación si el log falla
      }

      // Upsert formulario_especifico si viene en el body
      if (body.formulario_especifico !== undefined) {
        // ¿Existe registro?
        const { data: existingForm } = await adminClient
          .from('formularios_atencion')
          .select('id')
          .eq('atencion_id', id)
          .maybeSingle()

        if (existingForm?.id) {
          await adminClient
            .from('formularios_atencion')
            .update({ datos_json: body.formulario_especifico, updated_at: new Date().toISOString() })
            .eq('id', existingForm.id)
        } else {
          await adminClient
            .from('formularios_atencion')
            .insert({ atencion_id: id, datos_json: body.formulario_especifico })
        }
      }

      return NextResponse.json({ success: true, data: adminData })
    }

    // Si no es admin, usar el cliente con sesión
    const { supabase } = authCheck
    const { error: updateError, data: updatedData } = await supabase
      .from('atenciones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating atencion:', updateError)
      return NextResponse.json({ 
        error: 'No se pudo actualizar la atención.',
        details: updateError.message 
      }, { status: 500 })
    }

    if (!updatedData) {
      return NextResponse.json({ 
        error: 'No se actualizó ninguna atención.',
        details: 'La atención puede que ya no exista o no tengas permisos para actualizarla.'
      }, { status: 404 })
    }

    // Upsert formulario_especifico si viene en el body
    if (body.formulario_especifico !== undefined) {
      const { data: existingForm } = await supabase
        .from('formularios_atencion')
        .select('id')
        .eq('atencion_id', id)
        .maybeSingle()

      if (existingForm?.id) {
        await supabase
          .from('formularios_atencion')
          .update({ datos_json: body.formulario_especifico, updated_at: new Date().toISOString() })
          .eq('id', existingForm.id)
      } else {
        await supabase
          .from('formularios_atencion')
          .insert({ atencion_id: id, datos_json: body.formulario_especifico })
      }
    }

    // Registrar log de actualización
    try {
      const adminClient = getSupabaseAdmin()
      if (adminClient) {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        await adminClient
          .from('system_logs')
          .insert({
            usuario_id: authCheck.userId,
            accion: 'update_atencion',
            entidad: 'atenciones',
            entidad_id: id,
            detalles: {
              joven_id: updatedData.joven_id,
              changes: updateData,
              updated_by: authCheck.userId,
            },
            ip_address: ipAddress,
            user_agent: userAgent,
          })
      }
    } catch (logError) {
      console.error('Error registrando log de actualización de atención:', logError)
      // No fallar la operación si el log falla
    }

    return NextResponse.json({ success: true, data: updatedData })
  } catch (error: any) {
    console.error('Error updating atencion:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code
    })
    
    return NextResponse.json({ 
      error: 'Error al actualizar la atención.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

