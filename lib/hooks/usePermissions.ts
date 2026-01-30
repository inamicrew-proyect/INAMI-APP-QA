// lib/hooks/usePermissions.ts
// Hook para obtener y usar permisos en componentes React

import { useState, useEffect, useCallback } from 'react'
import { getUserPermissions, type ModulePermission } from '@/lib/permissions'
import { useAuth } from '@/lib/auth'

export function usePermissions() {
  const { profile } = useAuth()
  const [permissions, setPermissions] = useState<ModulePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Timeout más corto (5 segundos) para que cargue más rápido
      const timeoutPromise = new Promise<ModulePermission[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout al cargar permisos')), 5000)
      })
      
      const permsPromise = getUserPermissions()
      const perms = await Promise.race([permsPromise, timeoutPromise])
      
      console.log('usePermissions: Permisos cargados', {
        count: perms.length,
        permisos: perms.map(p => ({
          modulo: p.modulo.nombre,
          ruta: p.modulo.ruta,
          puede_ver: p.puede_ver,
          puede_crear: p.puede_crear,
          puede_editar: p.puede_editar,
          puede_eliminar: p.puede_eliminar,
        }))
      })
      
      setPermissions(perms)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar permisos'
      setError(errorMessage)
      console.error('Error loading permissions:', err)
      // En caso de error, establecer permisos vacíos para que la app no se quede bloqueada
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Memoizar las funciones de verificación para evitar recrearlas en cada render
  const canView = useCallback((moduleRoute: string): boolean => {
    const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
    const result = permission?.puede_ver || false
    // Debug: solo loguear para admin panel (solo en desarrollo)
    if (process.env.NODE_ENV === 'development' && moduleRoute === '/dashboard/admin') {
      console.log('canView check for /dashboard/admin:', {
        result,
        hasPermission: !!permission,
        permission,
        allPermissions: permissions.map(p => ({ ruta: p.modulo.ruta, puede_ver: p.puede_ver }))
      })
    }
    return result
  }, [permissions])

  const canCreate = useCallback((moduleRoute: string): boolean => {
    const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
    return permission?.puede_crear || false
  }, [permissions])

  const canEdit = useCallback((moduleRoute: string): boolean => {
    const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
    return permission?.puede_editar || false
  }, [permissions])

  const canDelete = useCallback((moduleRoute: string): boolean => {
    const permission = permissions.find(p => p.modulo.ruta === moduleRoute)
    return permission?.puede_eliminar || false
  }, [permissions])

  return {
    permissions,
    loading,
    error,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refresh: loadPermissions,
  }
}

