'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from '@/lib/env/public-supabase'

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<any>>

let browserClient: SupabaseBrowserClient | null = null

/**
 * Drop-in replacement para createClientComponentClient.
 * Mantiene la API existente y sincroniza sesión en cookies para SSR.
 */
export function createClientComponentClient(): SupabaseBrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient<any>(
      getPublicSupabaseUrl(),
      getPublicSupabaseAnonKey()
    )
  }
  return browserClient
}
