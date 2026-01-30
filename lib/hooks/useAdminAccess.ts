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
    // Si aún está cargando, mantener loading
    if (authLoading || permissionsLoading) {
      setLoading(true)
      return
    }

    // Si es admin, siempre tiene acceso
    if (profile?.role === 'admin') {
      console.log('useAdminAccess: Usuario es admin, acceso permitido')
      setHasAccess(true)
      setLoading(false)
      return
    }

    // Si no es admin, verificar permisos directamente
    // No usar useMemo porque puede ejecutarse antes de que los permisos se carguen
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
  }, [authLoading, permissionsLoading, profile?.role, canView, permissions])

  return {
    hasAccess,
    loading: loading || authLoading || permissionsLoading,
    isAdmin: profile?.role === 'admin',
  }
}

