// lib/hooks/useAdminAccess.ts
// Acceso a /dashboard/admin: perfil admin o permiso puede_ver del módulo Seguridad (ruta ADMIN).

import { useAuth } from '@/lib/auth'
import { usePermissions } from './usePermissions'
import { Routes } from '@/lib/routes'
import { isProfileAdminRole } from '@/lib/is-profile-admin'

export function useAdminAccess() {
  const { profile, loading: authLoading } = useAuth()
  const { canView, loading: permissionsLoading } = usePermissions()

  const isProfileAdmin = isProfileAdminRole(profile?.role)

  if (authLoading) {
    return { hasAccess: false, loading: true, isAdmin: false as const }
  }

  if (!profile?.id) {
    return { hasAccess: false, loading: false, isAdmin: false as const }
  }

  if (isProfileAdmin) {
    return { hasAccess: true, loading: false, isAdmin: true as const }
  }

  if (permissionsLoading) {
    return { hasAccess: false, loading: true, isAdmin: false as const }
  }

  return {
    hasAccess: canView(Routes.ADMIN),
    loading: false,
    isAdmin: false as const,
  }
}
