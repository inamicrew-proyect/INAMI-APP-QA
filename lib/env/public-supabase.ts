/**
 * Lectura explícita de variables públicas de Supabase.
 * Falla con un mensaje claro si faltan (local o VPS).
 */
export function getPublicSupabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!v?.trim()) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL no está definida. Configúrala en .env (desarrollo) o en las variables del servidor (VPS/producción).'
    )
  }
  return v.trim()
}

export function getPublicSupabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!v?.trim()) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida. Configúrala en .env o en las variables del servidor.'
    )
  }
  return v.trim()
}
