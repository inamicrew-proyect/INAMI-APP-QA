// app/api/users/route.ts

import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { userCreateSchema } from '@/lib/validation/users'
import { formatZodErrors } from '@/lib/validation/utils'

// --- ESTA ES LA FUNCIÓN CORREGIDA ---
// Ahora solo usa la cookie para obtener la sesión.
async function requireAdmin(_request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'No autenticado', status: 401 } as const
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    return { error: 'Perfil no encontrado', status: 401 } as const
  }

  if (profile.role !== 'admin') {
    return { error: 'No autorizado', status: 403 } as const
  }

  return { supabase, profile } as const
}
// --- FIN DE LA FUNCIÓN CORREGIDA ---

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    return NextResponse.json({ error: 'Configuración inválida del servidor.' }, { status: 500 })
  }

  const normalizedPayload = {
    fullName: body.fullName,
    email: body.email,
    role: body.role,
    password: body.password,
    photoUrl: body.photoUrl ?? body.photo_url ?? null,
  }

  const parsedPayload = userCreateSchema.safeParse(normalizedPayload)

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        error: 'Los datos del usuario no son válidos.',
        details: formatZodErrors(parsedPayload.error),
      },
      { status: 422 }
    )
  }

  const { fullName, email, role, password, photoUrl } = parsedPayload.data
  const finalPhotoUrl = photoUrl ?? null

  // Verificar que el rol existe en la tabla roles
  const { data: roleExists } = await adminClient
    .from('roles')
    .select('id')
    .eq('nombre', role)
    .eq('activo', true)
    .maybeSingle()

  if (!roleExists) {
    return NextResponse.json(
      { error: `El rol "${role}" no existe o no está activo.` },
      { status: 400 }
    )
  }

    // Usar adminClient también para verificar el correo existente
    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfileError) {
      console.error('Error checking existing profile:', existingProfileError)
      return NextResponse.json({ error: 'No se pudo verificar el correo.' }, { status: 500 })
    }

  if (existingProfile) {
    return NextResponse.json({ error: 'Ya existe un usuario con este correo.' }, { status: 409 })
  }

  try {
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        photo_url: finalPhotoUrl,
      },
    })

    if (createError || !authUser?.user) {
      console.error('Error creating auth user:', createError)
      return NextResponse.json({ error: 'No se pudo crear el usuario en autenticación.' }, { status: 500 })
    }

    // Esperar un momento para que el trigger cree el perfil automáticamente
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verificar si el perfil ya fue creado por el trigger
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .maybeSingle()

    let profileData

    if (existingProfile) {
      // El perfil ya existe (creado por el trigger), actualizarlo con los datos correctos
      console.log('Perfil ya existe (creado por trigger), actualizando con datos correctos:', {
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
      })

      const { error: updateError, data: updatedProfile } = await adminClient
        .from('profiles')
        .update({
          email,
          full_name: fullName,
          role,
          photo_url: finalPhotoUrl,
        })
        .eq('id', authUser.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        console.error('Error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        try {
          await adminClient.auth.admin.deleteUser(authUser.user.id)
        } catch (cleanupError) {
          console.error('Error cleaning up auth user after profile update failure:', cleanupError)
        }
        return NextResponse.json({ 
          error: 'No se pudo actualizar el perfil del usuario.',
          details: updateError.message 
        }, { status: 500 })
      }

      profileData = updatedProfile
      console.log('Perfil actualizado exitosamente:', profileData)
    } else {
      // El perfil no existe, crearlo manualmente
      console.log('Perfil no existe, creándolo manualmente con adminClient:', {
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
      })

      const { error: profileError, data: insertedProfile } = await adminClient
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email,
          full_name: fullName,
          role,
          photo_url: finalPhotoUrl,
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error inserting profile:', profileError)
        console.error('Error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        })
        try {
          await adminClient.auth.admin.deleteUser(authUser.user.id)
        } catch (cleanupError) {
          console.error('Error cleaning up auth user after profile failure:', cleanupError)
        }
        return NextResponse.json({ 
          error: 'No se pudo guardar el perfil del usuario.',
          details: profileError.message 
        }, { status: 500 })
      }

      profileData = insertedProfile
      console.log('Perfil creado exitosamente:', profileData)
    }

    // Asignar rol en user_roles basándose en profile.role
    try {
      const { data: roleData } = await adminClient
        .from('roles')
        .select('id')
        .eq('nombre', role)
        .single()

      if (roleData) {
        // Verificar si ya tiene el rol asignado
        const { data: existingRole } = await adminClient
          .from('user_roles')
          .select('id')
          .eq('user_id', authUser.user.id)
          .eq('role_id', roleData.id)
          .maybeSingle()

        if (!existingRole) {
          await adminClient
            .from('user_roles')
            .insert({
              user_id: authUser.user.id,
              role_id: roleData.id,
              assigned_by: adminCheck.profile.id,
            })
          console.log('Rol asignado exitosamente al usuario')
        }
      }
    } catch (roleError) {
      // No fallar si hay error asignando el rol, solo loguear
      console.warn('Error asignando rol al usuario (no crítico):', roleError)
    }

    return NextResponse.json({
      user: {
        id: authUser.user.id,
        email,
        full_name: fullName,
        role,
        photo_url: finalPhotoUrl,
      },
    })
  } catch (error) {
    console.error('Unexpected error creating user:', error)
    return NextResponse.json({ error: 'Error inesperado al crear el usuario.' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) {
      // Devolvemos el error de autorización
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    // Verificar que supabaseAdmin esté configurado
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      console.error('supabaseAdmin no está configurado')
      console.error('Verifica que SUPABASE_SERVICE_ROLE_KEY esté en tu archivo .env.local')
      return NextResponse.json({ 
        error: 'Error de configuración del servidor.',
        details: 'Supabase admin client no está disponible. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurada en .env.local'
      }, { status: 500 })
    }

    // Consultar todos los usuarios de la tabla profiles
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email, full_name, role, photo_url, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error listing users from profiles:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ 
        error: 'No se pudieron cargar los usuarios de la tabla profiles.',
        details: error.message 
      }, { status: 500 })
    }

    // Asegurarse de que todos los campos estén presentes
    const formattedUsers = (data ?? []).map((user: any) => ({
      id: user.id || '',
      email: user.email || '',
      full_name: user.full_name || 'Sin nombre',
      role: user.role || 'seguridad',
      photo_url: user.photo_url || null,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
    }))

    console.log(`Cargados ${formattedUsers.length} usuarios de la tabla profiles`)

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Unexpected error fetching users:', error)
    return NextResponse.json({ 
      error: 'Error inesperado al obtener los usuarios.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
};