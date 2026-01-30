// app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { userUpdateSchema } from '@/lib/validation/users'
import { formatZodErrors } from '@/lib/validation/utils'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

async function requireAdmin(_request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const userId = session.user.id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  if (profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 } as const
  }

  return { supabase, profile, userId } as const
}

async function requireAuthOrOwnProfile(_request: NextRequest, targetUserId: string) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const userId = session.user.id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  // Permitir si es admin o si está viendo su propio perfil
  if (profile.role !== 'admin' && userId !== targetUserId) {
    return { error: 'No autorizado. Solo puedes ver tu propio perfil.', status: 403 } as const
  }

  return { supabase, profile, userId } as const
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

    // Verificar permisos: admin puede ver cualquier perfil, usuarios solo el suyo
    const authCheck = await requireAuthOrOwnProfile(request, id)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Usar adminClient para obtener el usuario y evitar problemas de RLS
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      console.error('supabaseAdmin no está configurado')
      return NextResponse.json({ 
        error: 'Error de configuración del servidor.',
        details: 'Supabase admin client no está disponible.'
      }, { status: 500 })
    }

    console.log('Obteniendo usuario con adminClient:', id)

    const { data, error } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ error: 'No se pudo obtener la información del usuario' }, { status: 500 })
    }

    if (!data) {
      console.error('Usuario no encontrado:', id)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    console.log('Usuario obtenido exitosamente:', { id: data.id, email: data.email })

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Unexpected error fetching user:', error)
    return NextResponse.json({ 
      error: 'Error inesperado al obtener el usuario.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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

  // Verificar permisos: admin puede editar cualquier perfil, usuarios solo el suyo
  const authCheck = await requireAuthOrOwnProfile(request, id)
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  const { profile: currentProfile, userId } = authCheck
  const isAdmin = currentProfile.role === 'admin'

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Obtener el perfil actual para usar el rol existente si no es admin
  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    console.error('supabaseAdmin no está configurado')
    return NextResponse.json({ 
      error: 'Error de configuración del servidor.',
      details: 'Supabase admin client no está disponible.'
    }, { status: 500 })
  }

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', id)
    .maybeSingle()

  if (!existingProfile) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Si no es admin, solo permitir cambiar la foto (usar nombre y rol existentes)
  // Si es admin, permitir cambiar nombre, rol y foto
  // Si no se envía fullName, usar el existente
  const normalizedPayload = {
    fullName: isAdmin 
      ? (body.full_name ?? body.fullName ?? existingProfile.full_name)
      : existingProfile.full_name,
    email: body.email ?? existingProfile.email,
    role: isAdmin 
      ? (body.role ?? existingProfile.role)
      : existingProfile.role,
    photoUrl: body.photoUrl ?? body.photo_url ?? null,
  }

  // Validar según el esquema
  const parsed = userUpdateSchema.safeParse(normalizedPayload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Los datos del usuario no son válidos.',
        details: formatZodErrors(parsed.error),
      },
      { status: 422 }
    )
  }

  const { fullName, photoUrl, role } = parsed.data

  // Verificar que el rol existe en la tabla roles (siempre, para asegurar que es válido)
  if (isAdmin && role) {
    const { data: roleExists, error: roleCheckError } = await adminClient
      .from('roles')
      .select('id')
      .eq('nombre', role)
      .eq('activo', true)
      .maybeSingle()

    if (roleCheckError) {
      console.error('Error verificando rol:', roleCheckError)
      return NextResponse.json(
        { error: 'Error al verificar el rol. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    if (!roleExists) {
      return NextResponse.json(
        { error: `El rol "${role}" no existe o no está activo.` },
        { status: 400 }
      )
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  // Solo permitir cambiar el nombre si es admin
  if (isAdmin) {
    updatePayload.full_name = fullName
  }

  // Solo permitir cambiar el rol si es admin
  if (isAdmin) {
    updatePayload.role = role
  }

  // Todos pueden cambiar la foto (subir o quitar)
  if (photoUrl !== undefined) {
    updatePayload.photo_url = photoUrl ?? null
  }

  console.log('Actualizando usuario con adminClient:', { id, fullName, role, updatePayload })

  const { data, error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error updating user profile:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    return NextResponse.json({ 
      error: 'No se pudo actualizar al usuario',
      details: error.message 
    }, { status: 500 })
  }

  if (!data) {
    console.error('Usuario no encontrado para actualizar:', id)
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  console.log('Usuario actualizado exitosamente en profiles:', { id: data.id, email: data.email, role: data.role })

  // Si se cambió el rol, actualizar user_roles
  if (isAdmin && role && role !== existingProfile.role) {
    try {
      // Obtener el ID del nuevo rol (ya lo verificamos arriba, pero lo obtenemos de nuevo)
      const { data: newRoleData, error: roleFetchError } = await adminClient
        .from('roles')
        .select('id')
        .eq('nombre', role)
        .eq('activo', true)
        .maybeSingle()

      if (roleFetchError) {
        console.error('Error obteniendo datos del rol:', roleFetchError)
        throw new Error('Error al obtener datos del rol')
      }

      if (!newRoleData) {
        console.error('Rol no encontrado después de verificación:', role)
        throw new Error('Rol no encontrado')
      }

      // Eliminar roles anteriores del usuario
      const { error: deleteError } = await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', id)

      if (deleteError) {
        console.error('Error eliminando roles anteriores:', deleteError)
        throw new Error('Error al eliminar roles anteriores')
      }

      // Asignar el nuevo rol
      const { error: insertError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: id,
          role_id: newRoleData.id,
          assigned_by: userId,
        })

      if (insertError) {
        console.error('Error asignando nuevo rol:', insertError)
        throw new Error('Error al asignar el nuevo rol')
      }

      console.log('Rol actualizado en user_roles exitosamente')
    } catch (roleError) {
      console.error('Error actualizando roles del usuario:', roleError)
      // Retornar error en lugar de solo loguear, para que el usuario sepa qué pasó
      return NextResponse.json(
        { 
          error: 'El usuario se actualizó pero hubo un error al actualizar los roles. Por favor, verifica los roles manualmente.',
          details: roleError instanceof Error ? roleError.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }
  }

  // Actualizar metadata en auth.users
  try {
    const metadata: Record<string, unknown> = {
      photo_url: photoUrl ?? null,
    }
    
    // Solo actualizar el nombre en metadata si es admin
    if (isAdmin) {
      metadata.full_name = fullName
    } else {
      // Mantener el nombre existente en metadata
      metadata.full_name = existingProfile.full_name
    }
    
    // Solo actualizar el rol en metadata si es admin
    if (isAdmin) {
      metadata.role = role
    } else {
      // Mantener el rol existente en metadata
      metadata.role = existingProfile.role
    }
    
    await adminClient.auth.admin.updateUserById(id, {
      user_metadata: metadata,
    })
    console.log('Metadata actualizada en auth.users')
  } catch (authError) {
    console.warn('No se pudo actualizar metadata en auth:', authError)
  }

  console.log('Usuario actualizado exitosamente:', { id: data.id, email: data.email })

  return NextResponse.json({ user: data })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }

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

  try {
    // Usar adminClient para eliminar el perfil y evitar problemas de RLS
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      console.error('supabaseAdmin no está configurado')
      return NextResponse.json({ 
        error: 'Error de configuración del servidor.',
        details: 'Supabase admin client no está disponible.'
      }, { status: 500 })
    }

    console.log('Eliminando usuario con adminClient:', id)

    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', id)

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError)
      console.error('Error details:', {
        code: deleteProfileError.code,
        message: deleteProfileError.message,
        details: deleteProfileError.details,
        hint: deleteProfileError.hint
      })
      return NextResponse.json({ error: 'No se pudo eliminar el usuario' }, { status: 500 })
    }

    // Eliminar el usuario de auth.users
    try {
      await adminClient.auth.admin.deleteUser(id)
      console.log('Usuario eliminado de auth.users')
    } catch (authError) {
      console.warn('No se pudo eliminar el usuario de auth:', authError)
    }

    console.log('Usuario eliminado exitosamente:', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'No se pudo eliminar el usuario' }, { status: 500 })
  }
}