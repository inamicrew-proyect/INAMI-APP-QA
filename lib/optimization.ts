// Cache de datos de Supabase (usado por permissions, user-permissions API)

export class SupabaseCache {
  private cache = new Map<string, unknown>()
  private ttl = new Map<string, number>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos

  set(key: string, value: unknown, ttl?: number) {
    this.cache.set(key, value)
    this.ttl.set(key, Date.now() + (ttl ?? this.defaultTTL))
  }

  get(key: string): unknown {
    const expiry = this.ttl.get(key)
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key)
      this.ttl.delete(key)
      return null
    }
    return this.cache.get(key)
  }

  clear() {
    this.cache.clear()
    this.ttl.clear()
  }
}

export const supabaseCache = new SupabaseCache()
