// proxy.ts — @supabase/ssr compatible con Next.js 15+ (antes middleware.ts)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/env/public-supabase'
import { userMustChangePassword } from '@/lib/auth-must-change-password'

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname
  const INACTIVITY_MS = 30 * 60 * 1000 // 30 minutos
  const isAuthRoute = pathname.startsWith('/login')
  const isVerifyRoute = pathname.startsWith('/login/verify-2fa')
  const isRegisterRoute = pathname.startsWith('/register')
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isApiRoute = pathname.startsWith('/api')
  const isResetPasswordRoute = pathname.startsWith('/reset-password')
  const isAuthCallbackRoute = pathname.startsWith('/auth/callback')
  const isFirstPasswordRoute = pathname.startsWith('/cambiar-contrasena-inicial')
  const isSecurityQuestionsRoute = pathname.startsWith('/dashboard/configuracion/preguntas-secretas')
  const isAdminRoute = pathname.startsWith('/dashboard/admin')
  const isLogoutRoute = req.nextUrl.searchParams.get('logout') === 'true'

  const passCookies = (response: NextResponse) => {
    res.cookies.getAll().forEach(({ name, value }) => {
      response.cookies.set(name, value)
    })
    return response
  }

  // 2. Las API routes manejan su propia autenticación, no las bloqueamos aquí
  // Solo protegemos las rutas del dashboard
  if (isDashboardRoute && !user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('t', Date.now().toString())
    return passCookies(NextResponse.redirect(loginUrl))
  }

  // Obligado a cambiar contraseña temporal: no usar el dashboard hasta completar el flujo
  if (user && isFirstPasswordRoute && !userMustChangePassword(user)) {
    return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
  }

  // Cuenta inactiva o marcada como bloqueada en perfiles: cerrar sesión y volver al login
  if (user && isDashboardRoute) {
    try {
      const { data: acct } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', user.id)
        .maybeSingle()
      const st = (acct?.account_status as string | undefined) ?? 'activo'
      if (st !== 'activo') {
        try {
          await supabase.auth.signOut()
        } catch {
          // ignorar
        }
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set(
          'reason',
          st === 'bloqueado' ? 'account_blocked' : 'account_inactive'
        )
        loginUrl.searchParams.set('t', Date.now().toString())
        return passCookies(NextResponse.redirect(loginUrl))
      }
      if (userMustChangePassword(user)) {
        const firstPwUrl = new URL('/cambiar-contrasena-inicial', req.url)
        return passCookies(NextResponse.redirect(firstPwUrl))
      }
    } catch (e) {
      console.warn('proxy: no se pudo verificar account_status', e)
    }
  }

  // 3. Si no hay sesión Y NO está en una ruta de autenticación, API, reset-password o callback, redirigir a /login
  if (!user && !isAuthRoute && !isRegisterRoute && !isApiRoute && !isDashboardRoute && !isResetPasswordRoute && !isAuthCallbackRoute) {
    return passCookies(NextResponse.redirect(new URL('/login', req.url)))
  }

  // 4. Si SÍ hay sesión: control de inactividad (30 min) y actualizar cookie
  if (user) {
    const now = Date.now()
    const lastActivityRaw = req.cookies.get('last-activity')?.value
    const lastActivity = lastActivityRaw ? parseInt(lastActivityRaw, 10) : NaN
    const isExpired = !Number.isNaN(lastActivity) && (now - lastActivity > INACTIVITY_MS)

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
      return passCookies(redirectRes)
    }

    if (!isApiRoute) {
      res.cookies.set('last-activity', String(now), {
        path: '/',
        maxAge: 60 * 60 * 24,
        httpOnly: false,
        sameSite: 'lax',
      })
    }
  }

  // 5. Si SÍ hay sesión, verificar el nivel de 2FA solo para el dashboard
  if (user) {
    if (isAdminRoute) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          // Continuar
        } else {
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', user.id)

          if (userRoles && userRoles.length > 0) {
            const roleIds = userRoles.map((ur) => ur.role_id)
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
                return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
              }
            } else {
              return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
            }
          } else {
            console.warn('Middleware: Usuario no tiene roles asignados, redirigiendo')
            return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
          }
        }
      } catch (error) {
        console.error('Middleware: Error verificando permisos de admin:', error)
        return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
      }
    }

    if (isDashboardRoute && !isSecurityQuestionsRoute && !isAdminRoute) {
      try {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

        if (aal) {
          if (aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2') {
            if (!isVerifyRoute) {
              return passCookies(NextResponse.redirect(new URL('/login/verify-2fa', req.url)))
            }
          }
        }
      } catch (error) {
        console.error('Error obteniendo AAL:', error)
      }

      if (!isSecurityQuestionsRoute) {
        try {
          const { count, error: questionsError } = await supabase
            .from('security_questions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          const hasQuestions = !questionsError && (count ?? 0) > 0

          if (!hasQuestions) {
            return passCookies(
              NextResponse.redirect(new URL('/dashboard/configuracion/preguntas-secretas', req.url))
            )
          }
        } catch (error) {
          console.error('Error verificando preguntas secretas:', error)
        }
      }
    }

    if (isAuthRoute && !isLogoutRoute && !isVerifyRoute) {
      try {
        if (userMustChangePassword(user)) {
          return passCookies(
            NextResponse.redirect(new URL('/cambiar-contrasena-inicial', req.url))
          )
        }
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal && aal.currentLevel === 'aal2') {
          const dashboardUrl = new URL('/dashboard', req.url)
          dashboardUrl.searchParams.set('t', Date.now().toString())
          return passCookies(NextResponse.redirect(dashboardUrl))
        } else if (!aal || aal.currentLevel === 'aal1') {
          const dashboardUrl = new URL('/dashboard', req.url)
          dashboardUrl.searchParams.set('t', Date.now().toString())
          return passCookies(NextResponse.redirect(dashboardUrl))
        }
      } catch (error) {
        const dashboardUrl = new URL('/dashboard', req.url)
        dashboardUrl.searchParams.set('t', Date.now().toString())
        return passCookies(NextResponse.redirect(dashboardUrl))
      }
    }

    if (isLogoutRoute) {
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (error) {
        try {
          await supabase.auth.signOut()
        } catch (e) {
          // Ignorar
        }
      }
    }

    if (isRegisterRoute && !isLogoutRoute) {
      return passCookies(NextResponse.redirect(new URL('/dashboard', req.url)))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}
