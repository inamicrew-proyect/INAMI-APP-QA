import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/env/public-supabase'

/**
 * Cliente Supabase para Route Handlers (App Router) compatible con Next.js 15+
 * donde `cookies()` es asíncrono. Reemplaza `createRouteHandlerClient` de
 * @supabase/auth-helpers-nextjs (deprecado / incompatible).
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getPublicSupabaseUrl(),
    getPublicSupabaseAnonKey(),
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
