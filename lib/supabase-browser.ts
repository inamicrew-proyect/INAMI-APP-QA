'use client'

import { createBrowserClient } from '@supabase/ssr'

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<any>>

let browserClient: SupabaseBrowserClient | null = null

/**
 * Drop-in replacement para createClientComponentClient.
 * Mantiene la API existente y sincroniza sesión en cookies para SSR.
 */
export function createClientComponentClient(): SupabaseBrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
