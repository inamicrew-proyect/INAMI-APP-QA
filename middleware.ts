// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 1. Obtener la sesión actual
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname
  const INACTIVITY_MS = 30 * 60 * 1000 // 30 minutos
  const isAuthRoute = pathname.startsWith('/login')
  const isVerifyRoute = pathname.startsWith('/login/verify-2fa')
  const isRegisterRoute = pathname.startsWith('/register')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isApiRoute = pathname.startsWith('/api')
  const isResetPasswordRoute = pathname.startsWith('/reset-password')
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
  const isSecurityQuestionsRoute = pathname.startsWith('/dashboard/configuracion/preguntas-secretas')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isLogoutRoute = req.nextUrl.searchParams.get('logout') === 'true'

  // 2. Las API routes manejan su propia autenticación, no las bloqueamos aquí
  // Solo protegemos las rutas del dashboard
  if (isDashboardRoute && !session) {
    // Redirigir a login si intenta acceder al dashboard sin sesión
    // Agregar timestamp para evitar cache
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('t', Date.now().toString())
    return NextResponse.redirect(loginUrl)
  }

  // 3. Si no hay sesión Y NO está en una ruta de autenticación, API, reset-password o callback, redirigir a /login
  // IMPORTANTE: reset-password y auth/callback deben estar permitidas sin sesión para el flujo de recuperación
  if (!session && !isAuthRoute && !isRegisterRoute && !isApiRoute && !isDashboardRoute && !isResetPasswordRoute && !isAuthCallbackRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 4. Si SÍ hay sesión: control de inactividad (30 min) y actualizar cookie
  if (session) {
    const now = Date.now()
    const lastActivityRaw = req.cookies.get('last-activity')?.value
    const lastActivity = lastActivityRaw ? parseInt(lastActivityRaw, 10) : NaN
    const isExpired = !Number.isNaN(lastActivity) && (now - lastActivity > INACTIVITY_MS)

    // Solo redirigir por inactividad en rutas de página (no en llamadas API)
    if (!isApiRoute && isExpired) {
      try {
        await supabase.auth.signOut()
      } catch {
        // ignorar
      }
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('reason', 'session_expired')
      const redirectRes = NextResponse.redirect(loginUrl)
      redirectRes.cookies.set('last-activity', '', { path: '/', maxAge: 0 })
      redirectRes.cookies.set('login_reason', 'session_expired', { path: '/', maxAge: 60, sameSite: 'lax' })
      return redirectRes
    }

    // Refrescar momento de última actividad SOLO en navegación de páginas (no en llamadas API en segundo plano)
    if (!isApiRoute) {
      // La cookie dura 1 día; el control de 30 min se hace con el timestamp guardado
      res.cookies.set('last-activity', String(now), {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: false,
        sameSite: 'lax',
      })
    }
  }

  // 5. Si SÍ hay sesión, verificar el nivel de 2FA solo para el dashboard
  if (session) {
    // 5.1. Verificar acceso a rutas de administrador basándose en permisos de roles
    if (isAdminRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role === 'admin') {
          // Continuar
        } else {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', session.user.id)

          if (userRoles && userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.role_id)
            const { data: adminModule } = await supabase
              .from('modulos')
              .select('id')
              .eq('ruta', '/dashboard/admin')
              .single()

            if (adminModule) {
              const { data: permissions } = await supabase
                .from('role_module_permissions')
                .select('puede_ver')
                .eq('modulo_id', adminModule.id)
                .in('role_id', roleIds)
                .eq('puede_ver', true)
                .limit(1)

              if (!permissions || permissions.length === 0) {
                return NextResponse.redirect(new URL('/dashboard', req.url))
              }
            } else {
              return NextResponse.redirect(new URL('/dashboard', req.url))
            }
          } else {
            // No tiene roles asignados, solo permitir a admins
            console.warn('Middleware: Usuario no tiene roles asignados, redirigiendo')
            return NextResponse.redirect(new URL('/dashboard', req.url))
          }
        }
      } catch (error) {
        console.error('Middleware: Error verificando permisos de admin:', error)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // 5. Si está en una ruta protegida (dashboard), verificar 2FA y preguntas secretas
    // Las API routes manejan su propia verificación
    if (isDashboardRoute && !isSecurityQuestionsRoute && !isAdminRoute) {
      try {
        // Obtener el nivel de aseguramiento (AAL)
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

        if (aal) {
          // 'aal1' = Logueado pero SIN 2FA
          // 'aal2' = Logueado Y CON 2FA verificada
          
          // 6. Si el nivel actual NO es 'aal2' Y el siguiente nivel SÍ es 'aal2'
          //    (significa que tiene 2FA activado pero no lo ha ingresado)
          
          if (aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2') {
            // Si está en el dashboard y no está verificado, redirigir a verificación
            if (!isVerifyRoute) {
              return NextResponse.redirect(new URL('/login/verify-2fa', req.url))
            }
          }
        }
      } catch (error) {
        // Si hay un error obteniendo el AAL, permitir el acceso (puede ser que no tenga 2FA configurado)
        console.error('Error obteniendo AAL:', error)
      }

      // 6.5. Verificar si el usuario tiene preguntas secretas configuradas
      // Si no las tiene, redirigir a la página de configuración
      // IMPORTANTE: Solo verificar si NO está ya en la página de preguntas secretas para evitar loops
      if (!isSecurityQuestionsRoute) {
        try {
          const { count, error: questionsError } = await supabase
            .from('security_questions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)

          const hasQuestions = !questionsError && (count ?? 0) > 0

          if (!hasQuestions) {
            // Si no tiene preguntas secretas, redirigir a la página de configuración
            // Solo si no está ya ahí para evitar loops infinitos
            return NextResponse.redirect(new URL('/dashboard/configuracion/preguntas-secretas', req.url))
          }
        } catch (error) {
          // Si hay error verificando preguntas, NO redirigir automáticamente
          // Permitir que el usuario acceda al dashboard y mostrar un mensaje allí
          // Esto evita que el usuario quede "al aire" si hay problemas con la base de datos
          console.error('Error verificando preguntas secretas:', error)
          // Continuar al dashboard en lugar de redirigir
        }
      }
    }
    
    // 7. Si ya está autenticado e intenta ir a /login (excepto si es logout)
    if (isAuthRoute && !isLogoutRoute && !isVerifyRoute) {
      // Si es logout, permitir acceso a login para limpiar sesión
      // Verificar si tiene 2FA completo antes de redirigir al dashboard
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal && aal.currentLevel === 'aal2') {
          // Si tiene 2FA completo, redirigir al dashboard
          const dashboardUrl = new URL('/dashboard', req.url)
          dashboardUrl.searchParams.set('t', Date.now().toString())
          return NextResponse.redirect(dashboardUrl)
        } else if (!aal || aal.currentLevel === 'aal1') {
          // Si no tiene 2FA o está en aal1, también puede ir al dashboard
          const dashboardUrl = new URL('/dashboard', req.url)
          dashboardUrl.searchParams.set('t', Date.now().toString())
          return NextResponse.redirect(dashboardUrl)
        }
      } catch (error) {
        // Si hay error, asumir que puede ir al dashboard
        const dashboardUrl = new URL('/dashboard', req.url)
        dashboardUrl.searchParams.set('t', Date.now().toString())
        return NextResponse.redirect(dashboardUrl)
      }
    }
    
    // 7.5. Si es logout, forzar limpieza de sesión
    if (isLogoutRoute) {
      // Cerrar sesión en Supabase
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (error) {
        // Ignorar errores, solo intentar cerrar
        try {
          await supabase.auth.signOut()
        } catch (e) {
          // Ignorar
        }
      }
      // Permitir acceso a login sin redirigir
    }
    
    // 8. Si ya está autenticado e intenta ir a /register
    if (isRegisterRoute && !isLogoutRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

// Configuración del Matcher: Aplica el middleware a todas las rutas EXCEPTO
// las estáticas (_next/static, _next/image) y favicon.ico
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}