// lib/profile-cache.ts
// Sistema de caché para el perfil del usuario
// Esto asegura que el perfil esté disponible inmediatamente después del login

'use client'

import type { Profile } from './supabase'

const PROFILE_CACHE_KEY = 'inami_user_profile'
const PROFILE_CACHE_TIMESTAMP_KEY = 'inami_user_profile_timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export interface CachedProfile {
  profile: Profile
  timestamp: number
  userId: string
}

/**
 * Guarda el perfil en el caché local
 */
export function cacheProfile(profile: Profile): void {
  if (typeof window === 'undefined') return
  
  try {
    const cached: CachedProfile = {
      profile,
      timestamp: Date.now(),
      userId: profile.id
    }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cached))
    localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, cached.timestamp.toString())
  } catch (error) {
    console.error('Error guardando perfil en caché:', error)
  }
}

/**
 * Obtiene el perfil del caché local si está disponible y no ha expirado
 */
export function getCachedProfile(userId?: string): Profile | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cachedStr = localStorage.getItem(PROFILE_CACHE_KEY)
    const timestampStr = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY)
    
    if (!cachedStr || !timestampStr) return null
    
    const cached: CachedProfile = JSON.parse(cachedStr)
    const timestamp = parseInt(timestampStr, 10)
    
    // Verificar que el caché no haya expirado
    if (Date.now() - timestamp > CACHE_DURATION) {
      clearProfileCache()
      return null
    }
    
    // Si se proporciona un userId, verificar que coincida
    if (userId && cached.userId !== userId) {
      clearProfileCache()
      return null
    }
    
    return cached.profile
  } catch (error) {
    console.error('Error obteniendo perfil del caché:', error)
    clearProfileCache()
    return null
  }
}

/**
 * Limpia el caché del perfil
 */
export function clearProfileCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
    localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.error('Error limpiando caché del perfil:', error)
  }
}

/**
 * Verifica si hay un perfil en caché válido
 */
export function hasValidCachedProfile(userId?: string): boolean {
  return getCachedProfile(userId) !== null
}
