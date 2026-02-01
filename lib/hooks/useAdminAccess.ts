// lib/hooks/useAdminAccess.ts
// Hook para verificar acceso al panel de administrador basándose en permisos

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { usePermissions } from './usePermissions'

export function useAdminAccess() {
  const { profile, loading: authLoading } = useAuth()
  const { canView, loading: permissionsLoading, permissions } = usePermissions()
  
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si aún está cargando auth, mantener loading
    if (authLoading) {
      setLoading(true)
      return
    }

    // Si es admin, siempre tiene acceso - NO ESPERAR permisos
    if (profile?.role === 'admin') {
      console.log('useAdminAccess: Usuario es admin, acceso permitido inmediatamente')
      setHasAccess(true)
      setLoading(false)
      return
    }

    // Si no hay perfil, no tiene acceso
    if (!profile?.id) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    // Si aún está cargando permisos, esperar un máximo de 3 segundos
    if (permissionsLoading) {
      // Timeout de seguridad: después de 3 segundos, asumir que no tiene permisos
      const timeoutId = setTimeout(() => {
        console.warn('useAdminAccess: Timeout esperando permisos, asumiendo sin acceso')
        setHasAccess(false)
        setLoading(false)
      }, 3000)
      
      return () => clearTimeout(timeoutId)
    }

    // Si no es admin, verificar permisos directamente
    const canAccessAdmin = canView('/dashboard/admin')
    
    console.log('useAdminAccess: Verificando permisos basados en roles', {
      canAccessAdmin,
      profileRole: profile?.role,
      permissionsLoading,
      permissionsCount: permissions.length,
      permissions: permissions.map(p => ({ ruta: p.modulo.ruta, puede_ver: p.puede_ver }))
    })
    
    setHasAccess(canAccessAdmin)
    setLoading(false)
  }, [authLoading, permissionsLoading, profile?.role, profile?.id, canView, permissions])

  return {
    hasAccess,
    loading: loading || authLoading || permissionsLoading,
    isAdmin: profile?.role === 'admin',
  }
}

