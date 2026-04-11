import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-route-handler'
import { getPublicSiteUrl } from '@/lib/env/public-site-url'
import { resetPasswordEmailRecoveryAbsoluteUrl, resetPasswordEmailRecoveryPath } from '@/lib/routes'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code') || requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  
  const siteUrl = getPublicSiteUrl()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedOrigin =
    forwardedHost && forwardedProto ? `${forwardedProto}://${forwardedHost}` : null
  const candidateOrigin = forwardedOrigin || requestUrl.origin || siteUrl

  // Origen interno (0.0.0.0, etc.): redirigir a la URL pública configurada (p. ej. localhost:3000).
  const shouldForceSiteUrl =
    /:\/\/(0\.0\.0\.0|127\.0\.0\.1|localhost)(:\d+)?/i.test(candidateOrigin) ||
    /:\/\/(0\.0\.0\.0|127\.0\.0\.1|localhost)(:\d+)?/i.test(requestUrl.origin)
  const requestOrigin = shouldForceSiteUrl ? siteUrl : candidateOrigin

  // Si no hay código ni token_hash, Supabase puede haber enviado el token en el fragmento (#access_token=...).
  // El servidor no recibe el hash, así que devolvemos una página que lo lee y llama a /api/auth/set-session (cookies).
  if (!code) {
    const recoveryResetPath = resetPasswordEmailRecoveryPath()
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Completando recuperación...</title>
</head>
<body>
  <p>Completando recuperación de contraseña...</p>
  <script>
    (function() {
      var fallbackOrigin = ${JSON.stringify(requestOrigin)};
      var recoveryPath = ${JSON.stringify(recoveryResetPath)};
      var rawOrigin = window.location.origin || '';
      var isInternalOrigin = /:\/\/(0\\.0\\.0\\.0|127\\.0\\.0\\.1|localhost)(:\\d+)?/i.test(rawOrigin);
      var origin = isInternalOrigin ? fallbackOrigin : rawOrigin;
      var hash = window.location.hash || '';
      var params = new URLSearchParams(hash.replace(/^#/, ''));
      var access_token = params.get('access_token');
      var refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        fetch(origin + '/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: access_token, refresh_token: refresh_token }),
          credentials: 'same-origin'
        })
          .then(function(r) { if (r.ok) return r.json(); throw new Error('Error'); })
          .then(function() {
            setTimeout(function() { window.location.replace(origin + recoveryPath); }, 300);
          })
          .catch(function() { window.location.replace(origin + '/login?recovery_expired=1'); });
      } else {
        window.location.replace(origin + '/login?recovery_expired=1');
      }
    })();
  </script>
</body>
</html>`
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // DETECCIÓN TEMPRANA: Determinar si es recuperación ANTES de intercambiar el código
  // Esto es crítico porque Supabase puede no incluir type en el email
  const isRecovery = type === 'recovery' || 
                     next?.includes('reset-password') ||
                     requestUrl.searchParams.get('type') === 'recovery'

  const supabase = await createSupabaseRouteHandlerClient()
  
  try {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      const isExpiredOrInvalid =
        error.message?.toLowerCase().includes('expired') ||
        error.message?.toLowerCase().includes('invalid') ||
        error.code === 'otp_expired'
      if (isExpiredOrInvalid || isRecovery || !type) {
        return NextResponse.redirect(`${requestOrigin}/login?recovery_expired=1`)
      }
    }

    // REGLA 1: Si es recuperación explícita (type=recovery o next incluye reset-password), SIEMPRE ir a reset-password
    // Usar requestOrigin para que las cookies de sesión se mantengan (mismo dominio que la petición)
    if (isRecovery && !error && data?.session) {
      return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
    }
    
    // REGLA 2: Si NO hay type ni next, y la sesión se creó exitosamente,
    // ASumir que es recuperación (resetPasswordForEmail no siempre incluye type)
    if (!error && data?.session) {
      if (!type && !next)
        return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
      if (next && next.includes('reset-password'))
        return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
      if (type && type !== 'recovery') {
        if (next) {
          return NextResponse.redirect(`${requestOrigin}${next}`)
        }
        return NextResponse.redirect(`${requestOrigin}/dashboard`)
      }
      
      // REGLA 5: Si hay next específico y NO es reset-password, usar ese next
      if (next && !next.includes('reset-password')) {
        return NextResponse.redirect(`${requestOrigin}${next}`)
      }
      return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
    } 
    
    // Si hubo error y no se redirigió antes, ir al login con mensaje de enlace expirado
    if (error) {
      return NextResponse.redirect(`${requestOrigin}/login?recovery_expired=1`)
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.error('Auth callback error:', err)
    if (isRecovery || (!type && !next)) {
      return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
    }
  }

  if (isRecovery) return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
  if (!type && !next)
    return NextResponse.redirect(resetPasswordEmailRecoveryAbsoluteUrl(requestOrigin))
  if (type && type !== 'recovery' && next && !next.includes('reset-password')) {
    return NextResponse.redirect(`${requestOrigin}${next}`)
  }
  return NextResponse.redirect(`${requestOrigin}/login`)
}
