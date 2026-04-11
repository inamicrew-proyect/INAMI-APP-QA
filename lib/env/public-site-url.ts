/**
 * URL pública de la app (callbacks Supabase, enlaces de recuperación, etc.).
 * Si no hay NEXT_PUBLIC_SITE_URL, se asume desarrollo en localhost:3000.
 */
const DEFAULT_PUBLIC_SITE_URL = 'http://localhost:3000'

export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  return DEFAULT_PUBLIC_SITE_URL
}
