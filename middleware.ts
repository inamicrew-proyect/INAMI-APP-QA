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

  // 4. Si SÍ hay sesión, verificar el nivel de 2FA solo para el dashboard
  if (session) {
    // 4.5. Verificar acceso a rutas de administrador basándose en permisos de roles
    if (isAdminRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        console.log('Middleware: Verificando acceso admin', { userId: session.user.id, role: profile?.role })

        // Si es admin, permitir acceso
        if (profile?.role === 'admin') {
          console.log('Middleware: Usuario es admin, acceso permitido')
          // Continuar
        } else {
          // Verificar si tiene permisos de ver el módulo admin
          const { data: userRoles, error: userRolesError } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', session.user.id)

          console.log('Middleware: Roles del usuario', { userRoles, error: userRolesError })

          if (userRoles && userRoles.length > 0) {
            const roleIds = userRoles.map(ur => ur.role_id)
            
            // Obtener el módulo admin
            const { data: adminModule, error: adminModuleError } = await supabase
              .from('modulos')
              .select('id')
              .eq('ruta', '/dashboard/admin')
              .single()

            console.log('Middleware: Módulo admin', { adminModule, error: adminModuleError })

            if (adminModule) {
              // Verificar si algún rol tiene permiso de ver el módulo admin
              const { data: permissions, error: permissionsError } = await supabase
                .from('role_module_permissions')
                .select('puede_ver')
                .eq('modulo_id', adminModule.id)
                .in('role_id', roleIds)
                .eq('puede_ver', true)
                .limit(1)

              console.log('Middleware: Permisos encontrados', { permissions, error: permissionsError, roleIds, moduloId: adminModule.id })

              if (!permissions || permissions.length === 0) {
                console.warn('Middleware: No se encontraron permisos, redirigiendo')
                return NextResponse.redirect(new URL('/dashboard', req.url))
              } else {
                console.log('Middleware: Permisos encontrados, acceso permitido')
              }
            } else {
              // Si no existe el módulo admin, solo permitir a admins
              console.warn('Middleware: Módulo admin no encontrado, redirigiendo')
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