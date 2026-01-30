// app/api/users/[id]/upload-photo/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

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
    return { error: 'No autorizado. Solo puedes subir fotos a tu propio perfil.', status: 403 } as const
  }

  return { supabase, profile, userId } as const
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Verificar permisos
    const authCheck = await requireAuthOrOwnProfile(request, id)
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    // Obtener el archivo del FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 })
    }

    // Validar tipo de archivo
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Use JPG, PNG o WebP.' }, { status: 400 })
    }

    // Validar tamaño (1 MB máximo)
    const MAX_PROFILE_PHOTO_SIZE = 1024 * 1024
    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 1 MB.' }, { status: 400 })
    }

    // Usar admin client para subir el archivo
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      console.error('supabaseAdmin no está configurado')
      return NextResponse.json({ 
        error: 'Error de configuración del servidor.',
        details: 'Supabase admin client no está disponible.'
      }, { status: 500 })
    }

    const fileExt = file.name.split('.').pop()
    const safeExt = fileExt ? fileExt.toLowerCase() : 'jpg'
    const filePath = `fotos-usuarios/${id}.${safeExt}`

    // Convertir File a ArrayBuffer para el admin client
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir usando admin client (bypass RLS)
    const { error: uploadError } = await adminClient.storage
      .from('fotos-usuarios')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Error uploading photo:', uploadError)
      return NextResponse.json({ 
        error: 'No se pudo subir la foto.',
        details: uploadError.message 
      }, { status: 500 })
    }

    // Obtener la URL pública
    const {
      data: { publicUrl },
    } = adminClient.storage.from('fotos-usuarios').getPublicUrl(filePath)

    // Actualizar el perfil con la nueva URL de foto
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        photo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ 
        error: 'No se pudo actualizar el perfil.',
        details: updateError.message 
      }, { status: 500 })
    }

    // Actualizar metadata en auth.users
    try {
      await adminClient.auth.admin.updateUserById(id, {
        user_metadata: {
          photo_url: publicUrl,
        },
      })
    } catch (authError) {
      console.warn('No se pudo actualizar metadata en auth:', authError)
    }

    return NextResponse.json({ 
      success: true,
      photoUrl: publicUrl 
    })
  } catch (error) {
    console.error('Unexpected error uploading photo:', error)
    return NextResponse.json({ 
      error: 'Error inesperado al subir la foto.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

