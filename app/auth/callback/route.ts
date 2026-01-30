import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://31.220.20.232:3000'

  // Si no hay código, redirigir al login
  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  // DETECCIÓN TEMPRANA: Determinar si es recuperación ANTES de intercambiar el código
  // Esto es crítico porque Supabase puede no incluir type en el email
  const isRecovery = type === 'recovery' || 
                     next?.includes('reset-password') ||
                     requestUrl.searchParams.get('type') === 'recovery'

  console.log('Auth callback - Detección inicial:', { 
    code: code.substring(0, 10) + '...', 
    type, 
    next, 
    isRecovery,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  const supabase = createRouteHandlerClient({ cookies: () => cookies() })
  
  try {
    // Intercambiar el código por una sesión
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Auth callback - Después de exchangeCodeForSession:', { 
      hasSession: !!data?.session, 
      error: error?.message,
      type,
      next
    })
    
    // REGLA 1: Si es recuperación explícita (type=recovery o next incluye reset-password), SIEMPRE ir a reset-password
    if (isRecovery) {
      console.log('✅ Es recuperación explícita, redirigiendo a reset-password')
      return NextResponse.redirect(`${siteUrl}/reset-password`)
    }
    
    // REGLA 2: Si NO hay type ni next, y la sesión se creó exitosamente,
    // ASumir que es recuperación (resetPasswordForEmail no siempre incluye type)
    if (!error && data?.session) {
      if (!type && !next) {
        console.log('✅ Sin type/next pero con sesión - asumiendo recuperación, redirigiendo a reset-password')
        return NextResponse.redirect(`${siteUrl}/reset-password`)
      }
      
      // REGLA 3: Si hay next que incluye reset-password, ir a reset-password
      if (next && next.includes('reset-password')) {
        console.log('✅ Next incluye reset-password, redirigiendo a reset-password')
        return NextResponse.redirect(`${siteUrl}/reset-password`)
      }
      
      // REGLA 4: Si hay type explícito que NO es recovery, ir al dashboard (login normal)
      if (type && type !== 'recovery') {
        console.log('✅ Type no es recovery, redirigiendo a dashboard')
        if (next) {
          return NextResponse.redirect(`${siteUrl}${next}`)
        }
        return NextResponse.redirect(`${siteUrl}/dashboard`)
      }
      
      // REGLA 5: Si hay next específico y NO es reset-password, usar ese next
      if (next && !next.includes('reset-password')) {
        console.log('✅ Next específico, redirigiendo a:', next)
        return NextResponse.redirect(`${siteUrl}${next}`)
      }
      
      // REGLA 6: Por defecto, si hay sesión pero no sabemos qué es, asumir recuperación (más seguro)
      console.log('✅ Sesión creada sin type/next claro - asumiendo recuperación, redirigiendo a reset-password')
      return NextResponse.redirect(`${siteUrl}/reset-password`)
    } 
    
    // REGLA 7: Si hay error pero no hay type/next, asumir recuperación
    if (error) {
      console.error('❌ Error exchanging code for session:', error)
      if (!type && !next) {
        console.log('✅ Error sin type/next - asumiendo recuperación, redirigiendo a reset-password')
        return NextResponse.redirect(`${siteUrl}/reset-password`)
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error in auth callback:', error)
    // Si es recuperación explícita o no hay type/next, intentar reset-password
    if (isRecovery || (!type && !next)) {
      console.log('✅ Error pero es recuperación o sin type/next - redirigiendo a reset-password')
      return NextResponse.redirect(`${siteUrl}/reset-password`)
    }
  }

  // REGLA 8: Última verificación - Si es recuperación explícita, redirigir a reset-password
  if (isRecovery) {
    console.log('✅ Última verificación - es recuperación, redirigiendo a reset-password')
    return NextResponse.redirect(`${siteUrl}/reset-password`)
  }

  // REGLA 9: Si llegamos aquí sin type/next, asumir recuperación (más seguro que login)
  if (!type && !next) {
    console.log('✅ Sin type ni next al final - asumiendo recuperación, redirigiendo a reset-password')
    return NextResponse.redirect(`${siteUrl}/reset-password`)
  }

  // REGLA 10: Solo si hay type/next explícito que NO es recuperación, ir al dashboard
  if (type && type !== 'recovery' && next && !next.includes('reset-password')) {
    console.log('✅ Type/next explícito no es recuperación, redirigiendo a dashboard')
    return NextResponse.redirect(`${siteUrl}${next}`)
  }

  // Último recurso: ir a login solo si realmente no podemos determinar qué es
  console.log('⚠️ No se pudo determinar el tipo, redirigiendo a login')
  return NextResponse.redirect(`${siteUrl}/login`)
}
