// lib/supabase-client.ts
// Singleton para el cliente de Supabase del lado del cliente
// Esto evita múltiples instancias de GoTrueClient

'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Usar el tipo de retorno de createClientComponentClient para evitar errores de tipo
type SupabaseClient = ReturnType<typeof createClientComponentClient>

let supabaseClientInstance: SupabaseClient | null = null

/**
 * Obtiene una instancia única del cliente de Supabase para componentes del cliente
 * Usa un patrón singleton para evitar múltiples instancias que causan warnings
 */
export function getSupabaseClient(): SupabaseClient {
  // Solo crear una instancia si no existe
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClientComponentClient()
  }
  return supabaseClientInstance
}

/**
 * Reinicia la instancia del cliente (útil para testing o resetear estado)
 */
export function resetSupabaseClient(): void {
  supabaseClientInstance = null
}

