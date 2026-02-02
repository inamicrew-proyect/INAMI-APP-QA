// lib/permissions.ts
// Utilidades para verificar permisos basados en roles

import { supabaseCache } from './optimization'

// Cache de permisos en el cliente (5 minutos)
const PERMISSIONS_CACHE_TTL = 5 * 60 * 1000

export interface ModulePermission {
  modulo_id: string
  modulo: {
    id: string
    nombre: string
    descripcion: string | null
    ruta: string
    icono: string | null
  }
  puede_ver: boolean
  puede_crear: boolean
  puede_editar: boolean
  puede_eliminar: boolean
}

/**
 * Obtener permisos de un usuario basándose en sus roles
 * Con retry automático y timeout
 */
export async function getUserPermissions(userId?: string, retries = 1): Promise<ModulePermission[]> {
  const url = userId 
    ? `/api/admin/user-permissions?userId=${userId}`
    : '/api/admin/user-permissions'
  
  // Verificar caché primero
  const cacheKey = `client_permissions_${userId || 'current'}`
  const cached = supabaseCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Timeout más corto (3 segundos) para cargar más rápido
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos

      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Si es un error 401 o 403, no reintentar
        if (response.status === 401 || response.status === 403) {
          console.warn('No autorizado para obtener permisos:', response.statusText)
          return []
        }
        
        // Para otros errores, lanzar para que se reintente
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Backoff exponencial
          continue
        }
        
        console.error('Error fetching permissions:', response.statusText)
        return []
      }

      const data = await response.json()
      const permisos = data.permisos || []
      
      // Guardar en caché
      supabaseCache.set(cacheKey, permisos, PERMISSIONS_CACHE_TTL)
      
      return permisos
    } catch (error) {
      // Si es el último intento o es un error de aborto, retornar array vacío
      if (attempt === retries || (error instanceof Error && error.name === 'AbortError')) {
        console.error('Error getting user permissions (final):', error)
        return []
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return []
}

/**
 * Verificar si un usuario puede ver un módulo específico
 */
export async function canViewModule(moduleRoute: string, userId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
  return permission?.puede_ver || false
}

/**
 * Verificar si un usuario puede crear en un módulo específico
 */
export async function canCreateInModule(moduleRoute: string, userId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
  return permission?.puede_crear || false
}

/**
 * Verificar si un usuario puede editar en un módulo específico
 */
export async function canEditInModule(moduleRoute: string, userId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
  return permission?.puede_editar || false
}

/**
 * Verificar si un usuario puede eliminar en un módulo específico
 */
export async function canDeleteInModule(moduleRoute: string, userId?: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId)
  const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
  return permission?.puede_eliminar || false
}

/**
 * Hook para usar permisos en componentes React
 * Nota: Esto es una función helper, para hooks reales usar usePermissions hook
 */
export function usePermissionsSync() {
  // Esta función se puede usar para obtener permisos de forma síncrona
  // pero requiere que se carguen primero con getUserPermissions
  return {
    getUserPermissions,
    canViewModule,
    canCreateInModule,
    canEditInModule,
    canDeleteInModule,
  }
}

