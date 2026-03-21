import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 [API /auth/profile] Iniciando...')
    
    // Verificar cookies recibidas
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('🔍 [API /auth/profile] Cookies recibidas:', {
      count: allCookies.length,
      cookieNames: allCookies.map(c => c.name)
    })
    
    const supabase = await createSupabaseRouteHandlerClient()
    
    // getUser() valida el JWT con Supabase (getSession() solo lee cookies y dispara warnings)
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout obteniendo usuario')), 5000)
    )

    let userResult
    try {
      userResult = await Promise.race([userPromise, timeoutPromise]) as Awaited<
        ReturnType<typeof supabase.auth.getUser>
      >
    } catch (error) {
      console.error('❌ [API /auth/profile] Error o timeout obteniendo usuario:', error)
      return NextResponse.json({ profile: null, error: 'Error obteniendo sesión' }, { status: 500 })
    }

    const { data: { user }, error: userError } = userResult

    console.log('🔍 [API /auth/profile] Usuario:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message,
      userErrorCode: userError?.code,
    })

    if (userError || !user) {
      console.warn('⚠️ [API /auth/profile] No hay sesión activa', {
        error: userError?.message,
        errorCode: userError?.code,
      })
      return NextResponse.json({ profile: null, error: 'No hay sesión activa' }, { status: 401 })
    }

    // SOLUCIÓN DIRECTA: Usar SIEMPRE admin client (bypass RLS completamente)
    console.log('🔍 [API /auth/profile] Cargando perfil con admin client (bypass RLS)...', {
      userId: user.id,
      userEmail: user.email,
    })
    
    const adminClient = getSupabaseAdmin()
    
    if (!adminClient) {
      console.error('❌ [API /auth/profile] Admin client no disponible - verificar SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ 
        profile: null, 
        error: 'Error de configuración del servidor: Admin client no disponible' 
      }, { status: 500 })
    }
    
    // Intentar por ID primero
    console.log('🔄 [API /auth/profile] Intentando por ID...')
    const { data: profileById, error: errorById } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!errorById && profileById) {
      console.log('✅ [API /auth/profile] Perfil obtenido exitosamente por ID:', {
        id: profileById.id,
        email: profileById.email,
        role: profileById.role,
        full_name: profileById.full_name
      })
      return NextResponse.json({ profile: profileById })
    }
    
    // Si falla por ID, intentar por email
    let profileByEmail = null
    let errorByEmail = null
    
    if (user.email) {
      console.log('🔄 [API /auth/profile] Intentando por email...', { email: user.email })
      const emailResult = await adminClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()
      
      profileByEmail = emailResult.data
      errorByEmail = emailResult.error

      if (!errorByEmail && profileByEmail) {
        console.log('✅ [API /auth/profile] Perfil obtenido exitosamente por email:', {
          id: profileByEmail.id,
          email: profileByEmail.email,
          role: profileByEmail.role,
          full_name: profileByEmail.full_name
        })
        return NextResponse.json({ profile: profileByEmail })
      }
      
      console.error('❌ [API /auth/profile] Error obteniendo perfil por email:', {
        error: errorByEmail?.message,
        errorCode: errorByEmail?.code,
        email: user.email
      })
    }
    
    // Si ambos fallan
    console.error('❌ [API /auth/profile] No se pudo obtener el perfil:', {
      errorById: errorById?.message,
      errorByEmail: errorByEmail?.message,
      userId: user.id,
      userEmail: user.email
    })
    
    return NextResponse.json({ 
      profile: null, 
      error: 'Perfil no encontrado en la base de datos',
      details: {
        userId: user.id,
        userEmail: user.email,
        errorById: errorById?.message,
        errorByEmail: errorByEmail?.message
      }
    }, { status: 404 })
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json({ profile: null, error: 'Error inesperado' }, { status: 500 })
  }
}
