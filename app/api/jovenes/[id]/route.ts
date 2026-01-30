// app/api/jovenes/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAuth(_request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const userId = session.user.id

  // Verificar el perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  return { supabase, profile, userId, isAdmin: profile.role === 'admin' } as const
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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

    const authCheck = await requireAuth(request)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const { supabase, isAdmin } = authCheck

    // Intentar cargar joven usando el cliente con sesión
    const { data, error } = await supabase
      .from('jovenes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading joven:', error)
      
      // Si hay un error de permisos y es admin, intentar con el cliente admin
      if ((error.code === 'PGRST301' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) && isAdmin) {
        const adminClient = getSupabaseAdmin()
        
        if (adminClient) {
          console.log('Intentando cargar joven con cliente admin...')
          const { data: adminData, error: adminError } = await adminClient
            .from('jovenes')
            .select('*')
            .eq('id', id)
            .single()

          if (adminError) {
            console.error('Error loading with admin client:', adminError)
            return NextResponse.json({ 
              error: 'No se pudo cargar el joven.',
              details: adminError.message 
            }, { status: 500 })
          }

          if (!adminData) {
            return NextResponse.json({ error: 'Joven no encontrado' }, { status: 404 })
          }

          return NextResponse.json({ 
            joven: adminData,
            success: true 
          })
        }
      }

      // Si no es admin o no se pudo usar el cliente admin, retornar error
      return NextResponse.json({ 
        error: 'No se pudo cargar el joven.',
        details: error.message 
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Joven no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ 
      joven: data,
      success: true 
    })
  } catch (error) {
    console.error('Error loading joven:', error)
    return NextResponse.json({ 
      error: 'Error al cargar el joven.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

async function requireAdminOrProfesionalForJoven(_request: NextRequest, jovenId: string) {
  // Usar la misma sintaxis que requireAuth que funciona en GET
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Error obteniendo sesión en requireAdminOrProfesionalForJoven:', sessionError)
  }
  
  if (!session) {
    console.log('No se encontró sesión en requireAdminOrProfesionalForJoven para jovenId:', jovenId)
    const cookieStore = cookies()
    console.log('Cookies recibidas:', cookieStore.getAll().map(c => c.name))
    return { error: 'No autenticado', status: 401 } as const
  }
  
  console.log('Sesión encontrada para usuario:', session.user.id, 'en jovenId:', jovenId)
  
  const userId = session.user.id

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Error obteniendo perfil:', profileError)
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  // Si es admin, puede hacer todo
  if (profile.role === 'admin') {
    return { supabase, profile, userId, isAdmin: true } as const
  }

  // Para no-admins, verificar que el joven existe
  // Según las políticas RLS, todos los usuarios autenticados pueden ver/editar jóvenes
  // Así que solo verificamos que el joven exista
  const adminClient = getSupabaseAdmin()
  if (adminClient) {
    const { data: joven, error: jovenError } = await adminClient
      .from('jovenes')
      .select('id')
      .eq('id', jovenId)
      .single()

    if (jovenError || !joven) {
      return { error: 'Joven no encontrado', status: 404 } as const
    }
  } else {
    // Si no hay cliente admin, intentar con el cliente normal
    const { data: joven, error: jovenError } = await supabase
      .from('jovenes')
      .select('id')
      .eq('id', jovenId)
      .single()

    if (jovenError || !joven) {
      // Si hay error de permisos, permitir acceso ya que las políticas RLS deberían manejarlo
      if (jovenError?.code === 'PGRST301' || jovenError?.message?.includes('permission denied')) {
        console.error('Error de permisos al verificar joven:', jovenError)
        // Permitir acceso ya que las políticas RLS deberían manejarlo
      } else {
        return { error: 'Joven no encontrado', status: 404 } as const
      }
    }
  }

  // Usuarios no-admin autenticados pueden editar/eliminar (RLS lo manejará)
  return { supabase, profile, userId, isAdmin: false } as const
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

    const authCheck = await requireAdminOrProfesionalForJoven(request, id)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    console.log('Datos recibidos para actualizar joven:', JSON.stringify(body, null, 2))

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar los campos que se envíen
    if (body.nombres !== undefined) updateData.nombres = body.nombres
    if (body.apellidos !== undefined) updateData.apellidos = body.apellidos
    if (body.fecha_nacimiento !== undefined) updateData.fecha_nacimiento = body.fecha_nacimiento
    if (body.edad !== undefined) updateData.edad = body.edad
    if (body.identidad !== undefined) updateData.identidad = body.identidad || null
    if (body.sexo !== undefined) updateData.sexo = body.sexo
    if (body.direccion !== undefined) updateData.direccion = body.direccion || null
    if (body.telefono !== undefined) updateData.telefono = body.telefono || null
    if (body.nombre_contacto_emergencia !== undefined) updateData.nombre_contacto_emergencia = body.nombre_contacto_emergencia || null
    if (body.telefono_emergencia !== undefined) updateData.telefono_emergencia = body.telefono_emergencia || null
    if (body.centro_id !== undefined) updateData.centro_id = body.centro_id
    if (body.fecha_ingreso !== undefined) updateData.fecha_ingreso = body.fecha_ingreso
    if (body.medida_aplicada !== undefined) updateData.medida_aplicada = body.medida_aplicada || null
    if (body.delito_infraccion !== undefined) updateData.delito_infraccion = body.delito_infraccion || null
    if (body.expediente_administrativo !== undefined) updateData.expediente_administrativo = body.expediente_administrativo || null
    if (body.expediente_judicial !== undefined) updateData.expediente_judicial = body.expediente_judicial || null
    if (body.estado !== undefined) updateData.estado = body.estado
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones || null
    if (body.foto_url !== undefined) updateData.foto_url = body.foto_url || null

    console.log('Datos a actualizar en la BD:', JSON.stringify(updateData, null, 2))
    console.log('Usuario es admin:', authCheck.isAdmin)

    // Si es admin, usar cliente admin directamente para evitar problemas de RLS
    let adminClient: ReturnType<typeof getSupabaseAdmin> = null
    try {
      adminClient = getSupabaseAdmin()
    } catch (err) {
      console.error('Error obteniendo cliente admin:', err)
    }

    if (authCheck.isAdmin && adminClient) {
      console.log('Actualizando joven con cliente admin (usuario es admin)')
      console.log('ID del joven a actualizar:', id)
      const { error: adminError, data: adminData } = await adminClient
        .from('jovenes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      console.log('Resultado de actualización con admin client:', { error: adminError, hasData: !!adminData })

      if (adminError) {
        console.error('Error updating with admin client:', adminError)
        return NextResponse.json({ 
          error: 'No se pudo actualizar el joven.',
          details: adminError.message 
        }, { status: 500 })
      }

      if (!adminData) {
        console.error('No se retornaron datos después de la actualización')
        return NextResponse.json({ 
          error: 'No se actualizó ningún joven.',
          details: 'El joven puede que ya no exista.'
        }, { status: 404 })
      }

      console.log('Joven actualizado exitosamente con admin client. Datos actualizados:', JSON.stringify(adminData, null, 2))
      return NextResponse.json({ success: true, data: adminData })
    }

    // Si no es admin, usar el cliente con sesión
    const { supabase } = authCheck
    console.log('Actualizando joven con cliente normal (no admin)')
    console.log('ID del joven a actualizar:', id)
    const { error: updateError, data: updatedData } = await supabase
      .from('jovenes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    console.log('Resultado de actualización con cliente normal:', { error: updateError, hasData: !!updatedData })

    if (updateError) {
      console.error('Error updating joven:', updateError)
      console.error('Detalles del error:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      return NextResponse.json({ 
        error: 'No se pudo actualizar el joven.',
        details: updateError.message 
      }, { status: 500 })
    }

    if (!updatedData) {
      console.error('No se retornaron datos después de la actualización con cliente normal')
      return NextResponse.json({ 
        error: 'No se actualizó ningún joven.',
        details: 'El joven puede que ya no exista o no tengas permisos para actualizarlo.'
      }, { status: 404 })
    }

    console.log('Joven actualizado exitosamente con cliente normal. Datos actualizados:', JSON.stringify(updatedData, null, 2))
    return NextResponse.json({ success: true, data: updatedData })
  } catch (error) {
    console.error('Error updating joven:', error)
    return NextResponse.json({ 
      error: 'Error al actualizar el joven.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const authCheck = await requireAdminOrProfesionalForJoven(request, id)
    
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const adminClient = getSupabaseAdmin()
    
    // Si es admin, usar cliente admin directamente para evitar problemas de RLS
    if (authCheck.isAdmin && adminClient) {
      console.log('Eliminando joven con cliente admin (usuario es admin)')
      const { error: adminError, data: adminData } = await adminClient
        .from('jovenes')
        .delete()
        .eq('id', id)
        .select()

      if (adminError) {
        console.error('Error deleting with admin client:', adminError)
        return NextResponse.json({ 
          error: 'No se pudo eliminar el joven.',
          details: adminError.message 
        }, { status: 500 })
      }

      if (!adminData || adminData.length === 0) {
        return NextResponse.json({ 
          error: 'No se eliminó ningún joven.',
          details: 'El joven puede que ya no exista.' 
        }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: adminData })
    }

    // Si no es admin, usar el cliente con sesión
    const { supabase } = authCheck
    const { error: deleteError, data: deletedData } = await supabase
      .from('jovenes')
      .delete()
      .eq('id', id)
      .select()

    if (deleteError) {
      console.error('Error deleting joven:', deleteError)
      return NextResponse.json({ 
        error: 'No se pudo eliminar el joven.',
        details: deleteError.message 
      }, { status: 500 })
    }

    if (!deletedData || deletedData.length === 0) {
      return NextResponse.json({ 
        error: 'No se eliminó ningún joven.',
        details: 'El joven puede que ya no exista o no tengas permisos para eliminarlo.' 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deletedData })
  } catch (error) {
    console.error('Error deleting joven:', error)
    return NextResponse.json({ 
      error: 'Error al eliminar el joven.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

