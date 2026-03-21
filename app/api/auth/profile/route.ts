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
    
    // Intentar obtener sesión con timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout obteniendo sesión')), 5000)
    )
    
    let sessionResult
    try {
      sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any
    } catch (error) {
      console.error('❌ [API /auth/profile] Error o timeout obteniendo sesión:', error)
      return NextResponse.json({ profile: null, error: 'Error obteniendo sesión' }, { status: 500 })
    }
    
    const { data: { session }, error: sessionError } = sessionResult

    console.log('🔍 [API /auth/profile] Sesión:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message,
      sessionErrorCode: sessionError?.code
    })

    if (sessionError || !session) {
      console.warn('⚠️ [API /auth/profile] No hay sesión activa', {
        error: sessionError?.message,
        errorCode: sessionError?.code
      })
      return NextResponse.json({ profile: null, error: 'No hay sesión activa' }, { status: 401 })
    }

    // SOLUCIÓN DIRECTA: Usar SIEMPRE admin client (bypass RLS completamente)
    console.log('🔍 [API /auth/profile] Cargando perfil con admin client (bypass RLS)...', { 
      userId: session.user.id,
      userEmail: session.user.email 
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
      .eq('id', session.user.id)
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
    
    if (session.user.email) {
      console.log('🔄 [API /auth/profile] Intentando por email...', { email: session.user.email })
      const emailResult = await adminClient
        .from('profiles')
        .select('*')
        .eq('email', session.user.email)
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
        email: session.user.email
      })
    }
    
    // Si ambos fallan
    console.error('❌ [API /auth/profile] No se pudo obtener el perfil:', {
      errorById: errorById?.message,
      errorByEmail: errorByEmail?.message,
      userId: session.user.id,
      userEmail: session.user.email
    })
    
    return NextResponse.json({ 
      profile: null, 
      error: 'Perfil no encontrado en la base de datos',
      details: {
        userId: session.user.id,
        userEmail: session.user.email,
        errorById: errorById?.message,
        errorByEmail: errorByEmail?.message
      }
    }, { status: 404 })
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json({ profile: null, error: 'Error inesperado' }, { status: 500 })
  }
}
