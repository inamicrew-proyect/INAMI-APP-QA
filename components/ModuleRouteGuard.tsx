'use client'

import { useIsAdmin } from '@/lib/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { ModuleAccessDenied } from '@/components/ModuleAccessDenied'

type Props = {
  moduleRoute: string
  nombreModulo: string
  children: React.ReactNode
}

export function ModuleRouteGuard({ moduleRoute, nombreModulo, children }: Props) {
  const { isAdmin } = useIsAdmin()
  const { canView, loading } = usePermissions()

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="card text-center text-gray-600 dark:text-gray-300">Cargando permisos…</div>
      </div>
    )
  }

  if (isAdmin || canView(moduleRoute)) {
    return <>{children}</>
  }

  return (
    <ModuleAccessDenied
      titulo={`Sin acceso a ${nombreModulo}`}
      mensaje="Tu rol no incluye permiso para ver este módulo. Si necesitas acceso, contacta a un administrador."
    />
  )
}
