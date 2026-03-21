import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para Route Handlers (App Router) compatible con Next.js 15+
 * donde `cookies()` es asíncrono. Reemplaza `createRouteHandlerClient` de
 * @supabase/auth-helpers-nextjs (deprecado / incompatible).
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // set puede fallar en contextos de solo lectura
          }
        },
      },
    }
  )
}
